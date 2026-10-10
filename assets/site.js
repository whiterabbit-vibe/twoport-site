// TwoPort website, shared by every page. Each part runs only when its
// section is on the page.
(function () {
  document.documentElement.classList.add('js');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- The headline's verb picker: every verb is on screen, the chosen one
  // on the headline's line with the crown, the rest above and below it
  // (phones: above only). Each tick they all roll down one slot; the one that
  // goes round fades out at one end and back in at the other.
  var rot = document.getElementById('rot');
  if (rot) {
    var words = Array.prototype.slice.call(rot.querySelectorAll('b')), nW = words.length;
    var prep = document.getElementById('prep'), wi = 0, heroOn = true;
    var stacked = matchMedia('(max-width: 700px)');
    // 0 is the chosen verb; the next one waits just above it.
    var slot = function (i) {
      var rel = (i - wi + nW) % nW;
      return stacked.matches ? -rel : rel <= 2 ? -rel : nW - rel;
    };
    var crownTo = function () {
      var w = words[wi].offsetWidth;
      rot.style.setProperty('--cx', (stacked.matches ? (rot.clientWidth - w) / 2 : rot.clientWidth - w) + 'px');
    };
    var fit = function () {
      rot.classList.add('snap');
      words.forEach(function (w, i) { w.dataset.o = slot(i); });
      rot.style.setProperty('--dw', Math.max.apply(null, words.map(function (w) { return w.offsetWidth; })) + 'px');
      crownTo();
      void rot.offsetWidth;
      rot.classList.remove('snap');
    };
    fit();
    if (document.fonts) document.fonts.ready.then(fit);
    addEventListener('resize', fit);
    var nextWord = function () {
      wi = (wi + 1) % nW;
      words.forEach(function (w, i) {
        var from = +w.dataset.o, to = slot(i);
        if (to > from) { w.dataset.o = to; return; }
        // Going round: out past the far end, then in from the near one.
        w.dataset.o = from + 1;
        setTimeout(function () {
          w.classList.add('snap'); w.dataset.o = to - 1;
          void w.offsetWidth;
          w.classList.remove('snap'); w.dataset.o = to;
        }, 480);
      });
      // "Send" reads "to your Mac"; the others "on your Mac".
      prep.textContent = words[wi].dataset.prep || 'on';
      crownTo();
      rot.classList.remove('hop'); void rot.offsetWidth; rot.classList.add('hop');
    };
    if (!reduced) {
      if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { heroOn = en[0].isIntersecting; }).observe(rot);
      setTimeout(function () {
        setInterval(function () { if (heroOn && !document.hidden) nextWord(); }, 2300);
      }, 700);
    }
  }

  // ---- The demo: chips pick a moment, the stage plays it.
  var stage = document.getElementById('stage');
  if (stage) {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
    var packet = document.getElementById('packet');
    var caption = document.getElementById('caption');
    // The menu bar names the app in front, so TwoPort's own window never reads as Finder.
    var menuApp = document.getElementById('menu-app');
    var cap = { title: document.getElementById('cap-title'), desc: document.getElementById('cap-desc'), count: document.getElementById('cap-count') };
    var DUR = 8000, N = tabs.length, idx = 0, current = 1, timer = null, visible = true;
    // Plays on its own until the visitor picks a moment, then stays put.
    // Not on phones: there it waits for a swipe or the arrows.
    var auto = !reduced && !matchMedia('(max-width: 900px)').matches;
    // The packet on the wire: which way, when, and what it carries.
    var flights = {
      2: { dir: 'toMac', delay: 2.6, icon: '#img' },
      3: { dir: 'toPhone', delay: 3.0, icon: '#pdf' },
      4: { dir: 'toPhone', delay: 1.8, icon: '#text' },
      6: { dir: 'toMac', delay: 1.2, icon: '#img' }
    };
    // Which way the dots on the link flow: phone → Mac unless the Mac sends.
    var toPhone = { 3: 1, 4: 1 };

    // Phones and tablets: the moments play as you scroll (see site.css). The
    // stage stays under the nav; a card per moment scrolls up below it, and
    // the card that has crossed the middle of the space left plays. A bar of
    // five under the stage says where you are.
    var scrolly = matchMedia('(max-width: 900px)');
    var stageCol = stage.parentNode, steps = document.createElement('div'), moments = document.createElement('ol');
    steps.className = 'm-steps';
    moments.className = 'moments';
    var stepBar = steps.appendChild(document.createElement('div')), stepName = steps.appendChild(document.createElement('span'));
    stepBar.className = 'm-bar';
    stepName.className = 'm-name';
    var mSegs = [], mCards = tabs.map(function (t, i) {
      var name = t.textContent.trim();
      var seg = stepBar.appendChild(document.createElement('button'));
      seg.type = 'button';
      seg.setAttribute('aria-label', name);
      seg.appendChild(document.createElement('i'));
      seg.addEventListener('click', function () { go(i); });
      mSegs.push(seg);
      var li = moments.appendChild(document.createElement('li'));
      li.className = 'moment';
      li.appendChild(t.querySelector('.tab-ico').cloneNode(true));
      li.appendChild(document.createElement('span')).className = 'm-k';
      li.lastChild.textContent = (i + 1) + ' of ' + N;
      li.appendChild(document.createElement('h3')).textContent = name;
      li.appendChild(document.createElement('p')).textContent = t.dataset.caption;
      li.addEventListener('click', function () { go(i); });
      return li;
    });
    stageCol.appendChild(steps);
    stageCol.parentNode.appendChild(moments);
    // Jump to a moment: on phones by scrolling its card into play.
    var go = function (i) {
      if (!scrolly.matches) { pick(i); return; }
      var pinned = parseFloat(getComputedStyle(stageCol).top) + stageCol.offsetHeight;
      scrollTo({ top: scrollY + mCards[i].getBoundingClientRect().top - pinned - 24, behavior: reduced ? 'auto' : 'smooth' });
    };

    var schedule = function () {
      clearTimeout(timer);
      if (auto) timer = setTimeout(function () { if (visible) show((idx + 1) % N); else schedule(); }, DUR);
      // Phones: the moment in view plays again while you stay on it.
      else if (scrolly.matches && !reduced) timer = setTimeout(function () { if (visible) show(idx); else schedule(); }, DUR);
    };

    // i is the chip's position; n is the scene it plays.
    var show = function (i) {
      idx = i;
      var n = current = +tabs[i].dataset.scene;
      stage.classList.remove('play', 'tomac');
      if (!toPhone[n]) stage.classList.add('tomac');
      stage.querySelectorAll('.scene, .pscene').forEach(function (el) { el.classList.remove('on'); });
      stage.querySelector('.scene.s' + n).classList.add('on');
      stage.querySelector('.pscene.p' + n).classList.add('on');
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        t.querySelector('.prog').classList.remove('run');
      });
      if (menuApp && tabs[i].dataset.app) menuApp.textContent = tabs[i].dataset.app;
      var text = tabs[i].dataset.caption;
      if (caption) caption.textContent = text;
      cap.title.textContent = tabs[i].textContent.trim();
      cap.desc.textContent = text;
      cap.count.textContent = (i + 1) + ' of ' + N;
      mSegs.forEach(function (s, j) {
        s.dataset.s = j < i ? 'past' : j === i ? 'on' : '';
        if (j === i) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current');
      });
      stepBar.style.setProperty('--dur', DUR + 'ms');
      stepName.innerHTML = '<em></em>';
      stepName.firstChild.textContent = (i + 1) + ' of ' + N;
      stepName.appendChild(document.createTextNode(tabs[i].textContent.trim()));
      mCards.forEach(function (c, j) { c.classList.toggle('on', j === i); });
      var f = flights[n];
      packet.style.animation = f ? f.dir + ' 1.1s cubic-bezier(.22,.8,.24,1) ' + f.delay + 's' : 'none';
      if (f) packet.querySelector('use').setAttribute('href', f.icon);
      void stage.offsetWidth; // with .play gone, every animation restarts on re-add
      stage.classList.add('play');
      // On phones the chips are a sideways row: keep the playing one in view.
      var row = tabs[i].parentNode;
      if (row.scrollWidth > row.clientWidth) {
        var dx = tabs[i].getBoundingClientRect().left - row.getBoundingClientRect().left;
        row.scrollTo({ left: row.scrollLeft + dx - 4, behavior: reduced ? 'auto' : 'smooth' });
      }
      if (auto) {
        var bar = tabs[i].querySelector('.prog');
        bar.style.setProperty('--dur', DUR + 'ms');
        void bar.offsetWidth;
        bar.classList.add('run');
      }
      schedule();
    };
    var pick = function (i) { auto = false; show(i); };

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { pick(i); });
      t.addEventListener('keydown', function (e) {
        var fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown', back = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
        if (!fwd && !back) return;
        e.preventDefault();
        var next = (i + (fwd ? 1 : N - 1)) % N;
        tabs[next].focus(); pick(next);
      });
    });
    // Drop the fade on the chip row once it's scrolled to the end.
    var row = tabs[0].parentNode;
    var edge = function () { row.classList.toggle('end', row.scrollLeft + row.clientWidth >= row.scrollWidth - 4); };
    row.addEventListener('scroll', edge, { passive: true }); addEventListener('resize', edge); edge();
    document.querySelectorAll('.cap-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { go((idx + +btn.dataset.step + N) % N); });
    });
    // Swipe the stage sideways for the next or previous moment.
    var touch = null;
    stage.addEventListener('touchstart', function (e) { touch = e.touches[0]; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (!touch) return;
      var t = e.changedTouches[0], dx = t.clientX - touch.clientX, dy = t.clientY - touch.clientY;
      touch = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) go(Math.max(0, Math.min(N - 1, idx + (dx < 0 ? 1 : -1))));
    }, { passive: true });

    var dTick = false;
    var follow = function () {
      if (dTick || !scrolly.matches) return;
      dTick = true;
      requestAnimationFrame(function () {
        dTick = false;
        var below = stageCol.getBoundingClientRect().bottom, line = below + (innerHeight - below) * .5, now = 0;
        mCards.forEach(function (c, j) { if (c.getBoundingClientRect().top < line) now = j; });
        if (now !== idx) show(now);
      });
    };
    addEventListener('scroll', follow, { passive: true });
    addEventListener('resize', follow);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { threshold: 0.25 }).observe(stage);
    }
    show(0);
  }

  // ---- Everything TwoPort does: the count comes from the list itself, and
  // one button opens or closes every detail.
  var fgrid = document.getElementById('fgrid');
  if (fgrid) {
    var fxs = Array.prototype.slice.call(fgrid.querySelectorAll('.fx'));
    document.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = fxs.length; });
    var openAll = document.querySelector('.open-all');
    var syncOpenAll = function () {
      var all = fxs.every(function (d) { return d.open; });
      openAll.textContent = all ? 'Close every detail' : 'Open every detail';
      openAll.setAttribute('aria-pressed', all ? 'true' : 'false');
    };
    openAll.addEventListener('click', function () {
      var open = !fxs.every(function (d) { return d.open; });
      fxs.forEach(function (d) { d.open = open; });
      syncOpenAll();
    });
    fxs.forEach(function (d) { d.addEventListener('toggle', syncOpenAll); });
  }

  // ---- Scroll story: the steps scroll by like any text; the picture beside
  // them plays the step in the middle of the screen. Scroll position becomes
  // custom properties and ge1..ge4 classes; the
  // flying photo and text are placed from the real positions of where they
  // start and land, so they line up at any size.
  var story = document.getElementById('story');
  if (story) {
    var sStage = story.querySelector('.story-stage');
    var heads = Array.prototype.slice.call(story.querySelectorAll('.story-steps li'));
    var fly1 = sStage.querySelector('.st-fly.f1'), fly2 = sStage.querySelector('.st-fly.f2');
    var from1 = sStage.querySelector('.st-gal .lift'), to1 = sStage.querySelector('.st-row.new .th');
    var from2 = sStage.querySelector('.st-notes .hl'), to2 = sStage.querySelector('.st-input');
    var c01 = function (x) { return x < 0 ? 0 : x > 1 ? 1 : x; };
    var seg = function (x, a, b) { return c01((x - a) / (b - a)); };
    var ease = function (t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
    var setv = function (k, v) { story.style.setProperty(k, v.toFixed(3)); };
    // Moves a flyer from one element to another; t 0..1, hidden at both ends.
    var place = function (el, a, b, t, arc) {
      if (t <= 0 || t >= 1) { el.style.opacity = 0; return; }
      var box = sStage.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(), e = ease(t);
      var x = ra.left + (rb.left - ra.left) * e - box.left;
      var y = ra.top + (rb.top - ra.top) * e - box.top - Math.sin(Math.PI * e) * box.height * arc;
      var w0 = parseFloat(getComputedStyle(el).width) || 1, sc = el === fly1 ? (ra.width + (rb.width - ra.width) * e) / w0 : 1;
      el.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + sc + ')';
      el.style.opacity = t < .08 ? t / .08 : t > .92 ? (1 - t) / .08 : 1;
    };
    var draw = function (p) {
      story.dataset.p = p.toFixed(3);
      var step = Math.min(4, Math.floor(p * 5)), s = [0, 1, 2, 3, 4].map(function (i) { return seg(p, i / 5, (i + 1) / 5); });
      heads.forEach(function (h, i) { h.classList.toggle('on', i === step); });
      for (var k = 1; k <= 4; k++) story.classList.toggle('ge' + k, step >= k);
      var link = seg(s[0], .15, .7), more = seg(s[4], .05, .6);
      setv('--link', link); setv('--chip', link * (1 - more));
      setv('--lift', seg(s[1], 0, .25) * (1 - seg(s[1], .75, .95)));
      setv('--land1', seg(s[1], .72, .86));
      setv('--copy', seg(s[2], .02, .22));
      story.classList.toggle('copied', s[2] > .18 && s[2] < .5);
      setv('--land2', seg(s[2], .66, .78));
      story.classList.toggle('pasting', s[2] > .6 && s[2] < .8);
      setv('--cab', seg(s[3], .05, .55));
      story.classList.toggle('fast', s[3] > .5);
      setv('--more', more);
      place(fly1, from1, to1, seg(s[1], .2, .76), .18);
      place(fly2, from2, to2, seg(s[2], .26, .7), .12);
    };
    if (reduced) {
      story.classList.add('static');
      draw(.999);
    } else {
      var ticking = false;
      // Phones and tablets show the steps as plain cards (see site.css): nothing to play.
      var cards = matchMedia('(max-width: 900px)');
      var onScroll = function () {
        if (ticking || cards.matches) return;
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          // The step whose text crosses the middle of the screen (below the
          // nav) plays; how far through its text you are is how far it has got.
          var mid = 62 + (innerHeight - 62) / 2, p = 0;
          heads.forEach(function (h, i) {
            var r = h.getBoundingClientRect();
            if (mid >= r.top) p = (i + c01((mid - r.top) / (r.height || 1))) / heads.length;
          });
          draw(Math.min(p, .999));
        });
      };
      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', onScroll);
      // Fonts and images can shift the page after the first draw.
      addEventListener('load', onScroll);
      if (document.fonts) document.fonts.ready.then(onScroll);
      onScroll();
    }
  }

  // ---- The guide in the nav: which numbered part of the page you're in, a
  // list to jump to any part (phones have no other menu), and a line under
  // the nav that fills as you read.
  var guide = document.getElementById('guide');
  var chapters = Array.prototype.slice.call(document.querySelectorAll('.chapter'));
  if (guide && chapters.length) {
    var navBar = document.querySelector('.nav'), gBtn = guide.querySelector('.guide-btn'), gList = document.getElementById('guide-list');
    var gNum = guide.querySelector('.guide-now b'), gName = guide.querySelector('.guide-now span'), navLine = document.querySelector('.nav-line');
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
    var parts = chapters.map(function (c) {
      var tab = c.querySelector('.ch-tab'), num = tab.querySelector('b').textContent;
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = '#' + c.id;
      a.appendChild(document.createElement('b')).textContent = num;
      a.appendChild(document.createElement('span')).textContent = tab.textContent.replace(num, '').trim();
      li.appendChild(a); gList.appendChild(li);
      return { el: c, id: c.id, num: num, name: a.lastChild.textContent, link: a };
    });
    // The first time the pill shows up, a note under it says what it is
    // (once per visitor; the pill alone went unnoticed for ten minutes).
    var tip = null, tipSeen = false;
    try { tipSeen = !!localStorage.getItem('tp-guide-tip'); } catch (err) {}
    var hideTip = function () {
      if (!tip) return;
      var t = tip; tip = null;
      t.classList.add('bye');
      setTimeout(function () { t.remove(); }, 300);
    };
    var showTip = function () {
      if (tipSeen) return;
      tipSeen = true;
      try { localStorage.setItem('tp-guide-tip', '1'); } catch (err) {}
      tip = document.createElement('p');
      tip.className = 'guide-tip';
      tip.textContent = 'This shows which part you\'re reading. ' + (matchMedia('(hover: none)').matches ? 'Tap' : 'Click') + ' it to jump to any part.';
      tip.addEventListener('click', hideTip);
      guide.appendChild(tip);
      setTimeout(hideTip, 6000);
    };
    var setOpen = function (open) { gList.hidden = !open; gBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); if (open) hideTip(); };
    gBtn.addEventListener('click', function () { setOpen(gList.hidden); });
    gList.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('click', function (e) { if (!guide.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !gList.hidden) { setOpen(false); gBtn.focus(); } });
    var cur = -2, gTick = false;
    var track = function () {
      if (gTick) return;
      gTick = true;
      requestAnimationFrame(function () {
        gTick = false;
        // The part whose folder has reached the top third of the screen.
        var edge = 62 + (innerHeight - 62) / 3, now = -1;
        parts.forEach(function (p, i) { if (p.el.getBoundingClientRect().top <= edge) now = i; });
        if (now !== cur) {
          cur = now;
          guide.hidden = now < 0;
          navBar.classList.toggle('guided', now >= 0);
          if (now < 0) { setOpen(false); hideTip(); }
          else {
            gNum.textContent = parts[now].num; gName.textContent = parts[now].name;
            guide.classList.remove('swap'); void guide.offsetWidth; guide.classList.add('swap');
            showTip();
          }
          parts.forEach(function (p, i) { if (i === now) p.link.setAttribute('aria-current', 'true'); else p.link.removeAttribute('aria-current'); });
          navLinks.forEach(function (a) {
            if (now >= 0 && a.getAttribute('href') === '#' + parts[now].id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
          });
        }
        // The ring round the number: how far through this part you are.
        if (now >= 0) {
          var box = parts[now].el.getBoundingClientRect();
          guide.style.setProperty('--gp', Math.max(0, Math.min(1, (edge - box.top) / (box.height || 1))).toFixed(3));
        }
        var max = document.documentElement.scrollHeight - innerHeight;
        navLine.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, scrollY / max) : 0) + ')';
      });
    };
    addEventListener('scroll', track, { passive: true });
    addEventListener('resize', track);
    track();
  }

  // ---- Waitlist, free licences and feature requests (Supabase; the key
  // below is the public "publishable" key — the database only allows adding
  // to the waitlist, reading visible requests, suggesting, and voting once).
  var API = 'https://pgltzghipfepvdniibpl.supabase.co/rest/v1';
  var KEY = 'sb_publishable_T7hAd-MH1KvPVsFLpt_o2A_AatR1UHW';
  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({ apikey: KEY, 'Content-Type': 'application/json' }, opts.headers || {});
    return fetch(API + path, opts);
  }
  // Named so no other part of this file can shadow it (v8's playground had its
  // own `say`, which silently swallowed every form message on the home page).
  function formSay(el, text) { el.textContent = text; el.className = 'form-msg err'; }
  var emailOK = function (v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); };
  // While a form is sending: the button says so and can't be pressed twice.
  var busy = function (btn, on, label) {
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label; } else if (btn.dataset.label) btn.textContent = btn.dataset.label;
    btn.disabled = on;
  };
  // After a form goes through, it steps aside for a clear confirmation: a
  // tick, one headline, what happens next, and a link to fill it in again.
  // Each line is a list of parts; every second part is shown in bold.
  var confirmed = function (form, title, lines, again) {
    var box = document.createElement('div');
    box.className = 'form-done';
    box.tabIndex = -1;
    box.setAttribute('role', 'status');
    box.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M7 12.4l3.2 3.2 6.8-7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><div><h3></h3></div>';
    var body = box.lastChild;
    body.firstChild.textContent = title;
    lines.forEach(function (parts) {
      var para = document.createElement('p');
      parts.forEach(function (t, k) { var n = document.createElement(k % 2 ? 'b' : 'span'); n.textContent = t; para.appendChild(n); });
      body.appendChild(para);
    });
    var more = document.createElement('button');
    more.type = 'button'; more.className = 'link again'; more.textContent = again;
    more.addEventListener('click', function () { box.remove(); form.hidden = false; form.querySelector('input').focus(); });
    body.appendChild(more);
    form.reset();
    form.querySelector('.form-msg').textContent = '';
    form.hidden = true;
    form.parentNode.insertBefore(box, form.nextSibling);
    box.focus({ preventScroll: true });
    box.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
  };

  // Where a visitor came from, for counting which posts bring signups:
  // twoport.app/?ref=reddit saves "website:reddit" with their waitlist entry.
  // Just a short word from the link, nothing about the visitor; kept for the
  // visit so it survives going from one page to another before signing up.
  var ref = (new URLSearchParams(location.search).get('ref') || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
  try {
    if (ref) sessionStorage.setItem('twoport.ref', ref);
    else ref = sessionStorage.getItem('twoport.ref') || '';
  } catch (e) {}
  var source = ref ? 'website:' + ref : 'website';

  var wl = document.getElementById('wl');
  if (wl) wl.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = document.getElementById('wl-msg'), input = document.getElementById('wl-email'), email = input.value.trim();
    if (!emailOK(email)) { formSay(msg, 'Enter an email address like you@example.com.'); input.focus(); return; }
    var founder = document.getElementById('wl-founder').checked;
    var btn = wl.querySelector('button'); busy(btn, true, 'Joining…'); msg.textContent = '';
    api('/waitlist', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({
      email: email, phone: document.getElementById('wl-phone').value.trim() || null, reserve_founder: founder, source: source
    }) }).then(function (r) {
      busy(btn, false);
      if (r.status === 201) confirmed(wl, "You're on the list!",
        [["We'll email ", email, ' once, when TwoPort is out. Nothing else.']].concat(founder ? [['Your ', '$9 founder price', ' is held for you. You pay only at launch.']] : []),
        'Add another email');
      else if (r.status === 409) confirmed(wl, "You're already on the list.", [['', email, " is on it. We'll email you when TwoPort is out."]], 'Use a different email');
      else formSay(msg, "That didn't go through. Check the email and try again.");
    }).catch(function () { busy(btn, false); formSay(msg, "Couldn't reach the waitlist. Check your connection and try again."); });
  });

  var fl = document.getElementById('fl');
  if (fl) fl.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = document.getElementById('fl-msg'), input = document.getElementById('fl-email'), email = input.value.trim();
    if (!emailOK(email)) { formSay(msg, 'Enter an email address like you@example.com.'); input.focus(); return; }
    var btn = fl.querySelector('button'); busy(btn, true, 'Sending…'); msg.textContent = '';
    api('/licence_requests', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({
      email: email, note: document.getElementById('fl-note').value.trim() || null
    }) }).then(function (r) {
      busy(btn, false);
      if (r.status === 201) confirmed(fl, 'Request received.', [["We'll email a free Pro licence to ", email, ' when TwoPort launches.']], 'Use a different email');
      else if (r.status === 409) confirmed(fl, 'We already have your request.', [['Your free licence goes to ', email, ' at launch.']], 'Use a different email');
      else formSay(msg, "That didn't go through. Check the email and try again.");
    }).catch(function () { busy(btn, false); formSay(msg, "Couldn't reach us just now. Check your connection and try again."); });
  });

  var board = document.getElementById('board');
  if (board) {
    var voter = null;
    try { voter = localStorage.getItem('tp-voter'); if (!voter) { voter = 'v-' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36); localStorage.setItem('tp-voter', voter); } } catch (err) { voter = 'v-' + Math.random().toString(36).slice(2, 14); }
    var voted = {};
    try { voted = JSON.parse(localStorage.getItem('tp-voted') || '{}'); } catch (err) {}
    var esc = function (t) { var d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; };
    var render = function (rows) {
      if (!rows.length) { board.innerHTML = '<li class="empty">No requests yet. Be the first.</li>'; return; }
      board.innerHTML = rows.map(function (r) {
        var on = !!voted[r.id];
        return '<li><button class="vote" type="button" data-id="' + r.id + '" aria-pressed="' + on + '" aria-label="Vote for ' + esc(r.title) + ', ' + r.votes + ' votes"><b>' + r.votes + '</b><span>' + (on ? 'voted' : 'vote') + '</span></button>' +
          '<div><h4>' + esc(r.title) + '</h4>' + (r.details ? '<p>' + esc(r.details) + '</p>' : '') + '<span class="status ' + esc(r.status).replace(' ', '-') + '">' + esc(r.status) + '</span></div></li>';
      }).join('');
    };
    var load = function () {
      api('/feature_requests?select=id,title,details,status,votes&order=votes.desc,created_at.asc&limit=50')
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(render)
        .catch(function () { board.innerHTML = '<li class="empty">Requests couldn\'t load just now. Refresh to try again.</li>'; });
    };
    board.addEventListener('click', function (e) {
      var b = e.target.closest('.vote'); if (!b) return;
      var id = +b.dataset.id; if (voted[id]) return;
      b.disabled = true;
      api('/rpc/vote_feature', { method: 'POST', body: JSON.stringify({ request_id: id, voter: voter }) })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (count) {
          voted[id] = 1; try { localStorage.setItem('tp-voted', JSON.stringify(voted)); } catch (err) {}
          b.setAttribute('aria-pressed', 'true'); b.querySelector('b').textContent = count; b.querySelector('span').textContent = 'voted';
        }).catch(function () {}).then(function () { b.disabled = false; });
    });
    var fr = document.getElementById('fr');
    if (fr) fr.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.getElementById('fr-msg'), title = document.getElementById('fr-title').value.trim();
      var email = document.getElementById('fr-email').value.trim();
      if (title.length < 4) { formSay(msg, 'Describe the idea in a few words.'); document.getElementById('fr-title').focus(); return; }
      if (email && !emailOK(email)) { formSay(msg, 'That email looks off. Leave it empty if you prefer.'); document.getElementById('fr-email').focus(); return; }
      var btn = fr.querySelector('button'); busy(btn, true, 'Sending…'); msg.textContent = '';
      api('/feature_requests', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({
        title: title, details: document.getElementById('fr-details').value.trim() || null, email: email || null
      }) }).then(function (r) {
        busy(btn, false);
        if (r.status === 201) { confirmed(fr, 'Thanks! Your idea is on the board.', [['', title, ' is listed now, and anyone can vote for it.']], 'Suggest another idea'); load(); }
        else formSay(msg, "That didn't go through. Try a shorter title.");
      }).catch(function () { busy(btn, false); formSay(msg, "Couldn't reach the board. Check your connection and try again."); });
    });
    load();
  }

  // ---- Compare page: label each table cell with its column (for the
  // stacked phone layout), and fold the long benchmark on phones.
  document.querySelectorAll('.compare-scroll table').forEach(function (t) {
    var heads = Array.prototype.map.call(t.querySelectorAll('thead th'), function (th) { return th.textContent.trim(); });
    t.querySelectorAll('tbody tr').forEach(function (tr) {
      Array.prototype.forEach.call(tr.children, function (c, k) { if (k && heads[k]) c.setAttribute('data-label', heads[k]); });
    });
  });
  var more = document.getElementById('bench-more');
  if (more) more.addEventListener('click', function () { document.getElementById('bench').classList.remove('folded'); });

  // ---- Decorative pairing codes (not scannable).
  document.querySelectorAll('.qr-draw').forEach(function (c) {
    var x = c.getContext('2d'), n = 25, seed = 11;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    x.fillStyle = '#0B1220';
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
      var fz = (i < 8 && j < 8) || (i > n - 9 && j < 8) || (i < 8 && j > n - 9);
      if (!fz && rnd() > .5) x.fillRect(i, j, 1, 1);
    }
    [[0, 0], [n - 7, 0], [0, n - 7]].forEach(function (p) {
      x.fillRect(p[0], p[1], 7, 7); x.clearRect(p[0] + 1, p[1] + 1, 5, 5); x.fillRect(p[0] + 2, p[1] + 2, 3, 3);
    });
  });
})();
