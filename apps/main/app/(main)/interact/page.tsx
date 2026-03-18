import { getUserChatThreads } from "@/actions/interact.action";
import InteractClient from "./interact-client";

export default async function InteractPage() {
    const threads = await getUserChatThreads();

    return <InteractClient initialThreads={threads} />;
}