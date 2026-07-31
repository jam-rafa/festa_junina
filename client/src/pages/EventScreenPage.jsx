import { findEventScreenBannerById } from "../eventScreenBanners.js";
import { useArrestRequestAnnouncement } from "../hooks/useArrestRequestAnnouncement.js";
import { useEventScreenBanner } from "../hooks/useEventScreenBanner.js";
import { useRealtimeQueue } from "../hooks/useRealtimeQueue.js";

function normalizeComparableName(name) {
  return name
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isRequestAlreadyInQueue(request, guests) {
  if (!request) {
    return false;
  }

  const requestName = normalizeComparableName(request.targetName);
  return guests.some((guest) => normalizeComparableName(guest.guestName) === requestName);
}

function WantedPopup({ request }) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-black/45 px-8">
      <article className="w-[min(78vw,620px)] animate-[wanted-pop_420ms_ease-out] border-8 border-[#2a1711] bg-[#fff8dc] p-6 text-center shadow-2xl">
        <p className="text-5xl font-black uppercase tracking-normal text-[#8f2f1f]">
          Procurado
        </p>
        {request.targetImagePath ? (
          <img
            className="mx-auto mt-5 aspect-[4/3] w-full max-w-md border-8 border-[#2a1711] object-cover grayscale"
            src={request.targetImagePath}
            alt={`Foto de ${request.targetName}`}
          />
        ) : (
          <div className="mx-auto mt-5 grid aspect-[4/3] w-full max-w-md place-items-center border-8 border-[#2a1711] bg-[#eadcae] text-8xl font-black text-[#8f2f1f]">
            ?
          </div>
        )}
        <h2 className="mt-5 break-words text-6xl font-black uppercase tracking-normal text-[#2a1711]">
          {request.targetName}
        </h2>
        <p className="mt-3 text-3xl font-black text-[#8f2f1f]">Pedido de prisão recebido</p>
      </article>
    </div>
  );
}

export function EventScreenPage() {
  const { bannerId } = useEventScreenBanner();
  const guests = useRealtimeQueue();
  const arrestRequestAnnouncement = useArrestRequestAnnouncement();
  const selectedBanner = findEventScreenBannerById(bannerId);
  const visibleAnnouncement = isRequestAlreadyInQueue(arrestRequestAnnouncement, guests)
    ? null
    : arrestRequestAnnouncement;
  const eventScreenStyle = {
    backgroundImage: `url(${selectedBanner.imageUrl})`,
  };

  return (
    <main className="grid min-h-dvh w-full place-items-center bg-[#2b160f] p-0">
      <section
        className="relative aspect-video h-auto max-h-dvh w-full max-w-[1920px] overflow-hidden bg-cover bg-center bg-no-repeat shadow-2xl"
        style={eventScreenStyle}
        aria-label="Telao do evento"
      >
        {visibleAnnouncement ? <WantedPopup request={visibleAnnouncement} /> : null}
      </section>
    </main>
  );
}
