import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import axios from 'axios';
import sanitizePath from 'sanitize-filename';
import FormData from 'form-data';
import dotenv from 'dotenv';

const router: Router = express.Router();

dotenv.config();
// ENV
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// Validate ENV
if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('Error: TELEGRAM_TOKEN and TELEGRAM_CHAT_ID must be set in .env file');
  process.exit(1);
}

// multer
const storage = multer.memoryStorage();

// Set up multer to accept all file types
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Max 50MB (Telegram Bot API limit for standard uploads)
});

function generateRandomId(): string {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let randomId = '';
  for (let i = 0; i < 20; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomId += characters[randomIndex];
  }
  return randomId;
}

function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

interface FileResponse {
  filename: string;
  mimetype: string;
  size: string;
  url: string;
  fileId: string;
}

// Upload route
router.post('/api/upload', upload.any(), async (req: Request, res: Response) => {
  try {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      return res.render('index', {
        error: 'No files uploaded',
        success: null,
        files: null,
        baseUrl: `${req.protocol}://${req.get('host')}`,
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();

    // Upload each file to Telegram
    const filePromises = files.map(async (file: Express.Multer.File) => {
      const sanitizedName = sanitizePath(file.originalname);
      const uniqueFilename = generateRandomId() + path.extname(sanitizedName);

      // FormData
      const formData = new FormData();
      formData.append('chat_id', TELEGRAM_CHAT_ID);
      formData.append('document', file.buffer, {
        filename: uniqueFilename,
        contentType: file.mimetype,
      });

      // Upload file
      const response = await axios.post(`${TELEGRAM_API_URL}/sendDocument`, formData, {
        headers: formData.getHeaders(),
      });

      if (!response.data.ok) {
        throw new Error('Failed to upload file to Telegram');
      }

      const fileId = response.data.result.document.file_id;

      return {
        filename: file.originalname,
        mimetype: file.mimetype,
        size: formatBytes(file.size),
        url: `${baseUrl}/file/${fileId}`,
        fileId: fileId,
      };
    });

    // Wait for all files to upload
    const fileData: FileResponse[] = await Promise.all(filePromises);

    res.render('index', {
      error: null,
      success: 'Files uploaded successfully!',
      files: fileData,
      baseUrl,
    });
  } catch (err: any) {
    console.error('Error uploading files:', err.message || err);
    res.render('index', {
      error: 'Failed to upload files. Please try again.',
      success: null,
      files: null,
      baseUrl: `${req.protocol}://${req.get('host')}`,
    });
  }
});

router.get('/file/:fileId', async (req: Request, res: Response) => {
  try {
    const fileId = req.params.fileId;

    // GetInfo
    const fileInfoResponse = await axios.get(`${TELEGRAM_API_URL}/getFile?file_id=${fileId}`);

    if (!fileInfoResponse.data.ok) {
      throw new Error('Failed to retrieve file information');
    }

    const filePath = fileInfoResponse.data.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`;

    // Metdata headers
    const fileMetadataResponse = await axios.get(`${TELEGRAM_API_URL}/getFile?file_id=${fileId}`);
    const fileName = fileMetadataResponse.data.result.file_path.split('/').pop() || 'downloaded_file';

    // Stream file
    const fileResponse = await axios.get(fileUrl, { responseType: 'stream' });

    res.set({
      'Content-Type': fileResponse.headers['content-type'] || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'X-Content-Type-Options': 'nosniff',
    });

    fileResponse.data.pipe(res);
  } catch (err: any) {
    console.error('Error downloading file:', err.message || err);
    res.render('index', {
      error: 'Failed to download file. Please check the file ID or try again.',
      success: null,
      files: null,
      baseUrl: `${req.protocol}://${req.get('host')}`,
    });
  }
});

export default router;