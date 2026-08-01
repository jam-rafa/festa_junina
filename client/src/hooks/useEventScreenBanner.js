import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { fetchCustomEventScreenBanners, fetchEventScreenBanner } from "../api/eventScreenApi.js";
import { DEFAULT_EVENT_SCREEN_BANNER_ID, EVENT_SCREEN_BANNERS } from "../eventScreenBanners.js";

const EVENT_SCREEN_BANNER_UPDATED_EVENT = "event-screen:banner-updated";

export function useEventScreenBanner({ enabled = true } = {}) {
  const [bannerId, setBannerId] = useState(DEFAULT_EVENT_SCREEN_BANNER_ID);
  const [banners, setBanners] = useState(EVENT_SCREEN_BANNERS);

  const refreshBanners = () => fetchCustomEventScreenBanners().then((custom) => setBanners([...EVENT_SCREEN_BANNERS, ...custom.map((banner) => ({ ...banner, imageUrl: banner.imagePath, removable: true }))]));

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const refreshBanner = () => Promise.all([fetchEventScreenBanner(), refreshBanners()])
      .then(([screenBanner]) => setBannerId(screenBanner.bannerId))
      .catch(() => setBannerId(DEFAULT_EVENT_SCREEN_BANNER_ID));

    const socket = io();
    socket.on("connect", refreshBanner);
    socket.on(EVENT_SCREEN_BANNER_UPDATED_EVENT, ({ bannerId: nextBannerId }) => {
      setBannerId(nextBannerId);
    });

    return () => socket.disconnect();
  }, [enabled]);

  return { bannerId, banners, setBannerId, refreshBanners };
}
