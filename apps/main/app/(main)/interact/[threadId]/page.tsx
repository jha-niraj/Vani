import { redirect } from "next/navigation";
import { getThreadMessages, getUserChatThreads } from "@/actions/interact.action";
import ThreadChatClient from "./thread-chat-client";

interface InteractThreadPageProps {
    params: Promise<{ threadId: string }>;
}

export default async function InteractThreadPage({ params }: InteractThreadPageProps) {
    const { threadId } = await params;
    const threads = await getUserChatThreads();

    const activeThread = threads.find((thread) => thread.id === threadId);
    if (!activeThread) {
        redirect("/interact");
    }

    const messages = await getThreadMessages(threadId);

    return (
        <ThreadChatClient
            initialThreads={threads}
            initialThreadId={threadId}
            initialMessages={messages}
        />
    );
}