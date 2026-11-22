const { v2: cloudinary } = require("cloudinary");

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function configureCloudinary() {
  if (!cloudinaryConfigured()) return false;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return true;
}

/**
 * Upload a buffer to Cloudinary. Returns { url, publicId }.
 * Falls back to a data URL stored in Mongo when Cloudinary is not configured.
 */
async function uploadImageBuffer(buffer, { folder = "azure-bay", filename } = {}) {
  if (configureCloudinary()) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "image", public_id: filename ? filename.replace(/\.[^.]+$/, "") : undefined },
        (error, uploaded) => (error ? reject(error) : resolve(uploaded)),
      );
      stream.end(buffer);
    });
    return { url: result.secure_url, publicId: result.public_id, storage: "cloudinary" };
  }

  if (buffer.length > 2.5 * 1024 * 1024) {
    const error = new Error("Image must be under 2.5 MB when Cloudinary is not configured. Paste a URL instead, or add Cloudinary keys.");
    error.status = 400;
    throw error;
  }
  const base64 = buffer.toString("base64");
  const mime = "image/jpeg";
  return {
    url: `data:${mime};base64,${base64}`,
    publicId: "",
    storage: "mongo",
  };
}

module.exports = { cloudinaryConfigured, uploadImageBuffer };
