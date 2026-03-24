"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Save, Clock, Loader2, Globe, Mail, ShieldCheck } from 'lucide-react';
import { invokeIPC } from "@/lib/electron";
import { toast } from "sonner";

export default function SettingsView() {
    const [settings, setSettings] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        setLoading(true)
        try {
            const data = await invokeIPC<any[]>('get-platform-settings')
            if (data) {
                const mapped = data.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {})
                setSettings({
                    platform_name: mapped.platform_name || 'School Nexus Cloud',
                    support_email: mapped.support_email || 'support@schoolnexus.com',
                    maintenance_mode: mapped.maintenance_mode || 'false',
                    ...mapped
                })
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            for (const [key, value] of Object.entries(settings)) {
                await invokeIPC('update-platform-setting', { key, value })
            }
            toast.success("Platform settings updated successfully")
            fetchSettings()
        } catch (error) {
            toast.error("Failed to update settings")
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Platform Settings</h1>
                    <p className="text-slate-500 font-medium">Configure global system parameters, email drivers, and domain bindings.</p>
                </div>
                <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2" 
                    onClick={handleSave}
                    disabled={loading || saving}
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                </Button>
            </div>
            
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
                    <p className="font-medium animate-pulse">Loading configuration...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-500" />
                                <CardTitle className="text-lg font-black text-slate-900">General Identity</CardTitle>
                            </div>
                            <CardDescription className="text-slate-500 font-medium">Core branding and routing parameters for the multi-tenant system.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="platform_name" className="font-bold text-slate-700">Platform Name</Label>
                                <Input 
                                    id="platform_name" 
                                    value={settings.platform_name || ''} 
                                    onChange={(e) => handleChange('platform_name', e.target.value)}
                                    className="rounded-xl border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="support_email" className="font-bold text-slate-700">Global Support Email</Label>
                                <Input 
                                    id="support_email" 
                                    type="email"
                                    value={settings.support_email || ''} 
                                    onChange={(e) => handleChange('support_email', e.target.value)}
                                    className="rounded-xl border-slate-200"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-purple-500" />
                                <CardTitle className="text-lg font-black text-slate-900">System Control</CardTitle>
                            </div>
                            <CardDescription className="text-slate-500 font-medium">Security policies and master access toggles.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="maintenance_mode" className="font-bold text-slate-700">Maintenance Mode</Label>
                                <select 
                                    id="maintenance_mode"
                                    value={settings.maintenance_mode || 'false'}
                                    onChange={(e) => handleChange('maintenance_mode', e.target.value)}
                                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                                >
                                    <option value="false">Disabled - Platform Active</option>
                                    <option value="true">Enabled - Lockout All Schools</option>
                                </select>
                            </div>
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm font-medium">
                                Enabling maintenance mode will force-logout all institutional users and display a system upgrade screen globally. Super Admins will retain access.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
