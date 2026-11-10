/* BillionNodes 3D scene: one WebGL canvas for the whole page.
   - Hub: wireframe globe with branch nodes, data pulses, orbit rings + light trails
   - Background: glowing particle field + floating holographic shapes
   - Pointer parallax, scroll parallax, DPR cap, pauses when tab is hidden */
(function () {
  "use strict";
  var canvas = document.getElementById("gl");
  if (!canvas || !window.THREE) return;
  var T = THREE, ADD = T.AdditiveBlending, hubEl = document.getElementById("hub");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var small = innerWidth < 700, renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: !small, alpha: true, powerPreference: "high-performance" });
  } catch (e) { canvas.style.display = "none"; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));

  var scene = new T.Scene(), camera = new T.PerspectiveCamera(50, 1, .1, 100), W, H, VW, VH;
  camera.position.z = 10;
  function resize() {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    VH = 2 * 10 * Math.tan(25 * Math.PI / 180); VW = VH * camera.aspect;
  }
  resize();

  /* soft glow sprite texture */
  var gc = document.createElement("canvas"); gc.width = gc.height = 64;
  var g = gc.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "#fff"); gr.addColorStop(.3, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  var glow = new T.CanvasTexture(gc);
  var CY = new T.Color(0x2dd4ff), VI = new T.Color(0x8b5cf6), BL = new T.Color(0x4f7cff);

  function mkPoints(pos, col, size, op) {
    var geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.BufferAttribute(pos, 3));
    geo.setAttribute("color", new T.BufferAttribute(col, 3));
    return new T.Points(geo, new T.PointsMaterial({ size: size, map: glow, vertexColors: true, transparent: true, opacity: op, depthWrite: false, blending: ADD }));
  }
  function lineMat(c, o) { return new T.LineBasicMaterial({ color: c, transparent: true, opacity: o, blending: ADD, depthWrite: false }); }

  /* ---- background particle field ---- */
  var N = small ? 420 : 1000, bp = new Float32Array(N * 3), bc = new Float32Array(N * 3), i, q;
  for (i = 0; i < N; i++) {
    bp[i * 3] = (Math.random() - .5) * 34; bp[i * 3 + 1] = (Math.random() - .5) * 22; bp[i * 3 + 2] = -14 + Math.random() * 16;
    q = Math.random() < .55 ? CY : Math.random() < .5 ? VI : BL;
    bc[i * 3] = q.r; bc[i * 3 + 1] = q.g; bc[i * 3 + 2] = q.b;
  }
  var bg = mkPoints(bp, bc, .1, .8); scene.add(bg);

  /* ---- floating holographic shapes ---- */
  var geos = [new T.BoxGeometry(.5, .5, .5), new T.OctahedronGeometry(.4), new T.IcosahedronGeometry(.4, 0), new T.TetrahedronGeometry(.45)], fl = [];
  for (i = 0; i < (small ? 6 : 12); i++) {
    var m = new T.LineSegments(new T.EdgesGeometry(geos[i % 4]), lineMat(i % 2 ? 0x2dd4ff : 0x8b5cf6, .5));
    m.position.set((Math.random() - .5) * 20, (Math.random() - .5) * 12, -6 + Math.random() * 7);
    m.userData = { by: m.position.y, rx: (Math.random() - .5) * .01, ry: (Math.random() - .5) * .014, ph: Math.random() * 6 };
    scene.add(m); fl.push(m);
  }

  /* ---- hub: globe ---- */
  var hub = new T.Group(), spin = new T.Group(); hub.visible = false; hub.add(spin); scene.add(hub);
  spin.add(new T.Mesh(new T.SphereGeometry(.97, 40, 40), new T.MeshBasicMaterial({ color: 0x050a1c, transparent: true, opacity: .92 })));
  spin.add(new T.Mesh(new T.IcosahedronGeometry(1, 2), new T.MeshBasicMaterial({ color: 0x4f7cff, wireframe: true, transparent: true, opacity: .28, blending: ADD, depthWrite: false })));
  hub.add(new T.Mesh(new T.SphereGeometry(1.07, 32, 32), new T.MeshBasicMaterial({ color: 0x2dd4ff, transparent: true, opacity: .1, side: T.BackSide, blending: ADD, depthWrite: false })));
  var halo = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 0x4f7cff, transparent: true, opacity: .6, blending: ADD, depthWrite: false }));
  halo.scale.set(4.4, 4.4, 1); hub.add(halo);

  /* branch nodes on the sphere + links */
  var NN = small ? 46 : 72, np = [], k, y, r, ph;
  for (k = 0; k < NN; k++) {
    y = 1 - 2 * (k + .5) / NN; r = Math.sqrt(1 - y * y); ph = k * 2.39996;
    np.push(new T.Vector3(Math.cos(ph) * r * 1.01, y * 1.01, Math.sin(ph) * r * 1.01));
  }
  var npos = new Float32Array(NN * 3), ncol = new Float32Array(NN * 3), lp = [], a, b;
  np.forEach(function (v, j) { v.toArray(npos, j * 3); var c = j % 3 ? CY : VI; ncol.set([c.r, c.g, c.b], j * 3); });
  spin.add(mkPoints(npos, ncol, .17, 1));
  for (a = 0; a < NN; a++) for (b = a + 1; b < NN; b++) if (np[a].distanceTo(np[b]) < .62) lp.push(np[a], np[b]);
  spin.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(lp), lineMat(0x2dd4ff, .32)));

  /* data pulses travelling between nodes */
  var PN = 14, pp = new Float32Array(PN * 3), pc = new Float32Array(PN * 3), pulses = [], tmp = new T.Vector3();
  function rn() { return np[Math.floor(Math.random() * NN)]; }
  for (i = 0; i < PN; i++) { pulses.push({ a: rn(), b: rn(), t: Math.random(), s: .004 + Math.random() * .006 }); pc.set([.8, 1, 1], i * 3); }
  var pulseP = mkPoints(pp, pc, .22, 1); spin.add(pulseP);

  /* orbit rings with satellites + light trails */
  var TL = 44, rings = [];
  [[1.5, .5, 0, CY], [1.8, -.7, .4, VI], [2.1, .2, -.6, BL]].forEach(function (d, n) {
    var grp = new T.Group(); grp.rotation.set(d[1], 0, d[2]);
    grp.add(new T.Mesh(new T.TorusGeometry(d[0], .006, 6, 160), new T.MeshBasicMaterial({ color: d[3], transparent: true, opacity: .5, blending: ADD, depthWrite: false })));
    var sat = new T.Group();
    sat.add(new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(.2, .2, .2)), lineMat(d[3], 1)));
    var sg = new T.Sprite(new T.SpriteMaterial({ map: glow, color: d[3], transparent: true, blending: ADD, depthWrite: false })); sg.scale.set(.7, .7, 1); sat.add(sg);
    grp.add(sat);
    var tp = new Float32Array(TL * 3), tc = new Float32Array(TL * 3);
    for (var j = 0; j < TL; j++) { var f = 1 - j / (TL - 1); tc.set([d[3].r * f, d[3].g * f, d[3].b * f], j * 3); }
    var tg = new T.BufferGeometry();
    tg.setAttribute("position", new T.BufferAttribute(tp, 3)); tg.setAttribute("color", new T.BufferAttribute(tc, 3));
    grp.add(new T.Line(tg, new T.LineBasicMaterial({ vertexColors: true, transparent: true, blending: ADD, depthWrite: false })));
    hub.add(grp); rings.push({ grp: grp, sat: sat, tp: tp, tg: tg, R: d[0], sp: .55 + n * .22, off: n * 2.1 });
  });

  /* ---- pointer ---- */
  var mx = 0, my = 0, sx = 0, sy = 0, bump = 0;
  addEventListener("pointermove", function (e) { mx = e.clientX / W * 2 - 1; my = e.clientY / H * 2 - 1; }, { passive: true });
  addEventListener("pointerdown", function () { bump = 1; }, { passive: true });

  function place() {
    if (!hubEl) { hub.visible = false; return; }
    var rc = hubEl.getBoundingClientRect();
    hub.visible = rc.bottom > -60 && rc.top < H + 60;
    if (!hub.visible) return;
    hub.position.set(((rc.left + rc.width / 2) / W - .5) * VW, -((rc.top + rc.height / 2) / H - .5) * VH, 0);
    hub.scale.setScalar(rc.width / W * VW * .42 * (1 + bump * .08));
  }

  function update(dt, t) {
    sx += (mx - sx) * .06 * dt; sy += (my - sy) * .06 * dt; bump *= Math.pow(.92, dt);
    camera.position.set(sx * .6, -sy * .35, 10); camera.lookAt(0, 0, 0);
    bg.rotation.y = t * .03 + sx * .05; bg.position.y = scrollY * .0035;
    fl.forEach(function (m, n) {
      var u = m.userData; m.rotation.x += u.rx * dt; m.rotation.y += u.ry * dt;
      m.position.y = u.by + Math.sin(t * .6 + u.ph) * .25 + scrollY * (.002 + (m.position.z + 6) * .0006);
    });
    place();
    if (!hub.visible) return;
    hub.rotation.y = sx * .5; hub.rotation.x = sy * .35; spin.rotation.y = t * .25;
    pulses.forEach(function (p, n) {
      p.t += p.s * dt;
      if (p.t > 1) { p.t = 0; p.a = p.b; p.b = rn(); }
      tmp.lerpVectors(p.a, p.b, p.t).normalize().multiplyScalar(1.01 + Math.sin(p.t * Math.PI) * .2).toArray(pp, n * 3);
    });
    pulseP.geometry.attributes.position.needsUpdate = true;
    rings.forEach(function (rg, n) {
      var ang = t * rg.sp + rg.off, tp = rg.tp;
      rg.grp.rotation.y = t * .08 * (n + 1);
      tp.copyWithin(3, 0, (TL - 1) * 3);
      tp[0] = Math.cos(ang) * rg.R; tp[1] = Math.sin(ang) * rg.R; tp[2] = 0;
      rg.sat.position.set(tp[0], tp[1], 0); rg.sat.rotation.set(t, t * 1.3, 0);
      rg.tg.attributes.position.needsUpdate = true;
    });
  }

  var running = true, last = performance.now(), t = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!running) return;
    var dt = Math.min((now - last) / 16.67, 3); last = now; t += dt / 60;
    update(dt, t); renderer.render(scene, camera);
  }
  addEventListener("resize", function () { resize(); if (reduce) { update(0, 0); renderer.render(scene, camera); } });
  document.addEventListener("visibilitychange", function () { running = !document.hidden; last = performance.now(); });
  if (reduce) { update(0, 0); renderer.render(scene, camera); addEventListener("scroll", function () { update(0, 0); renderer.render(scene, camera); }, { passive: true }); }
  else requestAnimationFrame(frame);
  document.documentElement.classList.add("gl-on");
})();
