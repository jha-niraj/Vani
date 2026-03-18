import { getThreadMessages, getUserChatThreads } from "@/actions/interact.action";
import InteractClient from "./interact-client";

interface InteractPageProps {
    searchParams: Promise<{ thread?: string }>;
}

export default async function InteractPage({ searchParams }: InteractPageProps) {
    const params = await searchParams;
    const threads = await getUserChatThreads();

    const selectedThreadId =
        params.thread && threads.some((thread) => thread.id === params.thread)
            ? params.thread
            : threads[0]?.id;

    const initialMessages = selectedThreadId ? await getThreadMessages(selectedThreadId) : [];

    return (
        <InteractClient
            initialThreads={threads}
            initialSelectedThreadId={selectedThreadId}
            initialMessages={initialMessages}
        />
    );
}
