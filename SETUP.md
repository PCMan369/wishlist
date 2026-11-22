# Wishlist setup

About 20 minutes, once. You'll do three things: put the site on GitHub, connect Firebase so claims are shared, and set a family password. Everything works before step 2 (in preview mode), so you can stop after step 1 and just look at it.

Costs nothing. No credit card needed anywhere.

---

## 1. Put the site on GitHub (5 min)

1. Sign in at **github.com** and click **New repository**. Name it `wishlist`, choose **Public**, and create it.
   - Public is required for free Pages. It's fine: the site is behind the password, and there's nothing personal in it.
2. Upload the files. Easiest is from a terminal, inside this folder:
   ```
   git init -b main
   git add .
   git commit -m "Wishlist"
   git remote add origin https://github.com/YOUR-USERNAME/wishlist.git
   git push -u origin main
   ```
   No terminal? On the repo page, **Add file → Upload files**, then drag in the `site` and `tools` folders plus `firestore.rules` and `SETUP.md`.
   The hidden `.github` folder is the one people miss: use **Add file → Create new file**, type `.github/workflows/deploy.yml` as the name, and paste in the contents of that file.
3. In the repo, go to **Settings → Pages**. Under **Build and deployment → Source**, pick **GitHub Actions**.
4. Open the **Actions** tab. When "Deploy site" shows a green check (about a minute), your site is live at
   `https://YOUR-USERNAME.github.io/wishlist/`
   If it's red, click it: the message says exactly what to fix. If you only just switched Pages to GitHub Actions, click **Re-run all jobs**.

## 2. Connect Firebase so claims are shared (10 min)

1. Go to **console.firebase.google.com**, sign in with a Google account, and click **Create a project**. Name it `jacob-wishlist`. Turn **Google Analytics off** and create it.
2. In the left menu: **Build → Firestore Database → Create database**. If it asks, pick **Standard edition**, any nearby location, and **Start in production mode**.
3. Open the **Rules** tab, delete what's there, paste in everything from `firestore.rules`, and click **Publish**.
4. Click the gear icon → **Project settings → General**. Scroll to **Your apps**, click the web icon `</>`, give it any nickname, **skip** the Hosting checkbox, and click **Register app**.
5. You'll see a block of code with `apiKey`, `authDomain`, `projectId`, and `appId`. Copy those four values into the `firebase:` section of `site/config.js`.
   These aren't secrets. The rules in step 3 are what protect your data.

## 3. Family password (1 min)

1. Open `tools/set-password.html` by double-clicking it.
2. Type a password, and paste in your site address if you like.
3. Paste the `passwordHash` line it shows into `site/config.js`, replacing the empty one.

## 4. Save the changes

On github.com, open `site/config.js`, click the pencil, paste your values, and click **Commit changes**. Watch the Actions tab. About a minute later the site updates. If you made a typo, the check step turns red and the live site keeps showing the last good version.

## 5. Share it, and hide claims from yourself

- **Family and friends:** send the invite link from the password tool. One tap opens the list (the password rides along in the link). They can also type the password by hand. Names are asked once, the first time someone claims something.
- **You:** open the "private view" link from the password tool once on each of your own devices. From then on, claims are hidden from you on that device (and your device never even loads them). To turn it off on a device, add `?as=guest` to the site address.
  Don't open the plain invite link on a device you haven't done this on, or you'll see who's getting what.

---

## Everyday use

- **Change items:** edit `site/items.js` on github.com (pencil icon, then Commit). Copy an existing block to add one. The comments at the top explain every field. The optional `short`, `tagline` and `badge` fields set the big headline, the line under it, and a small label like "Black Friday price". The page lays itself out from each item's `priority`: the first available item becomes the big hero, other "Most wanted" and "Would love" items get a full-width section, and the rest sit side by side in pairs.
- **Change wording, delivery info, or the date:** `site/config.js`.
- **Start claims over:** Firebase console → Firestore Database → Data → the `pledges` collection → **Delete collection**.
- **See who claimed what:** the `pledges` collection (but that spoils the surprise).

## Good to know

- The password stops casual visitors, not determined ones. It's meant for a family wishlist, not secrets. Claims are the same: anyone who finds your Firebase settings could read them.
- A person can only remove a claim they made (it matches their name on that device), so nobody removes someone else's by accident.
- Firebase's free plan allows far more than a family list will ever use.
- Product photos load from the stores' own sites. If one ever breaks, the emoji shows instead; swap in a fresh image address in `items.js`.
