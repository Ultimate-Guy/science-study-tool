// Minimal jQuery-like fallback for environments without CDN jQuery.
// Provides a small subset of jQuery used by the site's UI scripts.
(function (global) {
  if (global.jQuery) return; // don't override real jQuery

  function JQ(nodes) {
    this.nodes = Array.isArray(nodes) ? nodes : (nodes ? [nodes] : []);
  }

  JQ.prototype = {
    each: function (cb) {
      this.nodes.forEach((n, i) => cb.call(n, i, n));
      return this;
    },
    hide: function () {
      this.each(function () {
        this.style.display = 'none';
      });
      return this;
    },
    show: function () {
      this.each(function () {
        this.style.display = '';
      });
      return this;
    },
    css: function (k, v) {
      if (typeof k === 'string') {
        this.each(function () { this.style[k] = v; });
      } else if (typeof k === 'object') {
        this.each(function () { for (var p in k) this.style[p] = k[p]; });
      }
      return this;
    },
    on: function (ev, cb) {
      if (this.nodes.length === 0 && this.selector === window) {
        window.addEventListener(ev, cb);
        return this;
      }
      this.each(function () { this.addEventListener(ev, cb); });
      return this;
    },
    off: function (ev, cb) {
      this.each(function () { this.removeEventListener(ev, cb); });
      return this;
    },
    append: function (html) {
      this.each(function () { if (typeof html === 'string') this.insertAdjacentHTML('beforeend', html); else this.appendChild(html); });
      return this;
    },
    fadeOut: function (opts) {
      var duration = (opts && opts.duration) || 300;
      var complete = (opts && opts.complete) || function () {};
      this.each(function () {
        this.style.transition = `opacity ${duration}ms`;
        this.style.opacity = 1;
        requestAnimationFrame(() => { this.style.opacity = 0; });
        setTimeout(() => { this.style.display = 'none'; this.style.opacity = ''; this.style.transition = ''; complete.call(this); }, duration);
      });
      return this;
    },
    fadeIn: function (opts) {
      var duration = (opts && opts.duration) || 300;
      this.each(function () {
        this.style.display = '';
        this.style.opacity = 0;
        this.style.transition = `opacity ${duration}ms`;
        requestAnimationFrame(() => { this.style.opacity = 1; });
        setTimeout(() => { this.style.opacity = ''; this.style.transition = ''; }, duration);
      });
      return this;
    },
    find: function (sel) {
      var out = [];
      this.each(function () { out = out.concat(Array.from(this.querySelectorAll(sel))); });
      return new JQ(out);
    },
    attr: function (k, v) {
      if (v === undefined) return this.nodes[0] && this.nodes[0].getAttribute(k);
      this.each(function () { this.setAttribute(k, v); });
      return this;
    },
    text: function (t) {
      if (t === undefined) return this.nodes[0] && this.nodes[0].textContent;
      this.each(function () { this.textContent = t; });
      return this;
    },
    html: function (h) {
      if (h === undefined) return this.nodes[0] && this.nodes[0].innerHTML;
      this.each(function () { this.innerHTML = h; });
      return this;
    },
    val: function (v) {
      if (v === undefined) return this.nodes[0] && this.nodes[0].value;
      this.each(function () { this.value = v; });
      return this;
    },
    focus: function () { this.nodes[0] && this.nodes[0].focus(); return this; },
    toggleClass: function (cls) { this.each(function () { this.classList.toggle(cls); }); return this; },
    addClass: function (cls) { this.each(function () { this.classList.add(cls); }); return this; },
    removeClass: function (cls) { this.each(function () { this.classList.remove(cls); }); return this; }
  };

  function $(selector) {
    if (!selector) return new JQ([]);
    if (typeof selector === 'function') {
      if (document.readyState === 'complete' || document.readyState === 'interactive') selector();
      else document.addEventListener('DOMContentLoaded', selector);
      return new JQ([document]);
    }
    if (selector === window) return new JQ([window]);
    if (selector === document) return new JQ([document]);
    if (selector instanceof Node) return new JQ(selector);
    if (typeof selector === 'string') {
      try {
        var nlist = Array.from(document.querySelectorAll(selector));
        var jq = new JQ(nlist);
        jq.selector = selector;
        return jq;
      } catch (e) { return new JQ([]); }
    }
    return new JQ([]);
  }

  $.fn = JQ.prototype;
  $.extend = function (target, src) { for (var k in src) target[k] = src[k]; return target; };
  global.$ = global.jQuery = $;
})(this);
