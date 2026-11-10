// Fonts are stored locally (no Google download at startup, works offline for the demo)
import "@fontsource-variable/outfit";
import "@fontsource-variable/geist-mono";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
  title: { default: "Vela Noire Admin", template: "%s | Vela Noire Admin" },
  description: "Admin dashboard for Vela Noire",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-zinc-50 font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
