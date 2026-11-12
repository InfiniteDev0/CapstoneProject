import AccountShell from "@/components/account/AccountShell";

// Every /account page is protected by src/proxy.js and shares the tabs.
export default function AccountLayout({ children }) {
  return <AccountShell>{children}</AccountShell>;
}
