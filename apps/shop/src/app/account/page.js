import AccountHome from "@/components/account/AccountHome";

export const metadata = { title: "My Vela Noire" };

// Protected by src/proxy.js: guests are sent to /login first.
export default function AccountPage() {
  return <AccountHome />;
}
