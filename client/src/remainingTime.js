export function calculateRemainingMinutes(guest, now) {
  const enteredAtMs = new Date(guest.enteredAt).getTime();
  const releaseAtMs = enteredAtMs + guest.holdDurationMinutes * 60_000;
  const remainingMs = releaseAtMs - now.getTime();
  return Math.max(0, Math.ceil(remainingMs / 60_000));
}

export function hasGuestFinishedWaiting(guest, now) {
  return calculateRemainingMinutes(guest, now) === 0;
}
