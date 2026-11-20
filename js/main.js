/* MT Catering · funciones compartidas por todas las páginas */
(function () {
  'use strict';

  var cfg = window.MT_CONFIG || {};
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Enlaces y datos de contacto desde config.js ---------- */
  function waLink(texto) {
    var num = String(cfg.whatsapp || '').replace(/\D/g, '');
    return 'https://wa.me/' + num + (texto ? '?text=' + encodeURIComponent(texto) : '');
  }
  window.MT_waLink = waLink;

  document.querySelectorAll('[data-mt]').forEach(function (el) {
    var key = el.getAttribute('data-mt');
    if (cfg[key]) el.textContent = cfg[key];
  });
  document.querySelectorAll('[data-mt-wa]').forEach(function (el) {
    el.setAttribute('href', waLink('Hola MT Catering, quiero información sobre sus servicios.'));
  });
  document.querySelectorAll('[data-mt-mail]').forEach(function (el) {
    if (cfg.correo) el.setAttribute('href', 'mailto:' + cfg.correo);
  });
  var anySocial = false;
  document.querySelectorAll('[data-mt-social]').forEach(function (li) {
    var url = cfg[li.getAttribute('data-mt-social')];
    if (url) {
      li.querySelector('a').setAttribute('href', url);
      anySocial = true;
    } else {
      li.remove();
    }
  });
  var socialWrap = document.querySelector('[data-mt-social-wrap]');
  if (socialWrap && !anySocial) socialWrap.remove();

  var anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();

  /* ---------- Menú del celular ---------- */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu-movil');
  if (burger && menu) {
    var setMenu = function (open) {
      menu.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', function () { setMenu(!menu.classList.contains('is-open')); });
    menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  }

  /* ---------- Palabra que cambia en la portada ---------- */
  var palabra = document.getElementById('palabra');
  if (palabra && !reduceMotion) {
    var palabras = ['reunión.', 'jornada.', 'equipo.', 'evento.'];
    var i = 0;
    setInterval(function () {
      i = (i + 1) % palabras.length;
      palabra.classList.remove('word-swap');
      void palabra.offsetWidth;
      palabra.textContent = palabras[i];
      palabra.classList.add('word-swap');
    }, 2800);
  }

  /* ---------- Galería: filtros y vista a pantalla completa ---------- */
  var lightbox = null;
  if (window.GLightbox && document.querySelector('.glightbox')) {
    lightbox = window.GLightbox({ selector: '.glightbox', loop: true });
  }
  var filtros = document.querySelectorAll('.filter');
  filtros.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-filter');
      filtros.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
      document.querySelectorAll('.gallery-item').forEach(function (item) {
        var show = f === 'todos' || item.getAttribute('data-cat') === f;
        item.classList.toggle('is-hidden', !show);
        item.setAttribute('data-gallery', show ? 'mt' : 'oculto');
        if (show && window.gsap && !reduceMotion) {
          window.gsap.fromTo(item, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .7, ease: 'expo.out' });
        }
      });
      if (lightbox) lightbox.reload();
    });
  });

  /* ---------- Animaciones (GSAP) ---------- */
  if (!window.gsap || reduceMotion) return;
  var gsap = window.gsap;
  if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

  var heroBg = document.querySelector('.hero-bg');
  if (heroBg) gsap.fromTo(heroBg, { scale: 1.15 }, { scale: 1, duration: 14, ease: 'power2.out' });

  var lines = document.querySelectorAll('[data-anim="line"]');
  if (lines.length) gsap.from(lines, { y: 48, opacity: 0, duration: 1.3, ease: 'expo.out', stagger: .15, delay: .15 });
  var fades = document.querySelectorAll('[data-anim="fade"]');
  if (fades.length) gsap.from(fades, { y: 24, opacity: 0, duration: 1.2, ease: 'expo.out', delay: .7 });

  if (!window.ScrollTrigger) return;

  gsap.utils.toArray('[data-anim="up"]').forEach(function (el) {
    gsap.from(el, {
      y: 40, opacity: 0, duration: 1.1, ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });

  var cards = document.querySelectorAll('[data-anim="card"]');
  if (cards.length) {
    gsap.from(cards, {
      y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: .12,
      scrollTrigger: { trigger: cards[0].parentNode, start: 'top 85%', once: true }
    });
  }

  var bandBg = document.querySelector('.band-bg');
  if (bandBg) {
    gsap.fromTo(bandBg, { yPercent: -8 }, {
      yPercent: 8, ease: 'none',
      scrollTrigger: { trigger: '.band', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }
})();
