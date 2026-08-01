import { findEventScreenBannerById } from "../eventScreenBanners.js";
import { useArrestRequestAnnouncement } from "../hooks/useArrestRequestAnnouncement.js";
import { useEventScreenBanner } from "../hooks/useEventScreenBanner.js";

function WantedPopup({ request }) {
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-[#1c0d08]/65 p-[3.5%]">
      <article className="wanted-poster wanted-poster--announcement">
        <header className="wanted-poster__header">
          <p className="wanted-poster__title">Procurado</p>
          <p className="wanted-poster__subtitle">Vivo ou morto</p>
        </header>
        <WantedPhoto request={request} />
        <footer className="wanted-poster__footer">
          <h2 className="wanted-poster__name">{request.targetName}</h2>
          <p className="wanted-poster__notice">Pedido de prisão recebido</p>
        </footer>
      </article>
    </div>
  );
}

function WantedPhoto({ request }) {
  if (request.targetImagePath) {
    return (
      <div className="wanted-poster__photo-frame">
        <img
          className="wanted-poster__photo"
          src={request.targetImagePath}
          alt={`Foto de ${request.targetName}`}
        />
      </div>
    );
  }

  return (
    <div className="wanted-poster__photo-frame wanted-poster__photo-frame--empty">
      <span aria-hidden="true">?</span>
      <span className="sr-only">Foto não informada</span>
    </div>
  );
}

function WantedMural({ requests }) {
  if (!requests.length) {
    return null;
  }

  return (
    <div className="wanted-mural absolute inset-0 z-10 overflow-hidden">
      <div className="wanted-mural__grid">
        {requests.map((request) => (
          <article key={request.id} className="wanted-poster">
            <header className="wanted-poster__header">
              <p className="wanted-poster__title">Procurado</p>
              <p className="wanted-poster__subtitle">Vivo ou morto</p>
            </header>
            <WantedPhoto request={request} />
            <footer className="wanted-poster__footer">
              <h2 className="wanted-poster__name">{request.targetName}</h2>
              <p className="wanted-poster__notice">Cadeia da festa</p>
            </footer>
          </article>
        ))}
      </div>
    </div>
  );
}

export function EventScreenPage() {
  const { bannerId } = useEventScreenBanner();
  const { announcement, muralRequests } = useArrestRequestAnnouncement();
  const selectedBanner = findEventScreenBannerById(bannerId);
  const eventScreenStyle = {
    backgroundImage: `url(${selectedBanner.imageUrl})`,
  };

  return (
    <main className="grid min-h-dvh w-full place-items-center bg-[#2b160f] p-0">
      <section
        className="relative aspect-[7/4] h-auto max-h-dvh w-full max-w-[2240px] overflow-hidden bg-cover bg-center bg-no-repeat shadow-2xl"
        style={eventScreenStyle}
        aria-label="Telao do evento"
      >
        <WantedMural requests={muralRequests} />
        {announcement ? <WantedPopup request={announcement} /> : null}
      </section>
    </main>
  );
}
