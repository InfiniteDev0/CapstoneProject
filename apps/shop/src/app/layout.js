import { Birthstone, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import SiteChrome from "@/components/shared/SiteChrome";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const birthstone = Birthstone({
  variable: "--font-birthstone",
  subsets: ["latin"],
  weight: ["400"],
});

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
      <body className={`${outfit.variable} ${birthstone.variable} font-sans antialiased`}>
        <SiteChrome>{children}</SiteChrome>
        <Toaster />
      </body>
    </html>
  );
}
