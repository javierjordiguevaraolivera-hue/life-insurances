// ============================================================
// life-insurances /iul-v5 — traduccion a JS puro del funnel
// hibrido /iul-v5 de best-life (React -> vanilla).
// Rama lead (Otro estatus): zip -> nombre -> contacto -> Supabase (ready_for_sell).
// Rama PPC (Ciudadano Americano / Residente Permanente): financiero -> loading -> llamada.
// ============================================================

(function () {
  "use strict";

  // Numero fijo del PPC landing (Vercel HTML / life-insurances.pro).
  var PPC_PHONE_NUMBER = "+12136993670";
  var PPC_PHONE_DISPLAY = "(213) 699-3670";
  var FUNNEL_ID = "iul-v5";
  var PAGE_PATH = "/iul-v5";
  var LOADING_DURATION_MS = 3600;

  var AGE_OPTIONS = ["25 a 34", "35 a 44", "45 a 54", "55 a 65", "65+"];
  var GOAL_OPTIONS = [
    "Seguro de vida",
    "Ahorrar e invertir",
    "Planificación de retiro",
    "No estoy seguro aún",
  ];
  var RETIREMENT_OPTIONS = ["Antes de los 60", "Entre los 60 y 65", "Después de los 65"];
  var STATUS_OPTIONS = ["Ciudadano Americano", "Residente Permanente", "Otro estatus"];
  var FINANCIAL_OPTIONS = [
    "401(k) o 403(b)",
    "IRA Tradicional",
    "Roth IRA",
    "Acciones o Fondos Mutuos",
    "Bienes Raíces",
    "CDs o Bonos",
    "Otras inversiones",
    "Aún no tengo ninguna",
  ];
  var FINANCIAL_NONE = "Aún no tengo ninguna";

  var STATE_OPTIONS = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
    "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina",
    "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island",
    "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "District of Columbia",
  ];
  var STATE_ABBREVIATIONS = {
    Alabama: "al", Alaska: "ak", Arizona: "az", Arkansas: "ar", California: "ca",
    Colorado: "co", Connecticut: "ct", Delaware: "de", Florida: "fl", Georgia: "ga",
    Hawaii: "hi", Idaho: "id", Illinois: "il", Indiana: "in", Iowa: "ia", Kansas: "ks",
    Kentucky: "ky", Louisiana: "la", Maine: "me", Maryland: "md", Massachusetts: "ma",
    Michigan: "mi", Minnesota: "mn", Mississippi: "ms", Missouri: "mo", Montana: "mt",
    Nebraska: "ne", Nevada: "nv", "New Hampshire": "nh", "New Jersey": "nj",
    "New Mexico": "nm", "New York": "ny", "North Carolina": "nc", "North Dakota": "nd",
    Ohio: "oh", Oklahoma: "ok", Oregon: "or", Pennsylvania: "pa", "Rhode Island": "ri",
    "South Carolina": "sc", "South Dakota": "sd", Tennessee: "tn", Texas: "tx",
    Utah: "ut", Vermont: "vt", Virginia: "va", Washington: "wa", "West Virginia": "wv",
    Wisconsin: "wi", Wyoming: "wy", "District of Columbia": "dc",
  };

  var LEAD_STEPS = ["age", "goal", "retirement", "status", "zip", "name", "contact"];
  var CALL_STEPS = ["age", "goal", "retirement", "status", "financial"];

  var TITLES = {
    age: "¿En qué grupo de edad estás?",
    goal: "Cuéntame, ¿qué te gustaría lograr con un seguro de vida?",
    retirement: "¿A qué edad te gustaría jubilarte?",
    status: "¿Cuál es tu situación en Estados Unidos?",
    financial: "¿Cómo estás preparando hoy tu futuro financiero?",
    zip: "Cual es tu ZIP code?",
    name: "¿Cuál es tu nombre completo?",
    contact: "¿A qué número te enviamos tu cotización personalizada?",
  };

  var DEVICE_STORAGE_KEY = "best-life-iul-v5-device-id";
  var DEVICE_COOKIE_NAME = "bf_iul_device_id";
  var DEVICE_COOKIE_DAYS = 15;
  var AGE_REJECTED_COOKIE = "bf_age_rejected";
  var AGE_REJECTED_DAYS = 90;
  var REJECTED_URL = "/iul-v5/rechazo.html";
  var BLOCKED_STATE = "New York";
  var TRUSTEDFORM_FIELD = "xxTrustedFormCertUrl";

  // ---------- iconos (mismos SVG del funnel de best-life) ----------

  var ICONS = {
    dialFinger:
      '<svg aria-hidden="true" viewBox="0 0 24 24" width="23" height="23" fill="none"><path d="M1.875 1.5a.375.375 0 1 0 .375.375.375.375 0 0 0-.375-.375h0" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M7.125 1.5a.375.375 0 1 0 .375.375.375.375 0 0 0-.375-.375" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M12.375 1.5a.375.375 0 1 0 .375.375.375.375 0 0 0-.375-.375" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M1.875 6.75a.375.375 0 1 0 .375.375.375.375 0 0 0-.375-.375" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M7.125 6.75a.375.375 0 1 0 .375.375.375.375 0 0 0-.375-.375" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M1.875 12a.375.375 0 1 0 .375.375A.375.375 0 0 0 1.875 12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M7.125 12a.375.375 0 1 0 .375.375A.375.375 0 0 0 7.125 12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M6.75 22.5l-1.9-3.327A2.263 2.263 0 0 1 8.7 16.8l1.8 2.7V8.25a2.25 2.25 0 0 1 4.5 0V16.5h3.379A4.332 4.332 0 0 1 22.5 20.847V22.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/></svg>',
    shieldCheck:
      '<svg aria-hidden="true" viewBox="0 0 317.855 317.855" width="22" height="22" fill="currentColor"><path d="M158.929 317.855c-1.029 0-2.059-.159-3.051-.477-33.344-10.681-61.732-31.168-84.377-60.891-17.828-23.401-32.103-52.526-42.426-86.566C11.661 112.506 11.461 61.358 11.461 59.209c0-5.15 3.912-9.459 9.039-9.954.772-.075 78.438-8.048 132.553-47.347 3.504-2.546 8.249-2.543 11.753.001C218.906 41.207 296.582 49.18 297.36 49.256c5.123.5 9.034 4.807 9.034 9.953 0 2.149-.2 53.297-17.613 110.713-10.324 34.04-24.598 63.165-42.426 86.566-22.644 29.723-51.032 50.21-84.376 60.891-.992.317-2.021.476-3.05.476zM31.748 67.982c.831 16.784 4.062 55.438 16.604 96.591 21.405 70.227 58.601 114.87 110.576 132.746 52.096-17.916 89.335-62.711 110.713-133.202 12.457-41.074 15.653-79.434 16.472-96.134-22.404-3.269-80.438-14.332-127.186-45.785C112.175 53.648 54.153 64.713 31.748 67.982z"/><path d="M153.582 207.625c-2.372 0-4.68-.844-6.499-2.4l-36.163-30.926c-4.197-3.589-4.69-9.901-1.101-14.099 3.588-4.198 9.901-4.692 14.099-1.101l28.124 24.051 55.743-73.118c3.348-4.392 9.622-5.24 14.015-1.89 4.393 3.348 5.238 9.623 1.89 14.015l-62.155 81.53c-1.667 2.187-4.16 3.591-6.895 3.882-.353.037-.706.056-1.058.056z"/></svg>',
    statisticGrow:
      '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M22 5v5a1 1 0 0 1-2 0V7.41l-5.29 5.3a1 1 0 0 1-1.16.18l-5.29-2.64-4.49 5.39A1 1 0 0 1 3 16a1 1 0 0 1-.64-.23 1 1 0 0 1-.13-1.41l5-6a1 1 0 0 1 1.22-.25l5.35 2.67L18.59 6H16a1 1 0 0 1 0-2h5a1 1 0 0 1 .38.08 1 1 0 0 1 .54.54A1 1 0 0 1 22 5ZM21 18H3a1 1 0 0 0 0 2h18a1 1 0 0 0 0-2Z"/></svg>',
    retirementPlan:
      '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M21 6.25C21 4.455 19.545 3 17.75 3H6.25C4.455 3 3 4.455 3 6.25v11.5C3 19.545 4.455 21 6.25 21h5.772a6.45 6.45 0 0 1-.709-1.5H6.25A1.75 1.75 0 0 1 4.5 17.75V8.5h15v2.814c.534.172 1.037.411 1.5.708V6.25ZM6.25 4.5h11.5a1.75 1.75 0 0 1 1.75 1.75V7h-15v-.75A1.75 1.75 0 0 1 6.25 4.5Z"/><path d="M23 17.5a5.5 5.5 0 1 0-11 0 5.5 5.5 0 0 0 11 0Zm-5.5 0h2a.5.5 0 0 1 0 1H17a.5.5 0 0 1-.5-.491V15a.5.5 0 0 1 1 0v2.5Z"/></svg>',
    unsure:
      '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><path d="M12 13c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><line x1="12" y1="13" x2="12" y2="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/><path d="M12 17v.01" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>',
    flag:
      '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none"><line x1="5" y1="3" x2="5" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M5 4.5c2.2-1.1 4.3-1.1 6.5 0s4.3 1.1 6.5 0v8.5c-2.2 1.1-4.3 1.1-6.5 0s-4.3-1.1-6.5 0V4.5Z" fill="currentColor" opacity="0.9"/></svg>',
    doubleCheck:
      '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="m2.5 12.5 4 4L14 9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="m11.5 15.5 1 1L21 9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    questionMark:
      '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none"><path d="M8.6 8.6a3.4 3.4 0 1 1 5.6 2.6c-1.2 1-2.2 1.7-2.2 3.4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="18.6" r="1.4" fill="currentColor"/></svg>',
    spinner:
      '<svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" class="spin" style="color:#94a3b8" fill="none"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="3" opacity="0.24"/><path d="M20 12a8 8 0 0 0-8-8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
    valid:
      '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" style="color:#16a34a" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="m7.8 12.2 2.6 2.6 5.8-6" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    invalid:
      '<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" style="color:#dc2626" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="m8.5 8.5 7 7M15.5 8.5l-7 7" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"/></svg>',
    finCheck:
      '<svg viewBox="0 0 24 24" width="13" height="13" fill="none"><path d="m6 12.5 4 4L18 8" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  var GOAL_ICONS = {
    "Seguro de vida": ICONS.shieldCheck,
    "Ahorrar e invertir": ICONS.statisticGrow,
    "Planificación de retiro": ICONS.retirementPlan,
    "No estoy seguro aún": ICONS.unsure,
  };
  var STATUS_ICONS = {
    "Ciudadano Americano": ICONS.flag,
    "Residente Permanente": ICONS.doubleCheck,
    "Otro estatus": ICONS.questionMark,
  };

  // ---------- estado ----------

  var answers = {
    zipCode: "",
    locationText: "",
    ageGroup: "",
    insuranceGoal: "",
    retirementAge: "",
    usaStatus: "",
    financialAccounts: [],
    state: "",
    firstName: "",
    lastName: "",
    phoneCountry: "US",
    phoneNumber: "",
    email: "",
  };

  var currentStep = "age";
  var isTransitioning = false;
  var leadToken = "";
  var submittedLead = false;
  var submittedLeadId = "";
  var leadUrl = window.location.href;
  var trackedSteps = {};
  var phoneStatus = "idle"; // idle | validating | valid | invalid
  var phoneVerification = null;
  var phoneVerificationToken = "";
  var phoneRequestId = 0;
  var phoneDebounceTimer = null;
  var phoneAbort = null;
  var hasBlurredPhone = false;
  var zipDebounceTimer = null;
  var zipAbort = null;
  var isLookingUpZip = false;
  var loadingTimer = null;
  var loadingInterval = null;

  // ---------- helpers ----------

  function $(id) {
    return document.getElementById(id);
  }

  function normalizePhone(value) {
    var digits = String(value || "").replace(/\D/g, "");
    if (digits.length === 11 && digits.charAt(0) === "1") return digits.slice(1);
    return digits;
  }

  function formatPhone(value) {
    var digits = normalizePhone(value);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return digits.slice(0, 3) + " " + digits.slice(3);
    var formatted = digits.slice(0, 3) + " " + digits.slice(3, 6) + " " + digits.slice(6, 10);
    return digits.length > 10 ? formatted + " " + digits.slice(10) : formatted;
  }

  function normalizeZip(value) {
    return String(value || "").replace(/\D/g, "").slice(0, 5);
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  function setCookie(name, value, days) {
    document.cookie =
      name + "=" + encodeURIComponent(value) + "; Max-Age=" + days * 24 * 60 * 60 + "; Path=/; SameSite=Lax";
  }

  function hasAgeRejectedCookie() {
    return document.cookie
      .split(";")
      .map(function (c) { return c.trim(); })
      .indexOf(AGE_REJECTED_COOKIE + "=true") !== -1;
  }

  function getOrCreateDeviceId() {
    try {
      var existing = window.localStorage.getItem(DEVICE_STORAGE_KEY);
      if (existing) {
        setCookie(DEVICE_COOKIE_NAME, existing, DEVICE_COOKIE_DAYS);
        return existing;
      }
      var newId = "bm_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
      window.localStorage.setItem(DEVICE_STORAGE_KEY, newId);
      setCookie(DEVICE_COOKIE_NAME, newId, DEVICE_COOKIE_DAYS);
      return newId;
    } catch (e) {
      return "";
    }
  }

  function getTrustedFormCertUrl() {
    var field = document.getElementsByName(TRUSTEDFORM_FIELD)[0];
    return (field && field.value && field.value.trim()) || "";
  }

  function createEventId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return prefix + "_" + window.crypto.randomUUID();
    }
    return prefix + "_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
  }

  function lowerValue(value) {
    var normalized = String(value || "").trim().toLowerCase();
    return normalized || undefined;
  }

  function gtmState(value) {
    var state = String(value || "").trim();
    if (/^[A-Za-z]{2}$/.test(state)) return state.toLowerCase();
    return STATE_ABBREVIATIONS[state] || lowerValue(state);
  }

  function getUtmParams() {
    var params = new URLSearchParams(window.location.search);
    var payload = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (key) {
      var value = params.get(key);
      if (value) payload[key] = value;
    });
    return payload;
  }

  function getGtmLeadPayload() {
    var location = answers.locationText || "";
    var city = (location.split(",")[0] || "").trim();
    var base = {
      funnel_id: FUNNEL_ID,
      step: currentStep,
      country: "us",
      state: gtmState(answers.state),
      zip_code: answers.zipCode || undefined,
      city: lowerValue(city),
      location: lowerValue(location),
      age_group: lowerValue(answers.ageGroup),
      insurance_goal: lowerValue(answers.insuranceGoal),
      retirement_age: lowerValue(answers.retirementAge),
      usa_status: lowerValue(answers.usaStatus),
      financial_accounts: lowerValue(answers.financialAccounts.join(", ")),
      first_name: lowerValue(answers.firstName),
      last_name: lowerValue(answers.lastName),
      phone_number: normalizePhone(answers.phoneNumber) || undefined,
      email: lowerValue(answers.email),
    };
    var utm = getUtmParams();
    for (var key in utm) base[key] = utm[key];
    return base;
  }

  function pushGtmEvent(event, payload) {
    window.dataLayer = window.dataLayer || [];
    var entry = { event: event };
    if (payload) {
      for (var key in payload) {
        if (payload[key] !== undefined) entry[key] = payload[key];
      }
    }
    window.dataLayer.push(entry);
  }

  // ---------- flujo / navegacion ----------

  function isCallPath() {
    return answers.usaStatus === "Ciudadano Americano" || answers.usaStatus === "Residente Permanente";
  }

  function visibleSteps() {
    return isCallPath() ? CALL_STEPS : LEAD_STEPS;
  }

  function rejectAndRedirect() {
    setCookie(AGE_REJECTED_COOKIE, "true", AGE_REJECTED_DAYS);
    window.location.replace(REJECTED_URL);
  }

  function stepPanelId(step) {
    return {
      age: "step-age",
      goal: "step-goal",
      retirement: "step-retirement",
      status: "step-status",
      financial: "step-financial",
      zip: "step-zip",
      name: "step-name",
      contact: "step-contact",
    }[step];
  }

  function renderProgress() {
    var steps = visibleSteps();
    var index = steps.indexOf(currentStep);
    var track = $("progress-track");
    var fill = $("progress-fill");
    var label = $("progress-label");

    if (index < 0) {
      fill.style.width = "0%";
      label.textContent = "";
      return;
    }

    fill.style.width = (((index + 1) / steps.length) * 100).toFixed(2) + "%";
    label.textContent = index + 1 + " de " + steps.length;

    // divisores del track (uno por paso, menos el primero)
    Array.prototype.slice.call(track.querySelectorAll(".progress-divider")).forEach(function (el) {
      el.remove();
    });
    for (var i = 1; i < steps.length; i += 1) {
      var divider = document.createElement("span");
      divider.className = "progress-divider";
      divider.setAttribute("aria-hidden", "true");
      divider.style.left = ((i / steps.length) * 100).toFixed(2) + "%";
      track.appendChild(divider);
    }
  }

  function renderHead() {
    $("q-eyebrow").hidden = currentStep !== "age";
    $("q-subtitle").hidden = currentStep !== "financial";
    var title = $("q-title");
    title.textContent = TITLES[currentStep] || "";
    title.classList.toggle("q-title-sm", currentStep === "financial");
  }

  function showStep(step) {
    ["age", "goal", "retirement", "status", "financial", "zip", "name", "contact"].forEach(function (key) {
      var panel = $(stepPanelId(key));
      if (panel) panel.hidden = key !== step;
    });
    currentStep = step;
    renderHead();
    renderProgress();
    trackStepView();
  }

  function animateTo(step) {
    if (isTransitioning) return;
    if (hasAgeRejectedCookie()) {
      rejectAndRedirect();
      return;
    }

    isTransitioning = true;
    var head = $("q-head");
    var currentPanel = $(stepPanelId(currentStep));
    head.classList.remove("anim-in");
    head.classList.add("anim-out");
    if (currentPanel) {
      currentPanel.classList.remove("anim-in");
      currentPanel.classList.add("anim-out");
    }

    window.setTimeout(function () {
      head.classList.remove("anim-out");
      if (currentPanel) currentPanel.classList.remove("anim-out");
      showStep(step);
      var nextPanel = $(stepPanelId(step));
      head.classList.add("anim-in");
      if (nextPanel) nextPanel.classList.add("anim-in");
      $("submit-error").textContent = "";
      isTransitioning = false;
      window.setTimeout(function () {
        head.classList.remove("anim-in");
        if (nextPanel) nextPanel.classList.remove("anim-in");
      }, 430);
    }, 170);
  }

  function goBack() {
    if (hasAgeRejectedCookie()) {
      rejectAndRedirect();
      return;
    }
    var steps = visibleSteps();
    var index = steps.indexOf(currentStep);
    if (index <= 0) return;
    animateTo(steps[index - 1]);
  }

  function trackStepView() {
    var steps = visibleSteps();
    var index = steps.indexOf(currentStep);
    if (index < 0) return;

    var trackingKey = index + ":" + currentStep;
    if (trackedSteps[trackingKey]) return;
    trackedSteps[trackingKey] = true;

    var payload = getGtmLeadPayload();
    payload.event_id = createEventId(index === 0 ? "pageview" : "viewcontent");
    payload.step_number = index + 1;
    pushGtmEvent(index === 0 ? "PageView" : "ViewContent", payload);
  }

  // ---------- render de opciones ----------

  function buildOptionButton(option, iconSvg, isRecommended, extraClass) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "option-btn" + (isRecommended ? " is-recommended" : "");
    var inner = document.createElement("span");
    inner.className = "option-inner" + (extraClass ? " " + extraClass : "");
    inner.innerHTML = (iconSvg || "") + "<span>" + option + "</span>";
    button.appendChild(inner);
    return button;
  }

  function renderAgeOptions() {
    var container = $("step-age");
    container.innerHTML = "";
    AGE_OPTIONS.forEach(function (option) {
      var button = buildOptionButton(option, ICONS.dialFinger, option === "35 a 44" && !answers.ageGroup, "age");
      button.addEventListener("click", function () {
        if (option === "65+") {
          answers.ageGroup = "65+";
          rejectAndRedirect();
          return;
        }
        answers.ageGroup = option;
        markSelected(container, button);
        window.setTimeout(function () { animateTo("goal"); }, 120);
      });
      container.appendChild(button);
    });
  }

  function renderGoalOptions() {
    var container = $("step-goal");
    container.innerHTML = "";
    GOAL_OPTIONS.forEach(function (option) {
      var button = buildOptionButton(option, GOAL_ICONS[option] || "", option === "Ahorrar e invertir" && !answers.insuranceGoal);
      button.addEventListener("click", function () {
        answers.insuranceGoal = option;
        markSelected(container, button);
        window.setTimeout(function () { animateTo("retirement"); }, 120);
      });
      container.appendChild(button);
    });
  }

  function renderRetirementOptions() {
    var container = $("step-retirement");
    container.innerHTML = "";
    RETIREMENT_OPTIONS.forEach(function (option) {
      var button = buildOptionButton(option, ICONS.retirementPlan, false);
      button.addEventListener("click", function () {
        answers.retirementAge = option;
        markSelected(container, button);
        window.setTimeout(function () { animateTo("status"); }, 120);
      });
      container.appendChild(button);
    });
  }

  function renderStatusOptions() {
    var container = $("step-status");
    container.innerHTML = "";
    STATUS_OPTIONS.forEach(function (option) {
      var button = buildOptionButton(option, STATUS_ICONS[option] || "", false);
      button.addEventListener("click", function () {
        answers.usaStatus = option;
        markSelected(container, button);
        window.setTimeout(function () {
          animateTo(isCallPath() ? "financial" : "zip");
        }, 120);
      });
      container.appendChild(button);
    });
  }

  function markSelected(container, selectedButton) {
    Array.prototype.slice.call(container.querySelectorAll(".option-btn")).forEach(function (btn) {
      btn.classList.remove("is-selected", "is-recommended");
    });
    selectedButton.classList.add("is-selected");
  }

  function renderFinancialOptions() {
    var container = $("financial-options");
    container.innerHTML = "";
    FINANCIAL_OPTIONS.forEach(function (option) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "fin-option";
      button.setAttribute("role", "checkbox");
      button.setAttribute("aria-checked", "false");
      button.innerHTML =
        '<span class="fin-check" aria-hidden="true">' + ICONS.finCheck + "</span><span>" + option + "</span>";
      button.addEventListener("click", function () {
        toggleFinancialOption(option);
      });
      button.dataset.option = option;
      container.appendChild(button);
    });
  }

  function toggleFinancialOption(option) {
    var selected = answers.financialAccounts.indexOf(option) !== -1;

    if (option === FINANCIAL_NONE) {
      answers.financialAccounts = selected ? [] : [FINANCIAL_NONE];
    } else {
      var withoutNone = answers.financialAccounts.filter(function (item) {
        return item !== FINANCIAL_NONE;
      });
      if (selected) {
        answers.financialAccounts = withoutNone.filter(function (item) { return item !== option; });
      } else {
        withoutNone.push(option);
        answers.financialAccounts = withoutNone;
      }
    }

    Array.prototype.slice.call($("financial-options").querySelectorAll(".fin-option")).forEach(function (btn) {
      var isOn = answers.financialAccounts.indexOf(btn.dataset.option) !== -1;
      btn.classList.toggle("is-selected", isOn);
      btn.setAttribute("aria-checked", isOn ? "true" : "false");
    });
    $("financial-continue").disabled = answers.financialAccounts.length === 0;
  }

  // ---------- ZIP ----------

  function setZipHint() {
    var hint = $("zip-hint");
    hint.textContent =
      STATE_OPTIONS.indexOf(answers.state) !== -1
        ? "Estado detectado: " + answers.state
        : "Usamos tu ZIP code para identificar tu estado.";
  }

  function isResolvedUsZip(data, requestedZip) {
    return (
      !!data &&
      data.source === "zippopotam" &&
      data.fallback === false &&
      data.zipCode === requestedZip &&
      !!data.state &&
      STATE_OPTIONS.indexOf(data.state) !== -1
    );
  }

  function scheduleZipLookup() {
    if (zipDebounceTimer) window.clearTimeout(zipDebounceTimer);
    if (zipAbort) zipAbort.abort();

    var zip = answers.zipCode;
    if (zip.length < 5) {
      answers.state = "";
      answers.locationText = "";
      setZipHint();
      return;
    }

    zipDebounceTimer = window.setTimeout(function () {
      var controller = new AbortController();
      zipAbort = controller;
      fetch("/api/zip/" + zip + "?strict=zippopotam", { cache: "no-store", signal: controller.signal })
        .then(function (response) { return response.ok ? response.json() : null; })
        .then(function (data) {
          if (controller.signal.aborted || zip !== answers.zipCode) return;
          if (isResolvedUsZip(data, zip)) {
            if (data.state === BLOCKED_STATE) {
              rejectAndRedirect();
              return;
            }
            answers.state = data.state;
            answers.locationText = data.location || "";
          } else {
            answers.state = "";
            answers.locationText = "";
          }
          setZipHint();
        })
        .catch(function () { /* la validacion dura ocurre en el continue */ });
    }, 180);
  }

  function setZipLoading(isLoading) {
    isLookingUpZip = isLoading;
    $("zip-continue-label").textContent = isLoading ? "Validando ZIP code..." : "Confirmar ZIP code";
    $("zip-continue-spinner").hidden = !isLoading;
    $("zip-continue-arrow").style.display = isLoading ? "none" : "";
    updateZipButton();
  }

  function updateZipButton() {
    $("zip-continue").disabled = isLookingUpZip || normalizeZip(answers.zipCode).length !== 5;
  }

  function handleZipContinue() {
    if (hasAgeRejectedCookie()) {
      rejectAndRedirect();
      return;
    }

    var zip = normalizeZip(answers.zipCode);
    if (zip.length !== 5) {
      $("zip-error").textContent = "Ingresa un ZIP code valido de EE.UU. con 5 digitos.";
      return;
    }

    $("zip-error").textContent = "";
    setZipLoading(true);

    fetch("/api/zip/" + zip + "?strict=zippopotam", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("Ingresa un ZIP code real de EE.UU.");
        return response.json();
      })
      .then(function (data) {
        if (!isResolvedUsZip(data, zip)) throw new Error("Ingresa un ZIP code real de EE.UU.");
        if (data.state === BLOCKED_STATE) {
          rejectAndRedirect();
          return;
        }
        answers.zipCode = zip;
        answers.state = data.state;
        answers.locationText = data.location || "";
        setZipHint();
        animateTo("name");
      })
      .catch(function (error) {
        answers.state = "";
        answers.locationText = "";
        setZipHint();
        $("zip-error").textContent =
          (error && error.message) || "No pudimos validar ese ZIP code. Intenta otro.";
      })
      .finally(function () {
        setZipLoading(false);
      });
  }

  // ---------- telefono ----------

  function setPhoneStatus(status) {
    phoneStatus = status;
    var statusEl = $("phone-status");
    var input = $("phone-number");

    if (status === "idle") {
      statusEl.hidden = true;
      statusEl.innerHTML = "";
    } else {
      statusEl.hidden = false;
      statusEl.innerHTML =
        status === "validating" ? ICONS.spinner : status === "valid" ? ICONS.valid : ICONS.invalid;
    }

    input.classList.toggle("border-valid", status === "valid");
    input.classList.toggle("border-invalid", status === "invalid");
    input.setAttribute("aria-invalid", status === "invalid" ? "true" : "false");
    input.setAttribute("aria-busy", status === "validating" ? "true" : "false");
    updateSubmitButton();
  }

  function setPhoneError(message) {
    $("phone-validation-message").textContent = phoneStatus === "validating" ? "" : message || "";
  }

  function updateSubmitButton() {
    $("submit-lead").disabled = phoneStatus !== "valid";
  }

  function schedulePhoneVerification() {
    if (phoneDebounceTimer) window.clearTimeout(phoneDebounceTimer);
    if (phoneAbort) phoneAbort.abort();
    phoneAbort = null;
    var requestId = ++phoneRequestId;
    phoneVerification = null;
    phoneVerificationToken = "";

    var normalized = normalizePhone(answers.phoneNumber);

    if (normalized.length !== 10) {
      var shouldShowError = normalized.length > 10 || (hasBlurredPhone && normalized.length > 0);
      setPhoneStatus(shouldShowError ? "invalid" : "idle");
      setPhoneError(shouldShowError ? "Ingresa un número contactable de 10 dígitos." : "");
      return;
    }

    setPhoneStatus("validating");
    setPhoneError("");

    phoneDebounceTimer = window.setTimeout(function () {
      phoneDebounceTimer = null;
      var controller = new AbortController();
      phoneAbort = controller;
      pushGtmEvent("phone_verification_started", { funnel_id: FUNNEL_ID });

      fetch("/api/phone-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
        cache: "no-store",
        signal: controller.signal,
      })
        .then(function (response) {
          return response.json().catch(function () { return null; }).then(function (result) {
            return { ok: response.ok, result: result };
          });
        })
        .then(function (packed) {
          if (requestId !== phoneRequestId || controller.signal.aborted) return;
          var result = packed.result;

          if (
            packed.ok &&
            result &&
            result.ok === true &&
            result.normalized === normalized &&
            result.veriphone &&
            result.verificationToken
          ) {
            setPhoneStatus("valid");
            phoneVerification = result.veriphone;
            phoneVerificationToken = result.verificationToken;
            setPhoneError("");
            pushGtmEvent("phone_verification_passed", {
              funnel_id: FUNNEL_ID,
              phone_type: result.veriphone.phoneType,
              carrier: result.veriphone.carrier,
              country_code: result.veriphone.countryCode,
            });
            return;
          }

          setPhoneStatus("invalid");
          setPhoneError(
            (result && result.reason) || "No pudimos verificar el número ahora mismo. Intenta nuevamente.",
          );
          pushGtmEvent("phone_verification_failed", {
            funnel_id: FUNNEL_ID,
            validation_reason: (result && result.flags && result.flags.join(",")) || "request_failed",
          });
        })
        .catch(function (error) {
          if ((error && error.name === "AbortError") || requestId !== phoneRequestId) return;
          setPhoneStatus("invalid");
          setPhoneError("No pudimos verificar el número ahora mismo. Intenta nuevamente.");
          pushGtmEvent("phone_verification_failed", {
            funnel_id: FUNNEL_ID,
            validation_reason: "request_failed",
          });
        });
    }, 350);
  }

  // ---------- lead token / submit ----------

  function prepareLeadToken() {
    if (leadToken) return Promise.resolve(leadToken);

    return fetch("/api/lead-token", { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("No pudimos preparar el envio seguro. Intenta nuevamente.");
        return response.json().catch(function () { return null; });
      })
      .then(function (body) {
        var token = body && body.token;
        if (!token) throw new Error("No pudimos preparar el envio seguro. Intenta nuevamente.");
        leadToken = token;
        return token;
      });
  }

  function updateNameButton() {
    $("name-continue").disabled = !answers.firstName.trim() || !answers.lastName.trim();
  }

  function handleNameContinue() {
    if (!answers.firstName.trim() || !answers.lastName.trim()) return;

    $("submit-error").textContent = "";
    animateTo("contact");

    prepareLeadToken().catch(function (error) {
      $("submit-error").textContent =
        (error && error.message) || "No pudimos preparar el envio seguro. Intenta nuevamente.";
    });
  }

  function setSubmitting(isSubmitting) {
    $("submit-spinner").hidden = !isSubmitting;
    $("submit-arrow").style.display = isSubmitting ? "none" : "";
    $("submit-lead").disabled = isSubmitting || phoneStatus !== "valid";
  }

  function submitLead() {
    if (hasAgeRejectedCookie()) {
      rejectAndRedirect();
      return;
    }
    if (!answers.firstName.trim() || !answers.lastName.trim()) return;

    var normalized = normalizePhone(answers.phoneNumber);

    if (
      phoneStatus !== "valid" ||
      !phoneVerification ||
      !phoneVerificationToken ||
      phoneVerification.normalized !== normalized
    ) {
      setPhoneError(
        phoneStatus === "validating"
          ? "Espera mientras verificamos tu número."
          : "Ingresa un número móvil o fijo contactable.",
      );
      return;
    }

    if (!isValidEmail(answers.email)) {
      $("email-error").textContent = "Por favor, ingresa un correo válido.";
      return;
    }

    setPhoneError("");
    $("email-error").textContent = "";
    $("submit-error").textContent = "";

    if (submittedLead) {
      redirectToThanks(submittedLeadId);
      return;
    }

    setSubmitting(true);

    var resolvedZip = normalizeZip(answers.zipCode);

    fetch("/api/zip/" + resolvedZip + "?strict=zippopotam", { cache: "no-store" })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (zipData) {
        if (!isResolvedUsZip(zipData, resolvedZip)) {
          $("submit-error").textContent =
            "Necesitamos confirmar un ZIP code real para completar la solicitud.";
          animateTo("zip");
          throw new Error("__handled__");
        }
        if (zipData.state === BLOCKED_STATE) {
          rejectAndRedirect();
          throw new Error("__handled__");
        }

        answers.zipCode = resolvedZip;
        answers.state = zipData.state;
        answers.locationText = zipData.location || "";

        var hasCompleteData = [
          answers.ageGroup,
          answers.insuranceGoal,
          answers.retirementAge,
          answers.usaStatus,
          answers.state,
          answers.firstName.trim(),
          answers.lastName.trim(),
          normalized,
          answers.email.trim(),
          answers.locationText,
          answers.zipCode,
        ].every(Boolean);

        if (!hasCompleteData) {
          $("submit-error").textContent = "Necesitamos completar tu ubicación para enviar la solicitud.";
          animateTo("zip");
          throw new Error("__handled__");
        }

        var urlParams = new URLSearchParams(window.location.search);
        var sub1 = (urlParams.get("sub1") || "").trim();
        var sub2 = (urlParams.get("sub2") || "").trim();
        var adaccountName = (urlParams.get("adaccount_name") || "").trim();
        var rawAnswers = {
          ageGroup: answers.ageGroup,
          insuranceGoal: answers.insuranceGoal,
          retirementAge: answers.retirementAge,
          usaStatus: answers.usaStatus,
          state: answers.state,
          firstName: answers.firstName.trim(),
          lastName: answers.lastName.trim(),
          phoneNumber: normalized,
          email: answers.email.trim(),
          locationText: answers.locationText,
          zipCode: answers.zipCode,
          sub1: sub1,
          sub2: sub2,
        };
        var cleanedAnswers = {};
        for (var key in rawAnswers) {
          if (rawAnswers[key] !== "" && rawAnswers[key] != null) cleanedAnswers[key] = rawAnswers[key];
        }

        return prepareLeadToken().then(function (token) {
          return fetch("/api/lead-iul-v5", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-lead-token": token,
            },
            body: JSON.stringify({
              page: PAGE_PATH,
              answers: cleanedAnswers,
              meta: {
                deviceId: getOrCreateDeviceId(),
                trustedFormCertUrl: getTrustedFormCertUrl(),
                salePath: "lead",
                adaccountName: adaccountName,
                leadUrl: leadUrl || window.location.href,
                phoneVerification: phoneVerification,
                phoneVerificationToken: phoneVerificationToken,
              },
            }),
          });
        });
      })
      .then(function (response) {
        if (!response) return null;
        return response.json().catch(function () { return null; }).then(function (body) {
          if (!response.ok) {
            throw new Error((body && body.error) || "No pudimos enviar tu solicitud ahora mismo.");
          }
          return body;
        });
      })
      .then(function (body) {
        if (!body) return;
        var leadId = body.leadId || "";
        submittedLead = true;
        submittedLeadId = leadId;
        leadToken = "";

        var payload = getGtmLeadPayload();
        payload.event_id = createEventId("lead");
        payload.lead_id = leadId || undefined;
        payload.external_id = leadId || undefined;
        pushGtmEvent("Lead", payload);

        redirectToThanks(leadId);
      })
      .catch(function (error) {
        if (error && error.message === "__handled__") return;
        $("submit-error").textContent =
          (error && error.message) || "No pudimos enviar tu solicitud ahora mismo. Intenta nuevamente.";
      })
      .finally(function () {
        setSubmitting(false);
      });
  }

  function redirectToThanks(leadId) {
    var params = new URLSearchParams(window.location.search);
    params.set("funnel_id", FUNNEL_ID);
    if (leadId) params.set("lead_id", leadId);
    if (answers.firstName.trim()) params.set("first_name", answers.firstName.trim());
    if (answers.insuranceGoal) params.set("insurance_goal", answers.insuranceGoal);
    var search = params.toString() ? "?" + params.toString() : "";
    window.location.assign("/iul-v5/gracias.html" + search);
  }

  // ---------- loading + landing PPC ----------

  function startLoading() {
    var panelQ = $("panel-questionnaire");
    var panelLoading = $("panel-loading");
    panelQ.hidden = true;
    panelLoading.hidden = false;

    var startedAt = Date.now();
    var fill = $("loading-bar-fill");
    var checks = Array.prototype.slice.call(document.querySelectorAll(".loading-check"));

    loadingInterval = window.setInterval(function () {
      var elapsed = Date.now() - startedAt;
      var progress = Math.min(100, Math.round((elapsed / LOADING_DURATION_MS) * 100));
      fill.style.width = progress + "%";
      var visibleChecks = Math.min(checks.length, Math.floor((progress / 100) * (checks.length + 1)));
      checks.forEach(function (check, index) {
        check.classList.toggle("on", index < visibleChecks);
      });
    }, 60);

    loadingTimer = window.setTimeout(function () {
      window.clearInterval(loadingInterval);
      loadingInterval = null;
      fill.style.width = "100%";
      checks.forEach(function (check) { check.classList.add("on"); });

      var payload = getGtmLeadPayload();
      payload.event_id = createEventId("qualified");
      pushGtmEvent("v5_qualified", payload);

      showCallPanel();
    }, LOADING_DURATION_MS);
  }

  function showCallPanel() {
    $("panel-loading").hidden = true;
    var panel = $("panel-call");
    if (answers.firstName.trim()) {
      $("call-eyebrow").textContent = "¡Felicidades, " + answers.firstName.trim() + "! Estás calificado";
    }
    panel.hidden = false;
  }

  // ---------- TrustedForm ----------

  function injectTrustedForm() {
    if (document.getElementById("trustedform-certify-sdk")) return;

    var script = document.createElement("script");
    script.id = "trustedform-certify-sdk";
    script.type = "text/javascript";
    script.async = true;
    script.src =
      window.location.protocol +
      "//api.trustedform.com/trustedform.js?field=" +
      encodeURIComponent(TRUSTEDFORM_FIELD) +
      "&use_tagged_consent=true&l=" +
      Date.now() +
      Math.random();

    var firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    }
  }

  // ---------- listeners ----------

  function bindEvents() {
    $("back-btn").addEventListener("click", goBack);

    $("zip-code").addEventListener("input", function (event) {
      var zip = normalizeZip(event.target.value);
      event.target.value = zip;
      answers.zipCode = zip;
      $("zip-error").textContent = "";
      updateZipButton();
      scheduleZipLookup();
    });
    $("zip-continue").addEventListener("click", handleZipContinue);
    $("zip-code").addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        if (!$("zip-continue").disabled) handleZipContinue();
      }
    });

    $("first-name").addEventListener("input", function (event) {
      answers.firstName = event.target.value;
      updateNameButton();
    });
    $("last-name").addEventListener("input", function (event) {
      answers.lastName = event.target.value;
      updateNameButton();
    });
    $("name-continue").addEventListener("click", handleNameContinue);

    $("phone-number").addEventListener("input", function (event) {
      phoneRequestId += 1;
      if (phoneAbort) phoneAbort.abort();
      if (phoneDebounceTimer) {
        window.clearTimeout(phoneDebounceTimer);
        phoneDebounceTimer = null;
      }
      answers.phoneNumber = normalizePhone(event.target.value);
      event.target.value = formatPhone(answers.phoneNumber);
      hasBlurredPhone = false;
      phoneVerification = null;
      phoneVerificationToken = "";
      setPhoneStatus("idle");
      setPhoneError("");
      schedulePhoneVerification();
    });
    $("phone-number").addEventListener("blur", function () {
      if (normalizePhone(answers.phoneNumber).length !== 10) {
        hasBlurredPhone = true;
        schedulePhoneVerification();
      }
    });

    $("email").addEventListener("input", function (event) {
      answers.email = event.target.value;
      $("email-error").textContent = "";
    });

    $("step-contact").addEventListener("submit", function (event) {
      event.preventDefault();
      submitLead();
    });

    $("financial-continue").addEventListener("click", function () {
      if (answers.financialAccounts.length === 0) return;
      startLoading();
    });

    $("call-cta").addEventListener("click", function () {
      var payload = getGtmLeadPayload();
      payload.event_id = createEventId("contact");
      pushGtmEvent("Contact", payload);
    });
  }

  // ---------- init ----------

  function init() {
    if (hasAgeRejectedCookie()) {
      window.location.replace(REJECTED_URL);
      return;
    }

    renderAgeOptions();
    renderGoalOptions();
    renderRetirementOptions();
    renderStatusOptions();
    renderFinancialOptions();
    bindEvents();
    injectTrustedForm();

    // numero fijo (por si se cambia la constante sin tocar el HTML)
    var cta = $("call-cta");
    cta.setAttribute("href", "tel:" + PPC_PHONE_NUMBER);
    cta.querySelector(".num").childNodes.forEach(function (node) {
      if (node.nodeType === 3 && node.textContent.trim()) node.textContent = PPC_PHONE_DISPLAY;
    });

    showStep("age");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
