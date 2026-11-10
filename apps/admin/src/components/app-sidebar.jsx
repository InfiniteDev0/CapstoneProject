"use client";

import Image from "next/image";
import Link from "next/link";
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
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Placeholder until Phase 3 gives us the logged-in admin from the JWT
const adminUser = {
  name: "Vela Noire",
  email: "admin@velanoire.local",
  avatar: "",
};

// The capstone admin portal: every item maps to a requirement in the school spec
const navMain = [
  { title: "Dashboard", url: "/dashboard", icon: <LayoutDashboard />, isActive: true },
  {
    title: "Products",
    url: "/dashboard/products",
    icon: <Shirt />,
    items: [
      { title: "All Products", url: "/dashboard/products" },
      { title: "Add Product", url: "/dashboard/products/new" },
      { title: "Inventory", url: "/dashboard/products/inventory" },
    ],
  },
  {
    title: "Collections",
    url: "/dashboard/collections",
    icon: <Gem />,
    items: [
      { title: "Rare Collectibles", url: "/dashboard/collections/rare-collectibles" },
      { title: "Infinity Bride", url: "/dashboard/collections/infinity-bride" },
      { title: "Modern Muse", url: "/dashboard/collections/modern-muse" },
      { title: "Lux Infinity", url: "/dashboard/collections/lux-infinity" },
      { title: "Traditions Reimagined", url: "/dashboard/collections/traditions-reimagined" },
      { title: "Simplicity Speaks", url: "/dashboard/collections/simplicity-speaks" },
      { title: "Seasonal", url: "/dashboard/collections/seasonal" },
    ],
  },
  { title: "Orders", url: "/dashboard/orders", icon: <Receipt /> },
  { title: "Customers", url: "/dashboard/customers", icon: <Users /> },
  { title: "Churn Risk", url: "/dashboard/churn", icon: <ShieldAlert /> },
  { title: "Model Health", url: "/dashboard/models", icon: <BrainCircuit /> },
  { title: "Settings", url: "/dashboard/settings", icon: <Settings2 /> },
];

export function AppSidebar(props) {
  return (
    <Sidebar className="top-(--header-height) h-[calc(100svh-var(--header-height))]!" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" className="flex items-center">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black text-xs tracking-tight text-white">
                  VN
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <Image src="/logo.png" width={100} height={38} alt="Vela Noire" />
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={adminUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
