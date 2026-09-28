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
