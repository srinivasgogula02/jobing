(function () {
  "use strict";

  function elements() {
    var form = document.querySelector("[data-public-form]");
    return {
      form: form,
      button: form && form.querySelector("[data-submit-button]"),
      status: form && form.querySelector("[data-turnstile-status]"),
    };
  }

  function update(message, ready) {
    var current = elements();
    if (current.status) current.status.textContent = message;
    if (current.button) current.button.disabled = !ready;
    if (current.form) current.form.dataset.securityReady = ready ? "true" : "false";
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

  window.jobingTurnstileReady = function () {
    update("Security check complete.", true);
  };

  window.jobingTurnstileError = function () {
    update("The security check is retrying…", false);
  };

  window.jobingTurnstileExpired = function () {
    update("Refreshing the security check…", false);
  };

  document.addEventListener("DOMContentLoaded", function () {
    var current = elements();
    if (!current.form) return;
    ensureSubmissionId(current.form);

    current.form.addEventListener("submit", function (event) {
      ensureSubmissionId(current.form);
      var token = current.form.querySelector('input[name="cf-turnstile-response"]');
      if (!token || !token.value) {
        event.preventDefault();
        update("Finishing the security check…", false);
        if (window.turnstile) window.turnstile.reset();
        return;
      }
      if (current.button) {
        current.button.disabled = true;
        current.button.textContent = "Sending…";
      }
      if (current.status) current.status.textContent = "Security check complete. Sending your response…";
    });

    window.setTimeout(function () {
      if (current.form.dataset.securityReady !== "true") {
        update("Still checking your browser. If this does not finish, allow the security check for this page and reload it.", false);
      }
    }, 10000);
  });

  window.addEventListener("pageshow", function (event) {
    if (!event.persisted) return;
    update("Checking your browser again…", false);
    if (window.turnstile) window.turnstile.reset();
  });
})();
