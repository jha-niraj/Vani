import {
    S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand
} from "@aws-sdk/client-s3";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
    if (!s3Client) {
        s3Client = new S3Client({
            region: process.env.SUPABASE_REGION || "ap-southeast-2",
            endpoint: process.env.SUPABASE_STORAGE_ENDPOINT,
            credentials: {
                accessKeyId: process.env.SUPABASE_ACCESS_KEY_ID!,
                secretAccessKey: process.env.SUPABASE_SECRET_ACCESS_KEY!,
            },
            forcePathStyle: true,
        });
    }
    return s3Client;
}

const BUCKET = process.env.SUPABASE_S3_BUCKET_NAME || "vani";

export interface UploadResult {
    storagePath: string;
    audioUrl: string;
}

/**
 * Upload an audio file to Supabase Storage via S3 protocol.
 */
export async function uploadAudioToStorage(
    userId: string,
    audioBuffer: Buffer,
    fileName: string,
    contentType: string = "audio/webm"
): Promise<UploadResult> {
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `recordings/${userId}/${timestamp}_${sanitizedName}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: storagePath,
        Body: audioBuffer,
        ContentType: contentType,
    });

    await getS3Client().send(command);

    // Construct the public URL from the Supabase endpoint
    const baseUrl = process.env.SUPABASE_STORAGE_ENDPOINT?.replace("/storage/v1/s3", "") || "";
    const audioUrl = `${baseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}`;

    return { storagePath, audioUrl };
}

/**
 * Delete an audio file from storage.
 */
export async function deleteAudioFromStorage(storagePath: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: storagePath,
    });

    await getS3Client().send(command);
}

/**
 * Stream/get an audio file from storage.
 */
export async function getAudioFromStorage(storagePath: string) {
    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: storagePath,
    });

    return getS3Client().send(command);
}
