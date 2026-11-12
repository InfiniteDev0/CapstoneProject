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

/** The name of the page you're on, for the top bar and the tab title. */
export function pageTitle(pathname) {
  const exact = allPages.find((page) => page.url === pathname);
  if (exact) return exact.title;
  const last = pathname.split("/").filter(Boolean).pop();
  return last && last !== "dashboard" ? formatSegment(last) : "Dashboard";
}
