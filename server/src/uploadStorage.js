import { mkdirSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const defaultStoragePath = path.join(currentDir, "..", "data", "uploads");

export const uploadStoragePath = process.env.STORAGE_PATH ?? defaultStoragePath;
export const arrestRequestImagesPath = path.join(uploadStoragePath, "arrest-requests");

export function ensureUploadDirectories() {
  mkdirSync(arrestRequestImagesPath, { recursive: true });
}

export function toPublicUploadPath(filename) {
  return `/uploads/arrest-requests/${filename}`;
}

export function removeUploadedFile(filePath) {
  if (!filePath) {
    return;
  }

  try {
    unlinkSync(filePath);
  } catch {
    // The original request error is more important than cleanup failure here.
  }
}
