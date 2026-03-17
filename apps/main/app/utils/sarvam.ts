/**
 * Sarvam AI Speech-to-Text utilities.
 *
 * - REST API:  audio <= 30 seconds  → immediate response
 * - Batch API: audio >  30 seconds  → async job (poll for result)
 *
 * Reference: https://docs.sarvam.ai/api-reference-docs/speech-to-text/transcribe
 */

const SARVAM_API_URL = "https://api.sarvam.ai";

function getApiKey(): string {
    const key = process.env.SARVAM_API_KEY;
    if (!key) throw new Error("SARVAM_API_KEY is not set");
    return key;
}

export interface SarvamTranscriptResult {
    transcript: string;
    languageCode: string | null;
    languageProbability: number | null;
    requestId: string | null;
}

/**
 * Transcribe short audio (≤30s) via the Sarvam REST API.
 * Returns an immediate transcript.
 */
export async function transcribeShortAudio(
    audioBuffer: Buffer,
    fileName: string = "recording.webm",
    opts?: {
        model?: "saarika:v2.5" | "saaras:v3";
        mode?: "transcribe" | "translate" | "verbatim" | "translit" | "codemix";
        languageCode?: string;
    }
): Promise<SarvamTranscriptResult> {
    const formData = new FormData();

    const blob = new Blob([new Uint8Array(audioBuffer)], { type: "audio/webm" });
    formData.append("file", blob, fileName);
    formData.append("model", opts?.model || "saaras:v3");

    if (opts?.mode) {
        formData.append("mode", opts.mode);
    }

    if (opts?.languageCode) {
        formData.append("language_code", opts.languageCode);
    } else {
        formData.append("language_code", "unknown");
    }

    const response = await fetch(`${SARVAM_API_URL}/speech-to-text`, {
        method: "POST",
        headers: {
            "api-subscription-key": getApiKey(),
        },
        body: formData,
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Sarvam STT error:", response.status, errorBody);
        throw new Error(`Sarvam STT failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();

    return {
        transcript: data.transcript || "",
        languageCode: data.language_code || null,
        languageProbability: data.language_probability || null,
        requestId: data.request_id || null,
    };
}

/**
 * For longer audio (>30s), use the Sarvam Batch API.
 *
 * Step 1: Submit the job
 * Step 2: Poll for completion
 * Step 3: Retrieve the transcript
 */

export interface BatchJobSubmitResult {
    jobId: string;
}

export async function submitBatchTranscription(
    audioUrl: string,
    opts?: {
        model?: "saarika:v2.5" | "saaras:v3";
        languageCode?: string;
    }
): Promise<BatchJobSubmitResult> {
    const response = await fetch(`${SARVAM_API_URL}/speech-to-text-translate/batch`, {
        method: "POST",
        headers: {
            "api-subscription-key": getApiKey(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            url: audioUrl,
            model: opts?.model || "saaras:v3",
            language_code: opts?.languageCode || "unknown",
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Sarvam batch submit error:", response.status, errorBody);
        throw new Error(`Sarvam batch submit failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    return { jobId: data.job_id || data.request_id };
}

export interface BatchJobStatus {
    status: "queued" | "processing" | "completed" | "failed";
    transcript?: string;
    languageCode?: string | null;
}

export async function checkBatchStatus(jobId: string): Promise<BatchJobStatus> {
    const response = await fetch(`${SARVAM_API_URL}/speech-to-text-translate/batch/${jobId}`, {
        method: "GET",
        headers: {
            "api-subscription-key": getApiKey(),
        },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Sarvam batch status failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();

    return {
        status: data.status || "processing",
        transcript: data.transcript,
        languageCode: data.language_code,
    };
}

/**
 * Convenience: transcribe audio based on duration.
 * - ≤30s: direct REST call
 * - >30s: submit batch job (caller must poll for result)
 */
export async function transcribeAudio(
    audioBuffer: Buffer,
    durationSec: number,
    fileName: string = "recording.webm",
    opts?: {
        model?: "saarika:v2.5" | "saaras:v3";
        languageCode?: string;
        audioUrl?: string; // Required for batch mode
    }
): Promise<
    | { mode: "instant"; result: SarvamTranscriptResult }
    | { mode: "batch"; jobId: string }
> {
    if (durationSec <= 30) {
        const result = await transcribeShortAudio(audioBuffer, fileName, {
            model: opts?.model,
            languageCode: opts?.languageCode,
        });
        return { mode: "instant", result };
    }

    // For batch, we need the public audio URL
    if (!opts?.audioUrl) {
        throw new Error("audioUrl is required for batch transcription (audio > 30s)");
    }

    const { jobId } = await submitBatchTranscription(opts.audioUrl, {
        model: opts?.model,
        languageCode: opts?.languageCode,
    });

    return { mode: "batch", jobId };
}
