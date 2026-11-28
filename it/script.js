(function () {
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  document.documentElement.classList.remove('no-js');

  // Theme
  $('#theme').addEventListener('click', function (ev) {
    var next = root.dataset.theme === 'light' ? 'dark' : 'light';
    function apply() { root.dataset.theme = next; try { localStorage.setItem('theme', next); } catch (e) {} }
    if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) { apply(); return; }
    var r = this.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    var rad = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('vt');
    var vt = document.startViewTransition(apply);
    vt.ready.then(function () {
      root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + rad + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 750, easing: 'cubic-bezier(.22,.75,.2,1)', pseudoElement: '::view-transition-new(root)' });
    }).catch(function () {});
    vt.finished.then(function () { root.classList.remove('vt'); }, function () { root.classList.remove('vt'); });
  });

  // Mobile menu
  var nav = $('#nav'), menu = $('#menu');
  function closeMenu() { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }
  menu.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', closeMenu); });

  // Active section in nav
  var links = $$('a', nav);
  var jchips = $$('.jchip, .jtile');
  $$('.jdrop').forEach(function (d) { var b = $('.jbtn', d); b.addEventListener('click', function () { var o = d.classList.toggle('is-open'); b.setAttribute('aria-expanded', o); }); $$('.jtile', d).forEach(function (t) { t.addEventListener('click', function () { d.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); }); }); });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var id = e.target.id; var inProj = /^p\d\d$/.test(id); var inExp = /^e\d\d$/.test(id) || id==='experience'; links.forEach(function (l) { var h = l.getAttribute('href'); l.classList.toggle('on', inExp ? l.dataset.group === 'exp' : inProj ? l.dataset.group === 'project' : h === '#' + id); });
          jchips.forEach(function (c) { if (c.closest('.pjump')) return; c.classList.toggle('on', c.getAttribute('href') === '#' + id); });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    var rv = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }); }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
    $$('.reveal').forEach(function (r) { rv.observe(r); });
    $$('main > section[id], .pslide').forEach(function (s) { io.observe(s); });
  }

  if (!('IntersectionObserver' in window)) { $$('.reveal').forEach(function (r) { r.classList.add('in'); }); }

  // Typing effect
  var WORDS_EN = ['IT Technician', 'Technical Support Technician', 'Windows Troubleshooter'];
  var words = WORDS_EN;
  var el = $('#typing');
  var typingOn = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tw = { w: 0, n: 0, del: false, t: 0 };
  function tick() {
    var word = words[tw.w];
    tw.n += tw.del ? -1 : 1;
    el.textContent = word.slice(0, tw.n);
    var delay = tw.del ? 35 : 80;
    if (!tw.del && tw.n === word.length) { tw.del = true; delay = 1800; }
    else if (tw.del && tw.n === 0) { tw.del = false; tw.w = (tw.w + 1) % words.length; delay = 350; }
    tw.t = setTimeout(tick, delay);
  }
  function startTyping() {
    clearTimeout(tw.t); tw.w = 0; tw.n = 0; tw.del = false;
    if (typingOn) { el.textContent = ''; tick(); } else { el.textContent = words[0]; }
  }
  startTyping();

  // Certificate filter
  var chips = $$('.chip'), certs = $$('#certs li');
  chips.forEach(function (c) {
    c.addEventListener('click', function () {
      chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); });
      var f = c.dataset.f;
      certs.forEach(function (li) { li.hidden = !(f === 'all' || li.dataset.i === f); });
    });
  });

  // Certificate lightbox
  var dlg = $('#lightbox'), img = $('#lb-img'), cap = $('#lb-cap');
  certs.forEach(function (li) {
    $('button', li).addEventListener('click', function () {
      var s = $('img', li).getAttribute('src');
      img.src = s;
      var title = $('strong', li).textContent, by = $('small', li).textContent;
      img.alt = title + ' certificate from ' + by;
      cap.textContent = title + ' · ' + by;
      dlg.showModal();
    });
  });
  $('.close', dlg).addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });


  // Projects slider: arrows, autoplay, category filters, stacked fallback
  var pslider = $('#pslider');
  if (pslider) {
    var pv = $('.pviewport', pslider), pt = $('.ptrack', pslider);
    var pslides = $$('.project', pt);
    var pprev = $('.pprev', pslider), pnext = $('.pnext', pslider);
    var pnow = $('.pcount b', pslider), ptot = $('.ptot', pslider);
    var pfill = $('.pprogress span', pslider), pcat = $('.pcat', pslider);
    var ppause = $('.ppause', pslider), pview = $('#pview');
    var pfchips = $$('.pfchip');
    var view = pslides.slice(), pi = 0, stacked = false;
    var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var DELAY = 3000, ptimer = null, coolUntil = 0, paused = false, hovering = false, onScreen = false, swiped = false;
    var AR = function (en, ar) { return root.lang === 'ar' ? ar : en; };

    function pRtl() { return root.dir === 'rtl'; }
    function pPad(n) { return (n < 10 ? '0' : '') + n; }

    function pLayout(anim) {
      if (stacked || !view.length) return;
      var w = pv.clientWidth;
      if (!anim) { pt.classList.add('no-anim'); pv.style.transition = 'none'; }
      pt.style.transform = 'translateX(' + (pRtl() ? pi * w : -pi * w) + 'px)';
      pv.style.height = view[pi].offsetHeight + 'px';
      if (!anim) { void pt.offsetWidth; pt.classList.remove('no-anim'); pv.style.transition = ''; }
    }

    function pPaint() {
      if (!stacked && view.length) {
        pslides.forEach(function (s) {
          var on = s === view[pi];
          s.classList.toggle('is-active', on);
          if (on) { s.removeAttribute('aria-hidden'); s.removeAttribute('inert'); }
          else { s.setAttribute('aria-hidden', 'true'); s.setAttribute('inert', ''); }
        });
        pnow.textContent = pPad(pi + 1);
        ptot.textContent = '/ ' + pPad(view.length);
        pfill.style.width = ((pi + 1) / view.length * 100) + '%';
        var chip = pfchips.filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; })[0];
        if (chip) pcat.textContent = $('span', chip).textContent;
        $$('.pjump .jtile').forEach(function (t) { t.classList.toggle('on', t.getAttribute('href') === '#' + view[pi].id); });
      }
      if (pview) {
        $('span', pview).textContent = stacked ? AR('Back to slider', 'رجوع للسلايدر') : AR('Show all projects', 'اعرض كل المشاريع');
        pview.setAttribute('aria-pressed', String(stacked));
        $('i', pview).className = stacked ? 'fas fa-images' : 'fas fa-table-cells-large';
      }
    }

    function pGo(i, user) {
      if (stacked || !view.length) return;
      pi = (i + view.length) % view.length;
      pLayout(true); pPaint();
      if (user) pCool();
    }

    function pPlay() {
      clearTimeout(ptimer);
      if (stacked || paused || view.length < 2) return;
      var wait = Math.max(DELAY, coolUntil - Date.now());
      ptimer = setTimeout(function () {
        if (!document.hidden && onScreen && !stacked && !paused) pGo(pi + 1);
        pPlay();
      }, wait);
    }
    function pRestart() { clearTimeout(ptimer); pPlay(); }
    function pCool(ms) { coolUntil = Date.now() + (ms || 6000); pPlay(); }

    function pFilter(f) {
      pfchips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.f === f)); });
      view = pslides.filter(function (s) {
        return f === 'all' || (' ' + (s.dataset.cat || '') + ' ').indexOf(' ' + f + ' ') > -1;
      });
      pslides.forEach(function (s) { s.classList.toggle('is-off', view.indexOf(s) < 0); });
      pi = 0;
      pLayout(false); pPaint(); pCool(6000);
    }

    function pStacked(on) {
      stacked = on;
      pslider.classList.toggle('is-stacked', on);
      pslides.forEach(function (s) { s.classList.remove('is-off'); s.classList.remove('is-active'); s.removeAttribute('aria-hidden'); s.removeAttribute('inert'); });
      pfchips.forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.f === 'all')); });
      view = pslides.slice(); pi = 0;
      if (on) {
        clearTimeout(ptimer);
        pv.style.height = ''; pt.style.transform = '';
      } else {
        pLayout(false); pRestart();
      }
      pPaint();
    }

    if (pprev) pprev.addEventListener('click', function () { pGo(pi - 1, true); });
    if (pnext) pnext.addEventListener('click', function () { pGo(pi + 1, true); });
    pfchips.forEach(function (c) { c.addEventListener('click', function () { pFilter(c.dataset.f); }); });
    if (pview) pview.addEventListener('click', function () { pStacked(!stacked); });

    if (ppause) ppause.addEventListener('click', function () {
      paused = !paused;
      ppause.setAttribute('aria-pressed', String(paused));
      ppause.setAttribute('aria-label', paused ? AR('Play slideshow', 'تشغيل العرض التلقائي') : AR('Pause slideshow', 'إيقاف العرض التلقائي'));
      $('i', ppause).className = paused ? 'fas fa-play' : 'fas fa-pause';
      if (paused) clearTimeout(ptimer); else pPlay();
    });

    pslider.addEventListener('keydown', function (e) {
      if (stacked) return;
      if (e.key === 'ArrowRight') { pGo(pi + (pRtl() ? -1 : 1), true); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { pGo(pi + (pRtl() ? 1 : -1), true); e.preventDefault(); }
    });

    var psx = 0, psy = 0, ptrk = false;
    pv.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && e.button !== 0) return; psx = e.clientX; psy = e.clientY; ptrk = true; });
    pv.addEventListener('pointerup', function (e) {
      if (!ptrk) return; ptrk = false;
      var dx = e.clientX - psx, dy = e.clientY - psy;
      if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
      swiped = true; setTimeout(function () { swiped = false; }, 0);
      pGo(pi + ((pRtl() ? dx > 0 : dx < 0) ? 1 : -1), true);
    });
    pv.addEventListener('click', function (e) { if (swiped) { e.preventDefault(); e.stopPropagation(); } }, true);

    function pJump(id) {
      var el = document.getElementById(id);
      if (!el || pslides.indexOf(el) < 0) return false;
      var pin = $('#projects'); if (pin) pin.classList.add('in');
      if (stacked) pStacked(false);
      pFilter('all');
      pi = view.indexOf(el);
      pLayout(true); pPaint(); pRestart();
      return true;
    }
    $$('a[href^="#p"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        if (!/^p\d\d$/.test(id) || !pJump(id)) return;
        e.preventDefault();
        pslider.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });

    pslider.classList.add('is-ready');
    pLayout(false); pPaint();
    if (/^#p\d\d$/.test(location.hash)) {
      pJump(location.hash.slice(1));
      setTimeout(function () { pslider.scrollIntoView({ block: 'start' }); }, 80);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { onScreen = e.isIntersecting; if (onScreen) pPlay(); });
      }, { threshold: 0 }).observe(pslider);
    } else { onScreen = true; }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) pPlay(); });
    window.addEventListener('resize', function () { pLayout(false); });
    window.addEventListener('load', function () { pLayout(false); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { pLayout(false); });
    var phire = $('#hire'), pbarEl = $('.pbar', pslider);
    if (phire && pbarEl && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { phire.classList.toggle('away', e.isIntersecting); }); }, { threshold: 0.35 }).observe(pbarEl);
    }
    window.__pRepaint = function () { pLayout(false); pPaint(); };
    pPlay();
  }

  // Language switch (English default, Arabic on request)
  var D = {}, A = {};
  var langBtn = $('#lang');
  var items = [], attrs = [], prepared = false, loadingDict = false;
  // The Arabic dictionary (lang-ar.js, ~50 KB) is only fetched when Arabic is first requested.
  function prepare() {
    if (prepared) return; prepared = true;
    D = window.AR_DICT || {}; A = window.AR_ATTR || {};
    var tree = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || /^(SCRIPT|STYLE)$/.test(p.nodeName) || p.closest('#lang') || p.closest('#typing')) return NodeFilter.FILTER_REJECT;
        return n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var tn;
    while ((tn = tree.nextNode())) {
      var key = tn.nodeValue.replace(/\s+/g, ' ').trim();
      if (Object.prototype.hasOwnProperty.call(D, key)) items.push({ n: tn, en: tn.nodeValue, key: key });
    }
    $$('[aria-label]').forEach(function (e) {
      var v = e.getAttribute('aria-label');
      if (Object.prototype.hasOwnProperty.call(A, v)) attrs.push({ e: e, en: v });
    });
  }
  function loadDict(cb) {
    if (window.AR_DICT) { cb(); return; }
    if (loadingDict) return; loadingDict = true;
    var sc = document.createElement('script'); sc.src = 'lang-ar.js';
    sc.onload = function () { loadingDict = false; cb(); };
    sc.onerror = function () { loadingDict = false; langBtn.classList.remove('is-busy'); };
    langBtn.classList.add('is-busy');
    document.head.appendChild(sc);
  }
  var metaDesc = $('meta[name="description"]');
  var EN_TITLE = document.title, EN_DESC = metaDesc ? metaDesc.content : '';

  function setLang(lang, save) {
    var ar = lang === 'ar';
    if (ar && !window.AR_DICT) { loadDict(function () { setLang(lang, save); }); return; }
    langBtn.classList.remove('is-busy');
    if (ar) prepare();
    items.forEach(function (o) {
      if (ar) { o.n.nodeValue = o.en.match(/^\s*/)[0] + D[o.key] + o.en.match(/\s*$/)[0]; }
      else { o.n.nodeValue = o.en; }
    });
    attrs.forEach(function (o) { o.e.setAttribute('aria-label', ar ? A[o.en] : o.en); });
    root.lang = ar ? 'ar' : 'en';
    root.dir = ar ? 'rtl' : 'ltr';
    document.title = ar && window.AR_TITLE ? window.AR_TITLE : EN_TITLE;
    if (metaDesc) metaDesc.content = ar && window.AR_DESC ? window.AR_DESC : EN_DESC;
    langBtn.firstElementChild.textContent = ar ? 'EN' : 'ع';
    langBtn.lang = ar ? 'en' : 'ar';
    langBtn.setAttribute('aria-label', ar ? 'Switch language to English' : 'التبديل إلى العربية');
    words = ar && window.AR_WORDS ? window.AR_WORDS : WORDS_EN;
    startTyping();
    if (save) { try { localStorage.setItem('lang', lang); } catch (e) {} }
    if (window.__pRepaint) window.__pRepaint();
  }
  langBtn.addEventListener('click', function () { setLang(root.lang === 'ar' ? 'en' : 'ar', true); });
  if (root.lang === 'ar') setLang('ar', false);
})();

// Fit the giant cover word to the viewport width
(function () {
  var g = document.querySelector('.giant');
  if (!g) return;
  function fit() {
    g.style.fontSize = '100px';
    var cw = document.querySelector('.cover').clientWidth; var target = cw < 996 ? (cw - 32) * 0.98 : Math.min(cw * 0.56, (document.querySelector('.cutout').getBoundingClientRect().left - 24) - cw*0.0375);
    var w = g.getBoundingClientRect().width;
    if (w > 0) g.style.fontSize = Math.min(100 * target / w, window.innerHeight * 0.7) + 'px';
  }
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('load', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();

// Hide the floating "Hire me" button while the contact section is on screen
(function () {
  var hire = document.getElementById('hire'), c = document.getElementById('contact');
  if (!hire || !c || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(function (es) { es.forEach(function (e) { hire.classList.toggle('hide', e.isIntersecting); }); }, { threshold: 0.25 }).observe(c);
})();

// Site-wide polish: staggered reveals, scroll progress, header shadow
(function () {
  var q = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var groups = ['.skills', '.tags', '.svc-grid', '.how-steps', '.contact-list', '.thanks .social', '.chips'];
  groups.forEach(function (sel) {
    q(sel).forEach(function (ul) {
      var kids = q(':scope > li, :scope > button', ul);
      kids.forEach(function (li, i) { li.classList.add('rv-item'); li.style.setProperty('--d', Math.min(i, 12)); });
    });
  });
  var certs = q('#certs li');
  certs.forEach(function (li, i) { li.classList.add('rv-item'); li.style.setProperty('--d', Math.min(i, 8)); });
  q('.how h3, .how-lead, .svc-cta, .contact-lead').forEach(function (e, i) { e.classList.add('rv-item'); e.style.setProperty('--d', i); });
  if (!('IntersectionObserver' in window)) { q('.rv-item').forEach(function (e) { e.classList.add('rv-in'); }); }
  else {
    var io2 = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('rv-in'); io2.unobserve(e.target); } }); }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    q('.rv-item').forEach(function (e) { io2.observe(e); });
  }
  var bar = document.querySelector('.bar');
  var pr = document.createElement('div'); pr.className = 'sprog'; pr.setAttribute('aria-hidden', 'true'); document.body.appendChild(pr);
  var tick = false;
  function upd() {
    tick = false;
    var h = document.documentElement.scrollHeight - innerHeight;
    var prog = h > 0 ? Math.min(1, scrollY / h) : 0;
    pr.style.transform = 'scaleX(' + prog + ')';
    if (window.__fxScroll) window.__fxScroll(prog);
    if (bar) bar.classList.toggle('scrolled', scrollY > 8);
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  upd();
})();

// v43: spotlight, glare, tilt, magnetic pull, ripple, count-up, back-to-top
(function () {
  var doc = document, root = doc.documentElement;
  var q = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var ar = function () { return root.lang === 'ar'; };
  var hasIO = 'IntersectionObserver' in window;

  // Cursor spotlight on cards and glare on screenshots (one delegated listener, rAF-throttled)
  q('.skills li, .svc-grid li, .grid li > a, .grid li > button, .contact-list li > a, .shot').forEach(function (e) { e.classList.add('fx'); });
  if (fine && !reduce) {
    var spotEl = null, spotEv = null, spotRaf = 0;
    doc.addEventListener('pointermove', function (e) {
      var t = e.target.closest ? e.target.closest('.fx') : null;
      if (!t) return;
      spotEl = t; spotEv = e;
      if (!spotRaf) spotRaf = requestAnimationFrame(function () {
        spotRaf = 0;
        var r = spotEl.getBoundingClientRect();
        spotEl.style.setProperty('--mx', (spotEv.clientX - r.left) + 'px');
        spotEl.style.setProperty('--my', (spotEv.clientY - r.top) + 'px');
      });
    }, { passive: true });

    // 3D tilt on the hero portrait
    var cut = $c('.cutout');
    if (cut) {
      var tRaf = 0, tx = 0, ty = 0;
      cut.addEventListener('pointermove', function (e) {
        var r = cut.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - .5); ty = ((e.clientY - r.top) / r.height - .5);
        cut.classList.add('is-tilting');
        if (!tRaf) tRaf = requestAnimationFrame(function () {
          tRaf = 0;
          cut.style.setProperty('--ry', (tx * 14).toFixed(2) + 'deg');
          cut.style.setProperty('--rx', (-ty * 12).toFixed(2) + 'deg');
        });
      });
      cut.addEventListener('pointerleave', function () {
        cut.classList.remove('is-tilting');
        cut.style.setProperty('--ry', '0deg'); cut.style.setProperty('--rx', '0deg');
      });
    }

    // Magnetic pull on primary buttons (uses the independent `translate` property)
    q('.btn, .hire, .open').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) * .22, dy = (e.clientY - (r.top + r.height / 2)) * .3;
        b.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', function () { b.style.translate = ''; });
    });
  }
  function $c(s) { return doc.querySelector(s); }

  // Click ripple
  if (!reduce) {
    var RIP = '.btn, .hire, .open, .pview, .pfchip, .chip';
    q(RIP).forEach(function (e) { e.classList.add('rip-host'); });
    doc.addEventListener('pointerdown', function (e) {
      var h = e.target.closest ? e.target.closest(RIP) : null;
      if (!h) return;
      var r = h.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
      var s = doc.createElement('u'); s.className = 'rip'; s.setAttribute('aria-hidden', 'true');
      s.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px';
      h.appendChild(s);
      s.addEventListener('animationend', function () { s.remove(); });
    });
  }

  // Count-up for numeric stats
  q('.meta-row dd').forEach(function (dd) {
    var n = parseInt(dd.textContent, 10);
    if (!/^\d+$/.test(dd.textContent.trim()) || reduce || !hasIO) return;
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return; io.disconnect();
      var t0 = performance.now(), dur = 1400;
      (function step(t) {
        if (dd.dataset.done) return;
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        dd.textContent = Math.round(n * e);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: .6 });
    dd.dataset.count = n; dd.textContent = '0'; io.observe(dd);
  });

  // Pause hero animations when the hero is off screen
  var cover = $c('.cover');
  if (cover && hasIO) new IntersectionObserver(function (es) { cover.classList.toggle('fx-off', !es[0].isIntersecting); }).observe(cover);

  // Back-to-top button with progress ring
  var top = $c('#totop');
  if (top) {
    top.addEventListener('click', function () { scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
    window.__fxScroll = function (p) {
      top.style.setProperty('--p', p.toFixed(3));
      top.classList.toggle('show', scrollY > 700);
    };
    var gone = {};
    var hideWhen = function (el, key, th) {
      if (el && hasIO) new IntersectionObserver(function (es) {
        gone[key] = es[0].isIntersecting;
        top.classList.toggle('away', !!(gone.bar || gone.foot));
      }, { threshold: th }).observe(el);
    };
    hideWhen($c('.pbar'), 'bar', .35);
    hideWhen($c('footer'), 'foot', 0);
  }

  // Toast helper (used by the vCard button)
  var toast = $c('#toast'), toastT = 0;
  function say(msg) {
    if (!toast) return;
    toast.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i>';
    toast.appendChild(doc.createTextNode(msg));
    toast.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('show'); }, 2000);
  }
  window.__fxSay = say;
})();

// v44: search palette (Ctrl+K), vCard download, lazy-image loading polish
(function () {
  var doc = document, root = doc.documentElement;
  var q = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var $1 = function (s, c) { return (c || doc).querySelector(s); };
  var ar = function () { return root.lang === 'ar'; };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- image skeleton + reveal ----
  q('img[loading="lazy"]').forEach(function (img) {
    if (img.complete) return;
    var host = img.parentElement && img.parentElement.matches('.shot, .grid li > button') ? img.parentElement : null;
    img.classList.add('img-wait'); if (host) host.classList.add('is-loading');
    function done(ok) {
      img.classList.remove('img-wait'); if (ok) img.classList.add('img-ok');
      if (host) host.classList.remove('is-loading');
    }
    img.addEventListener('load', function () { done(true); }, { once: true });
    img.addEventListener('error', function () { done(false); }, { once: true });
  });

  // ---- vCard (built in the browser from the page's own contact details) ----
  var vb = $1('#vcard');
  if (vb) vb.addEventListener('click', function () {
    var mail = ($1('a[href^="mailto:"]') || {}).href || '';
    var wa = ($1('a[href*="wa.me/"]') || {}).href || '';
    var li = ($1('a[href*="linkedin.com"]') || {}).href || '';
    var gh = ($1('a[href*="github.com/"]') || {}).href || '';
    var site = ($1('link[rel="canonical"]') || {}).href || '';
    var L = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:Zeyad Gaber', 'N:Gaber;Zeyad;;;',
      'TITLE:IT Technician · Technical Support'];
    if (wa) L.push('TEL;TYPE=CELL:+' + wa.split('/').pop());
    if (mail) L.push('EMAIL;TYPE=INTERNET:' + mail.replace('mailto:', ''));
    [site, li, gh].forEach(function (u) { if (u) L.push('URL:' + u); });
    L.push('ADR:;;;Alexandria;;;Egypt', 'END:VCARD');
    var blob = new Blob([L.join('\r\n') + '\r\n'], { type: 'text/vcard;charset=utf-8' });
    var url = URL.createObjectURL(blob), a = doc.createElement('a');
    a.href = url; a.download = 'Zeyad-Gaber.vcf'; doc.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    if (window.__fxSay) window.__fxSay(ar() ? 'تم تنزيل ملف جهة الاتصال' : 'Contact file downloaded');
  });

  // ---- search palette ----
  var dlg = $1('#palette'), inp = $1('#pal-q'), list = $1('#pal-list'), foot = $1('#pal-foot'), btn = $1('#search');
  if (!dlg || !dlg.showModal || !inp) return;
  var T = {
    en: { ph: 'Search projects, skills, certificates…', none: 'No results for', section: 'Section', project: 'Project', exp: 'Experience', cert: 'Certificate', skill: 'Skill', service: 'Service', nav: 'navigate', open: 'open', close: 'close' },
    ar: { ph: 'ابحث في المشاريع والمهارات والشهادات…', none: 'لا توجد نتائج لـ', section: 'قسم', project: 'مشروع', exp: 'خبرة', cert: 'شهادة', skill: 'مهارة', service: 'خدمة', nav: 'للتنقل', open: 'للفتح', close: 'للإغلاق' }
  };
  var t = function (k) { return (ar() ? T.ar : T.en)[k]; };
  var norm = function (s) { return (s || '').toLowerCase().replace(/[ً-ٰٟ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/\s+/g, ' ').trim(); };
  var txt = function (el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; };
  var items = [], shown = [], act = 0;

  function collect() {
    items = [];
    ['home', 'skills', 'services', 'experience', 'projects', 'certificates', 'contact'].forEach(function (id) {
      var a = $1('#nav a[href="#' + id + '"]'), el = $1('#' + id);
      var title = a ? txt(a) : txt($1('h2', el));
      if (title) items.push({ type: 'section', ty: t('section'), title: title, body: '', id: id, icon: 'fa-hashtag' });
    });
    q('.pslide').forEach(function (s) {
      var img = $1('.shot img', s);
      items.push({ type: 'project', ty: t('project'), title: txt($1('h2', s)), body: txt($1('.p-desc', s)) + ' ' + txt($1('.p-feat', s)), id: s.id, img: img && img.getAttribute('src') });
    });
    q('.exp').forEach(function (s) {
      items.push({ type: 'exp', ty: t('exp'), title: txt($1('h2', s)), body: txt($1('.sub', s)) + ' ' + txt($1('.bul', s)), id: s.id, icon: 'fa-briefcase' });
    });
    q('.svc-grid li').forEach(function (li) {
      items.push({ type: 'section', ty: t('service'), title: txt($1('h3', li)), body: txt($1('p', li)), id: 'services', icon: 'fa-screwdriver-wrench' });
    });
    var seen = {};
    q('#skills li').forEach(function (li) {
      var n = txt(li); if (!n || seen[n]) return; seen[n] = 1;
      items.push({ type: 'section', ty: t('skill'), title: n, body: '', id: 'skills', icon: 'fa-bolt' });
    });
    q('#certs li').forEach(function (li, i) {
      var img = $1('img', li);
      items.push({ type: 'cert', ty: t('cert'), title: txt($1('strong', li)), body: txt($1('small', li)), idx: i, img: img && img.getAttribute('src') });
    });
    items.forEach(function (it, i) { it.n = norm(it.title); it.nb = norm(it.body); it.o = i; });
  }

  function mark(text, toks) {
    var frag = doc.createDocumentFragment(), low = text.toLowerCase(), best = -1, len = 0;
    toks.forEach(function (tk) { var i = low.indexOf(tk); if (i > -1 && (best < 0 || i < best)) { best = i; len = tk.length; } });
    if (best < 0) { frag.appendChild(doc.createTextNode(text)); return frag; }
    frag.appendChild(doc.createTextNode(text.slice(0, best)));
    var m = doc.createElement('mark'); m.textContent = text.slice(best, best + len); frag.appendChild(m);
    frag.appendChild(doc.createTextNode(text.slice(best + len)));
    return frag;
  }
  function snippet(it, toks) {
    var b = it.body; if (!b) return '';
    var low = b.toLowerCase(), i = -1;
    toks.forEach(function (tk) { var k = low.indexOf(tk); if (k > -1 && (i < 0 || k < i)) i = k; });
    if (i < 0) return b.slice(0, 90);
    var from = Math.max(0, i - 30);
    return (from ? '…' : '') + b.slice(from, from + 100);
  }

  function render() {
    var query = norm(inp.value), toks = query ? query.split(' ') : [];
    var rawToks = inp.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
    shown = items.map(function (it) {
      if (!toks.length) return it.type === 'section' && it.ty === t('section') ? { it: it, s: 1 } : (it.type === 'project' ? { it: it, s: 0 } : null);
      var sc = 0;
      for (var k = 0; k < toks.length; k++) {
        var tk = toks[k], a = it.n.indexOf(tk), b = it.nb.indexOf(tk);
        if (a < 0 && b < 0) return null;
        sc += a === 0 ? 8 : a > -1 ? 5 : 1;
      }
      return { it: it, s: sc + (it.type === 'project' ? .5 : 0) };
    }).filter(Boolean).sort(function (x, y) { return y.s - x.s || x.it.o - y.it.o; }).slice(0, 40).map(function (r) { return r.it; });
    act = 0; list.textContent = '';
    if (!shown.length) {
      var e = doc.createElement('li'); e.className = 'pal-empty'; e.setAttribute('role', 'presentation');
      e.textContent = t('none') + ' “' + inp.value.trim() + '”'; list.appendChild(e);
    }
    shown.forEach(function (it, i) {
      var li = doc.createElement('li'); li.id = 'pal-o' + i; li.setAttribute('role', 'option'); li.dataset.i = i;
      var ic = doc.createElement('span'); ic.className = 'pal-ic';
      if (it.img) { var im = doc.createElement('img'); im.src = it.img; im.alt = ''; im.loading = 'lazy'; ic.appendChild(im); }
      else { var f = doc.createElement('i'); f.className = 'fas ' + (it.icon || 'fa-certificate'); f.setAttribute('aria-hidden', 'true'); ic.appendChild(f); }
      var tx = doc.createElement('span'); tx.className = 'pal-tx';
      var b = doc.createElement('b'); b.appendChild(mark(it.title, rawToks)); tx.appendChild(b);
      var sn = snippet(it, rawToks); if (sn) { var sm = doc.createElement('small'); sm.appendChild(mark(sn, rawToks)); tx.appendChild(sm); }
      var ty = doc.createElement('span'); ty.className = 'pal-ty'; ty.textContent = it.ty;
      li.appendChild(ic); li.appendChild(tx); li.appendChild(ty); list.appendChild(li);
    });
    paint();
  }
  function paint() {
    var els = list.children;
    for (var i = 0; i < els.length; i++) { var on = i === act && shown.length; els[i].classList.toggle('on', !!on); if (els[i].getAttribute('role') === 'option') els[i].setAttribute('aria-selected', String(!!on)); }
    var cur = els[act];
    if (cur && shown.length) { inp.setAttribute('aria-activedescendant', cur.id); cur.scrollIntoView({ block: 'nearest' }); } else inp.removeAttribute('aria-activedescendant');
  }
  function go(it) {
    if (!it) return;
    dlg.close();
    setTimeout(function () {
      var behavior = reduce ? 'auto' : 'smooth';
      if (it.type === 'project') {
        var tile = $1('.jtile[href="#' + it.id + '"]'); if (tile) tile.click(); else location.hash = it.id;
      } else if (it.type === 'cert') {
        var c = $1('#certificates'); if (c) c.scrollIntoView({ behavior: behavior });
        var b = q('#certs li')[it.idx]; if (b) { var bt = $1('button', b); if (bt) setTimeout(function () { bt.click(); }, reduce ? 0 : 450); }
      } else if (it.id === 'home') { scrollTo({ top: 0, behavior: behavior }); }
      else { var el = $1('#' + it.id); if (el) el.scrollIntoView({ behavior: behavior }); }
    }, 60);
  }
  function openPal() {
    if (dlg.open) return;
    collect(); inp.value = ''; inp.placeholder = t('ph');
    foot.innerHTML = '';
    [['↑↓', t('nav')], ['↵', t('open')], ['Esc', t('close')]].forEach(function (h) {
      var s = doc.createElement('span'), k = doc.createElement('kbd'); k.textContent = h[0]; s.appendChild(k); s.appendChild(doc.createTextNode(' ' + h[1])); foot.appendChild(s);
    });
    render(); dlg.showModal(); inp.focus();
  }
  inp.addEventListener('input', render);
  inp.addEventListener('keydown', function (e) {
    if (e.isComposing) return;
    if (e.key === 'ArrowDown') { act = Math.min(shown.length - 1, act + 1); paint(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { act = Math.max(0, act - 1); paint(); e.preventDefault(); }
    else if (e.key === 'Enter') { go(shown[act]); e.preventDefault(); }
  });
  list.addEventListener('click', function (e) { var li = e.target.closest('li[data-i]'); if (li) go(shown[+li.dataset.i]); });
  list.addEventListener('pointermove', function (e) { var li = e.target.closest('li[data-i]'); if (li && +li.dataset.i !== act) { act = +li.dataset.i; paint(); } });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  if (btn) btn.addEventListener('click', openPal);
  doc.addEventListener('keydown', function (e) {
    var tg = e.target, typing = tg && (/^(INPUT|TEXTAREA|SELECT)$/.test(tg.nodeName) || tg.isContentEditable);
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.open ? dlg.close() : openPal(); }
    else if (e.key === '/' && !typing && !dlg.open && !$1('dialog[open]') && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); openPal(); }
  });
  if (btn) btn.title = 'Ctrl + K';
})();

// Printing: make sure animated numbers show their final value
addEventListener('beforeprint', function () {
  Array.prototype.forEach.call(document.querySelectorAll('[data-count]'), function (e) { e.dataset.done = '1'; e.textContent = e.dataset.count; });
});
