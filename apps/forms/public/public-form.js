(function () {
  "use strict";

  function elements() {
    var form = document.querySelector("[data-public-form]");
    return {
      form: form,
      button: form && form.querySelector("[data-submit-button]"),
    };
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
    var current = elements();
    if (!current.form) return;
    ensureSubmissionId(current.form);
    updateForm(current.form);
    current.form.addEventListener("input", function () { updateForm(current.form); });
    current.form.addEventListener("change", function () { updateForm(current.form); });

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
