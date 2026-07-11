import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSupabaseAdmin, isSupabaseStorageConfigured } from "@/lib/supabase";

const AVATAR_BUCKET = "avatars";

export async function uploadImageFile(
  buffer: Buffer,
  fileType: string,
  fileName: string,
  storageFolder: string,
): Promise<string> {
  if (isSupabaseStorageConfigured()) {
    const supabase = getSupabaseAdmin()!;
    const storagePath = `${storageFolder}/${fileName}`;

    const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(storagePath, buffer, {
      contentType: fileType,
      upsert: true,
    });

    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(storagePath);
    return data.publicUrl;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", storageFolder);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), buffer);
  return `/uploads/${storageFolder}/${fileName}`;
}
