/*
 * The admin's small interactions: open/close the sidebar, clickable table rows,
 * the product form (subcategories, size presets, add/remove rows), and the dashboard charts.
 */
(function () {
  // ---- sidebar: hide/show (remembered), slides over the page on small screens ------------
  const sidebar = document.querySelector("[data-sidebar]");
  const KEY = "ls-admin-sidebar";
  const isDesktop = () => window.matchMedia("(min-width: 768px)").matches;
  function apply(open) {
    if (!sidebar) return;
    if (isDesktop()) {
      sidebar.classList.toggle("md:flex", open);
    } else {
      sidebar.classList.toggle("hidden", !open);
      sidebar.classList.toggle("flex", open);
      sidebar.classList.toggle("shadow-2xl", open);
    }
  }
  let open = (() => {
    try {
      return localStorage.getItem(KEY) !== "closed";
    } catch {
      return true;
    }
  })();
  if (isDesktop()) apply(open);
  document.querySelector("[data-sidebar-toggle]")?.addEventListener("click", () => {
    if (isDesktop()) {
      open = !open;
      try {
        localStorage.setItem(KEY, open ? "open" : "closed");
      } catch {}
      apply(open);
    } else {
      apply(sidebar.classList.contains("hidden"));
    }
  });
  document.addEventListener("click", (e) => {
    // on phones, a tap outside the sidebar closes it
    if (!isDesktop() && sidebar && !sidebar.classList.contains("hidden") && !sidebar.contains(e.target) && !e.target.closest("[data-sidebar-toggle]")) {
      apply(false);
    }
  });

  // ---- clickable table rows --------------------------------------------------------------
  document.addEventListener("click", (e) => {
    const row = e.target.closest("[data-href]");
    if (!row || e.target.closest("a, button, input, select, form")) return;
    window.pageLoading?.();
    location.href = row.dataset.href;
  });

  // ---- product form ----------------------------------------------------------------------
  const form = document.querySelector("[data-product-form]");
  if (form) {
    // Only show the types that belong to the chosen category
    const category = form.querySelector("[data-category]");
    const sub = form.querySelector("[data-subcategory]");
    function filterTypes() {
      let firstVisible = null;
      [...sub.options].forEach((o) => {
        const show = o.dataset.for === category.value;
        o.hidden = !show;
        o.disabled = !show;
        if (show && !firstVisible) firstVisible = o;
      });
      if (sub.selectedOptions[0]?.hidden && firstVisible) firstVisible.selected = true;
    }
    category?.addEventListener("change", filterTypes);
    if (category && sub) filterTypes();

    // Size presets
    form.addEventListener("click", (e) => {
      const preset = e.target.closest("[data-sizes]");
      if (preset) form.querySelector("#sizes").value = preset.dataset.sizes;
    });

    // Add / remove rows (details and colours)
    let nextIndex = form.querySelectorAll('[data-rows="colours"] [data-row]').length;
    form.addEventListener("click", (e) => {
      const add = e.target.closest("[data-add-row]");
      if (add) {
        const name = add.dataset.addRow;
        const template = form.querySelector(`template[data-template="${name}"]`);
        const html = template.innerHTML.replaceAll("__i__", String(nextIndex++));
        form.querySelector(`[data-rows="${name}"]`).insertAdjacentHTML("beforeend", html);
        return;
      }
      const remove = e.target.closest("[data-remove-row]");
      if (remove) {
        const rows = remove.closest("[data-rows]");
        if (rows.dataset.rows === "colours" && rows.querySelectorAll("[data-row]").length <= 1) {
          toast("A product needs at least one colour", "error");
          return;
        }
        remove.closest("[data-row]").remove();
      }
    });
  }

  // ---- dashboard charts (Chart.js) -------------------------------------------------------
  const data = window.DASHBOARD;
  if (data && window.Chart) {
    Chart.defaults.font.family = "Outfit, ui-sans-serif, system-ui";
    Chart.defaults.color = "#6b6b6b";
    const money = (v) => "$" + Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 });

    const sales = document.getElementById("salesChart");
    if (sales && data.months.length) {
      new Chart(sales, {
        type: "bar",
        data: {
          labels: data.months,
          datasets: [{ label: "Revenue", data: data.revenue.map(Number), backgroundColor: "#101010", borderRadius: 6, maxBarThickness: 36 }],
        },
        options: {
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => money(c.parsed.y) } } },
          scales: { x: { grid: { display: false } }, y: { grid: { color: "#ececec" }, border: { display: false }, ticks: { callback: money } } },
        },
      });
    }

    const cats = document.getElementById("categoryChart");
    if (cats && data.categories.length) {
      new Chart(cats, {
        type: "doughnut",
        data: {
          labels: data.categories.map((c) => c.charAt(0).toUpperCase() + c.slice(1)),
          datasets: [{ data: data.categoryRevenue.map(Number), backgroundColor: ["#101010", "#dc143c", "#9a9a9a", "#d4d4d4"], borderWidth: 0 }],
        },
        options: {
          maintainAspectRatio: false,
          cutout: "62%",
          plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: (c) => `${c.label}: ${money(c.parsed)}` } } },
        },
      });
    }
  }
})();
