export const DEFAULT_EVENT_SCREEN_BANNER_ID = "arraia-teste";

const eventScreenBannerModules = import.meta.glob(
  "./assets/backgrounds/*.{png,jpg,jpeg,webp,avif}",
  {
    eager: true,
    import: "default",
  }
);

function createBannerId(path) {
  return path
    .split("/")
    .pop()
    .replace(/\.[^.]+$/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function createBannerLabel(id) {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildEventScreenBanners() {
  const banners = Object.entries(eventScreenBannerModules)
    .map(([path, imageUrl]) => {
      const id = createBannerId(path);

      return {
        id,
        label: createBannerLabel(id),
        imageUrl,
      };
    })
    .filter((banner) => banner.id)
    .sort((leftBanner, rightBanner) => leftBanner.label.localeCompare(rightBanner.label));

  const uniqueBanners = [];
  const seenBannerIds = new Set();

  for (const banner of banners) {
    if (seenBannerIds.has(banner.id)) {
      continue;
    }

    seenBannerIds.add(banner.id);
    uniqueBanners.push(banner);
  }

  return uniqueBanners;
}

export const EVENT_SCREEN_BANNERS = buildEventScreenBanners();

export function findEventScreenBannerById(bannerId) {
  return (
    EVENT_SCREEN_BANNERS.find((banner) => banner.id === bannerId) ??
    EVENT_SCREEN_BANNERS[0]
  );
}
