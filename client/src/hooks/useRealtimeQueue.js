import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { fetchQueue } from "../api/queueApi.js";

const QUEUE_UPDATED_EVENT = "queue:updated";

export function useRealtimeQueue() {
  const [guests, setGuests] = useState([]);

  useEffect(() => {
    fetchQueue().then(setGuests);

    const socket = io();
    socket.on(QUEUE_UPDATED_EVENT, setGuests);

    return () => socket.disconnect();
  }, []);

  return guests;
}
