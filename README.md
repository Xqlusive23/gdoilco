# GDoilco

Recruitment website for oil rig and offshore crews in the United States.
React 18 + Vite + React Router on the front end, a small Node server for the application form.

## Run it

```bash
npm install
cp .env.example .env        # on Windows: copy .env.example .env
npm run keygen              # prints a key. Paste it into .env as SSN_ENCRYPTION_KEY
npm run admin:setup         # creates the admin username and password (see "Admin site" below)
npm run dev:all             # website on http://localhost:5173, server on http://localhost:4000
```

`npm run dev` starts only the website. The application form needs the server, so use `dev:all` when testing it.

## Pages

| Route | File |
| --- | --- |
| `/` | `src/pages/Home.jsx` |
| `/about` | `src/pages/About.jsx` |
| `/jobs` | `src/pages/Jobs.jsx` |
| `/safety` | `src/pages/Safety.jsx` |
| `/contact` | `src/pages/Contact.jsx` |
| `/apply` | `src/pages/Apply.jsx` |
| `/admin` | `src/admin/AdminApp.jsx` |

## Things to edit

- `src/data.js`: the starting list of positions, disciplines, contact email and phone. The starting list is copied into
  `server/data/positions.json` the first time the server runs. After that, manage positions in the admin site
  (changing the list in `data.js` has no effect on a server that already has `positions.json`).
- `src/styles.css`: colors and fonts are CSS variables at the top (Source Serif 4 for headlines, Source Sans 3 for text). Light and dark themes follow the visitor's device.
- `src/media.js`: every photo and video on the site. See "Photos and videos" below.
- `src/components/Showreel.jsx`: the animated "how hiring works" panel with chapters.
- `src/components/Marquee.jsx`: the scrolling tickers. Each page passes its own list of phrases.
- `src/components/Scene.jsx` and `src/lib/scene.js`: the animated rig scenes behind each page header.

## Admin site

Open `/admin` (for example http://localhost:5173/admin). It is not linked from the public pages.

**First time:** run `npm run admin:setup`, choose a username and a password of at least 12 characters, then start the server.
Run the same command again any time to change the password. Only a salted hash is saved, in `server/data/admin.json`.

What the admin can do:

- **Applications:** see every submission with search and filters, open one to read everything the applicant entered,
  set a status (new, reviewing, shortlisted, hired, rejected), add a private note, and delete an application.
- **Social Security number and ID:** the list shows only the last 4 digits. The full number and the ID images are decrypted only
  when the admin clicks Reveal or View, and each click is written to the activity log.
- **Export:** "Export CSV" downloads every application. "Export CSV with SSN" asks for confirmation first, because the file then holds full numbers.
- **Positions:** add a position, edit one, open or close it, or delete it. The public Jobs, Home and Apply pages show the change straight away.
  A closed position cannot be applied for, even by someone who knows its reference.
- **Activity:** who signed in, viewed, exported or changed something. It never contains the applicants' details.

**One application per person.** Each application gets its own ID (like `GD-261028-64B82A`). A second application is refused
if the Social Security number or the email address matches an earlier one (the email check ignores capitals and `+tags`).
The check uses keyed hashes, so it works without keeping extra copies of the numbers. If an admin deletes an application,
that person can apply again.

## Emails and approval

- **On submit,** the applicant gets a designed email (logo, rig picture, application number, position, what happens next).
  Their SSN and ID are never in it. If the email cannot be sent, the application is still saved.
- **Approval:** open an application in the admin and tick all five checks (ID, SSN, work authorization, experience and certificates,
  reference). Only then does "Approve and email applicant" work. The server also refuses an approval with a missing check.
  Approving sends the applicant an "Application approved" email and records who approved it and when.
  An approved application cannot be moved back to another status. If it was a mistake, delete it.
  The admin also shows whether each email was sent, and has a Resend button for both.
- **Delete:** the Delete button on every row of the list (and inside an application) removes the saved details, the SSN and the ID images for good.
  The person can then apply again.
- **Turning on real sending:** fill in the `SMTP_*`, `MAIL_FROM` and `PUBLIC_URL` lines in `.env` with the details from an email provider
  (Gmail with an app password, Outlook, Brevo, SendGrid, Mailgun, Amazon SES and others all work), then restart the server.
  Use a `MAIL_FROM` address on your own domain and ask your provider to set up SPF and DKIM for it, or messages may go to spam.
- **Before that, on your own computer:** with `SMTP_HOST` empty nothing is sent. Each email is saved as a web page in
  `server/data/outbox/`. Double-click one to see exactly what applicants will get.
- The pictures in the emails are in `server/email/assets/`. Replace them with your own (same file names) to change the look.

**How the admin login is protected:** salted scrypt password hash, a limit of 5 wrong attempts per 15 minutes per address,
a random session cookie that scripts cannot read (httpOnly, SameSite=Strict, and Secure over https), sessions that end after
30 minutes of no activity or 8 hours in total, and a same-site check on every change.

**Hosting notes:** serve the website and the server from the same domain (`npm run build` then `npm start` does this), because the
admin login cookie only works on one domain. Use https. If a host or proxy sits in front of the server, set `TRUST_PROXY=1` in `.env`
so the server reads the real visitor address and knows the connection is https. Back up `server/data/` and `SSN_ENCRYPTION_KEY` together.

## Application form, SSN and ID

The site uses real photographs and two background videos from Pexels (free to use under the Pexels license).
They load from Pexels when a visitor opens the site, so your computer needs internet access.

- Videos start by themselves, muted and looping, and pause when scrolled out of view. A small button on each lets the visitor stop them.
  They are not played on phones, with the "reduce motion" setting, or with Data Saver, to save data. To play them on phones too,
  set `VIDEO_ON_MOBILE = true` in `src/components/VideoBg.jsx`.
- Photos drift slowly (a gentle zoom). This stops for visitors who ask for reduced motion.
- To use your own media, put files in `public/media/` with the names listed in `src/media.js`
  (for example `hero.mp4`, `reel.mp4`, `sunset.jpg`, `crew.jpg`). Your file is used first, Pexels second, and a drawn rig scene if neither loads.
- The Pexels videos are large (about 2560x1440). For a real launch, use your own footage, compressed to 1080p or smaller.

## Application form, SSN and ID

The form sends the answers, the Social Security number and the ID images to `server/index.js` over HTTPS.
The server checks everything again, encrypts the SSN and the ID images with AES-256-GCM, and saves them in
`server/data/` (ignored by git). The browser never stores the SSN or the ID, and the copy shown to the applicant
leaves them out.

- Back up `SSN_ENCRYPTION_KEY`. Without it the saved data cannot be read, and anyone who has the key and the files can read it.
- To read one application on the server machine: `node server/reveal.js GD-261004-AB12CD`
  (add `front` or `back` to decrypt an ID image into `reveal-out/`, and delete it when you are done).
- The form refuses to send identity documents over plain `http` except on `localhost`.

## Deploying

```bash
npm run build
npm start                   # serves dist/ and the API from one process on PORT
```

Put it behind HTTPS (a host such as Render, Railway or Fly.io, or Nginx with a certificate). Keep `server/data/`
on a private, backed-up disk. If the website is hosted on a different domain than the server, set `ALLOWED_ORIGIN`
on the server and `VITE_API_URL` when building the website.

## Before you collect real SSNs

- Many employers ask for the SSN and ID only after a conditional job offer, because an applicant who is turned down
  has then given away sensitive data for nothing. Ask an employment lawyer which stage is right for you.
- A background check needs the applicant's written consent on a separate disclosure form.
- Treat this server as a starting point. For production, add logging of who reads records, a retention and deletion rule,
  and regular key rotation.
