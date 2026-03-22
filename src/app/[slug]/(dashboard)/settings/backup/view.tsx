"use client"
export const runtime = 'edge';

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, CheckCircle2, Clock, Download, FolderArchive, HardDrive, Loader2, MoreHorizontal, Save, Trash2, Upload } from 'lucide-react';
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { backupActions } from "@/lib/electron"

interface Backup {
    id: number;
    name: string;
    file_path: string | null;
    size: string | null;
    type: string;
    status: string;
    created_at: string;
}

export default function BackupPage() {
    const [backups, setBackups] = useState<Backup[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)
    const [restoreBackupId, setRestoreBackupId] = useState<number | null>(null)

    useEffect(() => {
        fetchBackups()
    }, [])

    const fetchBackups = async () => {
        setLoading(true)
        try {
            const backupsData = await backupActions.getAll() as Backup[]
            setBackups(backupsData)
        } catch (error: unknown) {
            console.error("Failed to fetch backups:", error)
            toast.error("Failed to load backups")
        } finally {
            setLoading(false)
        }
    }

    const handleCreateBackup = async () => {
        setCreating(true)
        try {
            const newBackup = await backupActions.create() as any as Backup
            setBackups([newBackup, ...backups])
            toast.success("Backup created successfully!")
        } catch (error: unknown) {
            console.error("Failed to create backup:", error)
            toast.error("Failed to create backup")
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteBackup = async (id: number) => {
        try {
            await backupActions.delete(id) as any as Promise<void>
            setBackups(backups.filter(b => b.id !== id))
            toast.success("Backup deleted successfully")
        } catch (error: unknown) {
            console.error("Failed to delete backup:", error)
            toast.error("Failed to delete backup")
        }
    }

    const handleRestoreBackup = async (id: number) => {
        try {
            await backupActions.restore(id) as any as Promise<void>
            toast.success("Backup restored successfully! Please restart the application.")
        } catch (error: unknown) {
            console.error("Failed to restore backup:", error)
            toast.error("Failed to restore backup")
        }
    }

    const handleDownloadBackup = async (id: number) => {
        try {
            const filePath = await backupActions.download(id) as string
            toast.success(`Backup file: ${filePath}`)
        } catch (error: unknown) {
            console.error("Failed to download backup:", error)
            toast.error("Failed to download backup")
        }
    }

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-5xl mx-auto space-y-8">
                <PageHeader
                    title="Backup & Restore"
                    description="Manage database backups and restore points."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Settings", href: "/settings" },
                        { label: "Backup" },
                    ]}
                    actions={
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 h-11 px-6 rounded-xl shadow-sm font-semibold transition-all hover:scale-105 active:scale-95"
                                onClick={() => setRestoreBackupId(0)} // Placeholder or different logic if needed, but the original had a separate button
                            >
                                <Upload className="mr-2 h-4 w-4 text-teal-600" /> Restore Backup
                            </Button>
                            <Button
                                onClick={handleCreateBackup}
                                disabled={creating}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-11 px-8 rounded-xl transition-all hover:scale-[1.02] active:scale-95 font-semibold"
                            >
                                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {creating ? "Creating..." : "Create Backup"}
                            </Button>
                        </div>
                    }
                />

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100">
                                <FolderArchive className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Total Backups</p>
                                <p className="text-2xl font-bold text-slate-900">{backups.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Last Backup</p>
                                <p className="text-2xl font-bold text-slate-900">{backups[0] ? new Date(backups[0].created_at).toLocaleDateString() : 'Never'}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center ring-1 ring-teal-100">
                                <HardDrive className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Total Size</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {backups.reduce((sum, b) => sum + (b.size ? parseFloat(b.size) : 0), 0).toFixed(1)} MB
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Backup List */}
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Backup History</CardTitle>
                        <CardDescription>All available database backups</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {backups.map(backup => {
                            const createdDate = new Date(backup.created_at);
                            const dateStr = createdDate.toLocaleDateString();
                            const timeStr = createdDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                            return (
                                <div key={backup.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100">
                                            <FolderArchive className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-slate-900">{backup.name}</p>
                                                <Badge className={
                                                    backup.type === 'Automatic' ? "bg-teal-50 text-teal-700 border-teal-100" :
                                                        backup.type === 'Manual' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                            "bg-amber-50 text-amber-700 border-amber-100"
                                                }>
                                                    {backup.type}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                                <Calendar className="h-3.5 w-3.5" /> {dateStr}
                                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                <Clock className="h-3.5 w-3.5" /> {timeStr}
                                                <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                <HardDrive className="h-3.5 w-3.5" /> {backup.size || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className={backup.status === 'Success' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"}>
                                            <CheckCircle2 className="h-3 w-3 mr-1" /> {backup.status}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl">
                                                <DropdownMenuItem onClick={() => handleDownloadBackup(backup.id)}><Download className="mr-2 h-4 w-4" /> Download</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setRestoreBackupId(backup.id)}><Upload className="mr-2 h-4 w-4" /> Restore</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteBackup(backup.id)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Restore Confirmation Dialog */}
                <Dialog open={restoreBackupId !== null} onOpenChange={() => setRestoreBackupId(null)}>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle>Restore Backup</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to restore this backup? This will replace all current data with the backup data. The application may need to restart.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRestoreBackupId(null)}>Cancel</Button>
                            <Button onClick={() => { if (restoreBackupId) handleRestoreBackup(restoreBackupId); setRestoreBackupId(null); }}>
                                Restore
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

