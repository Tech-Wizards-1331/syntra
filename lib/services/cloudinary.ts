import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary explicitly if URL is available
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
  });
}

/**
 * Uploads a base64 encoded image to Cloudinary.
 * Filters by mime type (jpg, jpeg, png) and restricts file size to max 5MB.
 *
 * @param base64Data Complete data URL string (e.g. data:image/png;base64,...)
 * @returns Secure URL of the uploaded image
 */
export async function uploadToCloudinary(base64Data: string): Promise<string> {
  // Validate format and extract mime type
  const match = base64Data.match(/^data:([^;]+);base64,/);
  if (!match) {
    throw new Error("Invalid base64 image data format");
  }

  const mimeType = match[1];
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error("Invalid file type. Only JPG, JPEG, and PNG are allowed.");
  }

  // Calculate size in bytes
  const base64Content = base64Data.substring(base64Data.indexOf(",") + 1);
  const padding = base64Content.endsWith("==") ? 2 : base64Content.endsWith("=") ? 1 : 0;
  const sizeInBytes = (base64Content.length * 3) / 4 - padding;
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (sizeInBytes > maxSize) {
    throw new Error("File size exceeds 5MB limit.");
  }

  try {
    const response = await cloudinary.uploader.upload(base64Data, {
      folder: "syntra_logos",
    });

    if (!response.secure_url) {
      throw new Error("Failed to upload image to Cloudinary");
    }

    return response.secure_url;
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    throw new Error(error.message || "Failed to upload image to Cloudinary");
  }
}

/**
 * Deletes an asset from Cloudinary using its URL.
 * Extracts the public ID from the URL and calls the destroy API.
 */
export async function deleteFromCloudinary(url: string): Promise<boolean> {
  try {
    // Split by /upload/
    const parts = url.split("/upload/");
    if (parts.length < 2) return false;
    
    // The rest is v12345/folder/name.ext or folder/name.ext
    let publicIdWithExt = parts[1];
    
    // Remove version prefix if exists (starts with v followed by digits)
    if (publicIdWithExt.startsWith("v") && /^\/v\d+\//.test("/" + publicIdWithExt)) {
      publicIdWithExt = publicIdWithExt.substring(publicIdWithExt.indexOf("/") + 1);
    }
    
    // Remove file extension
    const lastDot = publicIdWithExt.lastIndexOf(".");
    const publicId = lastDot !== -1 ? publicIdWithExt.substring(0, lastDot) : publicIdWithExt;

    // Cloudinary raw resources (like PDFs uploaded as raw/auto) need resource_type: "raw" or "image"
    // PDFs can be uploaded as raw or image. We detect if it contains raw or pdf.
    const isRaw = url.includes("/raw/") || url.toLowerCase().endsWith(".pdf");
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: isRaw ? "raw" : "image"
    });
    return result.result === "ok";
  } catch (error) {
    console.error("Failed to delete Cloudinary asset:", error);
    return false;
  }
}

