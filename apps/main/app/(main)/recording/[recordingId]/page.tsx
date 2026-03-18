import { notFound } from "next/navigation";
import { getRecordingById, getRecordingPlaybackUrl } from "@/actions/recording.action";
import RecordingDetailClient from "./recording-detail-client";

interface RecordingDetailPageProps {
    params: Promise<{ recordingId: string }>;
}

export default async function RecordingDetailPage({ params }: RecordingDetailPageProps) {
    const { recordingId } = await params;
    const recording = await getRecordingById(recordingId);

    if (!recording) {
        notFound();
    }

    const playbackUrl = await getRecordingPlaybackUrl(recordingId);

    return <RecordingDetailClient recording={recording} playbackUrl={playbackUrl} />;
}
