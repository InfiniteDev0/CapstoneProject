import Link from "next/link";

/**
 * Hero
 *
 * Full-viewport hero that uses whatever media the admin uploaded for a
 * collection. Falls back to a solid dark background if no media exists yet.
 *
 * Props:
 *   collection — { name, slug, tagline, heroImage, heroVideo }
 *   cta        — { label, href }  optional override for the CTA button
 */
const Hero = ({ collection, cta }) => {
  const { name, slug, tagline, heroImage, heroVideo } = collection ?? {};

  const ctaLabel = cta?.label ?? `Discover ${name ?? "the Collection"}`;
  const ctaHref = cta?.href ?? `/collections/${slug ?? ""}`;

  return (
    <section className="relative h-[95vh] w-full overflow-hidden bg-zinc-950">
      {/* ── Background media ── */}
      {heroVideo ? (
        <video
          src={heroVideo}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          // Show the still image while the video is buffering (especially mobile)
          poster={heroImage ?? undefined}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : heroImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={heroImage}
          alt={name ?? "Collection"}
          // Hero is always the LCP element — tell the browser to fetch it first
          fetchPriority="high"
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}

      {/* ── Gradient overlay — bottom-heavy so text pops ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />

      {/* ── Text overlay ── */}
      <div className="absolute bottom-0 left-0 w-full max-w-2xl px-10 pb-20 space-y-2">
        <h1
          className="text-white leading-none text-4xl"
        >
          {name ?? "Vela Noire"}
        </h1>
        {tagline && (
          <p className="text-white/75 font-light leading-relaxed max-w-md">
            {tagline}
          </p>
        )}
        <Link
          href={ctaHref}
          className="inline-block mt-2 underline text-white hover:text-gray-500 transition-colors duration-300"
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
};

export default Hero;
