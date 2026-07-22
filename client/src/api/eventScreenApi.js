import { getAdminToken } from "./queueApi.js";

const API_BASE_PATH = "/api";

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

export async function fetchEventScreenBanner() {
  const response = await fetch(`${API_BASE_PATH}/event-screen/banner`);
  return parseJsonOrThrow(response);
}

export async function updateEventScreenBanner({ bannerId }) {
  const response = await fetch(`${API_BASE_PATH}/event-screen/banner`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAdminHeaders() },
    body: JSON.stringify({ bannerId }),
  });

  return parseJsonOrThrow(response);
}
