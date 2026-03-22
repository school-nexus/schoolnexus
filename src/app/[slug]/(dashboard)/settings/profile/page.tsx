"use client"
export const runtime = 'edge';

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    School,
    Upload,
    MapPin,
    Phone,
    Mail,
    Globe,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    Save,
    Camera,
    Info,
    CheckCircle2,
    Loader2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { schoolProfileActions, fileActions } from "@/lib/electron"
import { toast } from "sonner"

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

export default function SchoolProfilePage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [profile, setProfile] = useState<SchoolProfile>({
        name: "",
        registrationNumber: "",
        email: "",
        phone: "",
        address: "",
        website: "",
        facebook: "",
        twitter: "",
        linkedin: "",
        logo: "",
        currency: "UGX"
    })

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await schoolProfileActions.get() as SchoolProfile | null
                if (data) {
                    setProfile({
                        name: data.name || "",
                        registrationNumber: data.registrationNumber || "",
                        email: data.email || "",
                        phone: data.phone || "",
                        address: data.address || "",
                        website: data.website || "",
                        facebook: data.facebook || "",
                        twitter: data.twitter || "",
                        linkedin: data.linkedin || "",
                        logo: data.logo || "",
                        currency: data.currency || "UGX"
                    })
                }
            } catch (error: unknown) {
                console.error("Failed to fetch profile:", error)
                toast.error("Failed to load school profile")
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

    const handleUpdate = async () => {
        setSaving(true)
        try {
            await schoolProfileActions.update(profile) as any as Promise<void>
            toast.success("School profile updated successfully")
        } catch (error: unknown) {
            console.error("Failed to update profile:", error)
            toast.error("Failed to update school profile")
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (field: keyof SchoolProfile, value: string) => {
        setProfile(prev => ({ ...prev, [field]: value }))
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
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/20 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/20 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-5xl mx-auto space-y-8">
                <PageHeader
                    title="School Profile"
                    description="Manage your institution's public identity, contact details, and branding assets."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Settings", href: "/settings" },
                        { label: "School Profile" },
                    ]}
                    actions={
                        <Button
                            onClick={handleUpdate}
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-11 px-8 rounded-xl transition-all hover:scale-[1.02] active:scale-95 font-semibold"
                        >
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {saving ? "Saving..." : "Update Profile"}
                        </Button>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Branding & Logo (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-slate-900">Institutional Logo</CardTitle>
                                <CardDescription>This logo will appear on report cards and invoices.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center p-8 pt-2">
                                <div className="relative group">
                                    <div className="h-40 w-40 rounded-3xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-emerald-400">
                                        {profile.logo ? (
                                            <img
                                                src={fileActions.getUrl(profile.logo)}
                                                alt="School Logo"
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <School className="h-16 w-16 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                                        )}
                                        {/* Mock Image Overlay */}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => document.getElementById('logo-upload')?.click()}>
                                            <Camera className="h-8 w-8 text-white" />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => document.getElementById('logo-upload')?.click()}
                                        className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl bg-emerald-600 text-white shadow-lg flex items-center justify-center hover:bg-emerald-700 transition-colors"
                                    >
                                        <Upload className="h-5 w-5" />
                                    </button>
                                    <input
                                        type="file"
                                        id="logo-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                try {
                                                    // For logo, we use a fixed ID like 'school' or the profile ID if available
                                                    // Let's use 'branding' as the ID for school logo
                                                    const path = await fileActions.save(file, 'logos', 'branding');
                                                    handleChange("logo", path);
                                                    toast.success("Logo uploaded successfully");
                                                } catch (error: unknown) {
                                                    console.error("Failed to upload logo:", error);
                                                    toast.error("Failed to upload logo");
                                                }
                                            }
                                        }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-6 text-center leading-relaxed">
                                    Recommended size: 512x512px.<br />Supported formats: PNG, JPG, SVG.
                                </p>
                            </CardContent>
                        </Card>

                        <div className="p-6 rounded-3xl bg-emerald-600 text-white shadow-xl shadow-emerald-500/20 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                                    <Info className="h-5 w-5" />
                                </div>
                                <h4 className="font-bold">Profile Completion</h4>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs font-bold">
                                    <span>Progress</span>
                                    <span>{Object.values(profile).filter(v => v).length * 10}%</span>
                                </div>
                                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${Object.values(profile).filter(v => v).length * 10}%` }} />
                                </div>
                            </div>
                            <p className="text-xs text-emerald-100 leading-relaxed">
                                Complete your profile to enable all features in the Reports and Accounts modules.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Details (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                            <CardHeader className="border-b border-slate-100 p-6">
                                <CardTitle className="text-lg font-bold text-slate-900">Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700">Institution Name</Label>
                                        <Input
                                            value={profile.name}
                                            onChange={(e) => handleChange("name", e.target.value)}
                                            placeholder="Enter school name"
                                            className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700">Registration Number</Label>
                                        <Input
                                            value={profile.registrationNumber}
                                            onChange={(e) => handleChange("registrationNumber", e.target.value)}
                                            placeholder="MOE/REG/..."
                                            className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700">Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                value={profile.email}
                                                onChange={(e) => handleChange("email", e.target.value)}
                                                placeholder="info@school.edu"
                                                className="pl-11 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <Input
                                                value={profile.phone}
                                                onChange={(e) => handleChange("phone", e.target.value)}
                                                placeholder="+256 ..."
                                                className="pl-11 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <Label className="text-sm font-bold text-slate-700">Physical Address</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3.5 top-4 h-4 w-4 text-slate-400" />
                                            <Textarea
                                                value={profile.address}
                                                onChange={(e) => handleChange("address", e.target.value)}
                                                placeholder="Plot ..., Road, City, Country"
                                                className="pl-11 min-h-[100px] rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                            <CardHeader className="border-b border-slate-100 p-6">
                                <CardTitle className="text-lg font-bold text-slate-900">Social Media & Web</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700">Website URL</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            value={profile.website}
                                            onChange={(e) => handleChange("website", e.target.value)}
                                            placeholder="www.school.edu"
                                            className="pl-11 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700">Facebook Page</Label>
                                    <div className="relative">
                                        <Facebook className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            value={profile.facebook}
                                            onChange={(e) => handleChange("facebook", e.target.value)}
                                            placeholder="facebook.com/..."
                                            className="pl-11 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700">Twitter (X)</Label>
                                    <div className="relative">
                                        <Twitter className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            value={profile.twitter}
                                            onChange={(e) => handleChange("twitter", e.target.value)}
                                            placeholder="@school"
                                            className="pl-11 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-slate-700">LinkedIn Profile</Label>
                                    <div className="relative">
                                        <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            value={profile.linkedin}
                                            onChange={(e) => handleChange("linkedin", e.target.value)}
                                            placeholder="linkedin.com/school/..."
                                            className="pl-11 h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

