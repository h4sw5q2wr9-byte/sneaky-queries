"""Explicit, real-Firebase permission smoke test using only its own test room.

Creates three temporary anonymous accounts and an expiring room. Never logs ID
or refresh tokens. Does not read, edit, or delete any other party's data.
"""
import json
from pathlib import Path
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request


class CheckFailure(Exception):
    pass


def request_json(url, method="GET", payload=None):
    body = None if payload is None else json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(url, data=body, method=method, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=25) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, None
    except (urllib.error.URLError, TimeoutError, ValueError):
        # A request URL contains its temporary ID token. Never log the exception.
        raise CheckFailure("A live Firebase request failed; no credentials were logged.") from None


def main():
    config = json.loads((Path(__file__).resolve().parent.parent / "src/data/firebase.web.json").read_text())
    accounts = []
    checks = 0
    code = "".join(secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(6))
    database = config["databaseURL"].rstrip("/")
    base_path = f"/rooms/{code}"

    def check(label, status, expected=200):
        nonlocal checks
        allowed = expected if isinstance(expected, tuple) else (expected,)
        if status not in allowed:
            raise CheckFailure(f"{label}: expected HTTP {allowed}, received HTTP {status}.")
        checks += 1
        print(f"PASS: {label}")

    def database_request(account, method="GET", child="", payload=None):
        token_query = "" if account is None else "?" + urllib.parse.urlencode({"auth": account["idToken"]})
        path = base_path + ("/" + child if child else "")
        return request_json(database + path + ".json" + token_query, method, payload)

    denied = (401, 403)
    try:
        for _ in range(3):
            url = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?" + urllib.parse.urlencode({"key": config["apiKey"]})
            status, account = request_json(url, "POST", {"returnSecureToken": True})
            check("anonymous authentication", status)
            if not isinstance(account, dict) or not account.get("idToken"):
                raise CheckFailure("Firebase did not return a usable anonymous identity.")
            accounts.append(account)
        host, alice, bob = accounts
        names = ["Security check host", "Security check A", "Security check B"]
        now = int(time.time() * 1000)
        members = {a["localId"]: {"nickname": name, "ready": True, "joinedAt": now, "slot": i} for i, (a, name) in enumerate(zip(accounts, names))}
        meta = {"hostId": host["localId"], "createdAt": now, "expiresAt": now + 43200000, "phase": "lobby", "round": 0, "roundId": "none", "settings": {"capacity": 3, "impostors": 1, "categories": ["party"], "locale": "en"}}
        check("create isolated test room", database_request(host, "PUT", payload={"meta": meta, "members": {host["localId"]: members[host["localId"]]}, "seats": {"0": host["localId"]}})[0])
        for i, account in enumerate(accounts[1:], start=1):
            uid = account["localId"]
            check("atomic player admission", database_request(account, "PATCH", payload={f"members/{uid}": members[uid], f"seats/{i}": uid})[0])
        round_id = "live-security-check"
        original = "What would you bring to a party?"
        variation = "What would you leave at home?"
        assignments = {a["localId"]: {"roundId": round_id, "question": variation if a is bob else original} for a in accounts}
        impostors = {bob["localId"]: {"nickname": names[2], "question": variation, "variation": "I1"}}
        vault = {"roundId": round_id, "original": original, "category": "party", "questionId": "security-check-only", "assignments": assignments, "impostors": impostors}
        check("host starts a complete roster", database_request(host, "PATCH", payload={"meta/phase": "answering", "meta/round": 1, "meta/roundId": round_id, "assignments": assignments, "vault": vault})[0])
        check("unauthenticated metadata denied", database_request(None, child="meta")[0], denied)
        check("own private question readable", database_request(alice, child=f"assignments/{alice['localId']}")[0])
        for label, child in [
            ("another player's question denied", f"assignments/{bob['localId']}"),
            ("private role vault denied", "vault"),
            ("early discussion denied", "discussion"),
            ("early impostor reveal denied", "reveal"),
            ("broad room read denied", ""),
        ]:
            check(label, database_request(alice, child=child)[0], denied)
        check("ordinary phase advance denied", database_request(alice, "PUT", "meta/phase", "discussion")[0], denied)
        check("forged answer denied", database_request(alice, "PUT", f"responses/{bob['localId']}", {"roundId": round_id, "answer": "forged"})[0], denied)
        for account in accounts:
            uid = account["localId"]
            patch = {f"responses/{uid}": {"roundId": round_id, "answer": "Security smoke test"}, f"submitted/{uid}": round_id}
            check("own answer and progress accepted", database_request(account, "PATCH", payload=patch)[0])
            if account is alice:
                check("duplicate submission denied", database_request(account, "PATCH", payload=patch)[0], denied)
        check("another player's submitted answer denied", database_request(bob, child=f"responses/{alice['localId']}")[0], denied)
        answers = {uid: {"nickname": member["nickname"], "answer": "Security smoke test"} for uid, member in members.items()}
        discussion = {"roundId": round_id, "original": original, "category": "party", "answers": answers}
        check("host publishes discussion", database_request(host, "PATCH", payload={"meta/phase": "discussion", "discussion": discussion})[0])
        check("discussion readable at correct phase", database_request(alice, child="discussion")[0])
        check("reveal stays hidden during discussion", database_request(alice, child="reveal")[0], denied)
        check("host publishes reveal", database_request(host, "PATCH", payload={"meta/phase": "reveal", "reveal": {"roundId": round_id, "impostors": impostors}})[0])
        check("reveal readable at correct phase", database_request(alice, child="reveal")[0])
        check("host resets test room", database_request(host, "PATCH", payload={"meta/phase": "lobby", "assignments": None, "responses": None, "submitted": None, "discussion": None, "reveal": None, "vault": None})[0])
        check("past discussion hidden after reset", database_request(alice, child="discussion")[0], denied)
        print(f"Live Firebase access checks passed: {checks}. Test room access expires after 12 hours; no other room was touched.")
        return 0
    except CheckFailure as error:
        print(f"FAIL: {error}")
        return 1
    finally:
        # Delete only the anonymous identities this run created. Expiry retains
        # the room lifecycle used by the app; no Admin credential is required.
        for account in accounts:
            url = "https://identitytoolkit.googleapis.com/v1/accounts:delete?" + urllib.parse.urlencode({"key": config["apiKey"]})
            try:
                status, _ = request_json(url, "POST", {"idToken": account["idToken"]})
                if status != 200:
                    print("Temporary test identity cleanup did not complete.")
            except CheckFailure:
                print("Temporary test identity cleanup did not complete.")


if __name__ == "__main__":
    raise SystemExit(main())
