/*
 * The shop's small interactions: mobile menu, likes, the product page (colour, size,
 * Add to Bag), bag quantities, newsletter, and the Swiper carousels.
 */
(function () {
  const loginUrl = () => "/login";

  function needsLogin(err) {
    if (err.status === 401) {
      toast("Please log in first", "info");
      setTimeout(() => (location.href = loginUrl()), 900);
      return true;
    }
    return false;
  }

  function setBagCount(count) {
    document.querySelectorAll("[data-bag-count]").forEach((badge) => {
      badge.textContent = count;
      badge.hidden = !count;
    });
  }

  // ---- mobile menu (opens from the left, closes on outside click or Escape) --------------
  const menu = document.querySelector("[data-menu]");
  document.querySelector("[data-menu-open]")?.addEventListener("click", () => {
    if (menu) menu.hidden = false;
  });
  menu?.addEventListener("click", (e) => {
    if (e.target.closest("[data-menu-close]") || !e.target.closest("[data-menu-panel]")) menu.hidden = true;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu) menu.hidden = true;
  });

  // ---- likes (hearts on cards and on the product page) ----------------------------------
  document.addEventListener("click", async (e) => {
    const button = e.target.closest("[data-like]");
    if (!button) return;
    e.preventDefault();
    const id = button.dataset.like;
    try {
      const { liked } = await send(`/web/likes/${encodeURIComponent(id)}`);
      document.querySelectorAll(`[data-like="${CSS.escape(id)}"]`).forEach((b) => {
        b.classList.toggle("is-liked", liked);
        b.setAttribute("aria-pressed", String(liked));
      });
      toast(liked ? "Added to favourites" : "Removed from favourites", liked ? "success" : "info");
    } catch (err) {
      if (!needsLogin(err)) toast(err.message, "error");
    }
  });

  // ---- product page: colour + size + Add to Bag ------------------------------------------
  const product = document.querySelector("[data-product]");
  if (product) {
    const colourLabel = product.querySelector("[data-colour-label]");
    const stockLabel = product.querySelector("[data-stock-label]");
    const addButton = product.querySelector("[data-add-to-bag]");
    const sizeHint = product.querySelector("[data-size-hint]");
    const needsSize = product.dataset.sized === "true";

    function chosenColour() {
      return product.querySelector('input[name="sku"]:checked');
    }
    function chosenSize() {
      return product.querySelector('input[name="size"]:checked')?.value;
    }
    function refresh() {
      const colour = chosenColour();
      if (!colour) return;
      const stock = Number(colour.dataset.stock || 0);
      if (colourLabel) colourLabel.textContent = colour.dataset.name;
      if (stockLabel) {
        stockLabel.textContent = stock === 0 ? "Sold out in this colour" : stock <= 5 ? `Only ${stock} left` : "In stock";
        stockLabel.dataset.state = stock === 0 ? "out" : stock <= 5 ? "low" : "ok";
      }
      if (addButton) addButton.disabled = stock === 0;
    }
    product.addEventListener("change", (e) => {
      if (e.target.name === "sku") refresh();
      if (e.target.name === "size" && sizeHint) sizeHint.hidden = true;
    });
    refresh();

    addButton?.addEventListener("click", async () => {
      const colour = chosenColour();
      const size = chosenSize();
      if (needsSize && !size) {
        if (sizeHint) sizeHint.hidden = false;
        toast("Please choose a size", "error");
        return;
      }
      busy(addButton, true);
      try {
        const bag = await send("/web/cart", "POST", {
          productId: product.dataset.product,
          sku: colour.value,
          quantity: 1,
          selectedSize: size || null,
        });
        setBagCount(bag.count);
        toast("Added to bag");
      } catch (err) {
        if (!needsLogin(err)) toast(err.message, "error");
      } finally {
        busy(addButton, false);
        refresh();
      }
    });
  }

  // ---- product photos: click a thumbnail to show it big ------------------------------------
  document.addEventListener("click", (e) => {
    const thumb = e.target.closest("[data-photo]");
    const main = document.getElementById("main-photo");
    if (thumb && main) main.src = thumb.dataset.photo;
  });

  // ---- bag page: quantity and remove -----------------------------------------------------
  document.querySelectorAll("[data-bag-line]").forEach((line) => {
    const id = line.dataset.bagLine;
    const qty = line.querySelector("[data-qty]");
    async function change(method, body, button) {
      busy(button, true);
      try {
        await send(`/web/cart/${id}`, method, body);
        location.reload(); // simplest way to show fresh totals
      } catch (err) {
        busy(button, false);
        if (!needsLogin(err)) toast(err.message, "error");
      }
    }
    line.querySelector("[data-qty-minus]")?.addEventListener("click", (e) => {
      const n = Number(qty.textContent);
      if (n > 1) change("PATCH", { quantity: n - 1 }, e.currentTarget);
    });
    line.querySelector("[data-qty-plus]")?.addEventListener("click", (e) => {
      change("PATCH", { quantity: Number(qty.textContent) + 1 }, e.currentTarget);
    });
    line.querySelector("[data-remove]")?.addEventListener("click", (e) => change("DELETE", undefined, e.currentTarget));
  });

  // ---- checkout card form: "4242 4242 4242 4242" and "MM/YY" as you type ----------------
  document.querySelector("[data-card-number]")?.addEventListener("input", (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 19);
    e.target.value = digits.replace(/(.{4})/g, "$1 ").trim();
  });
  document.querySelector("[data-card-expiry]")?.addEventListener("input", (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
    e.target.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  });

  // ---- newsletter (a front-end placeholder for now) --------------------------------------
  document.querySelector("[data-newsletter]")?.addEventListener("submit", (e) => {
    e.preventDefault();
    e.target.reset();
    toast("Thanks! Newsletter sign-up is coming soon", "info");
  });

  // ---- Swiper carousels (Related Products; "Recommended For You" later) -------------------
  if (window.Swiper) {
    document.querySelectorAll("[data-swiper]").forEach((el) => {
      new Swiper(el, {
        slidesPerView: 1.3,
        spaceBetween: 16,
        navigation: { nextEl: el.querySelector(".swiper-next"), prevEl: el.querySelector(".swiper-prev") },
        breakpoints: { 640: { slidesPerView: 2.3 }, 1024: { slidesPerView: 4 } },
      });
    });
  }
})();
