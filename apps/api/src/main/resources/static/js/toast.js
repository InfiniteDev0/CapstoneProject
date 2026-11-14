/*
 * The Under-Armour toast, in plain JavaScript: a white card at the top right with a
 * coloured icon, Bebas Neue text and a progress bar. It closes after 3 seconds,
 * has no close button, and can be dragged sideways to dismiss.
 *   toast("Added to bag")            green tick
 *   toast("Out of stock", "error")   crimson
 *   toast("Saved for later", "info") black
 */
(function () {
  const ICONS = {
    success: '<path d="M20 6 9 17l-5-5"/>',
    error: '<path d="M12 8v4M12 16h.01"/>',
    info: '<path d="M12 16v-4M12 8h.01"/>',
  };

  function toast(message, type) {
    const kind = ICONS[type] ? type : "success";
    const host = document.getElementById("toasts");
    if (!host || !message) return;

    const el = document.createElement("div");
    el.className = "ua-toast " + kind;
    el.setAttribute("role", kind === "error" ? "alert" : "status");
    el.innerHTML =
      '<span class="toast-icon"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
      ICONS[kind] + '</svg></span><span class="toast-text"></span><span class="toast-bar"></span>';
    el.querySelector(".toast-text").textContent = message; // text only: never inject HTML
    host.prepend(el);

    let gone = false;
    const close = () => {
      if (gone) return;
      gone = true;
      el.classList.add("leaving");
      el.addEventListener("animationend", () => el.remove(), { once: true });
    };
    const timer = setTimeout(close, 3000);

    // Drag sideways to dismiss
    let startX = null;
    el.addEventListener("pointerdown", (e) => {
      startX = e.clientX;
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", (e) => {
      if (startX === null) return;
      el.style.transform = `translateX(${Math.max(0, e.clientX - startX)}px)`;
    });
    el.addEventListener("pointerup", (e) => {
      const moved = startX === null ? 0 : e.clientX - startX;
      startX = null;
      if (moved > 80) {
        clearTimeout(timer);
        close();
      } else {
        el.style.transform = "";
      }
    });
  }

  window.toast = toast;

  // A message left by the server before a redirect ("Profile saved")
  document.addEventListener("DOMContentLoaded", () => {
    const flash = document.getElementById("flash");
    if (flash) toast(flash.dataset.message, flash.dataset.type);
  });
})();
