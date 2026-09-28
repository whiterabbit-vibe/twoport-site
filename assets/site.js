// TwoPort website, shared by every page. Each part runs only when its
// section is on the page.
(function () {
  document.documentElement.classList.add('js');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    var auto = !reduced;
    // The packet on the wire: which way, when, and what it carries.
    var flights = {
      2: { dir: 'toMac', delay: 2.6, icon: '#img' },
      3: { dir: 'toPhone', delay: 3.0, icon: '#pdf' },
      4: { dir: 'toPhone', delay: 1.8, icon: '#text' },
      6: { dir: 'toMac', delay: 1.2, icon: '#img' }
    };
    // Which way the dots on the link flow: phone → Mac unless the Mac sends.
    var toPhone = { 3: 1, 4: 1 };

    var schedule = function () {
      clearTimeout(timer);
      if (auto) timer = setTimeout(function () { if (visible) show((idx + 1) % N); else schedule(); }, DUR);
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
      btn.addEventListener('click', function () { pick((idx + +btn.dataset.step + N) % N); });
    });
    // Swipe the stage sideways for the next or previous moment.
    var touch = null;
    stage.addEventListener('touchstart', function (e) { touch = e.touches[0]; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (!touch) return;
      var t = e.changedTouches[0], dx = t.clientX - touch.clientX, dy = t.clientY - touch.clientY;
      touch = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) pick((idx + (dx < 0 ? 1 : N - 1)) % N);
    }, { passive: true });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { threshold: 0.25 }).observe(stage);
    }
    show(0);
  }

  // ---- Everything TwoPort does: counts come from the list itself, "What's
  // free" fades the Pro lines, and one button opens or closes every detail.
  var fgrid = document.getElementById('fgrid');
  if (fgrid) {
    var fxs = Array.prototype.slice.call(fgrid.querySelectorAll('.fx'));
    var counts = { all: fxs.length, free: fxs.filter(function (d) { return d.dataset.tier === 'free'; }).length };
    document.querySelectorAll('[data-count]').forEach(function (el) { el.textContent = counts[el.dataset.count]; });
    var segs = Array.prototype.slice.call(document.querySelectorAll('.seg-btn'));
    var setShow = function (v) {
      fgrid.dataset.show = v;
      segs.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.show === v ? 'true' : 'false'); });
    };
    segs.forEach(function (b) { b.addEventListener('click', function () { setShow(b.dataset.show); }); });
    document.querySelectorAll('a[data-show]').forEach(function (a) { a.addEventListener('click', function () { setShow(a.dataset.show); }); });
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

  // ---- Scroll story: the section pins while you scroll through five steps.
  // Scroll position becomes custom properties and ge1..ge4 classes; the
  // flying photo and text are placed from the real positions of where they
  // start and land, so they line up at any size.
  var story = document.getElementById('story');
  if (story) {
    var pin = story.querySelector('.story-pin'), sStage = story.querySelector('.story-stage');
    var heads = Array.prototype.slice.call(story.querySelectorAll('.story-steps li'));
    var dots = Array.prototype.slice.call(story.querySelectorAll('.story-dots i'));
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
      dots.forEach(function (d, i) { d.classList.toggle('on', i === step); });
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
      var onScroll = function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          ticking = false;
          // 0 when the section reaches the pin line under the nav, 1 when it's about to scroll away.
          var top = parseFloat(getComputedStyle(pin).top) || 0, range = story.offsetHeight - pin.offsetHeight;
          draw(c01((top - story.getBoundingClientRect().top) / (range || 1)));
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

  // ---- Playground: move photos, copy and paste, plug in the cable.
  var pg = document.querySelector('.pg');
  if (pg) {
    var drop = document.getElementById('pg-drop'), files = document.getElementById('pg-files'), count = document.getElementById('pg-count');
    var hint = document.getElementById('pg-hint'), link = document.getElementById('pg-link'), plug = document.getElementById('pg-plug');
    var copyBtn = document.getElementById('pg-copy'), bubble = document.getElementById('pg-bubble'), pasteBtn = document.getElementById('pg-paste');
    var pasted = document.getElementById('pg-pasted'), notes = pg.querySelector('.pg-notes'), done = document.getElementById('pg-done');
    var coarse = matchMedia('(pointer: coarse)').matches;
    var st = { usb: false, clip: false, sent: 0, tasks: {} };
    var say = function (t) { hint.textContent = t; };
    var initialHint = coarse ? 'Tap a photo on the phone to send it to the Mac.' : 'Drag a photo from the phone onto the Mac, or tap it.';
    say(initialHint);

    var confetti = function () {
      if (reduced) return;
      var r = done.getBoundingClientRect(), colors = ['#2563EB', '#22C55E', '#6EA0FF', '#45D98C', '#FEBC2E'];
      for (var i = 0; i < 36; i++) {
        var c = document.createElement('i');
        c.className = 'confetti';
        c.style.background = colors[i % colors.length];
        c.style.left = (r.left + r.width / 2) + 'px'; c.style.top = (r.top + 20) + 'px';
        document.body.appendChild(c);
        var a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 220;
        c.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 },
          { transform: 'translate(' + Math.cos(a) * d + 'px,' + (Math.sin(a) * d - 140) + 'px) rotate(' + (Math.random() * 720) + 'deg)', opacity: 1, offset: .7 },
          { transform: 'translate(' + Math.cos(a) * d * 1.1 + 'px,' + (Math.sin(a) * d + 60) + 'px) rotate(' + (Math.random() * 900) + 'deg)', opacity: 0 }],
          { duration: 1400 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = (function (el) { return function () { el.remove(); }; })(c);
      }
    };
    var complete = function (task, text) {
      if (text) say(text);
      if (st.tasks[task]) return;
      st.tasks[task] = 1;
      pg.querySelector('.pg-tasks [data-task="' + task + '"]').classList.add('done');
      if (Object.keys(st.tasks).length === 3) {
        setTimeout(function () { done.hidden = false; say('All three done.'); confetti(); }, 500);
      }
    };

    // A photo lands on the Mac: a row with a progress bar, speed set by the cable.
    var send = function (btn) {
      var name = btn.dataset.name, mb = +btn.dataset.mb;
      if (btn.classList.contains('sent')) {
        var row = files.querySelector('[data-name="' + name + '"]');
        if (row) { row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash'); }
        say(name + ' is already on your Mac. Try another one.');
        return;
      }
      btn.classList.add('sent');
      drop.classList.add('has');
      var li = document.createElement('li');
      li.dataset.name = name;
      li.innerHTML = '<svg class="ph"><use href="#' + btn.dataset.ph + '"/></svg><span></span><span class="st"></span><i class="bar"></i>';
      li.children[1].textContent = name;
      files.appendChild(li);
      st.sent++;
      count.textContent = st.sent + (st.sent === 1 ? ' photo' : ' photos');
      var dur = reduced ? 1 : (st.usb ? 500 : 2000), t0 = performance.now(), label = li.querySelector('.st');
      var tick = function (now) {
        var f = Math.min(1, (now - t0) / dur);
        li.style.setProperty('--pct', (f * 100) + '%');
        label.textContent = f < 1 ? (mb * f).toFixed(1) + ' / ' + mb + ' MB' : mb + ' MB ✓';
        if (f < 1) requestAnimationFrame(tick);
        else {
          li.classList.add('ok');
          complete('photo', st.usb ? 'That was the cable: about 4× faster.' : (st.tasks.usb ? 'Sent.' : 'On your Mac. Now plug in the cable and send another one.'));
        }
      };
      requestAnimationFrame(tick);
    };
    // Fly a copy of an element to a target, then call back.
    var flyTo = function (el, cls, from, to, then) {
      if (reduced) { then(); return; }
      var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
      el.className = cls;
      document.body.appendChild(el);
      var w = el.offsetWidth, h = el.offsetHeight;
      var x0 = a.left + a.width / 2 - w / 2, y0 = a.top + a.height / 2 - h / 2, x1 = b.left + b.width / 2 - w / 2, y1 = b.top + b.height / 2 - h / 2;
      el.animate([{ transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(1)' },
        { transform: 'translate(' + ((x0 + x1) / 2) + 'px,' + (Math.min(y0, y1) - 60) + 'px) scale(1.05)', offset: .5 },
        { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(.6)', opacity: .2 }],
        { duration: 650, easing: 'cubic-bezier(.3,.7,.3,1)' }).onfinish = function () { el.remove(); then(); };
    };

    var photos = Array.prototype.slice.call(pg.querySelectorAll('.pg-photo'));
    var inDrop = function (x, y) { var r = drop.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; };
    photos.forEach(function (btn) {
      var down = null, ghost = null;
      btn.addEventListener('pointerdown', function (e) {
        if (e.button) return;
        down = { x: e.clientX, y: e.clientY, id: e.pointerId };
        btn.setPointerCapture(e.pointerId);
      });
      btn.addEventListener('pointermove', function (e) {
        if (!down) return;
        if (!ghost && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) {
          ghost = document.createElement('div');
          ghost.className = 'pg-ghost';
          ghost.innerHTML = '<svg class="ph"><use href="#' + btn.dataset.ph + '"/></svg>';
          document.body.appendChild(ghost);
          btn.classList.add('dragging');
        }
        if (ghost) {
          ghost.style.transform = 'translate(' + (e.clientX - 35) + 'px,' + (e.clientY - 35) + 'px) rotate(-4deg)';
          drop.classList.toggle('over', inDrop(e.clientX, e.clientY));
        }
      });
      var end = function (e, cancelled) {
        if (!down) return;
        var wasDrag = !!ghost;
        down = null;
        btn.classList.remove('dragging');
        drop.classList.remove('over');
        if (!wasDrag) { if (!cancelled) flyTo(Object.assign(document.createElement('div'), { innerHTML: btn.innerHTML }), 'pg-ghost', btn, drop, function () { send(btn); }); return; }
        var g = ghost; ghost = null;
        if (!cancelled && inDrop(e.clientX, e.clientY)) {
          g.animate([{ opacity: 1 }, { opacity: 0, transform: g.style.transform + ' scale(.5)' }], { duration: 200 }).onfinish = function () { g.remove(); };
          send(btn);
        } else {
          var r = btn.getBoundingClientRect();
          g.animate([{ transform: g.style.transform }, { transform: 'translate(' + r.left + 'px,' + r.top + 'px)', opacity: .3 }], { duration: 250 }).onfinish = function () { g.remove(); };
          say('Drop it on the Mac window.');
        }
      };
      btn.addEventListener('pointerup', function (e) { end(e, false); });
      btn.addEventListener('pointercancel', function (e) { end(e, true); });
      // Keyboard: Enter or Space sends it.
      btn.addEventListener('click', function (e) { if (e.detail === 0) send(btn); });
    });

    copyBtn.addEventListener('click', function () {
      st.clip = true;
      copyBtn.textContent = 'Copied';
      copyBtn.classList.add('done');
      bubble.classList.add('copied');
      var chip = document.createElement('span');
      chip.textContent = bubble.textContent;
      flyTo(chip, 'pg-chipfly', bubble, notes, function () {});
      say(coarse ? 'It crossed to the Mac. Now tap Paste in Notes.' : 'It crossed to the Mac. Now press ⌘V, or click Paste in Notes.');
    });
    var paste = function () {
      if (!st.clip) {
        notes.classList.remove('shake'); void notes.offsetWidth; notes.classList.add('shake');
        say('Copy the address on the phone first.');
        return;
      }
      if (pasted.textContent) return;
      var text = bubble.textContent, i = 0;
      var type = function () { pasted.textContent = text.slice(0, ++i); if (i < text.length) setTimeout(type, reduced ? 0 : 18); else complete('clip', 'Pasted on the Mac. That\'s the clipboard, shared.'); };
      type();
    };
    pasteBtn.addEventListener('click', paste);
    var pgVisible = false;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { pgVisible = en[0].isIntersecting; }, { threshold: .3 }).observe(pg);
    document.addEventListener('keydown', function (e) {
      if (!pgVisible || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'v') return;
      var tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      paste();
    });

    plug.addEventListener('click', function () {
      st.usb = !st.usb;
      link.classList.toggle('usb', st.usb);
      plug.setAttribute('aria-pressed', st.usb ? 'true' : 'false');
      if (st.usb) complete('usb', st.tasks.photo ? 'Plugged in: about 4× faster. Send another photo and see.' : 'Plugged in: about 4× faster. Now send a photo.');
      else say('Unplugged. It carries on over Wi-Fi.');
    });

    document.getElementById('pg-reset').addEventListener('click', function () {
      st = { usb: false, clip: false, sent: 0, tasks: {} };
      files.innerHTML = ''; drop.classList.remove('has'); count.textContent = 'Empty';
      photos.forEach(function (b) { b.classList.remove('sent'); });
      pasted.textContent = ''; copyBtn.textContent = 'Copy'; copyBtn.classList.remove('done'); bubble.classList.remove('copied');
      link.classList.remove('usb'); plug.setAttribute('aria-pressed', 'false');
      pg.querySelectorAll('.pg-tasks li').forEach(function (li) { li.classList.remove('done'); });
      done.hidden = true; say(initialHint);
    });
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
  function say(el, text, ok) { el.textContent = text; el.className = 'form-msg ' + (ok ? 'ok' : 'err'); }
  var emailOK = function (v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); };

  var wl = document.getElementById('wl');
  if (wl) wl.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = document.getElementById('wl-msg'), email = document.getElementById('wl-email').value.trim();
    if (!emailOK(email)) { say(msg, 'Enter an email address like you@example.com.'); return; }
    var founder = document.getElementById('wl-founder').checked;
    var btn = wl.querySelector('button'); btn.disabled = true;
    api('/waitlist', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({
      email: email, phone: document.getElementById('wl-phone').value.trim() || null, reserve_founder: founder, source: 'website'
    }) }).then(function (r) {
      if (r.status === 201) { say(msg, founder ? "You're on the list, with the $9 founder price held for you." : "You're on the list. See you at launch.", true); wl.reset(); }
      else if (r.status === 409) say(msg, "You're already on the list with that email.", true);
      else say(msg, "That didn't go through. Check the email and try again.");
    }).catch(function () { say(msg, "Couldn't reach the waitlist. Check your connection and try again."); })
      .then(function () { btn.disabled = false; });
  });

  var fl = document.getElementById('fl');
  if (fl) fl.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = document.getElementById('fl-msg'), email = document.getElementById('fl-email').value.trim();
    if (!emailOK(email)) { say(msg, 'Enter an email address like you@example.com.'); return; }
    var btn = fl.querySelector('button'); btn.disabled = true;
    api('/licence_requests', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({
      email: email, note: document.getElementById('fl-note').value.trim() || null
    }) }).then(function (r) {
      if (r.status === 201) { say(msg, "Got it. We'll email your free licence when TwoPort launches.", true); fl.reset(); }
      else if (r.status === 409) say(msg, "We already have your request. Your licence comes at launch.", true);
      else say(msg, "That didn't go through. Check the email and try again.");
    }).catch(function () { say(msg, "Couldn't reach us just now. Check your connection and try again."); })
      .then(function () { btn.disabled = false; });
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
      if (title.length < 4) { say(msg, 'Describe the idea in a few words.'); return; }
      if (email && !emailOK(email)) { say(msg, 'That email looks off. Leave it empty if you prefer.'); return; }
      var btn = fr.querySelector('button'); btn.disabled = true;
      api('/feature_requests', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({
        title: title, details: document.getElementById('fr-details').value.trim() || null, email: email || null
      }) }).then(function (r) {
        if (r.status === 201) { say(msg, 'Thanks! Your idea is on the board.', true); fr.reset(); load(); }
        else say(msg, "That didn't go through. Try a shorter title.");
      }).catch(function () { say(msg, "Couldn't reach the board. Check your connection and try again."); })
        .then(function () { btn.disabled = false; });
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
