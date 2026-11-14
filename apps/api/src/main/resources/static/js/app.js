/*
 * Shared by the shop and the admin:
 *  - send(): a fetch() that carries the CSRF token and turns errors into readable messages
 *  - the thin loading bar while a page loads
 *  - dropdowns that close when you click anywhere else
 *  - "Are you sure?" for forms marked data-confirm
 *  - buttons that show a spinner while their form submits
 */
(function () {
  const csrfToken = document.querySelector('meta[name="_csrf"]')?.content;
  const csrfHeader = document.querySelector('meta[name="_csrf_header"]')?.content || "X-CSRF-TOKEN";

  /** POST/PATCH/DELETE JSON to the server. Resolves with the JSON reply, or rejects with an Error(message). */
  async function send(url, method = "POST", body) {
    const headers = { Accept: "application/json" };
    if (csrfToken) headers[csrfHeader] = csrfToken;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    let res;
    try {
      res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), credentials: "same-origin" });
    } catch {
      throw Object.assign(new Error("We couldn't reach the shop. Check your connection and try again."), { status: 0 });
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message =
        res.status === 401 ? "Please log in first"
        : res.status === 403 ? "Your session expired. Please refresh the page."
        : data?.message || "Something went wrong. Please try again.";
      throw Object.assign(new Error(message), { status: res.status });
    }
    return data;
  }
  window.send = send;

  /** Show a spinner in a button while work happens. */
  window.busy = function (button, on) {
    if (!button) return;
    if (on) {
      button.dataset.label = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<span class="spinner"></span>';
    } else {
      button.disabled = false;
      if (button.dataset.label) button.innerHTML = button.dataset.label;
    }
  };

  // ---- loading bar --------------------------------------------------------------------
  const bar = document.getElementById("loadbar");
  const startBar = () => bar && bar.classList.add("busy");
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || a.target === "_blank" || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("javascript")) return;
    startBar();
  });
  window.addEventListener("pageshow", () => bar && bar.classList.remove("busy"));

  // ---- forms: confirm + spinner -------------------------------------------------------
  document.addEventListener("submit", (e) => {
    const form = e.target;
    if (form.dataset.confirm && !window.confirm(form.dataset.confirm)) {
      e.preventDefault();
      return;
    }
    if (form.method.toLowerCase() === "get" || form.hasAttribute("data-no-spinner")) {
      startBar();
      return;
    }
    const button = e.submitter || form.querySelector('[type="submit"]');
    if (button && !button.hasAttribute("data-no-spinner")) setTimeout(() => busy(button, true), 0);
    startBar();
  });

  // ---- dropdowns ----------------------------------------------------------------------
  document.addEventListener("click", (e) => {
    const toggle = e.target.closest("[data-dropdown-toggle]");
    document.querySelectorAll("[data-dropdown]").forEach((box) => {
      const menu = box.querySelector("[data-dropdown-menu]");
      if (!menu) return;
      if (toggle && box.contains(toggle)) {
        menu.hidden = !menu.hidden;
      } else if (!box.contains(e.target)) {
        menu.hidden = true; // a click anywhere else closes it
      }
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.querySelectorAll("[data-dropdown-menu]").forEach((m) => (m.hidden = true));
  });
})();
