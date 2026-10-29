import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Smartsupp live chat. Set VITE_SMARTSUPP_KEY in .env (Smartsupp dashboard > Settings > Channels > Live chat > Installation).
// With no key nothing is loaded. The chat is never loaded on the admin site, and it is hidden on the application form,
// where applicants type their Social Security number: a third-party widget has no business on that page.
const KEY = (import.meta.env.VITE_SMARTSUPP_KEY || '').trim();
const HIDE_ON = ['/apply'];

let started = false;

function start() {
  if (started || !KEY) return;
  started = true;
  window._smartsupp = window._smartsupp || {};
  window._smartsupp.key = KEY;
  if (!window.smartsupp) {
    const o = function () { o._.push(arguments); };
    o._ = [];
    window.smartsupp = o;
    const s = document.createElement('script');
    s.type = 'text/javascript'; s.charset = 'utf-8'; s.async = true;
    s.src = 'https://www.smartsuppchat.com/loader.js?';
    document.head.appendChild(s);
  }
  document.documentElement.classList.add('has-chat');
}

const call = (name) => { try { window.smartsupp?.(name); } catch { /* chat is optional */ } };

export default function SmartsuppChat() {
  const { pathname } = useLocation();
  const hidden = HIDE_ON.includes(pathname);

  useEffect(() => {
    if (!KEY) return undefined;
    if (!started && !hidden) {
      // Wait until the page is idle so the chat never slows the first paint.
      const go = () => start();
      const id = 'requestIdleCallback' in window ? window.requestIdleCallback(go, { timeout: 4000 }) : setTimeout(go, 2000);
      return () => ('cancelIdleCallback' in window ? window.cancelIdleCallback(id) : clearTimeout(id));
    }
    return undefined;
  }, [hidden]);

  useEffect(() => {
    if (!KEY || !started) return;
    call(hidden ? 'chat:hide' : 'chat:show');
    document.documentElement.classList.toggle('has-chat', !hidden);
  }, [hidden, pathname]);

  return null;
}
