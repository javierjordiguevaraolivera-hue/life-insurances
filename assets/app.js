/* ==========================================================================
   Gastos Finales — Funnel Pay Per Call (Ecomfy Lead)
   Flujo: quiz (index) -> opt-in (optin) -> llamada (llamada)
   - Paso de parámetros de tracking + respuestas del quiz entre páginas
   - Quiz de 2 pasos, validación de form, countdown, controles de video
   ========================================================================== */
(function () {
  'use strict';

  /* --- Parámetros de la URL entre páginas (atribución) ------------------
     Traspasa ?clickid=...&utm_*=... (y respuestas del quiz) a cada paso.
     Respaldo en sessionStorage por si un host borra el query en un redirect. */
  var STORE_KEY = 'gf_params';
  var stored = '';
  try { stored = sessionStorage.getItem(STORE_KEY) || ''; } catch (e) {}

  var currentParams = window.location.search || '';
  if (currentParams) {
    try { sessionStorage.setItem(STORE_KEY, currentParams); } catch (e) {}
  } else if (stored) {
    currentParams = stored;
    try { history.replaceState(null, '', window.location.pathname + currentParams + window.location.hash); } catch (e) {}
  }

  function carryParams(url) {
    if (!currentParams) return url;
    var hash = '', h = url.indexOf('#');
    if (h !== -1) { hash = url.slice(h); url = url.slice(0, h); }
    var sep = url.indexOf('?') !== -1 ? '&' : '?';
    return url + sep + currentParams.replace(/^\?/, '') + hash;
  }

  // Propaga params a enlaces internos marcados con [data-carry-params]
  document.querySelectorAll('a[data-carry-params]').forEach(function (a) {
    a.setAttribute('href', carryParams(a.getAttribute('href')));
  });

  function setParams(str) {
    currentParams = str ? ('?' + str.replace(/^\?/, '')) : '';
    try { sessionStorage.setItem(STORE_KEY, currentParams); } catch (e) {}
  }

  /* --- Loader "Verificando" -> callback al 100% -------------------------
     Barra que avanza rápido hasta 90%, más lento a 95%, frena hasta 100%,
     y ejecuta onDone (navegar a la llamada). */
  function runLoader(onDone) {
    var ov = document.createElement('div');
    ov.className = 'gf-loader';
    ov.innerHTML =
      '<div class="gf-load-ring">' +
        '<svg class="gf-load-icon" viewBox="0 0 24 24" aria-hidden="true">' +
          '<path d="M12 2 4 5v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V5l-8-3z" fill="#16a34a"/>' +
          '<path d="M8.4 12.2l2.4 2.4 4.4-4.6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>' +
      '</div>' +
      '<div class="gf-load-title">Verificando su elegibilidad…</div>' +
      '<div class="gf-bar"><span></span></div>' +
      '<div class="gf-pct">0%</div>';
    document.body.appendChild(ov);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(function () { ov.classList.add('show'); });

    var fill = ov.querySelector('.gf-bar span');
    var pctEl = ov.querySelector('.gf-pct');
    var p = 0, done = false;

    var timer = setInterval(function () {
      var step;
      if (p < 90) step = 1.8;          // rápido hasta 90%
      else if (p < 95) step = 0.4;     // más lento hasta 95%
      else if (p < 100) step = 0.2;    // se frena hasta 100%
      else {
        if (done) return;
        done = true;
        clearInterval(timer);
        setTimeout(onDone, 380);       // pum -> llamada
        return;
      }
      p = Math.min(100, p + step);
      fill.style.width = p + '%';
      pctEl.textContent = Math.round(p) + '%';
    }, 30);
  }

  /* --- QUIZ (N pasos, con descalificación opcional) ---------------------
     Marca respuestas descalificantes con data-dq="1" en el .quiz-btn.
     Define data-dq-next en #quiz para la página de "no califica".
     Si no hay data-dq-next, nunca descalifica (comportamiento simple). */
  var quiz = document.getElementById('quiz');
  if (quiz) {
    var answers = {};
    var disqualified = false;
    var nextPage = quiz.getAttribute('data-next') || 'optin.html';
    var dqPage = quiz.getAttribute('data-dq-next') || '';

    quiz.addEventListener('click', function (e) {
      var btn = e.target.closest('.quiz-btn');
      if (!btn) return;

      var q = btn.getAttribute('data-q');
      if (q) answers[q] = btn.getAttribute('data-answer') || '';
      if (btn.getAttribute('data-dq') === '1') disqualified = true;

      var step = btn.closest('.quiz-step');
      var idx = parseInt(step.getAttribute('data-step'), 10) || 1;
      var next = quiz.querySelector('.quiz-step[data-step="' + (idx + 1) + '"]');

      if (next) {
        step.classList.add('hidden');
        next.classList.remove('hidden');
        try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e2) { window.scrollTo(0, 0); }
        return;
      }

      // Última pregunta: combinar params actuales + respuestas del quiz.
      var merged = currentParams ? currentParams.replace(/^\?/, '') : '';
      var extra = Object.keys(answers).map(function (k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(answers[k]);
      }).join('&');
      if (extra) merged = merged ? (merged + '&' + extra) : extra;

      setParams(merged);
      try { sessionStorage.setItem('gf_quiz', JSON.stringify(answers)); } catch (e3) {}

      var isDq = disqualified && dqPage;
      var target = isDq ? dqPage : nextPage;
      var url = target + (merged ? ('?' + merged) : '');

      // Si el quiz pide loader, muestra "Verificando" antes de navegar
      // (en ambos casos: califica -> llamada, y no califica -> no-califica).
      if (quiz.getAttribute('data-loader') === '1') {
        runLoader(function () { window.location.href = url; });
      } else {
        window.location.href = url;
      }
    });
  }

  /* --- Formulario opt-in ------------------------------------------------- */
  var form = document.getElementById('optin-form');
  if (form) {
    var nextUrl = form.getAttribute('data-next') || 'llamada.html';
    var validators = {
      firstName: function (v) { return v.trim().length >= 2; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
      phone: function (v) { return v.replace(/\D/g, '').length >= 10; }
    };

    var phoneInput = form.querySelector('input[name="phone"]');
    if (phoneInput) {
      phoneInput.addEventListener('input', function () {
        var d = this.value.replace(/\D/g, '').slice(0, 10), out = d;
        if (d.length > 6) out = '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
        else if (d.length > 3) out = '(' + d.slice(0, 3) + ') ' + d.slice(3);
        else if (d.length > 0) out = '(' + d;
        this.value = out;
      });
    }

    function validateField(input) {
      var fn = validators[input.getAttribute('name')];
      var wrap = input.closest('.field');
      var ok = fn ? fn(input.value) : true;
      input.classList.toggle('invalid', !ok);
      if (wrap) wrap.classList.toggle('show-error', !ok);
      return ok;
    }

    form.querySelectorAll('input').forEach(function (input) {
      input.addEventListener('blur', function () { if (input.value) validateField(input); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var allOk = true;
      form.querySelectorAll('input').forEach(function (input) { if (!validateField(input)) allOk = false; });
      if (!allOk) return;

      /* --- CAPTURA DE LEAD (opcional) -----------------------------------
         Descomenta y pon tu webhook (n8n / Supabase / CRM). No bloquea.
      var lead = {
        firstName: form.firstName.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        params: currentParams
      };
      fetch('https://TU-WEBHOOK-AQUI', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead), keepalive: true
      }).catch(function () {});
      -------------------------------------------------------------------- */

      runLoader(function () { window.location.href = carryParams(nextUrl); });
    });
  }

  /* --- Video VSL: solo play/pausa (clic), autoplay muteado, sin seek/mute -- */
  var video = document.querySelector('.video video');
  var videoWrap = document.querySelector('.video');
  var soundBtn = document.getElementById('sound-toggle');
  var playBtn = document.getElementById('video-play');
  if (video) {
    // Autoplay silenciado (permitido por el navegador). Si lo bloquea, queda en pausa.
    var pr = video.play();
    if (pr && pr.catch) pr.catch(function () {});

    function showPlay(v) { if (playBtn) playBtn.style.display = v ? 'flex' : 'none'; }
    video.addEventListener('play', function () { showPlay(false); });
    video.addEventListener('pause', function () { showPlay(true); });
    video.addEventListener('ended', function () { showPlay(true); });
    // Bloquea menú contextual (evita descargar / cambiar velocidad).
    video.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    // Clic en el video alterna play/pausa (el botón de sonido no pausa).
    if (videoWrap) {
      videoWrap.addEventListener('click', function (e) {
        if (e.target.closest('#sound-toggle')) return;
        if (video.paused) video.play(); else video.pause();
      });
    }
  }
  if (soundBtn) {
    soundBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (video) { video.muted = false; if (video.paused) video.play(); }
      soundBtn.style.display = 'none';
    });
  }

  /* --- Countdown de la página de llamada --------------------------------- */
  var cd = document.getElementById('countdown');
  if (cd) {
    var total = parseInt(cd.getAttribute('data-seconds'), 10) || 129;
    (function tick() {
      var m = Math.floor(total / 60), s = total % 60;
      cd.textContent = m + ':' + (s < 10 ? '0' : '') + s;
      if (total > 0) { total -= 1; setTimeout(tick, 1000); }
    })();
  }
})();
