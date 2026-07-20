import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { fetchQueue } from "../api/queueApi.js";

const QUEUE_UPDATED_EVENT = "queue:updated";

export function useRealtimeQueue({ enabled = true } = {}) {
  const [guests, setGuests] = useState([]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    fetchQueue().then(setGuests);

    const socket = io();
    socket.on(QUEUE_UPDATED_EVENT, setGuests);

    return () => socket.disconnect();
  }, [enabled]);

  return guests;
}
