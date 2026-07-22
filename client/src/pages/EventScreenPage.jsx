import { findEventScreenBannerById } from "../eventScreenBanners.js";
import { useEventScreenBanner } from "../hooks/useEventScreenBanner.js";

export function EventScreenPage() {
  const { bannerId } = useEventScreenBanner();
  const selectedBanner = findEventScreenBannerById(bannerId);
  const eventScreenStyle = {
    backgroundImage: `url(${selectedBanner.imageUrl})`,
  };

  return (
    <main className="grid min-h-dvh w-full place-items-center bg-[#2b160f] p-0">
      <section
        className="aspect-video h-auto max-h-dvh w-full max-w-[1920px] bg-cover bg-center bg-no-repeat shadow-2xl"
        style={eventScreenStyle}
        aria-label="Telao do evento"
      />
    </main>
  );
}
