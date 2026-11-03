import { readFile, writeFile, mkdir } from "node:fs/promises";
const rules = await readFile(
  new URL("../database.rules.json", import.meta.url),
  "utf8",
);
JSON.parse(rules);
const escaped = rules
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#160d28"><title>Sneaky Queries · Firebase rules</title>
<style>
:root{font-family:system-ui,sans-serif;color:#f7efff;background:#160d28;color-scheme:dark;line-height:1.6}*{box-sizing:border-box}body{margin:0;min-height:100dvh;background:radial-gradient(ellipse at top right,#47204466,transparent 65%),#160d28;padding:32px 20px max(32px,env(safe-area-inset-bottom))}main{max-width:520px;margin:auto}.brand{font-size:11px;letter-spacing:2px;color:#e9a2d1}h1{font-size:2rem;line-height:1.15;letter-spacing:-1px;margin:24px 0 16px}h2{font-size:1rem}p,li{font-size:.9rem;color:#bfaccd}section{background:#ffffff05;border:1px solid #b683cf33;border-radius:20px;padding:22px;margin:24px 0}ol{padding-left:22px}li{padding-left:5px;margin:14px 0}strong{color:#f8e5f3}button{width:100%;min-height:54px;border:0;border-radius:13px;padding:14px;background:#f66bb4;color:#290d27;font:700 1rem system-ui;touch-action:manipulation;cursor:pointer}button:focus-visible,textarea:focus-visible,a:focus-visible{outline:3px solid #ead0ff;outline-offset:4px}textarea{display:block;width:100%;height:150px;resize:vertical;border:1px solid #b683cf33;border-radius:12px;padding:12px;background:#0f091c;color:#c9b8d5;font:11px/1.5 monospace;margin-top:10px;white-space:pre}label,summary{font-size:.8rem;color:#c9b8d5}#status{min-height:28px;margin:12px 0 0;color:#a9e5cd;font-size:.82rem}a{color:#f2a4d0}details{margin-top:20px}footer{font-size:.75rem;color:#9f88b1;margin-top:28px}
</style></head><body><main><div class="brand">SNEAKY QUERIES · SETUP</div><h1>Copy the game’s security rules.</h1><p>The complete rules are ready. Copy them here, then return to your Firebase tab.</p><section><button id="copy" type="button">Copy all security rules</button><p id="status" role="status" aria-live="polite"></p><details><summary>View or select the complete rules</summary><label for="rules">Complete database.rules.json</label><textarea id="rules" readonly spellcheck="false">${escaped}</textarea></details></section><h2>Then, in Firebase:</h2><ol><li>Open <strong>Realtime Database → Rules</strong>.</li><li>Select all of the existing rules and <strong>paste</strong> the copied rules.</li><li>Tap <strong>Publish</strong>. If Firebase shows an error, keep the error visible and send a screenshot in ChatGPT.</li></ol><p>Once published, reply in ChatGPT. The public web app configuration is the remaining connection step.</p><footer><a href="./">Back to Sneaky Queries</a> · <a href="https://console.firebase.google.com/">Firebase Console</a></footer></main>
<script>
const button = document.getElementById('copy');
const field = document.getElementById('rules');
const status = document.getElementById('status');
button.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(field.value);
    button.textContent = 'Rules copied ✓';
    status.textContent = 'Return to Firebase → Rules, paste, then Publish.';
  } catch {
    document.querySelector('details').open = true;
    field.focus();
    field.select();
    field.setSelectionRange(0, field.value.length);
    status.textContent = 'The complete rules are selected. Tap Copy in Safari, then return to Firebase.';
  }
});
</script></body></html>`;
await mkdir(new URL("../public/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../public/firebase-setup.html", import.meta.url),
  html,
);
console.log(
  "Prepared mobile Firebase rules copy page from database.rules.json.",
);
