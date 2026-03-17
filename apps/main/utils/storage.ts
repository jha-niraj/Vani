import {
    S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand
} from "@aws-sdk/client-s3";
import { Readable } from "stream";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
    if (!s3Client) {
        const {
            SUPABASE_ACCESS_KEY_ID,
            SUPABASE_SECRET_ACCESS_KEY,
            SUPABASE_STORAGE_ENDPOINT,
            SUPABASE_REGION
        } = process.env;

        if (!SUPABASE_ACCESS_KEY_ID || !SUPABASE_SECRET_ACCESS_KEY || !SUPABASE_STORAGE_ENDPOINT) {
            throw new Error('Missing Supabase S3 credentials in environment variables');
        }

        s3Client = new S3Client({
            region: SUPABASE_REGION || 'ap-southeast-1',
            endpoint: SUPABASE_STORAGE_ENDPOINT,
            credentials: {
                accessKeyId: SUPABASE_ACCESS_KEY_ID,
                secretAccessKey: SUPABASE_SECRET_ACCESS_KEY,
            },
            forcePathStyle: true,
        });
    }
    return s3Client;
}

async function streamToBuffer(stream: Readable | Uint8Array | null): Promise<Buffer> {
    if (!stream) return Buffer.alloc(0);
    if (stream instanceof Uint8Array) return Buffer.from(stream);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}

const BUCKET = process.env.SUPABASE_S3_BUCKET_NAME || "vaniaudiobook";

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

    try {
        await getS3Client().send(command);
    } catch (err: unknown) {
        // The AWS SDK wraps the raw HTTP response in a non-enumerable field
        const sdkErr = err as Record<string, unknown>;

        // Extract raw response details
        const metadata = sdkErr['$metadata'] as Record<string, unknown> | undefined;
        const rawResponse = sdkErr['$response'] as Record<string, unknown> | undefined;

        console.error('uploadAudioToStorage failed:', {
            message: (err as Error).message,
            httpStatusCode: metadata?.httpStatusCode,
            requestId: metadata?.requestId,
            // Try to get the raw body — this shows what Supabase actually returned
            rawBody: rawResponse?.body ?? rawResponse,
        });

        // Also try to read the raw body if it's a stream
        if (rawResponse && typeof (rawResponse as { body?: unknown }).body === 'object') {
            try {
                const bodyStream = rawResponse.body as AsyncIterable<Uint8Array>;
                const chunks: Buffer[] = [];
                for await (const chunk of bodyStream) {
                    chunks.push(Buffer.from(chunk));
                }
                console.error('Raw response body:', Buffer.concat(chunks).toString('utf-8'));
            } catch {
                console.error('Could not read raw response body');
            }
        }

        throw err;
    }

    // Construct the public URL from the Supabase endpoint
    const storageEndpoint = process.env.SUPABASE_STORAGE_ENDPOINT;
    let baseUrl = process.env.SUPABASE_URL || '';
    if (storageEndpoint) {
        try {
            const u = new URL(storageEndpoint);
            baseUrl = `${u.protocol}//${u.hostname}${u.port ? `:${u.port}` : ''}`;
        } catch {
            baseUrl = storageEndpoint.replace(/\/+$/, '');
        }
    }
    const audioUrl = `${baseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}`;

    return { storagePath, audioUrl };
}

export async function deleteAudioFromStorage(storagePath: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: storagePath,
    });

    try {
        await getS3Client().send(command);
    } catch (err) {
        console.error('uploadAudioToStorage failed', err);
        throw err;
    }
}

export async function getAudioFromStorage(storagePath: string) {
    try {
        const command = new GetObjectCommand({ Bucket: BUCKET, Key: storagePath });
        const resp = await getS3Client().send(command);
        const data = await streamToBuffer(resp.Body as any);
        return { data, contentType: resp.ContentType, contentLength: resp.ContentLength };
    } catch (err) {
        console.error('uploadAudioToStorage failed', err);
        throw err;
    }
}