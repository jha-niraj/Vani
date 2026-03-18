"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
    Save, ShieldCheck, Globe2, UserRound, Languages
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Button } from "@repo/ui/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";
import { Switch } from "@repo/ui/components/ui/switch";
import { Badge } from "@repo/ui/components/ui/badge";
import { toast } from "@repo/ui/components/ui/sonner";
import { updateUserSettings } from "@/actions/settings.action";

const LANGUAGE_OPTIONS = [
    "en-IN",
    "hi-IN",
    "hinglish",
    "bn-IN",
    "ta-IN",
    "te-IN",
    "mr-IN",
    "gu-IN",
    "kn-IN",
    "ml-IN",
    "pa-IN",
    "od-IN",
    "mai-IN",
];

const USE_CASE_OPTIONS = [
    "STUDENT",
    "SALES_REP",
    "FOUNDER",
    "DOCTOR",
    "JOURNALIST",
    "FIELD_WORKER",
    "PERSONAL_JOURNALING",
    "LAB_RESEARCHER",
] as const;

type Settings = {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    preferredLanguage: string | null;
    timezone: string | null;
    consentGiven: boolean;
    useCase: (typeof USE_CASE_OPTIONS)[number] | null;
    onboarded: boolean;
    createdAt: Date | string;
};

export default function SettingsClient({ settings }: { settings: Settings }) {
    const [name, setName] = useState(settings.name || "");
    const [language, setLanguage] = useState(settings.preferredLanguage || "en-IN");
    const [timezone, setTimezone] = useState(settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [consentGiven, setConsentGiven] = useState(settings.consentGiven);
    const [useCase, setUseCase] = useState<(typeof USE_CASE_OPTIONS)[number]>(settings.useCase || "STUDENT");
    const [isPending, startTransition] = useTransition();

    const onSave = () => {
        startTransition(async () => {
            const result = await updateUserSettings({
                name,
                preferredLanguage: language,
                timezone,
                consentGiven,
                useCase,
            });

            if (!result.success) {
                toast.error(result.message || "Could not update settings.");
                return;
            }

            toast.success("Settings saved");
        });
    };

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-6">
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Profile, language, and AI processing preferences.
                </p>
            </div>

            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <UserRound className="h-4 w-4" />
                            Account
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={settings.email || ""} disabled />
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Joined on {new Date(settings.createdAt).toLocaleDateString("en-IN")}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Languages className="h-4 w-4" />
                            Transcription Defaults
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Preferred Language</Label>
                            <Select value={language} onValueChange={setLanguage}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGE_OPTIONS.map((item) => (
                                        <SelectItem key={item} value={item}>{item}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Use Case</Label>
                            <Select value={useCase} onValueChange={(value) => setUseCase(value as (typeof USE_CASE_OPTIONS)[number])}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select use case" />
                                </SelectTrigger>
                                <SelectContent>
                                    {USE_CASE_OPTIONS.map((item) => (
                                        <SelectItem key={item} value={item}>{item}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label className="flex items-center gap-2">
                                <Globe2 className="h-3.5 w-3.5" />
                                Timezone
                            </Label>
                            <Input value={timezone} onChange={(event) => setTimezone(event.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            Privacy & Consent
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-xl border p-4 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-medium">Allow AI processing</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Enables Sarvam transcription and OpenAI extraction on new recordings.
                                </p>
                            </div>
                            <Switch checked={consentGiven} onCheckedChange={setConsentGiven} />
                        </div>
                        <div className="mt-3">
                            <Badge variant={consentGiven ? "default" : "secondary"}>
                                {consentGiven ? "Enabled" : "Disabled"}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Button onClick={onSave} disabled={isPending} className="w-full sm:w-auto">
                    <Save className="h-4 w-4 mr-2" />
                    {isPending ? "Saving..." : "Save Settings"}
                </Button>
            </motion.div>
        </div>
    );
}
