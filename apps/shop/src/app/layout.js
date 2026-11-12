// Fonts are stored locally (no Google download at startup, works offline for the demo)
import "@fontsource-variable/outfit";
import "@fontsource/birthstone";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import SiteChrome from "@/components/shared/SiteChrome";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CartProvider } from "@/components/providers/CartProvider";

export const metadata = {
  title: {
    default: "Vela Noire | Luxury Reimagined for Her",
    template: "%s | Vela Noire",
  },
  description:
    "Vela Noire: luxury modest fashion. Abayas, fragrance, handbags, shayla and accessories, curated for the woman who chooses elegance without compromise.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthProvider>
          <CartProvider>
            <SiteChrome>{children}</SiteChrome>
          </CartProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
