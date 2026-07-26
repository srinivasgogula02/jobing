(function () {
  "use strict";

  function elements() {
    var form = document.querySelector("[data-public-form]");
    return {
      form: form,
      button: form && form.querySelector("[data-submit-button]"),
    };
  }

  function loadScript(src) {
    var script = document.createElement("script");
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  }

  function initializeAnalytics() {
    var root = document.documentElement;
    var formId = root.getAttribute("data-form-id") || "unknown";
    var measurementId = root.getAttribute("data-google-analytics");
    var pixelId = root.getAttribute("data-facebook-pixel");
    var submitted = root.getAttribute("data-submitted") === "true";

    if (measurementId) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", measurementId, { anonymize_ip: true });
      loadScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId));
      window.gtag("event", submitted ? "form_submit" : "form_view", { form_id: formId });
    }

    if (pixelId) {
      window.fbq = window.fbq || function () {
        if (window.fbq.callMethod) window.fbq.callMethod.apply(window.fbq, arguments);
        else window.fbq.queue.push(arguments);
      };
      window.fbq.queue = window.fbq.queue || [];
      window.fbq.loaded = true;
      window.fbq.version = "2.0";
      loadScript("https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", pixelId);
      window.fbq("track", submitted ? "Lead" : "ViewContent", { content_name: formId });
    }
  }

  function trackStart(formId) {
    if (typeof window.gtag === "function") window.gtag("event", "form_start", { form_id: formId });
    if (typeof window.fbq === "function") window.fbq("trackCustom", "FormStart", { content_name: formId });
  }

  function ensureSubmissionId(form) {
    var input = form && form.querySelector('input[name="_submission_id"]');
    if (!input || input.value) return;
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      input.value = window.crypto.randomUUID();
      return;
    }
    input.value = "web-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  }

  function fieldValues(form, key) {
    var named = form.elements.namedItem(key);
    var controls = named ? (named.length && !named.tagName ? Array.prototype.slice.call(named) : [named]) : [];
    return controls
      .filter(function (control) { return !control.disabled && (control.type !== "checkbox" && control.type !== "radio" || control.checked); })
      .map(function (control) { return String(control.value || "").trim(); })
      .filter(Boolean);
  }

  function matches(condition, actual) {
    var expected = String(condition.value || "").trim();
    if (condition.operator === "is_empty") return actual.length === 0;
    if (condition.operator === "is_not_empty") return actual.length > 0;
    if (condition.operator === "equals") return actual.indexOf(expected) !== -1;
    if (condition.operator === "not_equals") return actual.indexOf(expected) === -1;
    if (condition.operator === "contains") return actual.some(function (value) { return value.toLowerCase().indexOf(expected.toLowerCase()) !== -1; });
    if (condition.operator === "not_contains") return actual.every(function (value) { return value.toLowerCase().indexOf(expected.toLowerCase()) === -1; });
    var left = Number(actual[0]);
    var right = Number(expected);
    if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
    return condition.operator === "greater_than" ? left > right : left < right;
  }

  function updateForm(form) {
    Array.prototype.forEach.call(form.querySelectorAll("[data-condition]"), function (field) {
      var condition;
      try { condition = JSON.parse(field.getAttribute("data-condition")); } catch { return; }
      var visible = matches(condition, fieldValues(form, condition.fieldKey));
      field.hidden = !visible;
      Array.prototype.forEach.call(field.querySelectorAll("input,textarea,select"), function (control) {
        control.disabled = !visible;
        control.required = visible && field.getAttribute("data-required") === "true";
      });
    });
    var visibleFields = Array.prototype.slice.call(form.querySelectorAll("[data-field-key]")).filter(function (field) { return !field.hidden; });
    var answered = visibleFields.filter(function (field) { return fieldValues(form, field.getAttribute("data-field-key")).length > 0; }).length;
    var percent = visibleFields.length ? Math.round(answered / visibleFields.length * 100) : 0;
    var bar = form.querySelector("[data-progress-bar]");
    var label = form.querySelector("[data-progress-label]");
    if (bar) bar.style.width = percent + "%";
    if (label) label.textContent = percent + "% complete";
  }

  document.addEventListener("DOMContentLoaded", function () {
    initializeAnalytics();
    var current = elements();
    if (!current.form) return;
    var started = false;
    var formId = document.documentElement.getAttribute("data-form-id") || "unknown";
    ensureSubmissionId(current.form);
    updateForm(current.form);
    function onAnswer() {
      if (!started) {
        started = true;
        trackStart(formId);
      }
      updateForm(current.form);
    }
    current.form.addEventListener("input", onAnswer);
    current.form.addEventListener("change", onAnswer);

    current.form.addEventListener("submit", function () {
      ensureSubmissionId(current.form);
      if (current.button) {
        current.button.disabled = true;
        current.button.textContent = "Sending…";
      }
    });
  });

  window.addEventListener("pageshow", function (event) {
    if (!event.persisted) return;
    var current = elements();
    if (current.button) {
      current.button.disabled = false;
      current.button.textContent = current.button.getAttribute("data-default-label") || "Send response";
    }
  });
})();
