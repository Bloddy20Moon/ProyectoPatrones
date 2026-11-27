import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Solo imágenes raster seguras (se excluye SVG para prevenir Stored XSS)
const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = MIME_TO_EXTENSION[file.mimetype];
    if (!ext) {
      cb(new Error('Formato de imagen no permitido. Usa PNG, JPG, WEBP o GIF.'), '');
      return;
    }
    cb(null, `product-${randomUUID()}${ext}`);
  },
});

export const uploadProductImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (Object.prototype.hasOwnProperty.call(MIME_TO_EXTENSION, file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de imagen no permitido. Usa PNG, JPG, WEBP o GIF.'));
    }
  },
});

export { uploadsDir };
