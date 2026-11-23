/* MT Catering · formulario de cotización
   1) Envía la cotización a tu correo con Web3Forms.
   2) Luego lleva al cliente a WhatsApp con el resumen ya escrito. */
(function () {
  'use strict';

  var cfg = window.MT_CONFIG || {};
  var form = document.getElementById('cotizar-form');
  if (!form) return;

  var SERVICIOS = {
    almuerzos:   { t: 'Almuerzos para el equipo', foto: 'img/fotos/servicio-almuerzos.jpg', alt: 'Bandejas de buffet con carne guisada y arroz' },
    coffee:      { t: 'Coffee break',             foto: 'img/fotos/servicio-coffee.jpg',    alt: 'Estación de coffee break con termos de café' },
    desayuno:    { t: 'Desayuno de trabajo',      foto: 'img/fotos/servicio-desayunos.jpg', alt: 'Desayuno de trabajo con panes y jugo' },
    evento:      { t: 'Evento corporativo',       foto: 'img/fotos/servicio-eventos.jpg',   alt: 'Ejecutivos sirviéndose en un buffet' },
    refrigerios: { t: 'Refrigerios',              foto: 'img/fotos/ensaladas.jpg',      alt: 'Mesa de ensaladas' },
    otro:        { t: 'Otro',                     foto: 'img/fotos/buffet-oficina.jpg', alt: 'Personas sirviéndose en un buffet' }
  };
  // Factores de precio (solo se usan si mostrarEstimado = true en config.js)
  var FACTOR_MODALIDAD = { 'Box lunch': .75, 'Buffet': 1, 'Menú servido': 1.3, 'Estaciones': 1.15 };
  var FACTOR_EXTRA = { 'Meseros': .12, 'Café y bebidas': .15, 'Menaje y mantelería': .1, 'Postres': .1, 'Montaje y decoración': .15 };
  var VECES_AL_MES = { 'Una sola vez': 1, 'Semanal': 4, 'Diario (lunes a viernes)': 22, 'Mensual': 1 };

  var state = { paso: 1, servicio: '', frecuencia: 'Una sola vez', modalidad: '', extras: [] };

  var $ = function (id) { return document.getElementById(id); };
  var pasos = form.querySelectorAll('.step');
  var btnSig = $('btn-siguiente'), btnAtras = $('btn-atras'), btnEnviar = $('btn-enviar');
  var hint = $('hint'), errorBox = $('form-error');
  var fotoEl = $('quote-photo');

  /* ---------- Botones de opción (tarjetas y chips) ---------- */
  form.querySelectorAll('[data-group]').forEach(function (group) {
    var name = group.getAttribute('data-group');
    var multi = group.getAttribute('data-multi') === 'true';
    group.querySelectorAll('button[data-value]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var v = btn.getAttribute('data-value');
        if (multi) {
          var i = state[name].indexOf(v);
          if (i === -1) state[name].push(v); else state[name].splice(i, 1);
        } else {
          state[name] = v;
        }
        render();
      });
    });
  });

  ['f-fecha', 'f-horario', 'f-sede', 'f-nombre', 'f-empresa', 'f-correo', 'f-telefono', 'f-acepta'].forEach(function (id) {
    var el = $(id);
    el.addEventListener('input', render);
    el.addEventListener('change', render);
  });
  var rango = $('f-personas');
  rango.addEventListener('input', function () { $('personas-num').textContent = rango.value; render(); });

  /* ---------- Servicio elegido desde la página de inicio (?servicio=coffee) ---------- */
  var desdeUrl = new URLSearchParams(location.search).get('servicio');
  if (desdeUrl && SERVICIOS[desdeUrl]) state.servicio = desdeUrl;

  /* ---------- Validación por paso ---------- */
  function correoValido(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function faltaEnPaso(p) {
    if (p === 1 && !state.servicio) return 'Elige un tipo de servicio';
    if (p === 3 && !state.modalidad) return 'Elige cómo lo servimos';
    if (p === 4) {
      if (!$('f-nombre').value.trim()) return 'Escribe tu nombre';
      if (!$('f-empresa').value.trim()) return 'Escribe el nombre de tu empresa';
      if (!correoValido($('f-correo').value.trim())) return 'Escribe un correo válido';
      if ($('f-telefono').value.replace(/\D/g, '').length < 7) return 'Escribe un teléfono o WhatsApp';
      if (!$('f-acepta').checked) return 'Marca la casilla de aceptación';
    }
    return '';
  }

  /* ---------- Datos y textos ---------- */
  function datos() {
    var fecha = $('f-fecha').value;
    return {
      servicio: state.servicio ? SERVICIOS[state.servicio].t : '',
      frecuencia: state.frecuencia,
      fecha: fecha ? fecha.split('-').reverse().join('/') : '',
      horario: $('f-horario').value,
      sede: $('f-sede').value.trim(),
      personas: rango.value,
      modalidad: state.modalidad,
      extras: state.extras.join(', '),
      nombre: $('f-nombre').value.trim(),
      empresa: $('f-empresa').value.trim(),
      correo: $('f-correo').value.trim(),
      telefono: $('f-telefono').value.trim(),
      mensaje: $('f-mensaje').value.trim()
    };
  }

  function mensajeWhatsApp(d) {
    var l = [
      'Hola MT Catering, quiero cotizar' + (d.empresa ? ' para ' + d.empresa : '') + ':',
      '• Servicio: ' + (d.servicio || 'por definir'),
      '• Frecuencia: ' + d.frecuencia,
      '• Inicio: ' + (d.fecha || 'por definir') + (d.horario ? ' (' + d.horario + ')' : ''),
      '• Personas: ' + d.personas,
      '• Sede: ' + (d.sede || 'por definir'),
      '• Modalidad: ' + (d.modalidad || 'por definir'),
      '• Extras: ' + (d.extras || 'ninguno')
    ];
    if (d.nombre) l.push('Mi nombre: ' + d.nombre + (d.telefono ? ' · ' + d.telefono : ''));
    if (d.mensaje) l.push('Nota: ' + d.mensaje);
    return l.join('\n');
  }

  function fmt(n) { return Math.round(n).toLocaleString('es-DO'); }

  /* ---------- Pintar la pantalla ---------- */
  var fotoActual = '';
  function render() {
    var d = datos();

    // Paso visible
    pasos.forEach(function (s) { s.classList.toggle('is-active', Number(s.getAttribute('data-step')) === state.paso); });
    $('paso-num').textContent = '0' + state.paso;
    $('barra').style.width = (state.paso / 4 * 100) + '%';
    document.querySelectorAll('[data-step-name]').forEach(function (li) {
      li.classList.toggle('is-current', Number(li.getAttribute('data-step-name')) === state.paso);
    });

    // Botones de opción
    form.querySelectorAll('[data-group]').forEach(function (group) {
      var name = group.getAttribute('data-group');
      group.querySelectorAll('button[data-value]').forEach(function (btn) {
        var v = btn.getAttribute('data-value');
        var on = Array.isArray(state[name]) ? state[name].indexOf(v) !== -1 : state[name] === v;
        btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    });

    // Navegación
    var falta = faltaEnPaso(state.paso);
    btnAtras.hidden = state.paso === 1;
    btnSig.hidden = state.paso === 4;
    btnEnviar.hidden = state.paso !== 4;
    btnSig.disabled = !!falta;
    btnEnviar.disabled = !!falta;
    hint.textContent = falta;

    // Foto según el servicio
    var s = SERVICIOS[state.servicio];
    var foto = s ? s.foto : 'img/fotos/buffet.jpg';
    if (foto !== fotoActual) {
      fotoActual = foto;
      fotoEl.style.opacity = '0';
      setTimeout(function () {
        fotoEl.style.backgroundImage = "url('" + foto + "')";
        fotoEl.setAttribute('aria-label', s ? s.alt : 'Buffet con bandejas de plata');
        fotoEl.style.opacity = '1';
      }, 250);
    }

    // Resumen
    var filas = [
      ['Servicio', d.servicio], ['Frecuencia', d.frecuencia],
      ['Inicio', d.fecha ? d.fecha + (d.horario ? ' · ' + d.horario : '') : d.horario],
      ['Personas', d.personas], ['Sede', d.sede], ['Modalidad', d.modalidad],
      ['Extras', d.extras || (state.paso > 3 ? 'Ninguno' : '')]
    ];
    var dl = $('resumen');
    dl.textContent = '';
    filas.forEach(function (f) {
      var row = document.createElement('div'); row.className = 'row';
      var dt = document.createElement('dt'); dt.textContent = f[0];
      var dd = document.createElement('dd'); dd.textContent = f[1] || 'Por definir';
      if (!f[1]) dd.className = 'empty';
      row.appendChild(dt); row.appendChild(dd); dl.appendChild(row);
    });

    // Estimado (opcional)
    var est = $('estimado');
    if (cfg.mostrarEstimado) {
      est.hidden = false;
      var cuerpo = $('estimado-cuerpo');
      if (state.modalidad) {
        var base = Number(cfg.tarifaBase) || 0;
        var pp = base * FACTOR_MODALIDAD[state.modalidad] + state.extras.reduce(function (a, x) { return a + base * (FACTOR_EXTRA[x] || 0); }, 0);
        var total = pp * Number(d.personas);
        var veces = VECES_AL_MES[d.frecuencia] || 1;
        var m = cfg.moneda || '';
        var html = '<p class="range">' + m + ' ' + fmt(total * .9) + ' – ' + fmt(total * 1.15) + '</p>' +
          '<p>por servicio · ≈ ' + m + ' ' + fmt(pp) + ' por persona</p>';
        if (veces > 1) html += '<p>Al mes (' + veces + ' servicios): <strong>' + m + ' ' + fmt(total * .9 * veces) + ' – ' + fmt(total * 1.15 * veces) + '</strong></p>';
        cuerpo.innerHTML = html;
      } else {
        cuerpo.innerHTML = '<p>Elige la modalidad en el paso 3 para ver un estimado.</p>';
      }
    } else {
      est.hidden = true;
    }
  }

  function irA(p) {
    state.paso = p;
    errorBox.classList.remove('is-visible');
    render();
    var top = form.getBoundingClientRect().top + window.scrollY - 140;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
    var h = form.querySelector('.step.is-active h1, .step.is-active h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  btnSig.addEventListener('click', function () { if (!faltaEnPaso(state.paso)) irA(state.paso + 1); });
  btnAtras.addEventListener('click', function () { irA(Math.max(1, state.paso - 1)); });

  /* ---------- Envío ---------- */
  var cuenta = null;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var falta = faltaEnPaso(4);
    if (falta) { hint.textContent = falta; return; }
    if ($('f-botcheck').checked) return; // robot

    var d = datos();
    var wa = window.MT_waLink(mensajeWhatsApp(d));
    btnEnviar.disabled = true;
    btnEnviar.firstChild.textContent = 'Enviando… ';

    var clave = String(cfg.web3formsKey || '');
    var claveLista = clave && clave.indexOf('PEGA_AQUI') === -1;

    var envio = claveLista
      ? fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            access_key: clave,
            subject: 'Nueva cotización web: ' + d.servicio + ' · ' + d.empresa,
            from_name: 'Web MT Catering',
            replyto: d.correo,
            botcheck: false,
            'Servicio': d.servicio,
            'Frecuencia': d.frecuencia,
            'Fecha de inicio': d.fecha || 'Por definir',
            'Horario': d.horario || 'Por definir',
            'Personas por servicio': d.personas,
            'Sede o dirección': d.sede || 'Por definir',
            'Modalidad': d.modalidad,
            'Extras': d.extras || 'Ninguno',
            'Nombre': d.nombre,
            'Empresa': d.empresa,
            'Correo': d.correo,
            'Teléfono / WhatsApp': d.telefono,
            'Mensaje': d.mensaje || '—'
          })
        }).then(function (r) { return r.json(); }).then(function (j) { return !!(j && j.success); }).catch(function () { return false; })
      : Promise.resolve(false);

    envio.then(function (ok) {
      form.hidden = true;
      $('progreso-wrap').hidden = true;
      $('listo-nombre').textContent = (d.nombre.split(' ')[0] || '') + '.';
      $('listo-texto').textContent = ok
        ? 'Recibimos la solicitud de ' + d.empresa + '. Te enviaremos la propuesta a ' + d.correo + '. Ahora te llevamos a WhatsApp para seguir la conversación.'
        : 'No pudimos enviar el correo en este momento, pero tu solicitud no se pierde: te llevamos a WhatsApp con el resumen ya escrito para que nos lo envíes.';
      var listoWa = $('listo-wa');
      listoWa.setAttribute('href', wa);
      var listo = $('listo');
      listo.classList.add('is-visible');
      listo.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });

      var seg = 5;
      var cuentaEl = $('listo-cuenta');
      cuentaEl.textContent = 'Abriendo WhatsApp en ' + seg + ' segundos…';
      cuenta = setInterval(function () {
        seg -= 1;
        if (seg <= 0) {
          clearInterval(cuenta);
          cuentaEl.textContent = 'Abriendo WhatsApp…';
          window.location.href = wa;
        } else {
          cuentaEl.textContent = 'Abriendo WhatsApp en ' + seg + ' segundos…';
        }
      }, 1000);
    });
  });

  $('listo-quedarme').addEventListener('click', function () {
    if (cuenta) clearInterval(cuenta);
    $('listo-cuenta').textContent = 'Puedes abrir WhatsApp cuando quieras con el botón.';
  });

  render();
})();
