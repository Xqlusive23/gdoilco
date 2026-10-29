// Sends the emails. With SMTP_HOST set in .env it sends real mail. Without it (for example on your own computer)
// nothing leaves the machine: each email is saved as a web page in DATA_DIR/outbox so you can open it and see it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { ASSETS, renderEmail } from './email/templates.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const ASSET_DIR = path.join(here, 'email', 'assets');
const MIME = { '.jpg': 'image/jpeg', '.png': 'image/png' };

const short = (e) => String(e?.code || e?.message || 'unknown error').replace(/[\r\n]+/g, ' ').slice(0, 160);

export function createMailer({ dataDir, env = process.env }) {
  const from = env.MAIL_FROM || 'GDoilco Careers <info@gdoilcompany.online>';
  const live = !!env.SMTP_HOST;
  const transport = live
    ? nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT) || 587,
        secure: env.SMTP_SECURE === 'true',
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
        connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
      })
    : null;

  // Which pictures does this email use? Attach only those.
  const used = (html) => Object.keys(ASSETS).filter((cid) => html.includes('cid:' + cid + '"'));

  return {
    live,
    // d: see renderEmail. Never throws; returns { ok, mode, error? }.
    async send(type, d) {
      try {
        const { subject, html, text } = renderEmail(type, { ...d, siteUrl: (env.PUBLIC_URL || '').replace(/\/$/, '') });
        if (!live) {
          const dir = path.join(dataDir, 'outbox');
          fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
          let page = html;
          for (const cid of used(html)) {
            const file = ASSETS[cid];
            const uri = `data:${MIME[path.extname(file)]};base64,${fs.readFileSync(path.join(ASSET_DIR, file)).toString('base64')}`;
            page = page.split('cid:' + cid + '"').join(uri + '"');
          }
          const name = `${new Date().toISOString().replace(/[:.]/g, '-')}-${type}-${d.ref}.html`;
          fs.writeFileSync(path.join(dir, name), `<!-- To: ${d.email}\n     Subject: ${subject} -->\n` + page, { mode: 0o600 });
          return { ok: true, mode: 'outbox', file: name };
        }
        await transport.sendMail({
          from, to: d.email, replyTo: env.MAIL_REPLY_TO || undefined, subject, text, html,
          attachments: used(html).map((cid) => ({ filename: ASSETS[cid], path: path.join(ASSET_DIR, ASSETS[cid]), cid, contentDisposition: 'inline' })),
        });
        return { ok: true, mode: 'smtp' };
      } catch (e) {
        console.error('Email failed:', short(e));
        return { ok: false, mode: live ? 'smtp' : 'outbox', error: short(e) };
      }
    },
  };
}
