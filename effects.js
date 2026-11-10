/* BillionNodes micro-interactions (desktop pointer only where noted) */
(function () {
  "use strict";
  var fine = matchMedia("(pointer: fine)").matches;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Ripple on buttons and tabs */
  document.querySelectorAll(".btn,.tab").forEach(function (b) {
    b.addEventListener("pointerdown", function (e) {
      var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2, d = document.createElement("span");
      d.className = "ripple";
      d.style.cssText = "width:" + s + "px;height:" + s + "px;left:" + (e.clientX - r.left - s / 2) + "px;top:" + (e.clientY - r.top - s / 2) + "px";
      b.appendChild(d);
      setTimeout(function () { d.remove(); }, 700);
    });
  });

  if (!fine || reduce) return;

  /* Glowing cursor dot + trailing ring */
  var dot = document.createElement("div"), ring = document.createElement("div");
  dot.className = "cur-dot"; ring.className = "cur-ring";
  dot.setAttribute("aria-hidden", "true"); ring.setAttribute("aria-hidden", "true");
  document.body.appendChild(ring); document.body.appendChild(dot);
  var x = -100, y = -100, rx = -100, ry = -100;
  addEventListener("pointermove", function (e) {
    x = e.clientX; y = e.clientY;
    dot.style.transform = "translate3d(" + x + "px," + y + "px,0)";
  }, { passive: true });
  (function follow() {
    rx += (x - rx) * .16; ry += (y - ry) * .16;
    ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
    requestAnimationFrame(follow);
  })();
  document.addEventListener("pointerover", function (e) {
    ring.classList.toggle("hot", !!(e.target.closest && e.target.closest("a,button,.card,.tab,input,textarea")));
  });
  document.addEventListener("pointerdown", function () { ring.classList.add("press"); });
  document.addEventListener("pointerup", function () { ring.classList.remove("press"); });

  /* 3D tilt on cards, fact tiles and industry tiles */
  document.querySelectorAll(".card,.fact,.ind").forEach(function (c) {
    c.addEventListener("pointerenter", function () { c.style.transitionDelay = "0ms"; });
    c.addEventListener("pointermove", function (e) {
      var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      c.style.transform = "perspective(900px) rotateX(" + ((.5 - py) * 10) + "deg) rotateY(" + ((px - .5) * 12) + "deg) translateY(-4px) scale(1.015)";
    });
    c.addEventListener("pointerleave", function () { c.style.transform = ""; });
  });

  /* Magnetic primary buttons */
  document.querySelectorAll(".btn.primary").forEach(function (b) {
    b.addEventListener("pointermove", function (e) {
      var r = b.getBoundingClientRect();
      b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * .18) + "px," + ((e.clientY - r.top - r.height / 2) * .25 - 2) + "px)";
    });
    b.addEventListener("pointerleave", function () { b.style.transform = ""; });
  });
})();
