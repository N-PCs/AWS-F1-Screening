/**
 * Cloudinary client for payment screenshot uploads.
 * Uses an *unsigned* upload preset, so no API secret ever touches the browser.
 * Fill the VITE_CLOUDINARY_* values in .env (see firebase/README.md).
 */
const cloudName = import.meta.env['VITE_CLOUDINARY_CLOUD_NAME'] as string | undefined;
const uploadPreset = import.meta.env['VITE_CLOUDINARY_UPLOAD_PRESET'] as string | undefined;

export const isCloudinaryConfigured = Boolean(cloudName && uploadPreset);

export type CloudinaryUpload = {
  /** HTTPS URL Cloudinary serves the image from (stored in Firestore for the admin panel). */
  secureUrl: string;
  /** Cloudinary asset id; useful later for clean-up from the dashboard. */
  publicId: string;
  /** Uploaded file size in bytes (informational). */
  bytes: number;
};

/**
 * Upload an image blob straight to Cloudinary using the unsigned preset.
 * Returns the permanent URL + public id.
 */
export async function uploadImage(blob: Blob): Promise<CloudinaryUpload> {
  if (!isCloudinaryConfigured) {
    throw new Error("Screenshot uploads are not configured yet (missing VITE_CLOUDINARY_*).");
  }
  const body = new FormData();
  body.append("file", blob);
  body.append("upload_preset", uploadPreset!);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error?.message ?? "Could not upload the screenshot.");
  }

  const data = (await res.json()) as {
    secure_url?: string;
    public_id?: string;
    bytes?: number;
  };
  if (!data.secure_url) throw new Error("Cloudinary did not return an image URL.");

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id ?? "",
    bytes: Number(data.bytes ?? 0),
  };
}