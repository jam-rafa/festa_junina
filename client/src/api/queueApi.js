const API_BASE_PATH = "/api";
const ADMIN_TOKEN_STORAGE_KEY = "festaJuninaAdminToken";

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
}

function saveAdminToken(token) {
  localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
}

function getAdminHeaders() {
  const token = getAdminToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseJsonOrThrow(response) {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message ?? "Erro inesperado no servidor");
  }
  return body;
}

export async function loginAdmin({ pin }) {
  const response = await fetch(`${API_BASE_PATH}/auth/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  const body = await parseJsonOrThrow(response);
  saveAdminToken(body.token);
  return body;
}

export async function fetchQueue() {
  const response = await fetch(`${API_BASE_PATH}/queue`);
  return parseJsonOrThrow(response);
}

export async function addGuestToQueue({ guestName, holdDurationMinutes }) {
  const response = await fetch(`${API_BASE_PATH}/queue`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAdminHeaders() },
    body: JSON.stringify({ guestName, holdDurationMinutes }),
  });
  return parseJsonOrThrow(response);
}

export async function updateGuestInQueue(id, { guestName, holdDurationMinutes }) {
  const response = await fetch(`${API_BASE_PATH}/queue/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAdminHeaders() },
    body: JSON.stringify({ guestName, holdDurationMinutes }),
  });
  return parseJsonOrThrow(response);
}

export async function removeGuestFromQueue(id) {
  const response = await fetch(`${API_BASE_PATH}/queue/${id}`, {
    method: "DELETE",
    headers: getAdminHeaders(),
  });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.message ?? "Erro inesperado no servidor");
  }
}

export async function fetchArrestRequests() {
  const response = await fetch(`${API_BASE_PATH}/arrest-requests`, {
    headers: getAdminHeaders(),
  });
  return parseJsonOrThrow(response);
}

export async function createArrestRequest({ targetName }) {
  const response = await fetch(`${API_BASE_PATH}/arrest-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targetName }),
  });
  return parseJsonOrThrow(response);
}

export async function confirmArrestRequestPayment(id) {
  const response = await fetch(`${API_BASE_PATH}/arrest-requests/${id}/confirm-payment`, {
    method: "POST",
    headers: getAdminHeaders(),
  });
  return parseJsonOrThrow(response);
}

export async function acceptArrestRequest(id) {
  const response = await fetch(`${API_BASE_PATH}/arrest-requests/${id}/accept`, {
    method: "POST",
    headers: getAdminHeaders(),
  });
  return parseJsonOrThrow(response);
}

export async function rejectArrestRequest(id) {
  const response = await fetch(`${API_BASE_PATH}/arrest-requests/${id}/reject`, {
    method: "POST",
    headers: getAdminHeaders(),
  });
  return parseJsonOrThrow(response);
}
