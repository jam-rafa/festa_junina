import { useEffect, useState } from "react";
import { fetchArrestRequests, getAdminToken, loginAdmin } from "../api/queueApi.js";
import { fetchCustomEventScreenBanners } from "../api/eventScreenApi.js";

function GalleryLogin({ onLogin }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(null);

  async function submit(event) {
    event.preventDefault();
    try {
      await loginAdmin({ pin });
      onLogin();
    } catch (nextError) {
      setError(nextError.message);
    }
  }

  return <main className="min-h-dvh bg-stone-100 px-4 py-6 text-stone-950"><form onSubmit={submit} className="mx-auto mt-20 max-w-sm rounded-xl bg-white p-5 shadow"><p className="text-sm font-bold uppercase text-red-700">Galeria protegida</p><h1 className="mt-1 text-3xl font-black">Fotos enviadas</h1><input className="mt-6 w-full rounded-md border border-stone-300 px-4 py-3 text-center text-xl font-bold tracking-[.3em]" type="password" inputMode="numeric" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="PIN" required /><button className="mt-3 w-full rounded-md bg-stone-900 px-4 py-3 font-bold text-white">Entrar</button>{error ? <p className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}</form></main>;
}

export function PhotoGalleryPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getAdminToken()));
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([fetchArrestRequests(), fetchCustomEventScreenBanners()])
      .then(([requests, banners]) => setPhotos([
        ...requests.filter((request) => request.targetImagePath).map((request) => ({ id: `pedido-${request.id}`, url: request.targetImagePath, title: request.targetName, type: "Pedido de prisão" })),
        ...banners.map((banner) => ({ id: `banner-${banner.id}`, url: banner.imagePath, title: banner.label, type: "Banner do telão" })),
      ]))
      .catch((nextError) => setError(nextError.message));
  }, [isAuthenticated]);

  if (!isAuthenticated) return <GalleryLogin onLogin={() => setIsAuthenticated(true)} />;

  return <main className="min-h-dvh bg-[#f7ecd0] px-3 py-4 text-stone-950"><section className="mx-auto max-w-5xl"><a className="text-sm font-bold text-red-800" href="/admin">← Voltar ao ADM</a><h1 className="mt-3 text-3xl font-black">Fotos enviadas</h1><p className="mt-1 text-sm text-stone-600">Carregado ao abrir esta tela. Não atualiza automaticamente.</p>{error ? <p className="mt-4 rounded-md bg-red-50 p-3 text-red-800">{error}</p> : null}{!error && photos.length === 0 ? <p className="mt-6 rounded-lg bg-white p-5 text-center text-stone-500">Nenhuma foto enviada ainda.</p> : <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{photos.map((photo) => <article key={photo.id} className="overflow-hidden rounded-lg bg-white shadow"><img className="aspect-square w-full object-cover" src={photo.url} alt={photo.title} /><div className="p-2"><p className="truncate text-sm font-black">{photo.title}</p><p className="text-xs text-stone-500">{photo.type}</p></div></article>)}</div>}</section></main>;
}
