"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, Plus, Clock } from 'lucide-react';

export default function BackupsView() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Global Backups</h1>
                    <p className="text-slate-500 font-medium">Manage and restore point-in-time snapshots of the entire D1 database.</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2" disabled>
                    <Plus className="w-5 h-5" /> Trigger Manual Backup
                </Button>
            </div>
            
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden text-center p-12">
                <CardContent className="flex flex-col items-center justify-center space-y-4 pt-6">
                    <div className="bg-slate-50 p-6 rounded-full">
                        <Clock className="w-12 h-12 text-slate-300" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">Cloudflare D1 Automated Backups</h2>
                    <p className="text-slate-500 font-medium max-w-md">Your database is currently backed up automatically by Cloudflare directly at the infrastructure level. The dashboard interface for on-demand restorations is coming soon.</p>
                </CardContent>
            </Card>
        </div>
    )
}
