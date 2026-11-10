/* =====================================================================
   HERRERÍA DANY · script.js (JavaScript puro, sin librerías)
   Principios:
   - Todo el contenido es visible por defecto. La clase .anim (solo si no hay
     "reduce motion") activa los estados ocultos y este script los revela.
   - Cada módulo va en safe(): si uno falla, los demás siguen funcionando.
   - Los revelados tienen respaldo por geometría (scroll, resize y a los 2 s).
   ===================================================================== */
(() => {
  'use strict';

  /* Número de WhatsApp: ÚNICO lugar donde vive (formato internacional, sin "+").
     Si se deja vacío, los botones de WhatsApp y el envío del formulario se ocultan. */
  const WHATSAPP = '529932601506';

  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const safe = (fn) => { try { fn(); } catch (err) { /* un módulo falla, el resto sigue */ } };

  if (!reduce) root.classList.add('anim');
  const animOn = root.classList.contains('anim');

  const waUrl = (msg) => 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);

  /* ---------------------------------------------------------------
     1. WhatsApp: todos los enlaces [data-wa] salen de la constante
     --------------------------------------------------------------- */
  function initWhatsApp() {
    const links = $$('[data-wa]');
    if (!WHATSAPP) {
      links.forEach((a) => {
        if (a.id === 'waFloat') a.hidden = true;
        else a.setAttribute('href', '#contacto');
      });
      const btn = $('#formBtn');
      if (btn) btn.hidden = true;
      const note = $('.form__note');
      if (note) note.textContent = 'Escríbenos por teléfono para recibir tu cotización.';
      return;
    }
    links.forEach((a) => {
      a.href = waUrl(a.dataset.wa);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
  }

  /* ---------------------------------------------------------------
     2. Cargador: la cortina se enrolla (la línea de tiempo es CSS;
        aquí solo el contador y la limpieza)
     --------------------------------------------------------------- */
  function initLoader() {
    const loader = $('#loader');
    if (!loader) return;
    const pct = $('#loaderPct');
    const t0 = performance.now();
    const DUR = 1350;
    function tick(now) {
      const p = clamp((now - t0) / DUR);
      const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      if (pct) pct.textContent = Math.round(e * 100) + '%';
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    setTimeout(() => { loader.remove(); root.classList.add('is-ready'); }, 2450);
  }

  /* ---------------------------------------------------------------
     3. Navegación, menú móvil y barra de progreso
     --------------------------------------------------------------- */
  const nav = $('#nav');
  const progressBar = $('#progressBar');
  const navLinks = $$('.nav__links a');
  const secIds = ['inicio', 'por-que', 'manifiesto', 'cortina', 'servicios', 'obra', 'proyectos', 'proceso', 'zona', 'contacto'];

  function initNav() {
    const burger = $('#burger');
    const menu = $('#menu');
    if (!burger || !menu) return;
    const setMenu = (open) => {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      menu.classList.toggle('is-open', open);
      menu.setAttribute('aria-hidden', String(!open));
      root.classList.toggle('no-scroll', open);
    };
    burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
    $$('.menu__links a', menu).forEach((a, i) => {
      a.style.setProperty('--i', i);
      a.addEventListener('click', () => setMenu(false));
    });
    $$('.menu__foot a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) setMenu(false); });
    window.addEventListener('resize', () => { if (window.innerWidth >= 900) setMenu(false); });
  }

  function updateNav() {
    if (nav) nav.classList.toggle('is-solid', window.scrollY > 24);
    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.transform = 'scaleX(' + (max > 0 ? clamp(window.scrollY / max) : 0).toFixed(4) + ')';
    }
    let current = '';
    secIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) current = id;
    });
    navLinks.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === '#' + current));
  }

  /* ---------------------------------------------------------------
     4. Revelado al hacer scroll (IntersectionObserver + respaldo por geometría)
     --------------------------------------------------------------- */
  let revealCheck = () => {};
  function initReveal() {
    if (!animOn) return;
    $$('[data-stagger]').forEach((g) => {
      $$(':scope > [data-reveal]', g).forEach((el, i) => el.style.setProperty('--d', String(i * 90)));
    });
    $$('[data-reveal="lines"]').forEach((h) => {
      $$('.l', h).forEach((l, i) => { if (l.firstElementChild) l.firstElementChild.style.setProperty('--i', String(i)); });
    });

    const items = $$('[data-reveal]');
    const show = (el) => el.classList.add('is-in');

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      items.forEach((el) => io.observe(el));
    }

    // Respaldo: lo que ya esté dentro de la ventana se revela sí o sí.
    revealCheck = () => {
      items.forEach((el) => {
        if (el.classList.contains('is-in')) return;
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.94 && r.bottom > 0) show(el);
      });
    };
    revealCheck();
    setTimeout(revealCheck, 2000);
    setTimeout(revealCheck, 4500);
    window.addEventListener('load', revealCheck);
  }

  /* ---------------------------------------------------------------
     5. Motor de escenas ligadas al scroll (con suavizado "slow motion")
     --------------------------------------------------------------- */
  const scenes = [];
  let ticking = false;
  let looping = false;

  function measure(s) {
    const r = s.el.getBoundingClientRect();
    const vh = window.innerHeight;
    if (s.measure) { s.tgt = s.measure(r, vh); return; }
    if (s.mode === 'pin') {
      const total = r.height - vh;
      s.tgt = total > 0 ? clamp(-r.top / total) : 0;
    } else {
      if (r.bottom < -300 || r.top > vh + 300) return; // lejos de la pantalla: no gastar
      s.tgt = clamp((vh - r.top) / (vh + r.height));
    }
  }

  function loop() {
    let moving = false;
    scenes.forEach((s) => {
      const d = s.tgt - s.cur;
      if (Math.abs(d) > 0.0005) { s.cur += d * (s.ease || 0.12); moving = true; } else { s.cur = s.tgt; }
      s.apply(s.cur);
    });
    if (moving) requestAnimationFrame(loop); else looping = false;
  }
  function kick() { if (!looping) { looping = true; requestAnimationFrame(loop); } }

  function frame() {
    scenes.forEach(measure);
    kick();
    updateNav();
    safe(updateProceso);
    revealCheck();
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; frame(); });
  }
  function snapScenes() { scenes.forEach((s) => { measure(s); s.cur = s.tgt; s.apply(s.cur); }); }

  /* ---- Escena: la cortina que se abre ---- */
  function sceneShutter() {
    const el = $('#cortina');
    if (!el) return;
    const copyB = $('.shutter__copy--b', el);
    scenes.push({
      el, mode: 'pin', ease: 0.1, cur: 0, tgt: 0,
      apply(p) {
        const open = sstep(0.2, 0.64, p);
        const a = 1 - sstep(0.3, 0.45, p);
        const b = sstep(0.6, 0.76, p);
        el.style.setProperty('--open', open.toFixed(4));
        el.style.setProperty('--a', a.toFixed(3));
        el.style.setProperty('--b', b.toFixed(3));
        el.style.setProperty('--zoom', (1.14 - 0.14 * p).toFixed(4));
        if (copyB) copyB.classList.toggle('is-live', b > 0.55);
      }
    });
  }

  /* ---- Escena: la imagen se abre en grande ---- */
  function sceneExpand() {
    const el = $('#obra');
    if (!el) return;
    const imgs = $$('#expandMedia img');
    const chips = $$('[data-chip]', el);
    const ui = $('.expand__ui', el);
    let stage = -1;
    scenes.push({
      el, mode: 'pin', ease: 0.1, cur: 0, tgt: 0,
      apply(p) {
        const e = sstep(0, 0.5, p);
        el.style.setProperty('--e', e.toFixed(4));
        el.style.setProperty('--h', (1 - sstep(0.04, 0.26, p)).toFixed(3));
        const o = sstep(0.5, 0.66, p);
        el.style.setProperty('--o', o.toFixed(3));
        if (ui) ui.classList.toggle('is-live', o > 0.6);
        const s = p < 0.66 ? 0 : p < 0.83 ? 1 : 2;
        if (s !== stage) {
          stage = s;
          imgs.forEach((im) => im.classList.toggle('on', Number(im.dataset.stage) === s));
          chips.forEach((c) => c.classList.toggle('on', Number(c.dataset.chip) <= s));
        }
      }
    });
  }

  /* ---- Escena: galería horizontal fijada (solo escritorio) ---- */
  let layoutGallery = () => {};
  function sceneGallery() {
    const gal = $('#proyectos');
    const track = $('#galTrack');
    const bar = $('#galBar');
    if (!gal || !track) return;
    let pinned = false;
    let maxX = 0;
    layoutGallery = () => {
      const should = animOn && window.innerWidth >= 900;
      if (should !== pinned) {
        pinned = should;
        gal.classList.toggle('is-pinned', pinned);
        if (!pinned) { gal.style.height = ''; track.style.transform = ''; if (bar) bar.style.transform = ''; }
        else { const vp = $('#galVp'); if (vp) vp.scrollLeft = 0; }
      }
      if (pinned) {
        maxX = Math.max(0, track.scrollWidth - window.innerWidth);
        gal.style.height = Math.round(maxX * 0.85 + window.innerHeight) + 'px';
      }
    };
    scenes.push({
      el: gal, mode: 'pin', ease: 0.14, cur: 0, tgt: 0,
      apply(p) {
        if (!pinned) return;
        track.style.transform = 'translate3d(' + (-p * maxX).toFixed(1) + 'px,0,0)';
        if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      }
    });
  }

  /* ---- Parallax suave de las fotos de las tarjetas ---- */
  function sceneParallax() {
    $$('[data-parallax]').forEach((img) => {
      const host = img.closest('.card') || img.parentElement;
      const amt = Number(img.dataset.parallax) || 20;
      scenes.push({
        el: host, mode: 'pass', ease: 0.1, cur: 0.5, tgt: 0.5,
        apply(p) { img.style.transform = 'translate3d(0,' + ((p - 0.5) * amt).toFixed(1) + 'px,0) scale(1.12)'; }
      });
    });
  }

  /* ---- Hero: el contenido se desvanece al bajar ---- */
  function sceneHero() {
    const hero = $('#inicio');
    if (!hero) return;
    scenes.push({
      el: hero, ease: 1, cur: 0, tgt: 0,
      measure: (r) => clamp(-r.top / (r.height * 0.85)),
      apply(p) { hero.style.setProperty('--hp', p.toFixed(4)); }
    });
  }

  /* ---- Manifiesto: las palabras se encienden ---- */
  function sceneWords() {
    const el = $('#manifiestoTxt');
    if (!el) return;
    const words = [];
    (function wrap(node) {
      Array.from(node.childNodes).forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement('span');
            s.className = 'w';
            s.textContent = part;
            words.push(s);
            frag.appendChild(s);
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === 1) {
          wrap(ch);
        }
      });
    })(el);
    let last = -1;
    scenes.push({
      el, ease: 0.16, cur: 0, tgt: 0,
      measure: (r, vh) => clamp((vh * 0.86 - r.top) / (r.height + vh * 0.3)),
      apply(p) {
        const n = Math.round(p * words.length * 1.04);
        if (n === last) return;
        last = n;
        words.forEach((w, i) => w.classList.toggle('on', i < n));
      }
    });
  }

  /* ---- Proceso: paso activo y foto asociada ---- */
  const steps = $$('.step');
  const stepImgs = $$('.proceso__frame img');
  const stepTag = $('#stepTag');
  let lastStep = -2;
  function updateProceso() {
    if (!steps.length) return;
    const mid = window.innerHeight * 0.5;
    let active = -1;
    steps.forEach((s, i) => { if (s.getBoundingClientRect().top < mid) active = i; });
    if (active === lastStep) return;
    lastStep = active;
    steps.forEach((s, i) => {
      s.classList.toggle('is-active', i === active);
      s.classList.toggle('is-done', i < active);
    });
    const show = Math.max(0, active);
    stepImgs.forEach((im) => im.classList.toggle('on', Number(im.dataset.i) === show));
    if (stepTag) stepTag.textContent = 'Paso 0' + (show + 1);
  }

  function initScenes() {
    if (animOn) {
      safe(sceneShutter);
      safe(sceneExpand);
      safe(sceneGallery);
      safe(sceneParallax);
      safe(sceneHero);
      safe(sceneWords);
    }
    safe(layoutGallery);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { safe(layoutGallery); frame(); });
    window.addEventListener('load', () => { safe(layoutGallery); snapScenes(); frame(); });
    safe(snapScenes);
    frame();
  }

  /* ---------------------------------------------------------------
     6. Chispas de soldadura en el hero (canvas, siempre en movimiento)
     --------------------------------------------------------------- */
  function initSparks() {
    const cv = $('#sparks');
    const hero = $('#inicio');
    if (!cv || !hero || reduce) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0, dpr = 1, raf = 0, last = 0, visible = true, burstAt = 1200;
    const parts = [];
    const MAX = window.innerWidth < 700 ? 90 : 170;
    const rand = (a, b) => a + Math.random() * (b - a);

    function resize() {
      const r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = r.width; h = r.height;
      cv.width = Math.max(1, Math.round(w * dpr));
      cv.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spark(x, y, power) {
      if (parts.length >= MAX) return;
      const ang = rand(-Math.PI * 0.96, -Math.PI * 0.52) + (x > w * 0.5 ? -0.25 : 0.25) * -1;
      const sp = rand(2.2, 7.5) * (power || 1);
      parts.push({ t: 's', x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, g: 0.085, drag: 0.992, life: 0, max: rand(55, 130), size: rand(0.8, 2.1) });
    }
    function ember() {
      if (parts.length >= MAX) return;
      parts.push({ t: 'e', x: rand(0, w), y: h + 10, vx: rand(-0.15, 0.15), vy: rand(-0.35, -1.05), ph: rand(0, 6.28), life: 0, max: rand(260, 520), size: rand(0.7, 2.2) });
    }

    function step(now) {
      raf = 0;
      if (!visible || document.hidden) return;
      const dt = Math.min(2.6, (now - (last || now)) / 16.67);
      last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      // emisores tipo esmeril: esquinas inferiores
      if (Math.random() < 0.55 * dt) spark(w * rand(0.04, 0.2), h * rand(0.86, 0.97), 1);
      if (Math.random() < 0.4 * dt) spark(w * rand(0.8, 0.97), h * rand(0.9, 0.99), 0.9);
      if (Math.random() < 0.22 * dt) ember();
      burstAt -= 16.67 * dt;
      if (burstAt <= 0) {
        burstAt = rand(2600, 4200);
        const bx = Math.random() < 0.5 ? w * 0.1 : w * 0.9;
        for (let i = 0; i < 22; i++) spark(bx, h * 0.94, 1.25);
      }

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life += dt;
        const k = 1 - p.life / p.max;
        if (k <= 0 || p.y < -20 || p.x < -40 || p.x > w + 40) { parts.splice(i, 1); continue; }
        if (p.t === 's') {
          const px = p.x, py = p.y;
          p.vy += p.g * dt; p.vx *= p.drag; p.vy *= p.drag;
          p.x += p.vx * dt; p.y += p.vy * dt;
          const a = Math.min(1, k * 1.6);
          ctx.strokeStyle = 'rgba(255,' + Math.round(150 + 90 * k) + ',' + Math.round(40 + 70 * k * k) + ',' + a.toFixed(3) + ')';
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(px - p.vx * 1.6, py - p.vy * 1.6);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          if (p.size > 1.5 && k > 0.5) {
            ctx.fillStyle = 'rgba(255,235,190,' + (a * 0.9).toFixed(3) + ')';
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.7, 0, 6.283); ctx.fill();
          }
        } else {
          p.ph += 0.03 * dt;
          p.x += (p.vx + Math.sin(p.ph) * 0.35) * dt;
          p.y += p.vy * dt;
          const a = Math.sin(Math.min(1, p.life / p.max) * Math.PI) * 0.75;
          ctx.fillStyle = 'rgba(255,196,96,' + a.toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 6.283); ctx.fill();
        }
      }
      raf = requestAnimationFrame(step);
    }
    function start() { if (!raf && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(step); } }

    resize();
    window.addEventListener('resize', () => { resize(); });
    document.addEventListener('visibilitychange', start);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) start(); }, { threshold: 0 }).observe(hero);
    }
    // el cursor también genera chispas
    let lastMove = 0;
    hero.addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (now - lastMove < 45) return;
      lastMove = now;
      const r = cv.getBoundingClientRect();
      for (let i = 0; i < 2; i++) spark(e.clientX - r.left, e.clientY - r.top, 0.55);
    }, { passive: true });
    start();
  }

  /* ---------------------------------------------------------------
     7. Inclinación 3D del escenario del hero
     --------------------------------------------------------------- */
  function initTilt() {
    const hero = $('#inicio');
    const cards = $('#stageCards');
    if (!hero || !cards || reduce) return;
    if (fine) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        cards.style.setProperty('--ry', (x * 14).toFixed(2) + 'deg');
        cards.style.setProperty('--rx', (-y * 10).toFixed(2) + 'deg');
      }, { passive: true });
      hero.addEventListener('pointerleave', () => {
        cards.style.setProperty('--ry', '0deg');
        cards.style.setProperty('--rx', '0deg');
      });
    } else {
      // en pantallas táctiles: balanceo lento automático
      let visible = true;
      if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(hero);
      const sway = (now) => {
        if (visible) {
          const t = now / 1000;
          cards.style.setProperty('--ry', (Math.sin(t * 0.7) * 7).toFixed(2) + 'deg');
          cards.style.setProperty('--rx', (Math.cos(t * 0.5) * 4).toFixed(2) + 'deg');
        }
        requestAnimationFrame(sway);
      };
      requestAnimationFrame(sway);
    }
  }

  /* ---------------------------------------------------------------
     8. Tarjetas con foco de luz y botones magnéticos
     --------------------------------------------------------------- */
  function initCards() {
    if (!fine) return;
    $$('.card').forEach((c) => {
      c.addEventListener('pointermove', (e) => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
      }, { passive: true });
    });
  }
  function initMagnetic() {
    if (!fine || reduce) return;
    $$('[data-magnetic]').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * 0.22;
        const y = (e.clientY - (r.top + r.height / 2)) * 0.3;
        b.style.setProperty('--mx', x.toFixed(1) + 'px');
        b.style.setProperty('--my', y.toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', () => {
        b.style.setProperty('--mx', '0px');
        b.style.setProperty('--my', '0px');
      });
    });
  }

  /* ---------------------------------------------------------------
     9. Visor de imágenes (lightbox)
     --------------------------------------------------------------- */
  function initLightbox() {
    const lb = $('#lightbox');
    const img = $('#lbImg');
    const cap = $('#lbCap');
    const items = $$('.gcard');
    if (!lb || !img || !items.length) return;
    let idx = 0;
    let lastFocus = null;

    function show(i) {
      idx = (i + items.length) % items.length;
      const b = items[idx];
      const thumb = $('img', b);
      img.src = b.dataset.full;
      img.alt = thumb ? thumb.alt : '';
      if (cap) cap.textContent = b.dataset.cap || '';
      img.style.animation = 'none';
      void img.offsetWidth;
      img.style.animation = '';
    }
    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      lb.hidden = false;
      root.classList.add('no-scroll');
      const c = $('.lb__close', lb);
      if (c) c.focus();
    }
    function close() {
      lb.hidden = true;
      root.classList.remove('no-scroll');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    items.forEach((b, i) => b.addEventListener('click', () => open(i)));
    lb.addEventListener('click', (e) => {
      const a = e.target.closest('[data-lb]');
      if (a) {
        const t = a.dataset.lb;
        if (t === 'close') close(); else if (t === 'prev') show(idx - 1); else show(idx + 1);
        return;
      }
      if (e.target === lb) close();
    });
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'Tab') {
        const f = $$('button', lb);
        const first = f[0], lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
      }
    });
    let sx = null;
    lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', (e) => {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      sx = null;
    }, { passive: true });
  }

  /* ---------------------------------------------------------------
     10. Formulario: arma el mensaje y abre WhatsApp
     --------------------------------------------------------------- */
  function initForm() {
    const f = $('#form');
    if (!f) return;
    const setErr = (el, msg) => {
      const field = el.closest('.field');
      if (!field) return;
      field.classList.toggle('has-err', Boolean(msg));
      const out = $('.field__err', field);
      if (out) out.textContent = msg || '';
    };
    ['nombre', 'servicio'].forEach((n) => {
      const el = f.elements[n];
      if (el) el.addEventListener('input', () => setErr(el, ''));
      if (el) el.addEventListener('change', () => setErr(el, ''));
    });
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!WHATSAPP) return;
      const nombre = f.elements.nombre.value.trim();
      const servicio = f.elements.servicio.value;
      const zona = f.elements.zona.value.trim();
      const mensaje = f.elements.mensaje.value.trim();
      setErr(f.elements.nombre, nombre ? '' : 'Dinos tu nombre para saludarte.');
      setErr(f.elements.servicio, servicio ? '' : 'Elige qué necesitas.');
      if (!nombre) { f.elements.nombre.focus(); return; }
      if (!servicio) { f.elements.servicio.focus(); return; }
      const lines = ['Hola, soy ' + nombre + '. Quiero cotizar: ' + servicio + '.'];
      if (zona) lines.push('Zona: ' + zona);
      if (mensaje) lines.push('Detalles: ' + mensaje);
      lines.push('(Mensaje enviado desde la página web)');
      const url = waUrl(lines.join('\n'));
      const w = window.open(url, '_blank', 'noopener');
      if (!w) window.location.href = url;
    });
  }

  /* ---------------------------------------------------------------
     Arranque
     --------------------------------------------------------------- */
  safe(initWhatsApp);
  safe(initLoader);
  safe(initNav);
  safe(initReveal);
  safe(initScenes);
  safe(initSparks);
  safe(initTilt);
  safe(initCards);
  safe(initMagnetic);
  safe(initLightbox);
  safe(initForm);
})();
