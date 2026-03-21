import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
    School,
    Phone,
    Mail,
    MapPin,
    Camera,
    Lock,
    ArrowRight,
    Globe,
    FileText,
    Quote,
    Facebook,
    Twitter,
    Linkedin,
    Coins,
    X
} from "lucide-react"
import { fileActions } from "@/lib/electron"

interface SchoolInfoStepProps {
    data: any
    onUpdate: (data: any) => void
    onNext: () => void
}

const currencies = [
    { code: "UGX", name: "Ugandan Shilling", symbol: "Shs" },
    { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
    { code: "RWF", name: "Rwandan Franc", symbol: "FRw" },
]

export function SchoolInfoStep({ data, onUpdate, onNext }: SchoolInfoStepProps) {
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!data.name?.trim()) newErrors.name = "School name is required"
        if (!data.phone?.trim()) newErrors.phone = "Contact number is required"
        if (!data.address?.trim()) newErrors.address = "Complete address is required"

        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            newErrors.email = "Invalid email format"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validate()) {
            onNext()
        }
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            alert("File size must be less than 2MB")
            return
        }

        setIsUploading(true)
        try {
            const filePath = await fileActions.save(file, "logos", "school")
            onUpdate({ logo: filePath })
        } catch (error) {
            console.error("Logo upload failed:", error)
            alert("Failed to upload logo. Please try again.")
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <div className="space-y-5">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm transition-all hover:shadow-md">
                {/* Branding Section */}
                <div className="flex items-start gap-8 mb-8 pb-8 border-b border-slate-100">
                    <div className="relative group">
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleLogoUpload}
                        />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="h-32 w-32 rounded-3xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-emerald-50 hover:border-emerald-400 overflow-hidden relative"
                        >
                            {data.logo ? (
                                <>
                                    <img src={`protocol-file://${data.logo}`} className="h-full w-full object-cover" alt="School Logo" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                        <Camera className="h-6 w-6 text-white" />
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onUpdate({ logo: "" })
                                        }}
                                        className="absolute top-1 right-1 bg-white/90 rounded-full p-1 shadow-md hover:bg-white text-red-500"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Camera className="h-6 w-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Logo</span>
                                </>
                            )}
                            {isUploading && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <div className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 pt-2">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">School Profile</h3>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                                <Coins className="h-4 w-4 text-emerald-600" />
                                <select
                                    className="bg-transparent text-xs font-bold text-emerald-700 outline-none cursor-pointer"
                                    value={data.currency}
                                    onChange={(e) => onUpdate({ currency: e.target.value })}
                                >
                                    {currencies.map(c => (
                                        <option key={c.code} value={c.code}>{c.code} - {c.symbol}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm leading-relaxed mb-4">
                            Establish your school's digital identity. This information will be used for all official correspondence and documentation.
                        </p>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-1 md:col-span-2 space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                            School Name <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <School className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="e.g. Greenwood International Academy"
                                className={`h-12 pl-12 bg-slate-50/50 border-slate-200 rounded-2xl focus:bg-white transition-all text-sm font-medium ${errors.name ? 'border-red-500 bg-red-50/30' : ''}`}
                                value={data.name}
                                onChange={(e) => onUpdate({ name: e.target.value })}
                            />
                        </div>
                        {errors.name && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.name}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                            Primary Contact No. <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="+256 000 000000"
                                className={`h-12 pl-12 bg-slate-50/50 border-slate-200 rounded-2xl focus:bg-white transition-all text-sm font-medium ${errors.phone ? 'border-red-500 bg-red-50/30' : ''}`}
                                value={data.phone}
                                onChange={(e) => onUpdate({ phone: e.target.value })}
                            />
                        </div>
                        {errors.phone && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.phone}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                            Official Email Address
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                type="email"
                                placeholder="administration@school.edu"
                                className={`h-12 pl-12 bg-slate-50/50 border-slate-200 rounded-2xl focus:bg-white transition-all text-sm font-medium ${errors.email ? 'border-red-500 bg-red-50/30' : ''}`}
                                value={data.email}
                                onChange={(e) => onUpdate({ email: e.target.value })}
                            />
                        </div>
                        {errors.email && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.email}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                            Official Website (Optional)
                        </Label>
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="www.greenwoodacademy.com"
                                className="h-12 pl-12 bg-slate-50/50 border-slate-200 rounded-2xl focus:bg-white transition-all text-sm font-medium"
                                value={data.website}
                                onChange={(e) => onUpdate({ website: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                            Registration Number
                        </Label>
                        <div className="relative">
                            <FileText className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Registration ID / license No."
                                className="h-12 pl-12 bg-slate-50/50 border-slate-200 rounded-2xl focus:bg-white transition-all text-sm font-medium"
                                value={data.registrationNumber}
                                onChange={(e) => onUpdate({ registrationNumber: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                            School Motto / Slogan
                        </Label>
                        <div className="relative">
                            <Quote className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="e.g. Knowledge is Power"
                                className="h-12 pl-12 bg-slate-50/50 border-slate-200 rounded-2xl focus:bg-white transition-all text-sm font-medium italic"
                                value={data.motto}
                                onChange={(e) => onUpdate({ motto: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 space-y-1.5">
                        <Label className="text-xs font-bold text-slate-700 ml-1 flex items-center gap-1.5">
                            Complete Physical Address <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                            <Textarea
                                placeholder="Plot number, Street, City, State/Province, Country"
                                className={`min-h-[100px] pl-12 pt-4 bg-slate-50/50 border-slate-200 rounded-2xl focus:bg-white transition-all text-sm font-medium resize-none shadow-none ${errors.address ? 'border-red-500 bg-red-50/30' : ''}`}
                                value={data.address}
                                onChange={(e) => onUpdate({ address: e.target.value })}
                            />
                        </div>
                        {errors.address && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.address}</p>}
                    </div>

                </div>

                <div className="mt-8 flex items-center gap-2 text-slate-400 px-1 py-1 border-t border-slate-50 pt-6">
                    <Lock className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium italic">Confidential Data Infrastructure. Stored locally on your school server.</span>
                </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex justify-end pt-4 pb-12">
                <Button
                    onClick={handleNext}
                    className="h-14 px-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                >
                    Save & Continue
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
            </div>
        </div>
    )
}
