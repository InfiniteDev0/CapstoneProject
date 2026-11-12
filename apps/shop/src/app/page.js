import Hero from "@/components/home/Hero";
import HomeSections from "@/components/home/HomeSections";
import { currentSeason, titleCase } from "@/lib/format";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const FALLBACK_IMAGE = "/assets/images/abaya.webp";

/** Ask the kitchen on the server, before the page is sent. If it doesn't answer in 3 s, use the fallback. */
async function getJson(path) {
  try {
    const res = await fetch(`${API}${path}`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/**
 * Home. The hero follows the calendar: in November it's autumn, so the Amber Luxe line leads
 * (a simple date rule, not AI). The products below it will follow the person in Phase 7.
 */
export default async function Home() {
  const season = currentSeason();
  const [collections, seasonal] = await Promise.all([
    getJson("/api/store/collections"),
    getJson(`/api/store/products?collection=seasonal&season=${season}&sort=popular&size=1`),
  ]);
  const seasonalCollection = collections?.find((c) => c.slug === "seasonal");
  const line = seasonalCollection?.lines?.find((l) => l.season === season);

  const hero = line
    ? {
        name: line.name,
        tagline: `${titleCase(season)} collection · ${line.theme}. Where modesty meets luxury.`,
        heroImage: seasonal?.items?.[0]?.image ?? seasonalCollection.heroImage ?? FALLBACK_IMAGE,
      }
    : {
        name: "Vela Noire",
        tagline: "Where modesty meets luxury. Timeless abayas, fragrance and accessories for the woman who walks with purpose.",
        heroImage: FALLBACK_IMAGE,
      };
  const cta = line
    ? { label: `Discover ${line.name}`, href: `/shop?collection=seasonal&season=${season}` }
    : { label: "Luxury Reimagined for Her", href: "/shop" };

  return (
    <>
      <Hero collection={hero} cta={cta} />
      <HomeSections />
    </>
  );
}
