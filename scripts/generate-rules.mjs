import { writeFileSync } from "node:fs";
const room = "root.child('rooms').child($code)";
const member = `auth != null && ${room}.child('members').child(auth.uid).exists()`;
const live = `${room}.child('meta/expiresAt').val() > now`;
const host = `auth != null && ${room}.child('meta/hostId').val() === auth.uid && ${live}`;
const own = `auth != null && auth.uid === $uid && ${live}`;
const current = `${room}.child('meta/roundId').val()`;
const answering = `${room}.child('meta/phase').val() === 'answering'`;
// Ten fixed seats let RTDB validate capacity and start/admission races without
// unsupported collection counting or trusting a client-maintained counter.
const roundRoom = "newData.parent().parent()";
const completeRoster = Array.from({ length: 10 }, (_, i) => {
  const seat = `${roundRoom}.child('seats/${i}')`;
  return `(!${seat}.exists() || ${roundRoom}.child('assignments').child(${seat}.val()).child('roundId').val() === newData.parent().child('roundId').val())`;
}).join(" && ");
const rules = {
  rules: {
    ".read": false,
    ".write": false,
    rooms: {
      $code: {
        ".write": `auth != null && !data.exists() && $code.matches(/^[A-Z2-9]{6}$/) && newData.child('meta/hostId').val() === auth.uid && newData.child('meta/phase').val() === 'lobby' && newData.child('meta/round').val() === 0 && newData.child('seats/0').val() === auth.uid && newData.child('members').child(auth.uid).exists() && !newData.child('vault').exists() && !newData.child('responses').exists() && !newData.child('discussion').exists() && !newData.child('reveal').exists() && !newData.child('assignments').exists() && !newData.child('submitted').exists() && !newData.child('history').exists() && !newData.child('presence').exists()`,
        ".validate": "newData.hasChildren(['meta','members','seats'])",
        meta: {
          ".read": "auth != null",
          ".write": host,
          ".validate":
            "newData.hasChildren(['hostId','createdAt','expiresAt','phase','round','roundId','settings'])",
          hostId: {
            ".write": `${member} && ${live} && newData.val() === auth.uid && ((!${room}.child('presence').child(data.val()).exists() && ${room}.child('meta/createdAt').val() < now - 90000) || ${room}.child('presence').child(data.val()).child('lastSeen').val() < now - 90000 || (${room}.child('presence').child(data.val()).child('online').val() === false && ${room}.child('presence').child(data.val()).child('lastSeen').val() < now - 30000))`,
            ".validate":
              "newData.isString() && newData.parent().parent().child('members').child(newData.val()).exists()",
          },
          createdAt: {
            ".validate":
              "newData.isNumber() && ((!data.exists() && newData.val() <= now + 60000 && newData.val() > now - 60000) || newData.val() === data.val())",
          },
          expiresAt: {
            ".validate":
              "newData.isNumber() && ((!data.exists() && newData.val() > now && newData.val() <= now + 43300000) || newData.val() === data.val())",
          },
          phase: {
            ".validate": `newData.isString() && (newData.val() === 'lobby' || (newData.val() === 'answering' && (${completeRoster}) && ((data.val() === 'lobby' || data.val() === 'reveal') || (data.val() === 'answering' && newData.parent().child('roundId').val() === data.parent().child('roundId').val()))) || (newData.val() === 'discussion' && (data.val() === 'answering' || data.val() === 'discussion')) || (newData.val() === 'reveal' && (data.val() === 'discussion' || data.val() === 'reveal')))`,
          },
          round: {
            ".validate":
              "newData.isNumber() && newData.val() >= 0 && newData.val() % 1 === 0",
          },
          roundId: {
            ".validate": "newData.isString() && newData.val().length <= 64",
          },
          settings: {
            ".validate":
              "newData.hasChildren(['capacity','impostors','categories','locale'])",
            capacity: {
              ".validate":
                "newData.isNumber() && newData.val() >= 3 && newData.val() <= 10 && newData.val() % 1 === 0 && (newData.val() > 0 || !newData.parent().parent().parent().child('seats/0').exists()) && (newData.val() > 1 || !newData.parent().parent().parent().child('seats/1').exists()) && (newData.val() > 2 || !newData.parent().parent().parent().child('seats/2').exists()) && (newData.val() > 3 || !newData.parent().parent().parent().child('seats/3').exists()) && (newData.val() > 4 || !newData.parent().parent().parent().child('seats/4').exists()) && (newData.val() > 5 || !newData.parent().parent().parent().child('seats/5').exists()) && (newData.val() > 6 || !newData.parent().parent().parent().child('seats/6').exists()) && (newData.val() > 7 || !newData.parent().parent().parent().child('seats/7').exists()) && (newData.val() > 8 || !newData.parent().parent().parent().child('seats/8').exists()) && (newData.val() > 9 || !newData.parent().parent().parent().child('seats/9').exists())",
            },
            impostors: {
              ".validate":
                "newData.val() === 1 || newData.val() === 2 || newData.val() === 3 || newData.val() === 'random'",
            },
            locale: {
              ".validate": "newData.val() === 'en' || newData.val() === 'nl'",
            },
            categories: {
              ".validate": "newData.hasChild('0')",
              $index: {
                ".validate":
                  "$index.matches(/^[0-9]$/) && (newData.val() === 'social' || newData.val() === 'food' || newData.val() === 'party' || newData.val() === 'love' || newData.val() === 'opinions' || newData.val() === 'culture' || newData.val() === 'person' || newData.val() === 'whatif' || newData.val() === 'numbers' || newData.val() === 'weird')",
              },
            },
            $other: { ".validate": false },
          },
          $other: { ".validate": false },
        },
        members: {
          ".read": `${member} && ${live}`,
          $uid: {
            ".read": `auth != null && auth.uid === $uid`,
            ".write": `(${host} && !newData.exists() && !newData.parent().parent().child('seats').child(data.child('slot').val()+'').exists() && $uid !== ${room}.child('meta/hostId').val()) || (${own} && ((data.exists() && newData.exists() && newData.child('nickname').val() === data.child('nickname').val() && newData.child('joinedAt').val() === data.child('joinedAt').val() && newData.child('slot').val() === data.child('slot').val()) || (!data.exists() && ${room}.child('meta/phase').val() === 'lobby') || (!newData.exists() && !newData.parent().parent().child('seats').child(data.child('slot').val()+'').exists() && $uid !== ${room}.child('meta/hostId').val())))`,
            ".validate":
              "newData.hasChildren(['nickname','ready','joinedAt','slot']) && (data.exists() || newData.parent().parent().child('meta').exists()) && (root.child('rooms').child($code).exists() || $uid === auth.uid)",
            nickname: {
              ".validate":
                "newData.isString() && newData.val().length >= 1 && newData.val().length <= 20 && newData.val().matches(/.*[^ ].*/)",
            },
            ready: { ".validate": "newData.isBoolean()" },
            joinedAt: { ".validate": "newData.isNumber()" },
            slot: {
              ".validate":
                "newData.isNumber() && newData.val() >= 0 && newData.val() < newData.parent().parent().parent().child('meta/settings/capacity').val() && newData.val() % 1 === 0 && newData.parent().parent().parent().child('seats').child(newData.val()+'').val() === $uid",
            },
            $other: { ".validate": false },
          },
        },
        seats: {
          ".read": `auth != null && ${live}`,
          $slot: {
            ".write": `(${host} && !newData.exists() && !newData.parent().parent().child('members').child(data.val()).exists()) || (auth != null && ${live} && ((!data.exists() && newData.val() === auth.uid && ${room}.child('meta/phase').val() === 'lobby') || (data.val() === auth.uid && !newData.exists() && !newData.parent().parent().child('members').child(data.val()).exists())))`,
            ".validate":
              "$slot.matches(/^[0-9]$/) && newData.isString() && ($slot !== '0' || root.child('rooms').child($code).exists() || newData.val() === auth.uid) && newData.parent().parent().child('members').child(newData.val()).child('slot').val() < newData.parent().parent().child('meta/settings/capacity').val() && newData.parent().parent().child('members').child(newData.val()).child('slot').val()+'' === $slot",
          },
        },
        presence: {
          ".read": `${member} && ${live}`,
          $uid: {
            ".write": `(${own} && ${member}) || (${host} && !newData.exists())`,
            ".validate": "newData.hasChildren(['online','lastSeen'])",
            online: { ".validate": "newData.isBoolean()" },
            lastSeen: {
              ".validate":
                "newData.isNumber() && newData.val() <= now + 1000 && newData.val() >= now - 60000",
            },
            $other: { ".validate": false },
          },
        },
        assignments: {
          ".write": host,
          $uid: {
            ".read": `${member} && ${live} && auth.uid === $uid`,
            ".validate": "newData.hasChildren(['roundId','question'])",
            roundId: {
              ".validate":
                "newData.val() === newData.parent().parent().parent().child('meta/roundId').val()",
            },
            question: {
              ".validate":
                "newData.isString() && newData.val().length > 0 && newData.val().length <= 300",
            },
            $other: { ".validate": false },
          },
        },
        vault: { ".read": host, ".write": host },
        history: { ".read": host, ".write": host },
        responses: {
          ".read": host,
          ".write": `${host} && !newData.exists()`,
          $uid: {
            ".read": `${own} && ${member}`,
            ".write": `${own} && ${member} && ${answering} && !data.exists() && newData.exists() && newData.child('roundId').val() === ${current} && ${room}.child('assignments').child($uid).child('roundId').val() === ${current}`,
            ".validate": "newData.hasChildren(['roundId','answer'])",
            roundId: { ".validate": `newData.val() === ${current}` },
            answer: {
              ".validate":
                "newData.isString() && newData.val().length > 0 && newData.val().length <= 160 && newData.val().matches(/.*[^ ].*/)",
            },
            $other: { ".validate": false },
          },
        },
        submitted: {
          ".read": `${member} && ${live}`,
          ".write": `${host} && !newData.exists()`,
          $uid: {
            ".write": `${own} && ${member} && ${answering} && !data.exists() && newData.val() === ${current}`,
            ".validate":
              "newData.parent().parent().child('responses').child($uid).child('roundId').val() === newData.val()",
          },
        },
        discussion: {
          ".read": `${member} && ${live} && (${room}.child('meta/phase').val() === 'discussion' || ${room}.child('meta/phase').val() === 'reveal')`,
          ".write": host,
          ".validate":
            "newData.hasChildren(['roundId','original','category','answers']) && newData.child('roundId').val() === newData.parent().child('meta/roundId').val()",
        },
        reveal: {
          ".read": `${member} && ${live} && ${room}.child('meta/phase').val() === 'reveal'`,
          ".write": host,
          ".validate":
            "newData.hasChildren(['roundId','impostors']) && newData.child('roundId').val() === newData.parent().child('meta/roundId').val()",
        },
        $other: { ".validate": false },
      },
    },
  },
};
writeFileSync("database.rules.json", JSON.stringify(rules, null, 2) + "\n");
