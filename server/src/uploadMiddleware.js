import crypto from "node:crypto";
import path from "node:path";

import multer from "multer";

import { ValidationError } from "./errors.js";
import {
  arrestRequestImagesPath,
  ensureUploadDirectories,
  toPublicUploadPath,
} from "./uploadStorage.js";

const MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

ensureUploadDirectories();

const storage = multer.diskStorage({
  destination(request, file, callback) {
    callback(null, arrestRequestImagesPath);
  },
  filename(request, file, callback) {
    const extension =
      ALLOWED_IMAGE_TYPES.get(file.mimetype) || path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

function fileFilter(request, file, callback) {
  if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    callback(new ValidationError("Envie uma imagem JPG, PNG ou WebP"));
    return;
  }

  callback(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: 1,
  },
});

export const uploadArrestRequestImage = upload.single("targetImage");

export function attachUploadedImagePath(request, response, next) {
  if (request.file) {
    request.body.targetImagePath = toPublicUploadPath(request.file.filename);
  }

  next();
}
