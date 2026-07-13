import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from 'express';

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        // never trust the user's filename - derive extension from a strict allow-list
        const ext = path.extname(file.originalname).toLowerCase();
        const safeExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.png';
        // fieldname is from our own code + random uuid = no user input in final name
        cb(null, `${file.fieldname}-${uuidv4()}${safeExt}`);
    }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // check BOTH the claimed mimetype AND the extension against the allow-list
    // svg, html, and spoofed types are all rejected here
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
        return cb(new Error('Invalid file type. Only JPG, PNG and WEBP images are allowed'));
    }
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error('Invalid file extension. Only .jpg, .jpeg, .png and .webp are allowed'));
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 }, // 5MB, single file
});

// ===== MAGIC BYTE VALIDATION =====
// mimetype and extension are both client-controlled and can be spoofed.
// the file's actual leading bytes cannot. call this AFTER multer stores the file.
const MAGIC_BYTES: Record<string, number[][]> = {
    '.jpg':  [[0xFF, 0xD8, 0xFF]],
    '.jpeg': [[0xFF, 0xD8, 0xFF]],
    '.png':  [[0x89, 0x50, 0x4E, 0x47]],
    '.webp': [[0x52, 0x49, 0x46, 0x46]], // "RIFF"
};

export const validateMagicBytes = (filePath: string): boolean => {
    try {
        const ext = path.extname(filePath).toLowerCase();
        const signatures = MAGIC_BYTES[ext];
        if (!signatures) return false;

        const buffer = Buffer.alloc(12);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buffer, 0, 12, 0);
        fs.closeSync(fd);

        return signatures.some(sig => sig.every((byte, i) => buffer[i] === byte));
    } catch {
        return false;
    }
};

// deletes an uploaded file that failed post-upload validation
export const deleteFile = (filePath: string): void => {
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
        // best effort
    }
};

// ===== ERROR-HANDLING WRAPPER =====
// wraps a multer middleware so upload errors return a clean 400
// instead of bubbling up as a 500 (Express 5 changed async error propagation)
const handleUpload = (multerMiddleware: any) => {
    return (req: Request, res: Response, next: NextFunction) => {
        console.log('>>> handleUpload wrapper running'); 
        multerMiddleware(req, res, (err: any) => {
            console.log('>>> multer callback, err:', err?.message); 
            if (err) {
                if (err instanceof multer.MulterError) {
                    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
                }
                // our fileFilter errors (invalid type / extension)
                return res.status(400).json({ success: false, message: err.message });
            }
            next();
        });
    };
};

export const uploads = {
    single: (fieldName: string) => handleUpload(upload.single(fieldName)),
    array: (fieldName: string, maxCount: number) => handleUpload(upload.array(fieldName, maxCount)),
    fields: (fieldsArray: { name: string; maxCount?: number }[]) => handleUpload(upload.fields(fieldsArray)),
};