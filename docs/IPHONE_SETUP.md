# Firebase setup from an iPhone

You do not need a computer or the desktop Firebase plugin. Use the Firebase website in Safari. The code, GitHub repository, Pages deployment and multiplayer implementation are already prepared; these remaining steps configure resources inside your Google account.

## Start here

1. Open [Firebase Console](https://console.firebase.google.com/) in Safari and sign in with your Google account.
2. Choose **Create a project** (sometimes shown as **Get started with a Firebase project**).
3. Name it **Sneaky Queries**. You can leave optional Gemini/AI assistance and Google Analytics off. Create the project and wait for its dashboard.
4. If the page layout is difficult on your phone, open Safari's page menu, then **Request Desktop Website**. Rotating the phone sideways can also make the console easier to use. This changes the website layout; it does not require the desktop app.

If you only want to do the first part now, stop at the project dashboard and reply in ChatGPT. The project name alone does not grant the assistant access; the remaining account-only settings can be completed below, one at a time if needed.

## Turn on anonymous sign-in

In the project's menu, open **Build → Authentication → Get started**. Under **Sign-in method**, select **Anonymous**, enable it, and save. Players will use anonymous sign-in and will not register accounts.

Under Authentication's **Settings → Authorized domains**, add:

```text
h4sw5q2wr9-byte.github.io
```

## Create the shared database

Open **Build → Realtime Database → Create Database**. Choose a location near your players and start in **locked mode**. This game uses Realtime Database, not Cloud Firestore.

For this casual V1 setup, use the free **Spark** plan. No Functions, Storage, Firebase Hosting, or billing upgrade is needed by this project.

Open the [phone-friendly rules copy page](https://h4sw5q2wr9-byte.github.io/sneaky-queries/firebase-setup.html) and tap **Copy all security rules**. Return to the database's **Rules** tab, select all the initial rules, paste, then tap **Publish**. This page is generated from the same [database.rules.json](https://github.com/h4sw5q2wr9-byte/sneaky-queries/blob/main/database.rules.json) used by the tested application. Never replace it with open/test-mode rules.

Copy the database URL shown in the database's Data tab. It ends in `.firebaseio.com` or `.firebasedatabase.app`; retain the complete regional URL.

## Register the website

Go to the project's overview, select **Add app**, then the **Web** icon (`</>`). Call the app **Sneaky Queries** and register it. Firebase Hosting is not needed because the frontend is already on GitHub Pages.

The setup screen shows a block like this, with your project's actual values:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  appId: "..."
};
```

Copy that **public web configuration** and the Realtime Database URL back into ChatGPT. Firebase may include additional fields; keep the whole object. This public web configuration is intended to be present in the website's JavaScript; access is enforced by the database rules. Do not send a service-account JSON file, private key, Google password, or Firebase CLI login token.

With these public values and the enabled services/rules, the assistant can configure the frontend, deploy it, and rerun the live three-identity multiplayer test. Without account authorization, the assistant cannot toggle Firebase's private console settings on your behalf.

## Telegram updates

The private notification sender is working. The assistant can send completion updates and questions that need your input through it. The sender does not receive Telegram replies or resume this ChatGPT conversation. Reply in **ChatGPT** when an update asks you to do something.

## Official instructions

- [Create a project and register a web app](https://firebase.google.com/docs/web/setup)
- [Enable anonymous authentication](https://firebase.google.com/docs/auth/web/anonymous-auth)
- [Create a Realtime Database](https://firebase.google.com/docs/database/web/start)
- [Safari page-menu settings on iPhone](https://support.apple.com/guide/iphone/customize-your-safari-settings-iphb3100d149/ios)
