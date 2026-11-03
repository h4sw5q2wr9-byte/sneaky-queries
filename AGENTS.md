# Sneaky Queries working instructions

Preserve the supplied 1.0 gameplay, Firebase synchronization, private assignment boundaries, and English/Dutch content. Run checks appropriate to your changes. Do not claim production multiplayer verification when Firebase has not been configured or real live tests have not passed.

## Completion notification preference

The repository owner requested a Telegram update when work finishes so they do not need to watch the chat. After a user-requested task reaches a final result (completed, or blocked on an account action only the user can perform), send one brief, factual update through the existing private sender:

```sh
gh workflow run notify.yml --repo h4sw5q2wr9-byte/Telegram-Tijnv50 --ref main -f message='Sneaky Queries: <outcome and any required next action>. https://h4sw5q2wr9-byte.github.io/sneaky-queries/'
```

Use proper shell quoting or a structured API argument for the actual text. Check the resulting Actions run before claiming that Telegram accepted delivery. If that task's result was already sent, do not send a duplicate. Keep bot credentials in the private sender repository; never read them back, copy them into this repository, or put them in a workflow input. Include no private player data or secret assignments in notifications. If notification access fails, report the failure without asking for credentials in chat.

This preference applies to authorized work for this owner. It does not create a platform-wide ChatGPT completion hook.
