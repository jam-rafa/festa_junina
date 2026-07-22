import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { fetchEventScreenBanner } from "../api/eventScreenApi.js";
import { DEFAULT_EVENT_SCREEN_BANNER_ID } from "../eventScreenBanners.js";

const EVENT_SCREEN_BANNER_UPDATED_EVENT = "event-screen:banner-updated";

export function useEventScreenBanner({ enabled = true } = {}) {
  const [bannerId, setBannerId] = useState(DEFAULT_EVENT_SCREEN_BANNER_ID);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    fetchEventScreenBanner()
      .then((screenBanner) => setBannerId(screenBanner.bannerId))
      .catch(() => setBannerId(DEFAULT_EVENT_SCREEN_BANNER_ID));

    const socket = io();
    socket.on(EVENT_SCREEN_BANNER_UPDATED_EVENT, ({ bannerId: nextBannerId }) => {
      setBannerId(nextBannerId);
    });

    return () => socket.disconnect();
  }, [enabled]);

  return { bannerId, setBannerId };
}
