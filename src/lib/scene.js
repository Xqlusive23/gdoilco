/* Animated offshore scenes drawn on canvas. */
/* Animated offshore scenes drawn on canvas: sky, sea, jack-up rig, flare, supply vessel, helicopter. */
  var SCENES = {
    dusk:  { sky: ['#0a1828', '#2c3f66', '#c4604a', '#f2a65c'], sun: { x: 0.74, y: 0.0, r: 44, c: '255,214,160' }, sea: ['#163645', '#06141b'], wave: '4,14,20', stars: 0.5, flare: true, heli: true, ship: true },
    dawn:  { sky: ['#14293f', '#4a7699', '#e2ab8a', '#f7dfb4'], sun: { x: 0.28, y: 0.0, r: 36, c: '255,240,205' }, sea: ['#21505f', '#0a2431'], wave: '4,18,26', stars: 0.1, flare: false, ship: true },
    day:   { sky: ['#245f86', '#5c9cc0', '#a9cfdc', '#e6f0ee'], sun: { x: 0.82, y: -0.5, r: 26, c: '255,252,230' }, sea: ['#1a6a7f', '#0a3b4b'], wave: '4,26,36', stars: 0, flare: false, ship: true, heli: true },
    night: { sky: ['#02080d', '#08182a', '#122a3d', '#1c394d'], sun: { x: 0.2, y: -0.65, r: 20, c: '220,232,255' }, sea: ['#08222d', '#02090d'], wave: '0,6,10', stars: 1, flare: true, ship: false },
    fog:   { sky: ['#34454e', '#566a74', '#84969d', '#b1bec1'], sun: null, sea: ['#32505a', '#13262d'], wave: '6,20,26', stars: 0, flare: false, ship: true, fog: true },
    rise:  { sky: ['#1a2744', '#5b5c8c', '#e08c78', '#fbd29a'], sun: { x: 0.62, y: 0.0, r: 40, c: '255,226,178' }, sea: ['#2a4a5e', '#0a1f2b'], wave: '4,14,22', stars: 0.25, flare: false, ship: true, heli: true }
  };

  function rng(seed) { var s = seed; return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  function drawRig(ctx, x, y, s, t, opt) {
    // y is the waterline. Units are ~px at s = 1: rig is about 330 wide and 250 tall.
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    var ink = opt.ink;
    ctx.fillStyle = ink; ctx.strokeStyle = ink;
    // legs with lattice
    [-78, 64].forEach(function (lx) {
      ctx.fillRect(lx, -165, 5, 215);
      ctx.fillRect(lx + 14, -165, 5, 215);
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var j = 0; j < 10; j++) { var y0 = -160 + j * 21; ctx.moveTo(lx + 5, y0); ctx.lineTo(lx + 14, y0 + 21); ctx.moveTo(lx + 14, y0); ctx.lineTo(lx + 5, y0 + 21); }
      ctx.stroke();
      ctx.fillRect(lx - 14, 46, 47, 8); // spud can
    });
    // hull
    ctx.fillRect(-130, -78, 262, 22);
    ctx.fillRect(-112, -88, 224, 10);
    // accommodation block
    ctx.fillRect(-102, -126, 56, 40);
    ctx.fillRect(-96, -140, 30, 14);
    // helideck
    ctx.fillRect(-170, -104, 62, 5);
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-160, -99); ctx.lineTo(-136, -86); ctx.moveTo(-120, -99); ctx.lineTo(-128, -86); ctx.stroke();
    // derrick
    ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(18, -88); ctx.lineTo(34, -218); ctx.moveTo(68, -88); ctx.lineTo(52, -218); ctx.stroke();
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (var k = 0; k < 10; k++) {
      var y0 = -88 - k * 13, y1 = y0 - 13;
      var l0 = 18 + (88 + y0) * -0.123 * -1, r0 = 68 - (88 + y0) * 0.123 * -1;
      l0 = 18 + (-88 - y0) * 0.123; r0 = 68 - (-88 - y0) * 0.123;
      var l1 = 18 + (-88 - y1) * 0.123, r1 = 68 - (-88 - y1) * 0.123;
      ctx.moveTo(l0, y0); ctx.lineTo(r1, y1);
      ctx.moveTo(r0, y0); ctx.lineTo(l1, y1);
      ctx.moveTo(l0, y0); ctx.lineTo(r0, y0);
    }
    ctx.stroke();
    ctx.fillRect(30, -226, 26, 8); // crown block
    ctx.fillRect(41, -240, 3, 16); // mast
    // crane
    ctx.fillRect(98, -148, 8, 62);
    ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(102, -146); ctx.lineTo(168, -112); ctx.stroke();
    ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(102, -146); ctx.lineTo(150, -146); ctx.lineTo(168, -112); ctx.stroke();
    // flare boom
    if (opt.flare) {
      ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-126, -70); ctx.lineTo(-206, -118); ctx.stroke();
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-126, -84); ctx.lineTo(-206, -118); ctx.stroke();
    }
    // window lights
    ctx.fillStyle = opt.light;
    for (var w = 0; w < 5; w++) { ctx.fillRect(-96 + w * 10, -118, 5, 4); ctx.fillRect(-96 + w * 10, -106, 5, 4); }
    ctx.fillRect(-84, -135, 3, 3);
    // navigation lights
    var blink = (Math.sin(t * 3.2) > 0.2) ? 1 : 0.15;
    ctx.fillStyle = 'rgba(255,60,50,' + blink + ')';
    ctx.beginPath(); ctx.arc(42, -242, 3.2, 0, 6.3); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,' + (blink > 0.5 ? 0.9 : 0.3) + ')';
    ctx.beginPath(); ctx.arc(102, -150, 2.4, 0, 6.3); ctx.fill();
    ctx.restore();
  }

  function drawFlame(ctx, x, y, s, t) {
    var f = 0.75 + 0.25 * Math.sin(t * 13) * Math.sin(t * 7.3) + 0.12 * Math.sin(t * 23);
    var h = 62 * s * f, w = 15 * s;
    var g = ctx.createRadialGradient(x, y - h * 0.4, 2, x, y - h * 0.4, 130 * s * f);
    g.addColorStop(0, 'rgba(255,170,70,0.55)'); g.addColorStop(0.35, 'rgba(255,110,40,0.18)'); g.addColorStop(1, 'rgba(255,90,30,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - h * 0.4, 130 * s * f, 0, 6.3); ctx.fill();
    var sway = Math.sin(t * 5) * 4 * s;
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.bezierCurveTo(x - w * 1.2, y - h * 0.5, x + sway - w * 0.2, y - h * 0.7, x + sway * 1.6, y - h);
    ctx.bezierCurveTo(x + sway + w * 0.5, y - h * 0.6, x + w * 1.3, y - h * 0.4, x + w, y);
    ctx.closePath();
    var fg = ctx.createLinearGradient(0, y, 0, y - h);
    fg.addColorStop(0, '#fff3c4'); fg.addColorStop(0.35, '#ffb347'); fg.addColorStop(1, 'rgba(255,90,30,0.05)');
    ctx.fillStyle = fg; ctx.fill();
  }

  function drawShip(ctx, x, y, s, ink, light) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = ink;
    ctx.beginPath(); ctx.moveTo(-60, -8); ctx.lineTo(62, -8); ctx.lineTo(48, 6); ctx.lineTo(-56, 6); ctx.closePath(); ctx.fill();
    ctx.fillRect(28, -26, 20, 18); ctx.fillRect(34, -34, 8, 8); ctx.fillRect(-52, -14, 50, 6);
    ctx.fillStyle = light; ctx.fillRect(32, -22, 3, 3); ctx.fillRect(39, -22, 3, 3);
    ctx.restore();
  }

  function drawHeli(ctx, x, y, s, t, ink) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = ink; ctx.strokeStyle = ink;
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 7, 0, 0, 6.3); ctx.fill();
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-12, -1); ctx.lineTo(-40, -6); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-42, -12); ctx.lineTo(-38, 0); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-10, 9); ctx.lineTo(10, 9); ctx.stroke();
    ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, -11); ctx.stroke();
    var rw = 30 * Math.abs(Math.cos(t * 28)) + 6;
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-rw, -11); ctx.lineTo(rw, -11); ctx.stroke();
    ctx.fillStyle = (Math.sin(t * 6) > 0) ? 'rgba(255,80,60,0.95)' : 'rgba(255,80,60,0.2)';
    ctx.beginPath(); ctx.arc(-41, -12, 2, 0, 6.3); ctx.fill();
    ctx.restore();
  }

  export function initScene(el) {
    var canvas = el.querySelector('canvas');
    if (!canvas) { canvas = document.createElement('canvas'); el.appendChild(canvas); }
    var sc = SCENES[el.getAttribute('data-scene')] || SCENES.dusk;
    var focusX = parseFloat(el.getAttribute('data-rig-x') || '0.74');
    var ctx = canvas.getContext('2d');
    var w = 0, h = 0, dpr = 1, running = false, raf = 0;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var rand = rng(97), stars = [];
    for (var i = 0; i < 140; i++) stars.push([rand(), rand() * 0.6, rand() * 1.4 + 0.3, rand() * 6]);

    function resize() {
      var r = el.getBoundingClientRect();
      w = Math.max(280, r.width); h = Math.max(200, r.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function frame(t) {
      var hor = h * 0.64;
      var g = ctx.createLinearGradient(0, 0, 0, hor);
      sc.sky.forEach(function (c, i) { g.addColorStop(i / (sc.sky.length - 1), c); });
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, hor + 2);
      if (sc.stars) {
        for (var i = 0; i < stars.length; i++) {
          var st = stars[i], a = sc.stars * (0.35 + 0.65 * Math.abs(Math.sin(t * 0.8 + st[3])));
          ctx.fillStyle = 'rgba(255,255,255,' + (a * (1 - st[1] / 0.7)).toFixed(3) + ')';
          ctx.fillRect(st[0] * w, st[1] * hor, st[2], st[2]);
        }
      }
      var sunX = 0, sunY = 0;
      if (sc.sun) {
        sunX = sc.sun.x * w; sunY = hor + sc.sun.y * hor * 0.35;
        var sg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sc.sun.r * 7);
        sg.addColorStop(0, 'rgba(' + sc.sun.c + ',0.85)'); sg.addColorStop(0.15, 'rgba(' + sc.sun.c + ',0.35)'); sg.addColorStop(1, 'rgba(' + sc.sun.c + ',0)');
        ctx.fillStyle = sg; ctx.fillRect(0, 0, w, hor + 2);
        ctx.fillStyle = 'rgb(' + sc.sun.c + ')'; ctx.beginPath(); ctx.arc(sunX, sunY, sc.sun.r, 0, 6.3); ctx.fill();
      }
      // cloud bands
      ctx.fillStyle = sc.fog ? 'rgba(220,230,232,0.10)' : 'rgba(255,255,255,0.045)';
      for (var c = 0; c < 4; c++) {
        var cx = ((t * (3 + c) + c * w * 0.37) % (w + 400)) - 200, cy = hor * (0.18 + c * 0.15);
        ctx.beginPath(); ctx.ellipse(cx, cy, 160 + c * 40, 9 + c * 3, 0, 0, 6.3); ctx.fill();
      }
      // sea
      var sg2 = ctx.createLinearGradient(0, hor, 0, h);
      sg2.addColorStop(0, sc.sea[0]); sg2.addColorStop(1, sc.sea[1]);
      ctx.fillStyle = sg2; ctx.fillRect(0, hor, w, h - hor);
      // sun path glints
      if (sc.sun) {
        for (var q = 0; q < 26; q++) {
          var k = q / 26, gy = hor + 3 + (h - hor) * k * k, spread = (6 + 120 * k) * (0.6 + 0.4 * Math.sin(t * 1.3 + q));
          var gx = sunX + Math.sin(t * 0.9 + q * 2.1) * spread * 0.5, gw = 8 + 70 * k * Math.abs(Math.sin(t * 1.7 + q * 1.3));
          ctx.fillStyle = 'rgba(' + sc.sun.c + ',' + (0.35 * (1 - k * 0.6)).toFixed(3) + ')';
          ctx.fillRect(gx - gw / 2, gy, gw, 1 + k * 1.4);
        }
      }
      // rig placement
      var rigS = Math.min((hor - 18) / 300, w / 560, 1.15);
      var rx = Math.max(w * focusX, 190 * rigS + 20); if (rx > w - 150 * rigS) rx = w - 150 * rigS;
      var ry = hor + 8;
      var ink = sc.fog ? '#1d2a30' : (sc.sky[0] === '#245f86' ? '#102a3a' : '#050d13');
      // flare glow on water
      var fx = rx - 206 * rigS, fy = ry - 118 * rigS;
      if (sc.flare) {
        var rg = ctx.createRadialGradient(fx, ry + 20, 4, fx, ry + 20, 240 * rigS);
        rg.addColorStop(0, 'rgba(255,150,60,0.42)'); rg.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.save(); ctx.translate(0, 0); ctx.fillStyle = rg; ctx.fillRect(fx - 280 * rigS, hor, 560 * rigS, h - hor); ctx.restore();
      }
      // vessel and helicopter behind/beside
      if (sc.ship) drawShip(ctx, ((t * 9) % (w + 260)) - 130, hor + 14, Math.max(0.6, rigS * 0.7), ink, 'rgba(255,200,110,0.9)');
      drawRig(ctx, rx, ry, rigS, t, { ink: ink, flare: sc.flare, light: sc.stars > 0.4 || sc.sky[0] === '#0a1828' ? 'rgba(255,210,120,0.95)' : 'rgba(255,230,160,0.25)' });
      if (sc.flare) drawFlame(ctx, fx, fy, rigS * 1.1, t);
      if (sc.heli) {
        var hx = w + 80 - ((t * 22) % (w + 220));
        drawHeli(ctx, hx, hor * 0.42 + Math.sin(t * 0.7) * 6, Math.max(0.7, rigS * 0.8), t, ink);
      }
      // wave layers
      for (var i2 = 0; i2 < 5; i2++) {
        var kk = i2 / 4, y = hor + (h - hor) * (0.04 + 0.92 * kk * kk);
        var amp = 1 + kk * 8, len = 70 + kk * 170, sp = 0.5 + kk * 0.9;
        ctx.beginPath(); ctx.moveTo(0, h);
        for (var x = 0; x <= w + 8; x += 8) {
          ctx.lineTo(x, y + Math.sin(x / len + t * sp + i2 * 1.7) * amp + Math.sin(x / (len * 0.43) - t * sp * 1.3) * amp * 0.4);
        }
        ctx.lineTo(w, h); ctx.closePath();
        ctx.fillStyle = 'rgba(' + sc.wave + ',' + (0.12 + kk * 0.2).toFixed(3) + ')'; ctx.fill();
      }
      if (sc.fog) { var fgr = ctx.createLinearGradient(0, hor - 80, 0, hor + 60); fgr.addColorStop(0, 'rgba(190,205,208,0)'); fgr.addColorStop(0.5, 'rgba(190,205,208,0.35)'); fgr.addColorStop(1, 'rgba(190,205,208,0)'); ctx.fillStyle = fgr; ctx.fillRect(0, hor - 80, w, 140); }
    }

    function loop(ts) { frame(ts / 1000); raf = requestAnimationFrame(loop); }
    function start() { if (running || reduce) return; running = true; raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    resize(); frame(2.4);
    var io = null;
    if (!reduce && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? start() : stop(); }); });
      io.observe(el);
    } else if (!reduce) { start(); }
    var onResize = function () { resize(); frame(2.4); };
    window.addEventListener('resize', onResize);
    return function () { stop(); if (io) io.disconnect(); window.removeEventListener('resize', onResize); };
  }

