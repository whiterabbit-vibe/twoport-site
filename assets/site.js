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

  // ---- The Macs' wallpaper: an evening ridge under the stars, drawn to the
  // canvas's own size (the CSS gradient behind it is the no-JS version).
  var drawWall = function (c) {
    var r = c.getBoundingClientRect();
    if (!r.width) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
    var g = c.getContext('2d'), W = r.width, H = r.height;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#081C29'); sky.addColorStop(.5, '#174F5E'); sky.addColorStop(.78, '#2D8590'); sky.addColorStop(1, '#3E9AA2');
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    var seed = 11, rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (var i = 0; i < 90; i++) { g.fillStyle = 'rgba(255,255,255,' + (.2 + rnd() * .5) + ')'; g.fillRect(rnd() * W, rnd() * H * .5, 1, 1); }
    [{ base: .66, amp: .2, col: '#2B6E78', snow: true, k: 1.3 }, { base: .76, amp: .1, col: '#163F49', k: 4.1 }, { base: .88, amp: .06, col: '#0A2129', k: 7.7 }].forEach(function (L) {
      g.beginPath(); g.moveTo(0, H);
      for (var x = 0; x <= W + 4; x += 3) {
        var u = x / W;
        var peak = Math.exp(-Math.abs((u - .38) / .085)) + Math.exp(-Math.abs((u - .72) / .07)) * .5;
        var n = Math.sin(u * 23 + L.k) * .06 + Math.sin(u * 61 + L.k * 2) * .025;
        g.lineTo(x, H * (L.base - L.amp * (L.snow ? peak + n : .5 + n * 3 + Math.sin(u * 7 + L.k) * .3)));
      }
      g.lineTo(W, H); g.closePath(); g.fillStyle = L.col; g.fill();
      if (L.snow) {
        g.save(); g.clip();
        var cap = g.createLinearGradient(0, H * (L.base - L.amp * 1.05), 0, H * (L.base - L.amp * .55));
        cap.addColorStop(0, 'rgba(235,245,248,.95)'); cap.addColorStop(1, 'rgba(235,245,248,0)');
        g.fillStyle = cap; g.fillRect(0, 0, W, H);
        g.restore();
      }
    });
  };
  document.querySelectorAll('canvas.wall').forEach(function (c) {
    drawWall(c);
    if ('ResizeObserver' in window) new ResizeObserver(function () { drawWall(c); }).observe(c);
  });

  // ---- Moments (PLAN.md "Moments"): the light the apps play at the moments
  // that matter, in the apps' own look (2026-10-26): a milky disc of light
  // opens at the TwoPort icon with a band of colour at its rim that carries
  // on after it; the screen under it goes soft and comes back into focus
  // last. Here: Connected the first time the demo comes into view, a glow at
  // the icon each time a file crosses, and "All sent" for a scene's files.
  // Half speed, as in the apps: every duration below is written for normal speed.
  var SLOW = 2;
  var SPREAD = 'cubic-bezier(.12,.6,.2,1)', CARRY = 'cubic-bezier(.3,.25,.45,1)';
  var light = function (box) {
    var mfx = box.querySelector('.mfx'), icon = box.querySelector('.menubar .tp'), rings = box.querySelector('.rings');
    var screen = mfx && mfx.parentNode;
    var T = function (sec) { return sec * 1000 * SLOW; };
    var geo = function () {
      var s = screen.getBoundingClientRect(), r = icon.getBoundingClientRect();
      return { W: s.width, H: s.height, x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 };
    };
    // A round piece of light `D` across, centred on the icon (or `at`).
    var piece = function (cls, D, at, parent) {
      var g = at || geo(), el = document.createElement('i');
      el.className = cls;
      el.style.cssText = 'left:' + (g.x - D / 2) + 'px;top:' + (g.y - D / 2) + 'px;width:' + D + 'px;height:' + D + 'px';
      (parent || mfx).appendChild(el);
      return el;
    };
    var go = function (el, frames, dur, delay, easing, fill) {
      return el.animate(frames, { duration: T(dur), delay: T(delay || 0), easing: easing || 'cubic-bezier(.2,.7,.2,1)', fill: fill || 'both' });
    };
    var gone = function (el, after) { setTimeout(function () { el.remove(); }, T(after) + 60); };
    var halo = function (D, peak, dur, delay, grows) {
      var h = piece('halo', D);
      go(h, grows === false ? [{ opacity: 0 }, { opacity: peak, offset: .3 }, { opacity: 0 }]
        : [{ transform: 'scale(.15)', opacity: 0 }, { transform: 'scale(.8)', opacity: peak, offset: .3 }, { transform: 'scale(1)', opacity: 0 }], dur, delay);
      gone(h, (delay || 0) + dur);
    };
    var glow = function () {
      halo(geo().W * .4, .9, .8);
      icon.animate([{ background: 'rgba(69,217,140,0)', transform: 'scale(1)' }, { background: 'rgba(69,217,140,.35)', transform: 'scale(1.25)', offset: .35 }, { background: 'rgba(69,217,140,0)', transform: 'scale(1)' }], { duration: 650 * SLOW });
    };
    // The light opening at the icon: disc `disc` across, its band of colour
    // carried on to `reach`, the screen soft through a window `soft` across.
    var open = function (disc, reach, soft, k, delay) {
      delay = delay || 0;
      var d = piece('disc', disc);
      go(d, [{ transform: 'scale(.04)', opacity: 0, easing: SPREAD }, { transform: 'scale(.7)', opacity: .82 * k, offset: .18 }, { transform: 'scale(1)', opacity: .6 * k, offset: .42, easing: 'ease-out' }, { transform: 'scale(1.12)', opacity: 0 }], 1.45, delay, 'linear');
      gone(d, delay + 1.45);
      var w = piece('prism', reach), a = disc * 1.04 / reach;
      go(w, [{ transform: 'scale(.02)', opacity: 0, easing: SPREAD }, { transform: 'scale(' + a * .4 + ')', opacity: 1, offset: .08, easing: SPREAD }, { transform: 'scale(' + a + ')', opacity: .95, offset: .3, easing: CARRY }, { transform: 'scale(' + Math.min(1, a + (1 - a) * .55) + ')', opacity: .9, offset: .6, easing: CARRY }, { transform: 'scale(1)', opacity: 0 }], 1.65, delay, 'linear');
      gone(w, delay + 1.65);
      var v = piece('veil', soft), b = disc * 1.2 / soft;
      go(v, [{ transform: 'scale(.02)', easing: SPREAD }, { transform: 'scale(' + b + ')', offset: .3, easing: CARRY }, { transform: 'scale(1)' }], 1.65, delay, 'linear');
      go(v, [{ opacity: 0 }, { opacity: 1, offset: .14 }, { opacity: 1, offset: .45 }, { opacity: 0 }], 2.1, delay, 'ease-in-out');
      gone(v, delay + 2.1);
    };
    // All sent, as in the apps. `o.dir` 'in': the files come out of the
    // light at the icon, out of focus, and sharpen as they land in a stack
    // below it; a sheen crosses them, the check pops on, and the line. A set
    // (`o.full`) is a fanned stack, one or two files land side by side.
    // 'out': they're drawn up into the icon, turning to light on the way;
    // a ring of colour goes out from the icon, then the check and the line
    // under it. `o.items`: photo symbols ('#p3') or 'pdf'.
    var allSent = function (o) {
      var g = geo(), W = g.W, H = g.H, n = o.items.length;
      var side = W * (o.full ? .085 : .1);
      var ic = { x: g.x, y: g.y };
      var cx = Math.max(side * 2, Math.min(W - side * 1.6, ic.x - side * 1.6)), cy = ic.y + H * .42;
      var group = document.createElement('div');
      group.className = 'mset';
      group.style.transformOrigin = cx + 'px ' + cy + 'px';
      mfx.appendChild(group);
      var spots = o.items.map(function (_, i) {
        if (o.full) { var f = [[-.17, .05, -10], [.14, -.04, 7], [-.05, -.12, -3], [.1, .1, 12]][i % 4]; return { x: cx + f[0] * side, y: cy + f[1] * side, tilt: f[2] }; }
        if (n === 1) return { x: cx, y: cy, tilt: -3 };
        return { x: cx + side * .6 * (i ? 1 : -1), y: cy, tilt: i ? 4 : -5 };
      });
      var curve = function (a, b, lane) {
        return 'M' + a.x + ' ' + a.y + ' Q' + (Math.min(a.x, b.x) - 24 - lane * 10) + ' ' + (Math.min(a.y, b.y) + 24 - lane * 5) + ' ' + b.x + ' ' + b.y;
      };
      var card = function (item, d) {
        var c = document.createElement('i');
        c.className = 'mcard';
        c.style.width = c.style.height = side + 'px';
        c.style.offsetPath = "path('" + d + "')";
        c.innerHTML = (item === 'pdf' ? '<svg class="mdoc"><use href="#pdf"/></svg>' : '<svg class="ph"><use href="' + item + '"/></svg>') + '<i class="sheen"></i>';
        group.appendChild(c);
        return c;
      };
      // The light a file travels in.
      var carrier = function (d, delay, dur, easing, leaving) {
        var c = piece('carrier', side * 2.6, { x: 0, y: 0 }, group);
        c.style.left = c.style.top = '0px';
        c.style.offsetPath = "path('" + d + "')";
        go(c, [{ offsetDistance: '0%' }, { offsetDistance: '100%' }], dur, delay, easing);
        go(c, leaving ? [{ opacity: 0, transform: 'scale(1.1)' }, { opacity: .3, transform: 'scale(.7)', offset: .55 }, { opacity: .85, transform: 'scale(.35)', offset: .9 }, { opacity: 0, transform: 'scale(.25)' }]
          : [{ opacity: 0, transform: 'scale(.35)' }, { opacity: .85, transform: 'scale(.5)', offset: .06 }, { opacity: .35, transform: 'scale(.9)', offset: .45 }, { opacity: 0, transform: 'scale(1.1)' }], dur, delay, 'linear');
      };
      var badge = function (x, y, d, delay) {
        var r = document.createElement('i');
        r.className = 'mripple';
        r.style.cssText = 'left:' + (x - d / 2) + 'px;top:' + (y - d / 2) + 'px;width:' + d + 'px;height:' + d + 'px';
        group.appendChild(r);
        go(r, [{ transform: 'scale(1)', opacity: 0 }, { transform: 'scale(1.1)', opacity: .9, offset: .04 }, { transform: 'scale(2.8)', opacity: 0 }], .75, delay + .12, SPREAD);
        var b = document.createElement('i');
        b.className = 'mbadge';
        b.style.cssText = 'left:' + (x - d / 2) + 'px;top:' + (y - d / 2) + 'px;width:' + d + 'px;height:' + d + 'px';
        b.innerHTML = '<svg viewBox="0 0 24 24"><path pathLength="1" d="M6.5 12.5l3.5 3.5 7.5-8"/></svg>';
        group.appendChild(b);
        go(b, [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1.12)', opacity: 1, offset: .45 }, { transform: 'scale(.97)', offset: .75 }, { transform: 'scale(1)', opacity: 1 }], .45, delay, 'ease-out');
        go(b.querySelector('path'), [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], .28, delay + .12, 'ease-out');
      };
      var pill = function (x, y, base, delay) {
        var p = document.createElement('i');
        p.className = 'mpill';
        p.textContent = o.line;
        p.style.cssText = 'left:' + x + 'px;top:' + y + 'px';
        group.appendChild(p);
        go(p, [{ opacity: 0, transform: base + ' translateY(-8px)' }, { opacity: 1, transform: base }], .45, delay, SPREAD);
      };
      var out;
      if (o.dir === 'in') {
        var k = o.full ? 1 : .8;
        halo(W * .3, 1, .6);
        open(Math.max(H * .8, side * 4) * k, H * 1.5 * k, H * 1.35 * k, .88);
        var flight = .8, glide = 'cubic-bezier(.16,.7,.24,1)';
        o.items.forEach(function (item, i) {
          var sp = spots[i], d = curve(ic, sp, i), delay = .1 + i * .09, c = card(item, d);
          carrier(d, delay, flight, glide, false);
          go(c, [{ offsetDistance: '0%' }, { offsetDistance: '100%' }], flight, delay, glide);
          go(c, [{ transform: 'scale(.22) rotate(' + (-1.5 * sp.tilt) + 'deg)', opacity: 0, filter: 'blur(10px)' }, { opacity: 1, offset: .2 }, { transform: 'scale(1.04) rotate(' + sp.tilt + 'deg)', offset: .75, filter: 'blur(0px)' }, { transform: 'scale(1) rotate(' + sp.tilt + 'deg)', opacity: 1, filter: 'blur(0px)' }], flight, delay, glide);
        });
        var landed = .1 + (n - 1) * .09 + flight;
        Array.prototype.slice.call(group.querySelectorAll('.sheen')).forEach(function (sh, i) {
          go(sh, [{ transform: 'translateX(0) rotate(25deg)', opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 1, offset: .8 }, { transform: 'translateX(' + side * 2.4 + 'px) rotate(25deg)', opacity: 0 }], .7, landed - .05 + i * .06, 'ease-in-out');
        });
        var corner = o.full ? { x: cx + side * .62, y: cy - side * .6 } : { x: spots[n - 1].x + side * .46, y: spots[n - 1].y - side * .46 };
        badge(corner.x, corner.y, side * (o.full ? .36 : .3), landed + .05);
        pill(cx, cy + side * (o.full ? .85 : .7) + side * .3, 'translate(-50%,-50%)', landed + .15);
        out = landed + (o.full ? 1.25 : .95);
      } else {
        var fly = .62, pull = 'cubic-bezier(.5,0,.7,.25)', takeOff = o.full ? .75 : .55;
        o.items.forEach(function (item, i) {
          var sp = spots[i], d = curve(sp, ic, i), delay = takeOff + i * .1, c = card(item, d);
          go(c, [{ transform: 'scale(.86) rotate(' + sp.tilt + 'deg)', opacity: 0, filter: 'blur(6px)' }, { transform: 'scale(1) rotate(' + sp.tilt + 'deg)', opacity: 1, filter: 'blur(0px) brightness(1)' }], .35, i * .05, 'cubic-bezier(.2,.9,.3,1.1)');
          carrier(d, delay, fly, pull, true);
          go(c, [{ offsetDistance: '0%' }, { offsetDistance: '100%' }], fly, delay, pull);
          go(c, [{ transform: 'scale(1) rotate(' + sp.tilt + 'deg)', opacity: 1, filter: 'blur(0px) brightness(1)' }, { transform: 'scale(.55) rotate(' + sp.tilt + 'deg)', opacity: 1, filter: 'blur(4px) brightness(1.6)', offset: .75 }, { transform: 'scale(.1) rotate(' + sp.tilt + 'deg)', opacity: 0, filter: 'blur(10px) brightness(2.2)' }], fly, delay, pull, 'forwards');
          halo(side * 1.4, .85, .4, delay + fly - .04, false);
        });
        halo(side * 2, .7, .9, .25);
        var there = takeOff + (n - 1) * .1 + fly;
        var ring = piece('prism', side * (o.full ? 7 : 5));
        go(ring, [{ transform: 'scale(.03)', opacity: 0 }, { transform: 'scale(.15)', opacity: .95, offset: .12 }, { transform: 'scale(1)', opacity: 0 }], .9, there - .05, SPREAD);
        gone(ring, there + .9);
        var gx = ic.x, gy = ic.y + side * .7;
        badge(gx, gy, side * .3, there + .05);
        pill(gx - side * .35, gy, 'translate(-100%,-50%)', there + .15);
        out = there + .95;
      }
      go(group, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(10px) scale(.92)' }], .5, out, 'cubic-bezier(.4,0,.7,.4)');
      setTimeout(function () { group.remove(); }, T(out + .55));
    };
    return {
      allSent: function (o) { if (mfx && icon && mfx.animate) allSent(o); },
      clear: function () { if (mfx) Array.prototype.slice.call(mfx.querySelectorAll('.mset')).forEach(function (g) { g.remove(); }); },
      connected: function () {
        if (!mfx || !icon || !mfx.animate) return;
        var g = geo(), diag = Math.hypot(g.W, g.H);
        halo(g.W * .2, .9, .55);
        // Kept to the icon's corner, as in the apps.
        open(Math.min(g.H * .75, g.W * .5), diag * 1.25, Math.min(g.H * .75, g.W * .5) * 1.6, .72);
        // The edge light: fades in round the screen, its colours turning.
        var edge = box.querySelector('.medge');
        if (edge) {
          edge.animate([{ opacity: 0 }, { opacity: .45, offset: .3 }, { opacity: .45, offset: .65 }, { opacity: 0 }], { duration: 1800 * SLOW, delay: 250 * SLOW, fill: 'both' });
          var e0 = performance.now();
          var turn = function (now) {
            var k = (now - e0) / (2050 * SLOW);
            edge.style.setProperty('--a', (-150 * k) + 'deg');
            if (k < 1) requestAnimationFrame(turn);
          };
          requestAnimationFrame(turn);
        }
        glow();
        if (!rings) return;
        // The phone's ring: blue in from the left, green from the right, meeting at the bottom.
        var t0 = performance.now();
        var step = function (now) {
          var k = Math.min(1, (now - t0) / (700 * SLOW)), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
          rings.style.setProperty('--p', (180 * e) + 'deg');
          rings.style.opacity = 1;
          if (k < 1) requestAnimationFrame(step);
          else rings.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450 * SLOW, delay: 250 * SLOW, fill: 'forwards' }).onfinish = function () { rings.style.opacity = 0; };
        };
        requestAnimationFrame(step);
      },
      glow: function () { if (mfx && icon && mfx.animate) glow(); }
    };
  };

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
    // The light: Connected once, the first time the stage is in view; All
    // sent when a file lands or goes (see `sends` in show).
    var lit = light(stage), glowTimer = null, greeted = reduced;
    // Plays on its own until the visitor picks a moment, then stays put.
    // Phones too (v13): they get the same chips as a laptop.
    var auto = !reduced;
    // The packet on the wire: which way, when, and what it carries.
    var flights = {
      2: { dir: 'toMac', delay: 2.6, icon: '#img' },
      3: { dir: 'toPhone', delay: 3.0, icon: '#pdf' },
      4: { dir: 'toPhone', delay: 1.8, icon: '#text' },
      6: { dir: 'toMac', delay: 1.2, icon: '#img' }
    };
    // The same for the recordings, timed to each clip (seconds from its start).
    var realFlights = {
      copy: { dir: 'toPhone', delay: 2.0, icon: '#text' },
      tomac: { dir: 'toMac', delay: 3.6, icon: '#img' },
      tophone: { dir: 'toPhone', delay: 3.4, icon: '#pdf' },
      usb: { dir: 'toMac', delay: 4.2, icon: '#img' },
      backup: { dir: 'toMac', delay: 3.6, icon: '#img' }
    };
    // Which way the dots on the link flow: phone → Mac unless the Mac sends.
    var toPhone = { 3: 1, 4: 1 };

    var go = function (i) { pick(i); };

    // Real screen recordings (v12): a moment with `data-clip` plays its Mac
    // and phone videos instead of the drawn scene, for as long as the clip
    // runs (`data-dur`). A clip that can't play drops that moment back to
    // the drawing; reduced motion shows the clips' posters, still.
    var mDur = function (i) { return +tabs[i].dataset.dur || DUR; };
    // Copy and paste, made visible (v12): a thin light runs round the Mac's
    // screen the moment ⌘C is pressed in the recording, and round the
    // phone's when the paste lands. Times are seconds into each clip.
    var cueAt = { copy: [['mac', 1.8], ['phone', 4.35]] };
    var cueEls = {
      mac: stage.querySelector('.screen').appendChild(document.createElement('i')),
      phone: stage.querySelector('.pscreen').appendChild(document.createElement('i'))
    };
    cueEls.mac.className = 'cue cue-mac'; cueEls.phone.className = 'cue cue-phone';
    var cueTimers = [];
    var cuePlay = function (clip) {
      cueTimers.forEach(clearTimeout); cueTimers = [];
      Object.keys(cueEls).forEach(function (k) { cueEls[k].classList.remove('go'); });
      if (reduced || !cueAt[clip]) return;
      cueAt[clip].forEach(function (c) {
        cueTimers.push(setTimeout(function () {
          var el = cueEls[c[0]]; el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
        }, c[1] * 1000));
      });
    };
    var mRecs = Array.prototype.slice.call(stage.querySelectorAll('.rec'));
    var mDead = {};
    var mPlay = function (clip) {
      var real = !!clip && !mDead[clip];
      stage.classList.toggle('real', real);
      // The link between the two says how they're joined in this clip.
      var airLabel = stage.querySelector('.air-wifi');
      if (airLabel) airLabel.textContent = real && clip === 'usb' ? 'USB cable' : 'Wi-Fi';
      stage.classList.toggle('cable', real && clip === 'usb');
      mRecs.forEach(function (r) {
        var on = real && r.dataset.clip === clip;
        r.classList.toggle('on', on);
        if (r.tagName !== 'VIDEO') return;
        if (!on) { r.pause(); return; }
        if (reduced) return;
        try { r.currentTime = 0; } catch (e) {}
        // A rejected play() is not a broken clip: switching moments while a
        // clip is still loading aborts it (AbortError), and that used to mark
        // the clip dead and bring back the drawn scene and its light on top
        // of the next recording. Only a media error counts (below).
        var p = r.play();
        if (p && p.catch) p.catch(function () {});
      });
    };
    // A clip that can't load at all falls back to the drawing — only if it's
    // the one playing now.
    var mFail = function (r) {
      mDead[r.dataset.clip] = true;
      if (r.classList.contains('on')) { stage.classList.remove('real', 'cable'); show(idx); }
    };
    mRecs.forEach(function (r) {
      if (r.tagName !== 'VIDEO') return;
      var src = r.querySelector('source');
      (src || r).addEventListener('error', function () { mFail(r); });
      // Stalled mid-clip (slow disk or network): nudge it on rather than
      // leaving a frozen frame for the rest of the moment.
      r.addEventListener('waiting', function () {
        if (!r.classList.contains('on')) return;
        clearTimeout(r._nudge);
        r._nudge = setTimeout(function () { if (r.classList.contains('on') && r.paused === false && r.readyState < 3) { r.load(); r.play().catch(function () {}); } }, 2500);
      });
    });

    var schedule = function () {
      clearTimeout(timer);
      if (auto) timer = setTimeout(function () { if (visible) show((idx + 1) % N); else schedule(); }, mDur(idx));
      // A moment the visitor picked (and, on phones, the one in view) plays
      // again while they stay on it, instead of freezing on its last frame.
      else if (!reduced) timer = setTimeout(function () { if (visible) show(idx); else schedule(); }, mDur(idx));
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
      var clip = tabs[i].dataset.clip;
      mPlay(clip);
      var real = stage.classList.contains('real');
      // In a recording the packet crosses when the real one does.
      var f = real ? realFlights[clip] : flights[n];
      clearTimeout(glowTimer);
      lit.clear();
      // All sent, timed to each scene: the photo landing, the boarding
      // pass going, the backup finishing. Anything else: a glow as the file crosses.
      var sends = {
        2: { at: 3.7, dir: 'in', items: ['#p3'], line: 'IMG_2058.jpg arrived · 3.1 MB' },
        3: { at: 2.6, dir: 'out', items: ['pdf'], line: 'Boarding pass.pdf sent · 212 KB' },
        6: { at: 3.3, dir: 'in', items: ['#p6', '#p2', '#p7', '#p1'], line: '38 photos arrived · 412 MB', full: true }
      };
      // A recording already shows the apps' real light; never draw ours on
      // a moment that has one, even while it's falling back.
      if (real || clip) {}
      else if (!reduced && sends[n]) glowTimer = setTimeout(function () { lit.allSent(sends[n]); }, sends[n].at * 1000);
      else if (f && !reduced) glowTimer = setTimeout(lit.glow, (f.delay + (f.dir === 'toMac' ? 1.1 : 0)) * 1000);
      cuePlay(real ? clip : null);
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
        bar.style.setProperty('--dur', mDur(i) + 'ms');
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

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; }, { threshold: 0.25 }).observe(stage);
      new IntersectionObserver(function (entries, seen) {
        if (greeted || !entries[0].isIntersecting) return;
        greeted = true; seen.disconnect();
        // Only the all-drawn demo greets with the light; the recordings
        // already show the apps' real one.
        if (!mRecs.length) setTimeout(lit.connected, 350);
      }, { threshold: 0.6 }).observe(stage);
    }
    show(0);
  }

  // ---- Every feature, recorded (v12): each card's clip loads the first time
  // it comes into view and plays only while it's on screen. Reduced motion:
  // posters only.
  var fclips = Array.prototype.slice.call(document.querySelectorAll('.fclip video[data-src]'));
  if (fclips.length && 'IntersectionObserver' in window && !reduced) {
    var fcSeen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.src) { v.src = v.dataset.src; v.load(); }
          var p = v.play(); if (p && p.catch) p.catch(function () {});
        } else if (!v.paused) v.pause();
      });
    }, { threshold: 0.45 });
    fclips.forEach(function (v) { fcSeen.observe(v); });
  }

  // ---- The last chip under the demo: "+19 more features", every recorded
  // feature card the demo's moments don't already show.
  var moreN = document.querySelector('[data-more]');
  if (moreN) moreN.textContent = Math.max(0, document.querySelectorAll('.fclip').length - document.querySelectorAll('.tabs .tab').length);
  // On phones each group is a row you swipe (site.css): its head says how many.
  document.querySelectorAll('.fclip-group').forEach(function (g) {
    var n = g.querySelectorAll('.fclip').length, head = g.querySelector('.fclip-head');
    if (n > 1 && head) head.appendChild(document.createElement('small')).textContent = n + ' features →';
  });

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
    // Text from the board goes into attributes as well as elements, so quotes
    // are escaped too: textContent → innerHTML alone leaves " as it is, and a
    // title could close aria-label="…" and add an onmouseover.
    var esc = function (t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };
    var render = function (rows) {
      if (!rows.length) { board.innerHTML = '<li class="empty">No requests yet. Be the first.</li>'; return; }
      board.innerHTML = rows.map(function (r) {
        var on = !!voted[r.id];
        return '<li><button class="vote" type="button" data-id="' + esc(r.id) + '" aria-pressed="' + on + '" aria-label="Vote for ' + esc(r.title) + ', ' + esc(r.votes) + ' votes"><b>' + esc(r.votes) + '</b><span>' + (on ? 'voted' : 'vote') + '</span></button>' +
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
        if (r.status === 201) confirmed(fr, 'Thanks! We have your idea.', [['', title, " goes on the board once we've had a look, usually within a day. Then anyone can vote for it."]], 'Suggest another idea');
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
