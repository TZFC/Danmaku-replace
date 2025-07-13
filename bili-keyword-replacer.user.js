// ==UserScript==
// @name         Bili Keyword Replacer
// @namespace    https://github.com/TZFC/Danmaku-replace
// @downloadURL  https://raw.githubusercontent.com/TZFC/Danmaku-replace/main/bili-keyword-replacer.user.js
// @updateURL    https://raw.githubusercontent.com/TZFC/Danmaku-replace/main/bili-keyword-replacer.user.js
// @version      2.0
// @description  Replaces chosen substrings in outgoing Bilibili live-chat messages before they are sent
// @author       TZFC
// @match        https://live.bilibili.com/*
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

(() => {
  /* ────────────────────────────── SETTINGS ────────────────────────────── */
  /* Write the same number of items in both arrays, 1-to-1 correspondence. */
  const to_be_replace_list = ['包子', '舔jio',  '男娘','蓝凉','蓝涼','之交','抖音','y','m','p','r','e','o','x','k','i', '川普', '6','89'];  // ← originals
  const target_list        = ['包了', '舔.jio', '侽娘','侽娘','侽娘','Z交', '某音','у','м','р','г','е','о','х','κ','і', '川晋', 'б','ȣ9']; // ← replacements
  /* ────────────────────────── CHECK ────────────────────────── */
  if (to_be_replace_list.length !== target_list.length) {
    console.error('[Keyword Replacer] Array length mismatch!');
    return;
  }

  const SEND_PATH = '/msg/send';

  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    '(' + to_be_replace_list.map(esc).join('|') + ')',
    'g'
  );

  function transformMsg(str) {
    return str.replace(pattern, m => {
      const idx = to_be_replace_list
        .findIndex(src =>
          src === m
        );
      return target_list[idx];
    });
  }

  function sameEndpoint(url) {
    try { return new URL(url, location.origin).pathname.endsWith(SEND_PATH); }
    catch { return false; }
  }

  function patchedBody(body) {
    if (!body) return body;

    if (typeof body.has === 'function' && body.has('emoticonOptions')) {
    return body;
    }
    
    const m = body.get('msg');
    if (m) body.set('msg', transformMsg(m));
    return body;
  }

  /* ─────────────────────── fetch() HOOK ─────────────────────── */
  const nativeFetch = window.fetch;
  window.fetch = function (input, init = {}) {
    const url = typeof input === 'string' ? input
              : input instanceof Request   ? input.url
              : '';
    if (sameEndpoint(url)) {
      if (init.body) {
        init.body = patchedBody(init.body);
      } else if (input instanceof Request) {
        init = { ...input, body: patchedBody(input.body) };
        input = url;
      }
    }
    return nativeFetch.call(this, input, init);
  };

  /* ───────────── XMLHttpRequest HOOK (fallback path) ────────── */
  const XHROpen = XMLHttpRequest.prototype.open;
  const XHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this.__patchMe__ = sameEndpoint(url);
    return XHROpen.call(this, method, url, ...rest);
  };

  XMLHttpRequest.prototype.send = function (body) {
    if (this.__patchMe__) body = patchedBody(body);
    return XHRSend.call(this, body);
  };
})();
