import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { fetchArrestRequests, getAdminToken } from "../api/queueApi.js";

const ARREST_REQUESTS_UPDATED_EVENT = "arrest-requests:updated";

export function useRealtimeArrestRequests({ enabled = true } = {}) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    fetchArrestRequests().then(setRequests);

    const socket = io({ auth: { token: getAdminToken() } });
    socket.on(ARREST_REQUESTS_UPDATED_EVENT, setRequests);

    return () => socket.disconnect();
  }, [enabled]);

  return requests;
}
