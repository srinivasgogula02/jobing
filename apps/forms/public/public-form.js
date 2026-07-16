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

  document.addEventListener("DOMContentLoaded", function () {
    var current = elements();
    if (!current.form) return;
    ensureSubmissionId(current.form);

    current.form.addEventListener("submit", function (event) {
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
      current.button.textContent = "Send response";
    }
  });
})();
