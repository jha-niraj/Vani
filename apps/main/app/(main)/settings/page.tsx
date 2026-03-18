import { redirect } from "next/navigation";
import { getUserSettings } from "@/actions/settings.action";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
    const settings = await getUserSettings();

    if (!settings) {
        redirect("/home");
    }

    return <SettingsClient settings={settings} />;
}