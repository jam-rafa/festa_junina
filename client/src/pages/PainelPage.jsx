import { useEffect, useState } from "react";
import { useRealtimeQueue } from "../hooks/useRealtimeQueue.js";
import { calculateRemainingMinutes, hasGuestFinishedWaiting } from "../remainingTime.js";

function GuestRow({ guest, now }) {
  const remainingMinutes = calculateRemainingMinutes(guest, now);
  const isReady = hasGuestFinishedWaiting(guest, now);

  return (
    <tr className={isReady ? "guest-row guest-row--ready" : "guest-row"}>
      <td>{guest.guestName}</td>
      <td>{isReady ? "Liberado!" : `${remainingMinutes} min`}</td>
    </tr>
  );
}

export function PainelPage() {
  const guests = useRealtimeQueue();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <main className="painel">
      <h1>Fila da Festa Junina</h1>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Tempo restante</th>
          </tr>
        </thead>
        <tbody>
          {guests.map((guest) => (
            <GuestRow key={guest.id} guest={guest} now={now} />
          ))}
        </tbody>
      </table>
    </main>
  );
}
