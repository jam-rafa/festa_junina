const API_BASE_PATH = "/api";

async function parseJsonOrThrow(response) {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message ?? "Erro inesperado no servidor");
  }
  return body;
}

export async function fetchQueue() {
  const response = await fetch(`${API_BASE_PATH}/queue`);
  return parseJsonOrThrow(response);
}

export async function addGuestToQueue({ guestName, holdDurationMinutes }) {
  const response = await fetch(`${API_BASE_PATH}/queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guestName, holdDurationMinutes }),
  });
  return parseJsonOrThrow(response);
}

export async function updateGuestInQueue(id, { guestName, holdDurationMinutes }) {
  const response = await fetch(`${API_BASE_PATH}/queue/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guestName, holdDurationMinutes }),
  });
  return parseJsonOrThrow(response);
}

export async function removeGuestFromQueue(id) {
  const response = await fetch(`${API_BASE_PATH}/queue/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.message ?? "Erro inesperado no servidor");
  }
}
