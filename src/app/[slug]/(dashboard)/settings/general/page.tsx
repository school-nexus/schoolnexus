"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Settings,
    Globe,
    Clock,
    DollarSign,
    ShieldCheck,
    Bell,
    Mail,
    Save,
    ChevronRight,
    Languages,
    Calendar,
    Lock,
    Eye,
    EyeOff,
    Loader2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { settingsActions, schoolProfileActions } from "@/lib/electron"
import { toast } from "sonner"

interface SystemSetting {
    id: number
    key: string
    value: string
    group: string
}

interface SchoolProfile {
    name: string
    registrationNumber: string
    email: string
    phone: string
    address: string
    website: string
    facebook: string
    twitter: string
    linkedin: string
    logo: string
    currency?: string
}

export default function GeneralSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showApiKey, setShowApiKey] = useState(false)
    const [profile, setProfile] = useState<SchoolProfile | null>(null)
    const [settings, setSettings] = useState<Record<string, string>>({})

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [dbSettings, dbProfile] = await Promise.all([
                settingsActions.get() as Promise<SystemSetting[]>,
                schoolProfileActions.get() as Promise<SchoolProfile | null>
            ])

            const settingsMap: Record<string, string> = {}
            dbSettings.forEach((s) => {
                settingsMap[s.key] = s.value
            })

            setSettings(settingsMap)
            setProfile(dbProfile)
        } catch (error: unknown) {
            console.error("Failed to fetch settings:", error)
            toast.error("Failed to load settings")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const savePromises: Promise<void>[] = []

            // Update individual settings
            Object.entries(settings).forEach(([key, value]) => {
                savePromises.push(settingsActions.update({ key, value }) as Promise<void>)
            })

            // Update school profile (currency is part of profile)
            if (profile) {
                savePromises.push(schoolProfileActions.update(profile) as any as Promise<void>)
            }

            await Promise.all(savePromises)
            toast.success("Settings saved successfully")
        } catch (error: unknown) {
            console.error("Failed to save settings:", error)
            toast.error("Failed to save settings")
        } finally {
            setSaving(false)
        }
    }

    const updateSetting = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-emerald-600 opacity-20" />
                    <p className="text-sm font-medium text-slate-400 animate-pulse">Loading system settings...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/20 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/20 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-4xl mx-auto space-y-8">
                <PageHeader
                    title="General Settings"
                    description="Configure system-wide preferences, localization, and security defaults."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Settings", href: "/settings" },
                        { label: "General" },
                    ]}
                    actions={
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-11 px-8 rounded-xl transition-all hover:scale-[1.02] active:scale-95 font-semibold"
                        >
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    }
                />

                <div className="grid grid-cols-1 gap-8">
                    {/* Localization Section */}
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                        <CardHeader className="border-b border-slate-100 p-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100">
                                    <Globe className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-900">Localization</CardTitle>
                                    <CardDescription>Set your institution's regional and language preferences.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">System Language</Label>
                                <Select
                                    value={settings.system_language || "en"}
                                    onValueChange={(v) => updateSetting("system_language", v)}
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                        <SelectValue placeholder="Select Language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English (US)</SelectItem>
                                        <SelectItem value="uk">English (UK)</SelectItem>
                                        <SelectItem value="fr">French</SelectItem>
                                        <SelectItem value="sw">Swahili</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">Timezone</Label>
                                <Select
                                    value={settings.timezone || "eat"}
                                    onValueChange={(v) => updateSetting("timezone", v)}
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                        <SelectValue placeholder="Select Timezone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="eat">East Africa Time (UTC+3)</SelectItem>
                                        <SelectItem value="gmt">GMT (UTC+0)</SelectItem>
                                        <SelectItem value="est">Eastern Standard Time (UTC-5)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">Currency Symbol</Label>
                                <Select
                                    value={profile?.currency || "UGX"}
                                    onValueChange={(v) => setProfile((prev: SchoolProfile | null) => prev ? ({ ...prev, currency: v }) : null)}
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                        <SelectValue placeholder="Select Currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                                        <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">Date Format</Label>
                                <Select
                                    value={settings.date_format || "ddmmyyyy"}
                                    onValueChange={(v) => updateSetting("date_format", v)}
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50">
                                        <SelectValue placeholder="Select Format" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ddmmyyyy">DD/MM/YYYY</SelectItem>
                                        <SelectItem value="mmddyyyy">MM/DD/YYYY</SelectItem>
                                        <SelectItem value="yyyymmdd">YYYY-MM-DD</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security Section */}
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                        <CardHeader className="border-b border-slate-100 p-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center ring-1 ring-teal-100">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-900">Security & Access</CardTitle>
                                    <CardDescription>Manage password policies and session security.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold text-slate-900">Two-Factor Authentication (2FA)</Label>
                                    <p className="text-xs text-slate-500">Require 2FA for all administrative accounts.</p>
                                </div>
                                <Switch
                                    checked={settings.two_factor_auth === "true"}
                                    onCheckedChange={(checked) => updateSetting("two_factor_auth", checked.toString())}
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold text-slate-900">Session Timeout</Label>
                                    <p className="text-xs text-slate-500">Automatically log out users after inactivity.</p>
                                </div>
                                <Select
                                    value={settings.session_timeout || "30"}
                                    onValueChange={(v) => updateSetting("session_timeout", v)}
                                >
                                    <SelectTrigger className="w-32 h-10 rounded-xl border-slate-200 bg-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="15">15 mins</SelectItem>
                                        <SelectItem value="30">30 mins</SelectItem>
                                        <SelectItem value="60">1 hour</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-slate-700">API Key</Label>
                                <div className="relative">
                                    <Input
                                        type={showApiKey ? "text" : "password"}
                                        value="sk_test_51MzX9pL2qW4rT8vN0yH1uI3oP5aK7sD9fG0hJ..."
                                        readOnly
                                        className="h-11 rounded-xl border-slate-200 bg-slate-50/50 pr-12 font-mono text-xs"
                                    />
                                    <button
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400">Use this key for external integrations. Keep it secret!</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notifications Section */}
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                        <CardHeader className="border-b border-slate-100 p-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center ring-1 ring-amber-100">
                                    <Bell className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-bold text-slate-900">Notifications</CardTitle>
                                    <CardDescription>Configure how the system communicates with users.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold text-slate-900">Email Notifications</Label>
                                    <p className="text-xs text-slate-500">Send automated emails for fee reminders and exam results.</p>
                                </div>
                                <Switch
                                    checked={settings.email_notifications === "true"}
                                    onCheckedChange={(checked) => updateSetting("email_notifications", checked.toString())}
                                />
                            </div>
                            <div className="h-px bg-slate-100" />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold text-slate-900">SMS Alerts</Label>
                                    <p className="text-xs text-slate-500">Send critical alerts via SMS to parents and staff.</p>
                                </div>
                                <Switch
                                    checked={settings.sms_alerts === "true"}
                                    onCheckedChange={(checked) => updateSetting("sms_alerts", checked.toString())}
                                />
                            </div>
                            <div className="h-px bg-slate-100" />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-bold text-slate-900">Push Notifications</Label>
                                    <p className="text-xs text-slate-500">Enable browser push notifications for real-time updates.</p>
                                </div>
                                <Switch
                                    checked={settings.push_notifications === "true"}
                                    onCheckedChange={(checked) => updateSetting("push_notifications", checked.toString())}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

