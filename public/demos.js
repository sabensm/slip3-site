// Interactive demos for the case-study pages. Each one starts from an element with data-demo.
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs, parent) {
    var el = document.createElementNS(SVGNS, tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }
  function onVisible(el, fn) {
    if (!('IntersectionObserver' in window)) return fn();
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); fn(); }
    }, { threshold: 0.5 });
    io.observe(el);
  }

  // ---------- Formation Lab: a play that runs from snap to catch ----------
  function play(root) {
    var field = root.querySelector('svg');
    var btn = root.querySelector('[data-run]');
    var range = root.querySelector('input[type=range]');
    var W = 360, LOS = 200;
    for (var y = 20; y < 300; y += 30) svg('line', { x1: 0, x2: W, y1: y, y2: y, class: 'yard' }, field);
    svg('line', { x1: 0, x2: W, y1: LOS, y2: LOS, class: 'los' }, field);
    var defs = svg('defs', {}, field);
    var players = [
      { id: 'X', color: '#1d3b8f', d: 'M50 205 L50 168 L150 106', start: 0.12, end: 0.78 },
      { id: 'Y', color: '#2f9e5b', d: 'M128 214 L128 150 L250 150', start: 0.12, end: 0.82, catcher: true },
      { id: 'Z', color: '#7b4bd6', d: 'M312 205 L312 46', start: 0.12, end: 1 },
      { id: 'C', color: '#f2c230', d: 'M180 205 L180 158 L180 168', start: 0.12, end: 0.7, square: true },
      { id: 'Q', color: '#ef6a2b', d: 'M180 242 L180 262', start: 0.04, end: 0.3 }
    ];
    players.forEach(function (p) {
      var m = svg('marker', { id: 'ah-' + p.id, viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto' }, defs);
      svg('path', { d: 'M0 0 L10 5 L0 10 z', fill: p.color }, m);
      p.path = svg('path', { d: p.d, class: 'route', stroke: p.color, 'marker-end': 'url(#ah-' + p.id + ')' }, field);
      p.len = p.path.getTotalLength();
    });
    var ball = svg('ellipse', { rx: 7, ry: 4.5, class: 'ball' }, field);
    players.forEach(function (p) {
      p.g = svg('g', {}, field);
      if (p.square) svg('rect', { x: -14, y: -14, width: 28, height: 28, rx: 6, fill: p.color }, p.g);
      else svg('circle', { r: 15, fill: p.color }, p.g);
      svg('text', { class: 'ptxt', fill: p.square ? '#171310' : '#fff', style: p.square ? 'fill:#171310' : '' }, p.g).textContent = p.id;
    });
    var THROW = 0.42, CATCH = 0.82;
    function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function at(p, t) {
      var k = Math.max(0, Math.min(1, (t - p.start) / (p.end - p.start)));
      return p.path.getPointAtLength(ease(k) * p.len);
    }
    function draw(t) {
      players.forEach(function (p) { var pt = at(p, t); p.g.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ')'); });
      var q = at(players[4], t), cat = players.filter(function (p) { return p.catcher; })[0];
      var bx, by, rot = 0;
      if (t < THROW) { bx = q.x + 9; by = q.y - 6; }
      else if (t < CATCH) {
        var k = (t - THROW) / (CATCH - THROW), from = at(players[4], THROW), to = at(cat, CATCH);
        bx = from.x + (to.x - from.x) * k; by = from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * 36;
        rot = Math.atan2(to.y - from.y, to.x - from.x) * 180 / Math.PI;
      } else { var c = at(cat, t); bx = c.x + 10; by = c.y - 8; }
      ball.setAttribute('transform', 'translate(' + bx + ' ' + by + ') rotate(' + rot + ')');
      range.value = Math.round(t * 1000);
    }
    var raf, t0;
    function run() {
      cancelAnimationFrame(raf);
      t0 = null;
      function step(ts) {
        if (t0 === null) t0 = ts;
        var t = Math.min(1, (ts - t0) / 3400);
        draw(t);
        if (t < 1) raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }
    btn.addEventListener('click', run);
    range.addEventListener('input', function () { cancelAnimationFrame(raf); draw(range.value / 1000); });
    draw(0);
    if (!reduce) onVisible(root, run);
  }

  // ---------- Starting 5: five questions on a ten-second shot clock ----------
  function quiz(root) {
    var FIVE = ['LeBron James', 'Allen Iverson', "Shaquille O’Neal", 'Steve Nash', 'Kobe Bryant'];
    var QS = [
      { q: 'Drafted 13th overall by the Charlotte Hornets in 1996, then traded to the Lakers.', a: 'Kobe Bryant' },
      { q: 'Won back-to-back MVP awards in 2005 and 2006.', a: 'Steve Nash' },
      { q: 'Famously nicknamed “The Answer” throughout his career.', a: 'Allen Iverson' },
      { q: 'Won three straight Finals MVP awards, from 2000 to 2002.', a: "Shaquille O’Neal" },
      { q: 'Has scored more points than anyone in NBA history.', a: 'LeBron James' }
    ];
    var qEl = root.querySelector('[data-body] .quiz-q'), opts = root.querySelector('.quiz-opts'), clock = root.querySelector('.quiz-clock'),
        meter = root.querySelector('.quiz-meter i'), label = root.querySelector('[data-label]'), score = root.querySelector('[data-score]'),
        body = root.querySelector('[data-body]'), end = root.querySelector('.quiz-end'), live = root.querySelector('[aria-live]');
    var i, pts, raf, started, locked;
    FIVE.forEach(function (name) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.textContent = name;
      b.addEventListener('click', function () { answer(name, b); });
      li.appendChild(b); opts.appendChild(li);
    });
    var buttons = [].slice.call(opts.querySelectorAll('button'));
    function tick() {
      var left = Math.max(0, 10 - (performance.now() - started) / 1000);
      clock.textContent = '0:' + String(Math.ceil(left)).padStart(2, '0');
      meter.style.transform = 'scaleX(' + left / 10 + ')';
      if (left <= 0) return answer(null, null);
      raf = requestAnimationFrame(tick);
    }
    function ask() {
      locked = false; started = performance.now();
      var clutch = i === QS.length - 1;
      label.textContent = (clutch ? 'Clutch · 2× · ' : '') + 'Q' + (i + 1) + ' of ' + QS.length;
      qEl.textContent = QS[i].q;
      buttons.forEach(function (b) { b.className = ''; b.disabled = false; });
      cancelAnimationFrame(raf); raf = requestAnimationFrame(tick);
    }
    function answer(name, btn) {
      if (locked) return;
      locked = true; cancelAnimationFrame(raf);
      var secs = (performance.now() - started) / 1000;
      var right = name === QS[i].a, got = 0;
      if (right) got = (secs <= 3 ? 3 : secs <= 6 ? 2 : 1) * (i === QS.length - 1 ? 2 : 1);
      pts += got; score.textContent = pts;
      buttons.forEach(function (b) { b.disabled = true; if (b.textContent === QS[i].a) b.className = 'right'; });
      if (btn && !right) btn.className = 'wrong';
      live.textContent = right ? 'Correct, +' + got + ' points.' : (name ? 'Not quite. ' : 'Shot clock. ') + 'It was ' + QS[i].a + '.';
      setTimeout(function () { i++; if (i < QS.length) ask(); else finish(); }, 1100);
    }
    function finish() {
      body.hidden = true; end.hidden = false;
      end.querySelector('b').textContent = pts;
      live.textContent = 'Final score: ' + pts + ' points out of 18.';
      end.querySelector('button').focus();
    }
    function start() { i = 0; pts = 0; score.textContent = 0; body.hidden = false; end.hidden = true; ask(); }
    root.querySelector('[data-start]').addEventListener('click', function () {
      root.querySelector('[data-intro]').hidden = true; start(); buttons[0].focus();
    });
    end.querySelector('button').addEventListener('click', function () { start(); buttons[0].focus(); });
  }

  // ---------- Plonk: drop, match, grow ----------
  function plonk(root) {
    var canvas = root.querySelector('canvas'), box = root.querySelector('.toy'),
        nextImg = root.querySelector('[data-next]'), scoreEl = root.querySelector('[data-score]'),
        resetBtn = root.querySelector('[data-reset]'), live = root.querySelector('[aria-live]');
    var ctx = canvas.getContext('2d');
    var W = 360, H = 480, LINE = 78, G = 1500;
    var R = [11, 14, 19, 22, 27, 32, 38, 44, 51, 59, 70];
    var COL = ['#96d6b2', '#1c2a48', '#6a88b0', '#f5d26e', '#1a5a68', '#c47a8a', '#f5d26e', '#2f5a3a', '#f4b0c4', '#5a3a5e', '#f5d26e'];
    var NAMES = ['Ladybug', 'Frog', 'Chick', 'Cat', 'Fox', 'Panda', 'Owl', 'Pig', 'Bear', 'Lion', 'Elephant'];
    var imgs = R.map(function (_, k) { var im = new Image(); im.src = '/img/plonk-critter-' + k + '-160.webp'; return im; });
    var balls, aim, next, hold, cooldown, score, over, overT, last, pops;
    function deal() { return Math.floor(Math.random() * 5); }
    function reset() {
      balls = []; pops = []; aim = W / 2; hold = deal(); next = deal(); cooldown = 0; score = 0; over = false; overT = 0;
      scoreEl.textContent = '0'; setNext(); resetBtn.hidden = true;
    }
    function setNext() { nextImg.src = imgs[next].src; nextImg.alt = 'Next: ' + NAMES[next]; }
    function resize() {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function drop() {
      if (over || cooldown > 0) return;
      var r = R[hold], x = Math.max(r, Math.min(W - r, aim));
      balls.push({ x: x, y: 40, px: x, py: 40, t: hold, r: r, age: 0 });
      hold = next; next = deal(); setNext(); cooldown = 0.45;
    }
    function step(dt) {
      cooldown = Math.max(0, cooldown - dt);
      balls.forEach(function (b) {
        var vx = (b.x - b.px) * 0.995, vy = (b.y - b.py) * 0.995;
        b.px = b.x; b.py = b.y; b.x += vx; b.y += vy + G * dt * dt; b.age += dt;
      });
      for (var it = 0; it < 6; it++) {
        for (var a = 0; a < balls.length; a++) {
          var A = balls[a];
          if (A.x < A.r) A.x = A.r; if (A.x > W - A.r) A.x = W - A.r; if (A.y > H - A.r) A.y = H - A.r;
          for (var b = a + 1; b < balls.length; b++) {
            var B = balls[b], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 0.01, min = A.r + B.r;
            if (d < min) {
              if (A.t === B.t && A.t < R.length - 1 && !A.dead && !B.dead) { merge(A, B); continue; }
              var push = (min - d) / 2, nx = dx / d, ny = dy / d, ma = B.r * B.r / (A.r * A.r + B.r * B.r), mb = 1 - ma;
              A.x -= nx * push * 2 * ma; A.y -= ny * push * 2 * ma; B.x += nx * push * 2 * mb; B.y += ny * push * 2 * mb;
            }
          }
        }
        balls = balls.filter(function (x) { return !x.dead; });
      }
      var high = balls.some(function (b) { return b.age > 1 && b.y - b.r < LINE; });
      overT = high ? overT + dt : 0;
      if (overT > 1.6 && !over) { over = true; resetBtn.hidden = false; live.textContent = 'Bin full. Final score ' + score + '.'; }
      pops = pops.filter(function (p) { p.t += dt; return p.t < 0.45; });
    }
    function merge(A, B) {
      A.dead = B.dead = true;
      var t = A.t + 1, x = (A.x + B.x) / 2, y = (A.y + B.y) / 2;
      balls.push({ x: x, y: y, px: x, py: y + 1.5, t: t, r: R[t], age: 1 });
      score += Math.pow(2, t + 1); scoreEl.textContent = score.toLocaleString();
      pops.push({ x: x, y: y, r: R[t], t: 0 });
      if (t >= 6) live.textContent = 'You made a ' + NAMES[t] + '!';
    }
    function disc(x, y, r, t, alpha) {
      ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = COL[t]; ctx.fill();
      if (imgs[t].complete && imgs[t].naturalWidth) ctx.drawImage(imgs[t], x - r * 0.86, y - r * 0.86, r * 1.72, r * 1.72);
      ctx.globalAlpha = 1;
    }
    function render() {
      ctx.clearRect(0, 0, W, H);
      ctx.setLineDash([7, 7]); ctx.strokeStyle = over ? '#c45c3e' : 'rgba(196,92,62,.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, LINE); ctx.lineTo(W, LINE); ctx.stroke(); ctx.setLineDash([]);
      if (!over) {
        var r = R[hold], x = Math.max(r, Math.min(W - r, aim));
        ctx.strokeStyle = 'rgba(74,107,58,.35)'; ctx.setLineDash([2, 8]); ctx.beginPath(); ctx.moveTo(x, 40 + r); ctx.lineTo(x, H); ctx.stroke(); ctx.setLineDash([]);
        disc(x, 40, r, hold, cooldown > 0 ? 0.45 : 1);
      }
      balls.forEach(function (b) { disc(b.x, b.y, b.r, b.t, 1); });
      pops.forEach(function (p) {
        ctx.strokeStyle = 'rgba(255,255,255,' + (1 - p.t / 0.45) + ')'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + p.t * 60, 0, Math.PI * 2); ctx.stroke();
      });
      if (over) {
        ctx.fillStyle = 'rgba(36,23,15,.55)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fbeee3'; ctx.textAlign = 'center'; ctx.font = '800 34px "Bricolage Grotesque", sans-serif';
        ctx.fillText('So close…', W / 2, H / 2 - 8); ctx.font = '600 17px system-ui, sans-serif'; ctx.fillText('one more go?', W / 2, H / 2 + 22);
      }
    }
    var running = false;
    function loop(ts) {
      if (!last) last = ts;
      var dt = Math.min(1 / 30, (ts - last) / 1000); last = ts;
      var sub = 3; for (var s = 0; s < sub; s++) step(dt / sub);
      render();
      requestAnimationFrame(loop);
    }
    function toLocal(e) { var rc = canvas.getBoundingClientRect(); return (e.clientX - rc.left) / rc.width * W; }
    box.addEventListener('pointermove', function (e) { aim = toLocal(e); });
    box.addEventListener('pointerdown', function (e) { aim = toLocal(e); });
    box.addEventListener('pointerup', function (e) { if (e.button === 0 || e.pointerType !== 'mouse') drop(); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { aim = Math.max(0, aim - 18); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { aim = Math.min(W, aim + 18); e.preventDefault(); }
      else if (e.key === ' ' || e.key === 'Enter') { drop(); e.preventDefault(); }
    });
    resetBtn.addEventListener('click', function () { reset(); box.focus(); });
    resize(); reset();
    onVisible(root, function () { if (!running) { running = true; requestAnimationFrame(loop); } });
  }

  // ---------- Muted trailer: plays unless the viewer prefers reduced motion; always pausable ----------
  document.querySelectorAll('[data-trailer]').forEach(function (fig) {
    var v = fig.querySelector('video'), b = fig.querySelector('button');
    function sync() { var on = !v.paused; b.textContent = on ? 'Pause trailer' : 'Play trailer'; b.setAttribute('aria-pressed', String(on)); }
    b.addEventListener('click', function () { if (v.paused) v.play(); else v.pause(); });
    v.addEventListener('play', sync); v.addEventListener('pause', sync);
    if (!reduce) v.play().catch(function () {});
  });

  var demos = { play: play, quiz: quiz, plonk: plonk };
  document.querySelectorAll('[data-demo]').forEach(function (el) { demos[el.dataset.demo](el); });
})();
