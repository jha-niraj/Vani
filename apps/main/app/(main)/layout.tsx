import { Sidebar } from "@/components/navigation/sidebar"

export default function HomeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex w-full flex-1 flex-col border-r border-l md:flex-row max-w-3xl mx-auto">
            <Sidebar />
            
            <main className="flex-1 w-full px-4 py-6 pb-20 md:pb-6 overflow-y-auto">
                <div className="mx-auto max-w-3xl">
                    {children}
                </div>
            </main>
        </div>
    )
}