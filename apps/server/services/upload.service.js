/**
 * Upload Service - Gestion des uploads de fichiers
 * Utilise multer pour gérer les fichiers multipart/form-data
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload directory
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'evidence');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomstring-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter - only images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seules les images sont acceptées.'), false);
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  }
});

/**
 * Middleware pour upload multiple (max 10 fichiers)
 */
export const uploadMultiple = upload.array('photos', 10);

/**
 * Middleware pour upload simple
 */
export const uploadSingle = upload.single('photo');

/**
 * Get file URL from filename
 */
export const getFileUrl = (filename) => {
  return `/uploads/evidence/${filename}`;
};

/**
 * Delete a file
 */
export const deleteFile = (filename) => {
  const filePath = path.join(UPLOAD_DIR, filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }

  return false;
};

/**
 * Get file info
 */
export const getFileInfo = (filename) => {
  const filePath = path.join(UPLOAD_DIR, filename);

  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    return {
      filename,
      path: filePath,
      url: getFileUrl(filename),
      size: stats.size,
      created: stats.birthtime
    };
  }

  return null;
};

export default {
  uploadMultiple,
  uploadSingle,
  getFileUrl,
  deleteFile,
  getFileInfo
};
