/*
 * AnyVendor editor bridge v1 (schema "anyvendor.bridge/v1"), the site's side. Copy this file into your
 * site unchanged. The editor's side is src/lib/business/site-bridge.ts in the AnyVendor repository and
 * the written protocol is docs/backend/HANDOFF-TL-SITE-BRIDGE.md.
 *
 * What it does: when your DRAFT page is opened inside the AnyVendor editor (a frame, with av_edit=1 in
 * the address), it tells the editor which editable fields and chapters are on the page, reports the
 * field a person clicks, outlines the field the editor is focused on, and shows unsaved text, pictures
 * and chapter order the editor sends, so the person sees the change before saving.
 *
 * What it never does: it holds no key, token or password, makes no network request, reads no form
 * input and saves nothing. It never puts the page address (which contains the draft token) in a
 * message. Saving, publishing, versions and permissions all happen in AnyVendor under the person's own
 * sign-in. It talks only to the editor origins you list, only inside their frame, and stays silent
 * until one of them says hello.
 *
 * Start it from your draft page only:
 *   <script src="/anyvendor-bridge.js" defer></script>
 *   <script>window.addEventListener("DOMContentLoaded", function () {
 *     AnyVendorBridge.start({
 *       slug: "tl-executive-cars",
 *       origins: ["https://platform.anyvendor.co.uk"],
 *       capabilities: { text: true, image: true, chapters: true },
 *       keepVisible: ["plan"]            // optional: chapters the page always shows
 *       // onChapters: function (order) { ... }   optional: apply order/visibility yourself
 *     });
 *   });</script>
 *
 * Marks it relies on (nothing else is read from the page):
 *   <h1 data-av-field="hero.title">Text</h1>              a text field: the element's text is the field
 *   <img data-av-field="about.image" src="..." alt="...">  an image field
 *   <div data-av-chapter="fleet"> ... </div>               one per chapter; siblings in one parent
 * Marks may be added after load (for example on hydration); the field list is read again on each hello
 * and sent once more if it has grown.
 */
(function (global) {
  "use strict";
  var SCHEMA = "anyvendor.bridge/v1";
  var SLUG = /^[a-z0-9][a-z0-9-]{0,62}$/;
  var KEY = /^[a-z][a-z0-9_]{0,39}$/;
  var FIELD = /^[a-z][a-z0-9_]{0,39}\.[a-z][a-z0-9_]{0,39}(\.\d{1,2}\.[a-z][a-z0-9_]{0,39})?$/;
  var NONCE = /^[A-Za-z0-9_-]{16,64}$/;
  var ORIGIN = /^https:\/\/[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;
  var LIMITS = { fields: 400, chapters: 40, text: 10000, url: 2000, alt: 200 };
  var started = false;

  function start(options) {
    if (started) return false;
    var slug = options && options.slug;
    var origins = ((options && options.origins) || []).filter(function (o) { return typeof o === "string" && ORIGIN.test(o); });
    var want = (options && options.capabilities) || {};
    var caps = { text: want.text === true, image: want.image === true, chapters: want.chapters === true };
    var keepVisible = ((options && options.keepVisible) || []).filter(function (k) { return KEY.test(k); });
    var onChapters = options && typeof options.onChapters === "function" ? options.onChapters : null;
    // Only inside a frame, only when the editor asked for it, only with somewhere allowed to talk to.
    if (global.parent === global || typeof slug !== "string" || !SLUG.test(slug) || !origins.length) return false;
    if (new URLSearchParams(global.location.search).get("av_edit") !== "1") return false;
    started = true;

    var doc = global.document;
    var peer = null;   // the one origin that completed the handshake
    var nonce = "";    // the nonce of that handshake, echoed in every `ready`
    var armed = false; // page behaviour changes only after the handshake
    var lastCount = -1;

    function send(type, body) {
      if (!peer) return;
      var msg = { schema: SCHEMA, slug: slug, type: type };
      for (var k in body) if (Object.prototype.hasOwnProperty.call(body, k)) msg[k] = body[k];
      global.parent.postMessage(msg, peer); // always the handshake origin, never "*"
    }
    function marked() {
      return Array.prototype.slice.call(doc.querySelectorAll("[data-av-field]")).filter(function (el) { return FIELD.test(el.getAttribute("data-av-field") || ""); });
    }
    function chapterEls() {
      return Array.prototype.slice.call(doc.querySelectorAll("[data-av-chapter]")).filter(function (el) { return KEY.test(el.getAttribute("data-av-chapter") || ""); });
    }
    function unique(list, max) {
      var seen = {}, out = [];
      for (var i = 0; i < list.length && out.length < max; i++) if (!seen[list[i]]) { seen[list[i]] = true; out.push(list[i]); }
      return out;
    }
    function ready() {
      var fields = unique(marked().map(function (el) { return el.getAttribute("data-av-field"); }), LIMITS.fields);
      lastCount = fields.length;
      send("ready", {
        nonce: nonce,
        fields: fields,
        chapters: unique(chapterEls().map(function (el) { return el.getAttribute("data-av-chapter"); }), LIMITS.chapters),
        capabilities: { text: caps.text, image: caps.image, chapters: caps.chapters },
      });
    }

    function arm() {
      if (armed) return;
      armed = true;
      var style = doc.createElement("style");
      style.textContent =
        "[data-av-field]{cursor:pointer}" +
        "[data-av-field]:hover{outline:1px solid rgba(17,24,39,.55);outline-offset:3px}" +
        "[data-av-field][data-av-active]{outline:2px solid #111827;outline-offset:3px;box-shadow:0 0 0 5px rgba(255,255,255,.85)}" +
        "[data-av-chapter][data-av-hidden]{display:none!important}";
      doc.head.appendChild(style);
      // A click on an editable element selects it in the editor instead of doing what it normally does.
      doc.addEventListener("click", function (ev) {
        var t = ev.target && ev.target.closest ? ev.target : null;
        var el = t ? t.closest("[data-av-field]") : null;
        if (el && FIELD.test(el.getAttribute("data-av-field") || "")) {
          ev.preventDefault();
          ev.stopPropagation();
          send("select", { field: el.getAttribute("data-av-field") });
          return;
        }
        // The frame must stay on the draft page: links elsewhere do nothing here. Same-page links still work.
        var link = t ? t.closest("a[href]") : null;
        if (link && (link.getAttribute("href") || "").charAt(0) !== "#") ev.preventDefault();
      }, true);
      // A draft in the editor never sends a form (no test enquiry from an editing session).
      doc.addEventListener("submit", function (ev) { ev.preventDefault(); ev.stopPropagation(); }, true);
      // Marks added by the page after load: tell the editor once more if the list has grown.
      global.setTimeout(function () { if (peer && marked().length !== lastCount) ready(); }, 1500);
      global.setTimeout(function () { if (peer && marked().length !== lastCount) ready(); }, 5000);
    }

    function highlight(field) {
      var first = null;
      marked().forEach(function (el) {
        if (field !== null && el.getAttribute("data-av-field") === field) { el.setAttribute("data-av-active", ""); first = first || el; }
        else el.removeAttribute("data-av-active");
      });
      if (first && first.scrollIntoView) {
        var calm = global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches;
        first.scrollIntoView({ block: "center", behavior: calm ? "auto" : "smooth" });
      }
    }
    function imageSrc(v) {
      if (typeof v !== "string" || v.length > LIMITS.url) return null;
      if (/^https:\/\/[^\s<>"'`\\]+$/.test(v) || /^\/(?!\/)[A-Za-z0-9/_.~%-]*$/.test(v)) return v;
      return null;
    }
    function set(field, value) {
      marked().forEach(function (el) {
        if (el.getAttribute("data-av-field") !== field) return;
        if (el.tagName === "IMG") {
          if (!caps.image || !value || typeof value !== "object") return;
          var src = imageSrc(value.src);
          if (src) { el.removeAttribute("srcset"); el.removeAttribute("sizes"); el.setAttribute("src", src); }
          if (typeof value.alt === "string") el.setAttribute("alt", value.alt.slice(0, LIMITS.alt));
        } else if (caps.text && typeof value === "string") {
          el.textContent = value.slice(0, LIMITS.text); // text only, never HTML
        }
      });
    }
    function chapters(order) {
      if (!caps.chapters || !Array.isArray(order) || order.length > LIMITS.chapters) return;
      var clean = [], seen = {};
      for (var i = 0; i < order.length; i++) {
        var r = order[i];
        if (!r || typeof r !== "object" || typeof r.chapter !== "string" || !KEY.test(r.chapter) || seen[r.chapter]) continue;
        seen[r.chapter] = true;
        clean.push({ chapter: r.chapter, visible: r.visible === true || keepVisible.indexOf(r.chapter) >= 0 });
      }
      if (onChapters) { onChapters(clean); return; }
      var byKey = {};
      var onPage = chapterEls();
      onPage.forEach(function (el) { byKey[el.getAttribute("data-av-chapter")] = el; });
      // Listed chapters take their order starting where the first chapter sits now; they never leave their parent.
      var last = null;
      clean.forEach(function (r) {
        var el = byKey[r.chapter];
        if (!el) return; // a chapter that is not on the page appears after a save and reload
        if (r.visible) el.removeAttribute("data-av-hidden"); else el.setAttribute("data-av-hidden", "");
        if (!last) {
          var first = onPage[0];
          if (first !== el && first.parentNode === el.parentNode) first.parentNode.insertBefore(el, first);
        } else if (last.parentNode === el.parentNode && last.nextElementSibling !== el) last.parentNode.insertBefore(el, last.nextElementSibling);
        last = el;
      });
      // A chapter left out of the list has been removed: hide it unless the page always shows it.
      Object.keys(byKey).forEach(function (k) { if (!seen[k] && keepVisible.indexOf(k) < 0) byKey[k].setAttribute("data-av-hidden", ""); });
    }

    global.addEventListener("message", function (ev) {
      // Checked before anything is read: who sent it, from where, and that it is ours.
      if (ev.source !== global.parent || origins.indexOf(ev.origin) < 0) return;
      var d = ev.data;
      if (!d || typeof d !== "object" || d.schema !== SCHEMA || d.slug !== slug || typeof d.type !== "string") return;
      if (d.type === "hello") {
        if (typeof d.nonce !== "string" || !NONCE.test(d.nonce)) return;
        if (peer && ev.origin !== peer) return; // one editor per page load
        peer = ev.origin;
        nonce = d.nonce;
        arm();
        ready();
        return;
      }
      if (ev.origin !== peer) return; // everything else only after the handshake, from the same origin
      if (d.type === "highlight") { if (d.field === null || (typeof d.field === "string" && FIELD.test(d.field))) highlight(d.field); }
      else if (d.type === "set") { if (typeof d.field === "string" && FIELD.test(d.field)) set(d.field, d.value); }
      else if (d.type === "chapters") chapters(d.order);
      else if (d.type === "reload") global.location.reload();
      // Any other type is ignored.
    });
    return true;
  }

  global.AnyVendorBridge = { start: start, schema: SCHEMA };
})(window);
