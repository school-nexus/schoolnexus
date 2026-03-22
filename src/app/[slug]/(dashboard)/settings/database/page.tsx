export const runtime = 'edge';
"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Database, RefreshCw, AlertTriangle, CheckCircle2, Loader2, Server } from "lucide-react"
import { userActions } from "@/lib/electron"
import { toast } from "sonner"
import { useApp } from "@/context/AppContext"
import { useConfirm } from "@/components/providers/confirm-provider"

export default function DatabaseSettingsPage() {
    const { confirm } = useConfirm()
    const [seeding, setSeeding] = useState(false)
    const { refreshContext } = useApp()

    const handleSeed = async () => {
        if (await confirm({
            title: "Seed Database",
            description: "Are you sure you want to seed the database with demo data? This will populate the system with sample records and is irreversible.",
            confirmText: "Seed Database",
            variant: "destructive"
        })) {
            setSeeding(true)
            try {
                const result = await userActions.seed() as { success: boolean; message: string }
                if (result.success) {
                    toast.success(result.message)
                    await refreshContext()
                } else {
                    toast.info(result.message)
                }
            } catch (error: unknown) {
                console.error("Seeding failed:", error)
                toast.error("Failed to seed database")
            } finally {
                setSeeding(false)
            }
        }
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/20 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/20 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-4xl mx-auto space-y-8">
                <PageHeader
                    title="Database Management"
                    description="Manage system data, backups, and initialization."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Settings", href: "/settings" },
                        { label: "Database" },
                    ]}
                    actions={
                        <Button
                            onClick={handleSeed}
                            disabled={seeding}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-11 px-8 rounded-xl transition-all hover:scale-[1.02] active:scale-95 font-semibold"
                        >
                            {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            {seeding ? "Seeding..." : "Seed Database"}
                        </Button>
                    }
                />

                <div className="grid gap-6">
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardHeader className="border-b border-slate-100 p-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100">
                                    <Database className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-900">Data Initialization</CardTitle>
                                    <CardDescription>Populate the system with demo data for testing.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                        <Server className="h-4 w-4 text-emerald-500" />
                                        Seed Demo Data
                                    </h4>
                                    <p className="text-sm text-slate-500 max-w-md">
                                        This will populate the database with sample users, students, teachers, classes, and financial records.
                                        Only works if the database is empty.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleSeed}
                                    disabled={seeding}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-11 px-6 rounded-xl transition-all hover:scale-[1.02] font-bold min-w-[160px]"
                                >
                                    {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                    {seeding ? "Seeding..." : "Seed Database"}
                                </Button>
                            </div>

                            <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-amber-50 text-amber-800 border border-amber-100">
                                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-bold">Warning</p>
                                    <p className="mt-1 opacity-90">
                                        Seeding data is irreversible. Ensure you are in a development environment or have a backup before proceeding.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

