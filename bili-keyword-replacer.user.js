// ==UserScript==
// @name         Bili Keyword Replacer
// @namespace    https://github.com/TZFC/Danmaku-replace
// @downloadURL  https://raw.githubusercontent.com/TZFC/Danmaku-replace/main/bili-keyword-replacer.user.js
// @updateURL    https://raw.githubusercontent.com/TZFC/Danmaku-replace/main/bili-keyword-replacer.user.js
// @version      4.5
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
  const to_be_replace_list = ['包子', '男娘','蓝凉','之交','抖音','y','m','p','r','e','o','x','k','i', 's', 't', 'u', 'r', '川普', '64','89','扣扣','胖次','我的名字','比基尼','丑','喷水','出','扶她','大大','插一下','念经似','舔','榜','看我','动态','1','2','3','4','5','6','7','8','9','0','面基'];  // ← originals
  const target_list        = ['包了', '侽娘','侽娘','Z交' ,'某音','у','м','р','г','е','о','х','κ','і', 'ṡ', 'ṭ', 'ụ', 'ṟ', '川晋', 'б4','ȣ9','扣.扣','胖㳄','我の名字','此基尼','吜','喷氺','岀','扶他','大太','插1下','念泾似','㖭','搒','着我','动.态', '𝟷','𝟸','𝟹','𝟺','𝟻','𝟼','𝟽','𝟾','𝟿','𝟶','面箕']; // ← replacements
  /* ────────────────────────── CHECK ────────────────────────── */
  if (to_be_replace_list.length !== target_list.length) {
    console.error('[Keyword Replacer] Array length mismatch!');
    return;
  }

  const SEND_PATH = '/msg/send';
  let DEFAULT_DECO_LEFT = localStorage.getItem('deco_left') || '';
  let DEFAULT_DECO_RIGHT = localStorage.getItem('deco_right') || '';

  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    '(' + to_be_replace_list.map(esc).join('|') + ')',
    'g'
  );

  function transformMsg(str) {
    var returned_content = str;
    if (str.startsWith('#s ')) {
      const content = str.slice(3);
      returned_content = content
        .replace(/\s+/g, '♫')
        .replace(/([^a-zA-Z0-9])(?=[^a-zA-Z0-9])/g, '$1♪'); 
    }
  
    if (str.startsWith('#c ')) {
      const content = str.slice(3);
      returned_content = '⚞'+content+'⚟'; 
    }
  
    if (str.startsWith('#f ')) {
      const content = str.slice(3);
      returned_content = '꧁'+content+'꧂'; 
    }

    if (str.startsWith('!d ')) {
      const content = str.slice(3);
      const command = content.trim();
      if (command==='c') {
        DEFAULT_DECO_LEFT = '⚞';
        DEFAULT_DECO_RIGHT = '⚟';
      }
      if (command==='f') {
        DEFAULT_DECO_LEFT = '꧁';
        DEFAULT_DECO_RIGHT = '꧂';
      }
      if (command==='x') {
        DEFAULT_DECO_LEFT = '';
        DEFAULT_DECO_RIGHT = '';
      }
      localStorage.setItem('deco_left', DEFAULT_DECO_LEFT);
      localStorage.setItem('deco_right', DEFAULT_DECO_RIGHT);
      return '';
    }
  
    returned_content = returned_content.replace(pattern, m => {
      const idx = to_be_replace_list.findIndex(src => src === m);
      return target_list[idx];
    });

    return DEFAULT_DECO_LEFT + returned_content + DEFAULT_DECO_RIGHT;
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
