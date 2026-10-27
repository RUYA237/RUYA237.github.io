/* =========================================================
   Portfolio · Raúl Yagüe — main.js
   1. Nav (scroll, menú móvil, sección activa)
   2. Terminal animado del hero
   3. Aparición al hacer scroll + contadores
   4. Filtro de proyectos
   5. Copiar email
   6. Fondo de red (canvas)
   ========================================================= */
(() => {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- 1. Nav ---------- */
  const nav = $('#nav');
  const toggle = $('#navToggle');
  const menu = $('#navMenu');

  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const closeMenu = () => {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  $$('a', menu).forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  const links = $$('.nav__menu a[href^="#"]');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(l => l.classList.toggle('is-current', l.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => spy.observe(s));

  /* ---------- 2. Terminal ---------- */
  const term = $('#termBody');
  const script = [
    { cmd: 'whoami', out: [['raul · estudiante de 2º ASIR', '']] },
    { cmd: 'cat skills.txt', out: [
      ['sistemas   ', 'k'], ['Linux · Windows Server · Active Directory\n', ''],
      ['redes      ', 'k'], ['VLAN · OSPF · NAT · ACL\n', ''],
      ['seguridad  ', 'k'], ['Zero Trust · hardening · Nmap\n', ''],
      ['infra      ', 'k'], ['Docker · Nginx · VMs · homelab', '']
    ] },
    { cmd: 'systemctl status curiosidad', out: [
      ['● ', 'ok'], ['curiosidad.service - aprendizaje continuo\n', ''],
      ['     Active: ', 'd'], ['active (running)', 'ok'], [' desde siempre', 'd']
    ] },
    { cmd: 'echo $OBJETIVO', out: [['Primera oportunidad en sistemas / ciberseguridad 🚀', '']] }
  ];

  const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const span = (t, cls) => cls ? `<span class="${cls}">${esc(t)}</span>` : esc(t);
  const PS1 = '<span class="p">raul@homelab</span>:<span class="k">~</span>$ ';

  function renderStatic() {
    term.innerHTML = script.map(s => PS1 + esc(s.cmd) + '\n' + s.out.map(([t, c]) => span(t, c)).join('') + '\n').join('\n') +
      '\n' + PS1 + '<span class="caret"></span>';
  }

  async function typeTerminal() {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    let html = '';
    for (const step of script) {
      html += PS1;
      for (const ch of step.cmd) {
        html += esc(ch);
        term.innerHTML = html + '<span class="caret"></span>';
        await sleep(45 + Math.random() * 55);
      }
      await sleep(260);
      html += '\n' + step.out.map(([t, c]) => span(t, c)).join('') + '\n\n';
      term.innerHTML = html + '<span class="caret"></span>';
      await sleep(650);
    }
    term.innerHTML = html + PS1 + '<span class="caret"></span>';
  }

  if (term) reduceMotion ? renderStatic() : typeTerminal();

  /* ---------- 3. Reveal + contadores ---------- */
  const countUp = el => {
    const target = +el.dataset.count;
    if (reduceMotion) { el.textContent = target; return; }
    const t0 = performance.now(), dur = 1100;
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        $$('[data-count]', en.target).forEach(countUp);
        obs.unobserve(en.target);
      });
    }, { threshold: 0.12 });
    $$('.reveal').forEach((el, i) => {
      el.style.transitionDelay = `${(i % 3) * 70}ms`;
      io.observe(el);
    });
  } else {
    $$('.reveal').forEach(el => el.classList.add('is-in'));
    $$('[data-count]').forEach(el => (el.textContent = el.dataset.count));
  }

  /* ---------- 4. Filtro de proyectos ---------- */
  const filters = $$('.filter');
  const projects = $$('.project');
  filters.forEach(btn => btn.addEventListener('click', () => {
    filters.forEach(b => b.classList.toggle('is-active', b === btn));
    const f = btn.dataset.filter;
    projects.forEach(p => {
      const show = f === 'all' || p.dataset.cat.split(' ').includes(f);
      p.classList.toggle('is-hidden', !show);
      if (show) p.classList.add('is-in');
    });
  }));

  /* ---------- 5. Copiar email ---------- */
  const toast = $('#toast');
  const showToast = msg => {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove('is-on'), 2000);
  };
  const copyBtn = $('#copyMail');
  copyBtn?.addEventListener('click', async () => {
    const mail = copyBtn.dataset.mail;
    try {
      await navigator.clipboard.writeText(mail);
      showToast('✔ Email copiado');
    } catch {
      showToast(mail);
    }
  });

  $('#year').textContent = new Date().getFullYear();

  /* ---------- 6. Fondo: nodos de red ---------- */
  const canvas = $('#bg');
  const ctx = canvas.getContext('2d');
  let w, h, nodes = [], dpr = Math.min(window.devicePixelRatio || 1, 2);
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(70, (w * h) / 22000));
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const max = 140;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      if (!reduceMotion) {
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;
      }
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < max) {
          ctx.strokeStyle = `rgba(0,255,156,${(1 - d / max) * .14})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      ctx.fillStyle = dm < 160 ? 'rgba(0,255,156,.9)' : 'rgba(139,152,168,.45)';
      ctx.beginPath(); ctx.arc(a.x, a.y, dm < 160 ? 2.2 : 1.4, 0, Math.PI * 2); ctx.fill();
    }
    if (!reduceMotion) requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); if (reduceMotion) draw(); });
  window.addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  resize();
  draw();
})();
