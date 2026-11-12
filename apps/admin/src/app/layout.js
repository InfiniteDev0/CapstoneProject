// Fonts are stored locally (no Google download at startup, works offline for the demo)
import "@fontsource-variable/outfit";
import "@fontsource-variable/geist-mono";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AdminAuthProvider } from "@/components/providers/admin-auth";

export const metadata = {
  title: { default: "Vela Noire Admin", template: "%s | Vela Noire Admin" },
  description: "Admin dashboard for Vela Noire",
};

// Put the saved theme on <html> before the page paints, so dark mode doesn't flash white.
const themeScript = `try{if(localStorage.getItem("vn-admin-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-zinc-50 font-sans dark:bg-background">
        <AdminAuthProvider>{children}</AdminAuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
