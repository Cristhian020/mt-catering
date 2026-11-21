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

  /* ---------- Galería de eventos (se llena sola con data/eventos.json) ---------- */
  var gridEventos = document.getElementById('eventos');
  if (gridEventos && window.fetch) {
    fetch('data/eventos.json', { cache: 'no-cache' })
      .then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
      .then(function (eventos) { if (Array.isArray(eventos) && eventos.length) mostrarEventos(eventos); })
      .catch(function () { /* todavía no hay eventos: se queda la galería de muestra */ });
  }

  function fechaLarga(iso) {
    var p = String(iso || '').split('-');
    if (p.length !== 3) return '';
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  var albumes = null;
  var fotosOcultas = null;

  function enlaceFoto(ev, src, k, n) {
    var a = document.createElement('a');
    a.className = 'ev-foto';
    a.href = src;
    a.setAttribute('data-gallery', 'ev-' + ev.id);
    a.setAttribute('data-title', ev.titulo);
    a.setAttribute('data-description', fechaLarga(ev.fecha) + ' · foto ' + (k + 1) + ' de ' + n);
    return a;
  }

  function tarjetaEvento(ev, destacado) {
    var n = ev.fotos.length;
    // La tarjeta es el enlace a la primera foto; las demás fotos del evento van en enlaces ocultos
    // con el mismo data-gallery, así el visor muestra solo las fotos de ese evento.
    var btn = enlaceFoto(ev, ev.fotos[0], 0, n);
    btn.className = 'event-card ev-foto' + (destacado ? ' is-featured' : '');
    btn.setAttribute('aria-label', 'Ver las ' + n + ' fotos de ' + ev.titulo);
    ev.fotos.slice(1).forEach(function (src, k) { fotosOcultas.appendChild(enlaceFoto(ev, src, k + 1, n)); });

    var img = document.createElement('img');
    img.src = ev.portada; img.alt = ''; img.loading = 'lazy';

    var info = document.createElement('span'); info.className = 'event-info';
    var fecha = document.createElement('span'); fecha.className = 'event-date'; fecha.textContent = fechaLarga(ev.fecha);
    var titulo = document.createElement('span'); titulo.className = 'event-title'; titulo.textContent = ev.titulo;
    var cuenta = document.createElement('span'); cuenta.className = 'event-count';
    cuenta.innerHTML = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>';
    cuenta.appendChild(document.createTextNode(n + (n === 1 ? ' foto' : ' fotos')));
    info.appendChild(fecha); info.appendChild(titulo); info.appendChild(cuenta);

    var abrir = document.createElement('span'); abrir.className = 'event-open'; abrir.setAttribute('aria-hidden', 'true');
    abrir.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>';

    btn.appendChild(img); btn.appendChild(info); btn.appendChild(abrir);
    return btn;
  }

  function mostrarEventos(eventos) {
    var mostrados = 0;
    document.getElementById('galeria-muestra').hidden = true;
    var filtrosEl = document.getElementById('galeria-filtros');
    if (filtrosEl) filtrosEl.hidden = true;
    document.getElementById('galeria-sub').hidden = false;
    document.getElementById('galeria-titulo').innerHTML = 'Galería de <em>eventos</em>';
    gridEventos.hidden = false;
    fotosOcultas = document.createElement('div');
    fotosOcultas.hidden = true;
    gridEventos.parentNode.insertBefore(fotosOcultas, gridEventos.nextSibling);
    var masWrap = document.getElementById('mas-eventos-wrap');

    function pintar() {
      var hasta = Math.min(eventos.length, mostrados + (mostrados ? 6 : 7));
      var nuevas = [];
      for (var k = mostrados; k < hasta; k++) {
        var card = tarjetaEvento(eventos[k], k === 0);
        gridEventos.appendChild(card);
        nuevas.push(card);
      }
      mostrados = hasta;
      masWrap.hidden = mostrados >= eventos.length;
      if (window.GLightbox) {
        if (albumes) albumes.reload();
        else albumes = window.GLightbox({ selector: '.ev-foto', loop: true });
      }
      if (window.gsap && !reduceMotion) {
        window.gsap.from(nuevas, { y: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08 });
      }
    }
    document.getElementById('mas-eventos').addEventListener('click', pintar);
    pintar();
  }

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
