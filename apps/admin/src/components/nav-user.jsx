"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  ChevronsUpDownIcon,
  BadgeCheckIcon,
  CreditCardIcon,
  BellIcon,
  LogOutIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { notify } from "@/lib/toast";
import { useAdminAuth } from "@/components/providers/admin-auth";

/** The black account card at the bottom of the sidebar: the signed-in admin, and Log out. */
export function NavUser() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { user: me, logout } = useAdminAuth();
  const user = { name: me?.name ?? "Admin", email: me?.email ?? "", avatar: "" };

  function handleSignOut() {
    logout();
    notify.success("Signed out");
    router.replace("/login");
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              tooltip={user.name}
              className="cursor-pointer bg-black text-white hover:bg-zinc-800 hover:text-white data-[state=open]:bg-zinc-800 data-[state=open]:text-white"
            >
              {/* Square tile, no ring: open it sits inside the black card, folded it IS the card */}
              <Avatar className="size-8 rounded-md after:hidden">
                <AvatarImage src={user.avatar} alt={user.name} className="rounded-md" />
                <AvatarFallback className="rounded-md bg-white/15 text-xs font-medium text-white">VN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
