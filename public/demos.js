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

  // ---------- Muted trailer: plays unless the viewer prefers reduced motion; always pausable ----------
  document.querySelectorAll('[data-trailer]').forEach(function (fig) {
    var v = fig.querySelector('video'), b = fig.querySelector('button');
    function sync() { var on = !v.paused; b.textContent = on ? 'Pause trailer' : 'Play trailer'; b.setAttribute('aria-pressed', String(on)); }
    b.addEventListener('click', function () { if (v.paused) v.play(); else v.pause(); });
    v.addEventListener('play', sync); v.addEventListener('pause', sync);
    if (!reduce) v.play().catch(function () {});
  });

  var demos = { play: play, quiz: quiz };
  document.querySelectorAll('[data-demo]').forEach(function (el) { demos[el.dataset.demo](el); });
})();
