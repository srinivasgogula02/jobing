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

  window.jobingTurnstileReady = function () {
    update("Security check complete.", true);
  };

  window.jobingTurnstileError = function () {
    update("The security check could not load. Disable content blockers for this page, then reload it.", false);
  };

  window.jobingTurnstileExpired = function () {
    update("The security check expired. Complete it again to send your response.", false);
  };

  document.addEventListener("DOMContentLoaded", function () {
    var current = elements();
    if (!current.form) return;

    current.form.addEventListener("submit", function (event) {
      var token = current.form.querySelector('input[name="cf-turnstile-response"]');
      if (!token || !token.value) {
        event.preventDefault();
        update("Complete the security check before sending your response.", false);
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
        update("Still checking your browser. If this does not finish, disable content blockers for this page and reload it.", false);
      }
    }, 10000);
  });

  window.addEventListener("pageshow", function (event) {
    if (!event.persisted) return;
    update("Checking your browser again…", false);
    if (window.turnstile) window.turnstile.reset();
  });
})();
