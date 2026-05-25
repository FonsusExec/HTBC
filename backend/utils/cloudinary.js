import {Readable} from "stream";
import {v2 as cloudinary} from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import {dirname} from "path";
import {fileURLToPath} from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({path: path.join(__dirname, "../.env")});

const cloudinaryFolder = process.env.CLOUDINARY_FOLDER || "htbc";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

const isCloudinaryConfigured = () => Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

const getFolder = (folder = "") => [cloudinaryFolder, folder].filter(Boolean).join("/");

export const uploadImageToCloudinary = (file, folder = "") => {
    if (!file?.buffer) {
        return Promise.reject(new Error("No image file was provided"));
    }

    if (!isCloudinaryConfigured()) {
        return Promise.reject(new Error("Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to backend/.env."));
    }

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: getFolder(folder),
                resource_type: "image",
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            },
        );

        Readable.from(file.buffer).pipe(uploadStream);
    });
};

export const uploadImagesToCloudinary = async (files = [], folder = "") => {
    const uploads = await Promise.all(files.map((file) => uploadImageToCloudinary(file, folder)));
    return uploads.map((upload) => upload.url);
};
