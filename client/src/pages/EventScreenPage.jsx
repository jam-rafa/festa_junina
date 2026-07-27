import { useEffect, useState } from "react";
import { findEventScreenBannerById } from "../eventScreenBanners.js";
import { useArrestRequestAnnouncement } from "../hooks/useArrestRequestAnnouncement.js";
import { useEventScreenBanner } from "../hooks/useEventScreenBanner.js";
import { useRealtimeQueue } from "../hooks/useRealtimeQueue.js";
import { calculateRemainingMinutes } from "../remainingTime.js";

function WantedCard({ guest, now }) {
  return (
    <article className="w-[min(32vw,360px)] border-4 border-[#2a1711] bg-[#fff8dc] p-4 text-center shadow-2xl">
      <p className="text-2xl font-black uppercase tracking-normal text-[#8f2f1f]">Procurado</p>
      {guest.targetImagePath ? (
        <img
          className="mt-3 aspect-[4/3] w-full border-4 border-[#2a1711] object-cover grayscale"
          src={guest.targetImagePath}
          alt={`Foto de ${guest.guestName}`}
        />
      ) : null}
      <h2 className="mt-3 break-words text-4xl font-black uppercase tracking-normal text-[#2a1711]">
        {guest.guestName}
      </h2>
      <p className="mt-2 text-xl font-black text-[#8f2f1f]">
        {calculateRemainingMinutes(guest, now)} min restantes
      </p>
    </article>
  );
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
  const [now, setNow] = useState(() => new Date());
  const selectedBanner = findEventScreenBannerById(bannerId);
  const guestsWithImages = guests.filter((guest) => guest.targetImagePath).slice(0, 3);
  const eventScreenStyle = {
    backgroundImage: `url(${selectedBanner.imageUrl})`,
  };

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <main className="grid min-h-dvh w-full place-items-center bg-[#2b160f] p-0">
      <section
        className="relative aspect-video h-auto max-h-dvh w-full max-w-[1920px] overflow-hidden bg-cover bg-center bg-no-repeat shadow-2xl"
        style={eventScreenStyle}
        aria-label="Telao do evento"
      >
        {guestsWithImages.length > 0 ? (
          <div className="absolute inset-x-8 bottom-8 flex items-end justify-center gap-6">
            {guestsWithImages.map((guest) => (
              <WantedCard key={guest.id} guest={guest} now={now} />
            ))}
          </div>
        ) : null}
        {arrestRequestAnnouncement ? <WantedPopup request={arrestRequestAnnouncement} /> : null}
      </section>
    </main>
  );
}
