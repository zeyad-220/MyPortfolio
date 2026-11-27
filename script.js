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
          jchips.forEach(function (c) { c.classList.toggle('on', c.getAttribute('href') === '#' + id); });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    var rv = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rv.unobserve(e.target); } }); }, { threshold: 0, rootMargin: '0px 0px -12% 0px' });
    $$('.reveal').forEach(function (r) { rv.observe(r); });
    $$('main > section[id]').forEach(function (s) { io.observe(s); });
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
