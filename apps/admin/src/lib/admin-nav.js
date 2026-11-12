import {
  BrainCircuit,
  Gem,
  LayoutDashboard,
  Receipt,
  Settings2,
  ShieldAlert,
  Shirt,
  Users,
} from "lucide-react";

// Placeholder until the admin login is wired to the Java JWT (Phase 4)
export const adminUser = {
  name: "Vela Noire",
  email: "admin@velanoire.local",
  role: "Admin",
  avatar: "",
};

// The capstone admin portal: every item maps to a requirement in the school spec.
// Used by the sidebar, the top bar's page title and the search palette.
export const navMain = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  {
    title: "Products",
    url: "/dashboard/products",
    icon: Shirt,
    items: [
      { title: "All Products", url: "/dashboard/products" },
      { title: "Add Product", url: "/dashboard/products/new" },
      { title: "Inventory", url: "/dashboard/products/inventory" },
    ],
  },
  {
    title: "Collections",
    url: "/dashboard/collections",
    icon: Gem,
    items: [
      { title: "Seasonal", url: "/dashboard/collections/seasonal" },
      { title: "Modern Muse", url: "/dashboard/collections/modern-muse" },
      { title: "Traditions Reimagined", url: "/dashboard/collections/traditions-reimagined" },
      { title: "Simplicity Speaks", url: "/dashboard/collections/simplicity-speaks" },
    ],
  },
  { title: "Orders", url: "/dashboard/orders", icon: Receipt },
  { title: "Customers", url: "/dashboard/customers", icon: Users },
  { title: "Churn Risk", url: "/dashboard/churn", icon: ShieldAlert },
  { title: "Model Health", url: "/dashboard/models", icon: BrainCircuit },
  { title: "Settings", url: "/dashboard/settings", icon: Settings2 },
];

/** Every page, flat, for the search palette: { title, url, icon, parent } */
export const allPages = navMain.flatMap((item) => [
  { title: item.title, url: item.url, icon: item.icon },
  ...(item.items ?? [])
    .filter((sub) => sub.url !== item.url)
    .map((sub) => ({ title: sub.title, url: sub.url, icon: item.icon, parent: item.title })),
]);

/** Is this menu link the page you're on (or a page under it)? */
export function isActiveLink(pathname, url) {
  if (url === "/dashboard") return pathname === "/dashboard";
  return pathname === url || pathname.startsWith(url + "/");
}

function formatSegment(segment) {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * The trail to the page you're on, after "Vela Noire" (which already links to the dashboard):
 * /dashboard → [Dashboard];  /dashboard/products/inventory → [Products, Inventory].
 */
export function breadcrumbs(pathname) {
  const parts = pathname.split("/").filter(Boolean); // ["dashboard", "products", "inventory"]
  const trail = parts.map((part, i) => {
    const url = "/" + parts.slice(0, i + 1).join("/");
    const page = navMain.find((item) => item.url === url) ?? allPages.find((p) => p.url === url);
    return { url, title: page?.title ?? formatSegment(part) };
  });
  return trail.length > 1 ? trail.slice(1) : trail;
}

/** The name of the page you're on, for the top bar and the tab title. */
export function pageTitle(pathname) {
  const exact = allPages.find((page) => page.url === pathname);
  if (exact) return exact.title;
  const last = pathname.split("/").filter(Boolean).pop();
  return last && last !== "dashboard" ? formatSegment(last) : "Dashboard";
}
