(function () {
  "use strict";

  var FORM_PATH = /^\/f\/frm_[a-zA-Z0-9_-]+$/;

  function statusElement(form) {
    var existing = form.querySelector("[data-jobing-form-status]");
    if (existing) return existing;
    var element = document.createElement("div");
    element.setAttribute("data-jobing-form-status", "");
    element.setAttribute("role", "status");
    element.setAttribute("aria-live", "polite");
    element.hidden = true;
    form.appendChild(element);
    return element;
  }

  function endpoint(form) {
    try {
      var url = new URL(form.action, window.location.href);
      if (url.origin !== "https://jobing.site" || !FORM_PATH.test(url.pathname)) return null;
      return url;
    } catch {
      return null;
    }
  }

  document.addEventListener("submit", async function (event) {
    var form = event.target;
    if (!(form instanceof HTMLFormElement) || form.method.toLowerCase() !== "post") return;
    var url = endpoint(form);
    if (!url) return;

    event.preventDefault();
    if (form.dataset.jobingSubmitting === "true") return;

    var status = statusElement(form);
    var submitters = Array.from(form.querySelectorAll('button[type="submit"],input[type="submit"]'));
    var submissionId = window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
    var data = new FormData(form);
    if (!data.has("_submission_id")) data.set("_submission_id", submissionId);

    form.dataset.jobingSubmitting = "true";
    form.setAttribute("aria-busy", "true");
    submitters.forEach(function (button) { button.disabled = true; });
    status.hidden = false;
    status.dataset.state = "submitting";
    status.textContent = "Sending…";

    try {
      var response = await fetch(url, {
        method: "POST",
        body: data,
        headers: { accept: "application/json", "idempotency-key": submissionId },
        credentials: "omit",
      });
      var payload = await response.json().catch(function () { return {}; });
      if (!response.ok) throw new Error(payload.error && payload.error.message || "The form could not be submitted.");

      var result = payload.data || {};
      if (result.redirectUrl) {
        window.location.assign(result.redirectUrl);
        return;
      }

      form.reset();
      status.dataset.state = "success";
      status.textContent = result.message || "Thanks! Your response has been received.";
      form.dispatchEvent(new CustomEvent("jobing:form-success", { bubbles: true, detail: result }));
    } catch (error) {
      status.dataset.state = "error";
      status.setAttribute("role", "alert");
      status.textContent = error instanceof Error ? error.message : "The form could not be submitted.";
      form.dispatchEvent(new CustomEvent("jobing:form-error", { bubbles: true, detail: { error: error } }));
    } finally {
      delete form.dataset.jobingSubmitting;
      form.removeAttribute("aria-busy");
      submitters.forEach(function (button) { button.disabled = false; });
    }
  }, true);
})();
