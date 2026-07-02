document.addEventListener("DOMContentLoaded", () => {

  // ─── Header scroll shadow ───────────────────────────────────────────────
  const header = document.getElementById("site-header");
  const onScroll = () => header && header.classList.toggle("nav-scrolled", window.scrollY > 16);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // ─── Mobile menu ────────────────────────────────────────────────────────
  const mobileMenu  = document.getElementById("mobile-menu");
  const menuOpenBtn = document.getElementById("mobile-menu-btn");
  const menuCloseBtn = document.getElementById("mobile-menu-close");

  function openMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove("open");
    document.body.style.overflow = "";
  }

  if (menuOpenBtn)  menuOpenBtn.addEventListener("click", openMenu);
  if (menuCloseBtn) menuCloseBtn.addEventListener("click", closeMenu);
  if (mobileMenu) {
    mobileMenu.querySelectorAll("a").forEach(a => a.addEventListener("click", closeMenu));
    // Close if overlay (not panel) is clicked
    mobileMenu.addEventListener("click", (e) => {
      if (e.target === mobileMenu) closeMenu();
    });
  }

  // ─── Section scroll reveal ──────────────────────────────────────────────
  const srObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("revealed");
        srObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll("section").forEach(s => srObs.observe(s));

  // ─── Feature card stagger ────────────────────────────────────────────────
  const fcObs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add("visible"), i * 80);
        fcObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".feature-card").forEach(c => fcObs.observe(c));

  // ─── Animated counters ───────────────────────────────────────────────────
  const cObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.target;
      const dur = 1800;
      let start = null;

      function step(ts) {
        if (!start) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        el.textContent = Math.floor(p * target).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
      cObs.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll(".stats-counter").forEach(c => cObs.observe(c));

  // ─── Active nav highlight on scroll ─────────────────────────────────────
  const navLinks = document.querySelectorAll(".nav-link");
  const sections = document.querySelectorAll("section[id]");

  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    navLinks.forEach(link => {
      const href = link.getAttribute("href");
      const isActive = href === "#" + current;
      link.classList.toggle("active", isActive);
    });
  }, { passive: true });

});
