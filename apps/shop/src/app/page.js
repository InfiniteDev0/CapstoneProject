import Hero from "@/components/home/Hero";

// Phase 1: the Hero uses a local photo. In Phase 4 this comes from the Java API.
const featured = {
  name: "Vela Noire",
  slug: "",
  tagline:
    "Where modesty meets luxury. Timeless abayas, fragrance and accessories for the woman who walks with purpose.",
  heroImage: "/assets/images/abaya.webp",
};

export default function Home() {
  return (
    <Hero
      collection={featured}
      cta={{ label: "Luxury Reimagined for Her", href: "/" }}
    />
  );
}
