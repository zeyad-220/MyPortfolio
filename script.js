(function () {
  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  $('#year').textContent = new Date().getFullYear();
  document.documentElement.classList.remove('no-js');

  // Theme
  $('#theme').addEventListener('click', function () {
    var next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
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
  var WORDS_EN = ['IT Technician', 'Front-End Web Developer', 'Real Estate Cold Caller', 'HR Recruiter', 'BIS Student', 'Voice Actor'];
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
  var D = window.AR_DICT || {}, A = window.AR_ATTR || {};
  var langBtn = $('#lang');
  var items = [], attrs = [];
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
  var metaDesc = $('meta[name="description"]');
  var EN_TITLE = document.title, EN_DESC = metaDesc ? metaDesc.content : '';

  function setLang(lang, save) {
    var ar = lang === 'ar';
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
    pr.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
    if (bar) bar.classList.toggle('scrolled', scrollY > 8);
  }
  addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  upd();
})();
