import { getUserRecordings } from "@/actions/recording.action";
import LibraryClient from "./library-client";

export default async function LibraryPage() {
    const recordings = await getUserRecordings();

    return <LibraryClient recordings={recordings} />;
}
