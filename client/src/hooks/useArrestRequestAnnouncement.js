import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const ARREST_REQUEST_CREATED_EVENT = "event-screen:arrest-request-created";
const ANNOUNCEMENT_DURATION_MS = 8000;

export function useArrestRequestAnnouncement({ enabled = true } = {}) {
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const socket = io();
    socket.on(ARREST_REQUEST_CREATED_EVENT, (request) => {
      setAnnouncement(request);
    });

    return () => socket.disconnect();
  }, [enabled]);

  useEffect(() => {
    if (!announcement) {
      return undefined;
    }

    const timeoutId = setTimeout(() => setAnnouncement(null), ANNOUNCEMENT_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [announcement]);

  return announcement;
}
