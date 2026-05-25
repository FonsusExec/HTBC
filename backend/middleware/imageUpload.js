import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import {dirname} from "path";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({path: path.join(__dirname, "../.env")});

const maxImageSizeMb = Number(process.env.IMAGE_UPLOAD_LIMIT_MB || 8);

const imageFileFilter = (req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
        cb(new Error("Only image uploads are allowed"));
        return;
    }

    cb(null, true);
};

const imageUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: maxImageSizeMb * 1024 * 1024,
    },
    fileFilter: imageFileFilter,
});

export default imageUpload;
