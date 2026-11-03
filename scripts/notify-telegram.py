"""Optional Telegram notification; credentials come only from GitHub secrets."""
import json
import os
import sys
import urllib.error
import urllib.request


def main():
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    if not token or not chat_id:
        print("Telegram is not configured; add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID repository secrets to enable alerts.")
        return 0
    workflow = os.environ.get("SQ_WORKFLOW_NAME", "Project check")
    status = os.environ.get("SQ_WORKFLOW_STATUS", "completed")
    run_url = os.environ.get("SQ_RUN_URL", "")
    text = f"Sneaky Queries\n{workflow}: {status}\nSite: https://h4sw5q2wr9-byte.github.io/sneaky-queries/"
    if run_url:
        text += f"\nDetails: {run_url}"
    if os.environ.get("SQ_TELEGRAM_DRY_RUN") == "true":
        print("Telegram message validated; dry run did not send a message.")
        return 0
    payload = json.dumps({"chat_id": chat_id, "text": text, "disable_web_page_preview": True}).encode()
    request = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            result = json.load(response)
        if not result.get("ok"):
            print("Telegram declined the notification. Check the bot token, chat ID, and that you started the bot.")
            return 1
        print("Telegram notification delivered.")
        return 0
    except urllib.error.HTTPError as error:
        # Never print exception URLs: the Telegram API puts its token in the URL.
        print(f"Telegram returned HTTP {error.code}. Check the bot token and chat ID.")
        return 1
    except (urllib.error.URLError, TimeoutError, ValueError):
        print("Telegram notification failed because of a network or response error.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
