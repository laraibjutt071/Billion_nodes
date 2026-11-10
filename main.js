/* BillionNodes - core behaviour (nav, reveals, counters, ERP tabs, live feed, form) */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var $ = function (s) { return document.querySelector(s); };

  /* Header scroll state */
  var header = $("#top");
  function onScroll() { header.classList.toggle("scrolled", window.scrollY > 20); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* Mobile menu */
  var burger = $("#burger"), menu = $("#menu");
  function setMenu(o) { menu.classList.toggle("open", o); burger.setAttribute("aria-expanded", String(o)); }
  burger.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });
  menu.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  /* Count-up numbers */
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10), fmt = el.hasAttribute("data-fmt"), t0 = null;
    function show(v) { el.textContent = fmt ? v.toLocaleString("en-US") : v; }
    if (reduce) { show(target); return; }
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / 1600, 1);
      show(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var reveals = document.querySelectorAll(".reveal"), counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    reveals.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(el); });
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); co.unobserve(en.target); } });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { co.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
    counters.forEach(function (el) { el.textContent = el.getAttribute("data-count"); });
  }

  /* Active nav link */
  var links = document.querySelectorAll(".menu a");
  var secs = Array.prototype.map.call(links, function (a) { return document.querySelector(a.getAttribute("href")); });
  window.addEventListener("scroll", function () {
    var y = window.scrollY + 160, cur = 0;
    secs.forEach(function (s, i) { if (s && s.offsetTop <= y) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle("active", i === cur); });
  }, { passive: true });

  /* Dashboard: start chart + bars when scrolled into view, then keep bars gently moving */
  var stg = $("#stage"), bars = document.querySelectorAll(".br i");
  function goLive() {
    stg.classList.add("live");
    bars.forEach(function (b) { b.style.width = b.getAttribute("data-w") + "%"; });
    if (!reduce) setInterval(function () {
      if (document.hidden) return;
      bars.forEach(function (b) { b.style.width = Math.max(20, Math.min(97, +b.getAttribute("data-w") + (Math.random() * 12 - 6))) + "%"; });
    }, 3200);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en, o) { if (en[0].isIntersecting) { goLive(); o.disconnect(); } }, { threshold: .25 }).observe(stg);
  } else goLive();

  /* Dashboard: live transaction feed (sample data) */
  var feed = $("#feed"), branches = ["Lahore", "Karachi", "Faisalabad"];
  function addRow() {
    var li = document.createElement("li");
    var amt = (Math.floor(Math.random() * 380) + 12) * 50;
    var inv = 10000 + Math.floor(Math.random() * 89999);
    li.innerHTML = "<span>#" + inv + " " + branches[Math.floor(Math.random() * 3)] + "</span><b>Rs " + amt.toLocaleString("en-US") + "</b>";
    feed.insertBefore(li, feed.firstChild);
    while (feed.children.length > 6) feed.removeChild(feed.lastChild);
  }
  for (var k = 0; k < 6; k++) addRow();
  if (!reduce) setInterval(function () { if (!document.hidden) addRow(); }, 2200);

  /* Dashboard: 3D tilt (desktop only) */
  var stage = $("#stage"), dash = $("#dash");
  if (fine && !reduce) {
    stage.addEventListener("mousemove", function (e) {
      var r = stage.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      dash.style.transform = "rotateY(" + (x * 8) + "deg) rotateX(" + (-y * 8) + "deg)";
    });
    stage.addEventListener("mouseleave", function () { dash.style.transform = ""; });
  }

  /* Cursor glow + card spotlight (desktop only) */
  if (fine) {
    var glow = $("#glow");
    window.addEventListener("mousemove", function (e) {
      glow.style.opacity = 1;
      glow.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)";
    }, { passive: true });
    document.addEventListener("mouseleave", function () { glow.style.opacity = 0; });
    document.querySelectorAll(".card").forEach(function (c) {
      c.addEventListener("mousemove", function (e) {
        var r = c.getBoundingClientRect();
        c.style.setProperty("--mx", (e.clientX - r.left) + "px");
        c.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* ERP module tabs */
  var mods = [
    { n: "POS", t: "POS cash handling", d: "Fast billing and cash control at every counter.", l: ["Quick invoicing and returns", "Shift and cash drawer tracking", "Works across all branches"] },
    { n: "Inventory", t: "Inventory control", d: "Know what is in stock, in every branch, at all times.", l: ["Stock levels per branch", "Transfers between branches", "Low-stock alerts"] },
    { n: "Accounts", t: "Accounts management", d: "Full accounts from daily sales to financial reports.", l: ["Ledgers and vouchers", "Receivables and payables", "Branch-wise reporting"] },
    { n: "HRIS", t: "Human resources", d: "Manage your team without spreadsheets.", l: ["Staff records", "Attendance tracking", "Payroll support"] },
    { n: "CRM", t: "Customer management", d: "Keep every customer relationship in one place.", l: ["Customer profiles", "Purchase history", "Follow-up reminders"] },
    { n: "Compliance", t: "Compliance", d: "Stay aligned with the rules your business runs under.", l: ["Tax-ready records", "Audit-friendly logs", "Role-based access"] }
  ];
  var tabs = $("#tabs"), panel = $("#panel");
  function pick(i) {
    var m = mods[i];
    Array.prototype.forEach.call(tabs.children, function (b, j) { b.setAttribute("aria-selected", String(j === i)); b.tabIndex = j === i ? 0 : -1; });
    panel.className = "panel";
    void panel.offsetWidth;
    panel.className = "panel swap";
    panel.innerHTML = "<h3>" + m.t + "</h3><p>" + m.d + "</p><ul>" + m.l.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>";
  }
  mods.forEach(function (m, i) {
    var b = document.createElement("button");
    b.className = "tab"; b.type = "button"; b.textContent = m.n; b.setAttribute("role", "tab");
    b.addEventListener("click", function () { pick(i); });
    b.addEventListener("keydown", function (e) {
      var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { var n = (i + d + mods.length) % mods.length; pick(n); tabs.children[n].focus(); }
    });
    tabs.appendChild(b);
  });
  pick(0);

  /* Contact form (simulated; nothing is sent) */
  var form = $("#form"), ok = $("#ok"), emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  function check(input, id, valid, msg) {
    document.getElementById(id).textContent = valid ? "" : msg;
    input.classList.toggle("invalid", !valid);
    input.setAttribute("aria-invalid", String(!valid));
    return valid;
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault(); ok.classList.remove("show");
    var n = form.elements.name, em = form.elements.email, m = form.elements.message;
    var a = check(n, "en", n.value.trim().length >= 2, "Enter your name.");
    var b = check(em, "ee", emailRe.test(em.value.trim()), "Enter a valid email, like name@company.com.");
    var c = check(m, "em", m.value.trim().length >= 10, "Write at least 10 characters.");
    if (a && b && c) { form.reset(); void ok.offsetWidth; ok.classList.add("show"); }
  });
})();
