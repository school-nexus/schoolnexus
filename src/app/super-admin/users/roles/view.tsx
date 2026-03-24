"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Plus, Clock } from 'lucide-react';

export default function RolesView() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Role Assignments</h1>
                    <p className="text-slate-500 font-medium">Manage platform-level administrative roles and permissions.</p>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2" disabled>
                    <Plus className="w-5 h-5" /> New Role
                </Button>
            </div>
            
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden text-center p-12">
                <CardContent className="flex flex-col items-center justify-center space-y-4 pt-6">
                    <div className="bg-slate-50 p-6 rounded-full">
                        <Clock className="w-12 h-12 text-slate-300" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">Custom Roles Coming Soon</h2>
                    <p className="text-slate-500 font-medium max-w-md">Currently, platform administrators are assigned dynamically via system logic. Full custom role modeling across all institutions will be available in the next deployment phase.</p>
                </CardContent>
            </Card>
        </div>
    )
}
