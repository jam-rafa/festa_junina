import { useState } from "react";
import { useRealtimeQueue } from "../hooks/useRealtimeQueue.js";
import { addGuestToQueue, updateGuestInQueue, removeGuestFromQueue } from "../api/queueApi.js";
import { calculateRemainingMinutes } from "../remainingTime.js";

function NewGuestForm() {
  const [guestName, setGuestName] = useState("");
  const [holdDurationMinutes, setHoldDurationMinutes] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      await addGuestToQueue({ guestName, holdDurationMinutes: Number(holdDurationMinutes) });
      setGuestName("");
      setHoldDurationMinutes("");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="new-guest-form">
      <input
        type="text"
        placeholder="Nome"
        value={guestName}
        onChange={(event) => setGuestName(event.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Minutos"
        value={holdDurationMinutes}
        onChange={(event) => setHoldDurationMinutes(event.target.value)}
        required
        min="1"
      />
      <button type="submit">Adicionar</button>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
    </form>
  );
}

function GuestListItem({ guest }) {
  const [isEditing, setIsEditing] = useState(false);
  const [guestName, setGuestName] = useState(guest.guestName);
  const [holdDurationMinutes, setHoldDurationMinutes] = useState(guest.holdDurationMinutes);

  async function handleSave() {
    await updateGuestInQueue(guest.id, { guestName, holdDurationMinutes: Number(holdDurationMinutes) });
    setIsEditing(false);
  }

  async function handleRemove() {
    await removeGuestFromQueue(guest.id);
  }

  if (isEditing) {
    return (
      <li className="guest-item">
        <input value={guestName} onChange={(event) => setGuestName(event.target.value)} />
        <input
          type="number"
          value={holdDurationMinutes}
          onChange={(event) => setHoldDurationMinutes(event.target.value)}
          min="1"
        />
        <button onClick={handleSave}>Salvar</button>
        <button onClick={() => setIsEditing(false)}>Cancelar</button>
      </li>
    );
  }

  return (
    <li className="guest-item">
      <span>{guest.guestName}</span>
      <span>{calculateRemainingMinutes(guest, new Date())} min restantes</span>
      <button onClick={() => setIsEditing(true)}>Editar</button>
      <button onClick={handleRemove}>Remover</button>
    </li>
  );
}

export function AdminPage() {
  const guests = useRealtimeQueue();

  return (
    <main className="admin">
      <h1>Gerenciar Fila</h1>
      <NewGuestForm />
      <ul className="guest-list">
        {guests.map((guest) => (
          <GuestListItem key={guest.id} guest={guest} />
        ))}
      </ul>
    </main>
  );
}
