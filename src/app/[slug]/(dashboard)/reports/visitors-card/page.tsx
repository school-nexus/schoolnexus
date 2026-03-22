"use client"
export const runtime = 'edge';

import React, { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Printer, UserCheck, ShieldCheck, History, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { schoolProfileActions } from "@/lib/electron"
import { toast } from "sonner"
import { VisitorCardTemplate } from "@/components/reports/visitors-card-template"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { type SchoolProfile } from "@/lib/report-utils"

export default function VisitorsCardPage() {
    const [profile, setProfile] = useState<SchoolProfile | null>(null)
    const [formData, setFormData] = useState({
        visitorName: "",
        category: "GENERAL VISITOR",
        personToSee: "",
        purpose: "",
        timeIn: "",
        date: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await schoolProfileActions.get() as SchoolProfile
                setProfile(data)

                // Set current time
                const now = new Date()
                setFormData(prev => ({
                    ...prev,
                    timeIn: now.toTimeString().substring(0, 5)
                }))
            } catch (error: unknown) {
                console.error("Failed to load school profile", error)
                toast.error("Failed to load school profile")
            }
        }
        fetchProfile()
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handlePrint = () => {
        if (!formData.visitorName.trim() || !formData.personToSee.trim()) {
            toast.error("Please fill in the visitor's name and person to see.")
            return
        }

        const printContent = document.getElementById("visitor-card-container")
        if (printContent) {
            const originalContent = document.body.innerHTML
            document.body.innerHTML = printContent.outerHTML
            window.print()
            document.body.innerHTML = originalContent
            window.location.reload()
        }
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative font-sans p-6 md:p-8">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-50/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-8">
                <PageHeader
                    title="Visitor Management"
                    description="Issue professional entry passes and maintain security protocols."
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Form Section */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card className="border-0 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 rounded-3xl overflow-hidden">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                        <UserCheck className="h-6 w-6 text-emerald-600" />
                                        New Admission
                                    </h3>
                                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Visitor Full Name</label>
                                        <div className="relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
                                            <Input
                                                name="visitorName"
                                                placeholder="Enter guest name..."
                                                value={formData.visitorName}
                                                onChange={handleInputChange}
                                                className="pl-11 h-12 bg-slate-50 border-0 rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500/20 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Visitor Category</label>
                                            <Select
                                                value={formData.category}
                                                onValueChange={(val) => handleSelectChange('category', val)}
                                            >
                                                <SelectTrigger className="h-12 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-semibold">
                                                    <SelectValue placeholder="Category" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="PARENT">Parent / Guardian</SelectItem>
                                                    <SelectItem value="OFFICIAL">Official Guest</SelectItem>
                                                    <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                                                    <SelectItem value="ALUMNI">School Alumni</SelectItem>
                                                    <SelectItem value="GENERAL VISITOR">General Visitor</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Person to See</label>
                                            <Input
                                                name="personToSee"
                                                placeholder="Contact person..."
                                                value={formData.personToSee}
                                                onChange={handleInputChange}
                                                className="h-12 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Purpose of Visit</label>
                                        <Textarea
                                            name="purpose"
                                            placeholder="Nature of visit..."
                                            value={formData.purpose}
                                            onChange={handleInputChange}
                                            className="resize-none bg-slate-50 border-0 rounded-xl h-24 focus-visible:ring-2 focus-visible:ring-emerald-500/20 transition-all font-medium pt-3"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Visit Date</label>
                                            <Input
                                                name="date"
                                                type="date"
                                                value={formData.date}
                                                onChange={handleInputChange}
                                                className="h-12 bg-slate-50 border-0 rounded-xl focus:outline-none"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Time In</label>
                                            <Input
                                                name="timeIn"
                                                type="time"
                                                value={formData.timeIn}
                                                onChange={handleInputChange}
                                                className="h-12 bg-slate-50 border-0 rounded-xl focus:outline-none font-mono"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <Button
                                            onClick={handlePrint}
                                            className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-xl shadow-emerald-200 transition-all hover:scale-[1.01] active:scale-[0.99] gap-2"
                                        >
                                            <Printer className="h-5 w-5" /> Issue & Print Pass
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex items-center gap-3 p-4 bg-white/50 rounded-2xl border border-slate-100">
                            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                <History className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-900">Recent Visitors</p>
                                <p className="text-[10px] text-slate-500 font-medium">Last 5 entries logged</p>
                            </div>
                            <Button variant="ghost" size="sm" className="ml-auto text-emerald-600 font-bold text-xs uppercase tracking-widest">View All</Button>
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="lg:col-span-7">
                        <Card className="border-0 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 rounded-[2.5rem] overflow-hidden sticky top-8">
                            <CardContent className="p-10 flex flex-col items-center">
                                <div className="w-full flex justify-between items-center mb-10">
                                    <div className="space-y-1">
                                        <h3 className="font-black text-slate-900 uppercase text-sm tracking-tight leading-none">Security Preview</h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Document Rendering</p>
                                    </div>
                                    <Badge className="bg-emerald-50 text-emerald-700 border-none font-black px-4 py-1.5 rounded-full text-[10px] tracking-widest animate-pulse">AUTO-SYNC</Badge>
                                </div>
                                <div className="overflow-x-auto w-full flex justify-center pb-10 bg-slate-50/50 rounded-[2rem] border border-slate-100 shadow-inner py-10">
                                    <div className="scale-[0.85] origin-top">
                                        <VisitorCardTemplate
                                            data={formData}
                                            schoolProfile={profile}
                                        />
                                    </div>
                                </div>
                                <div className="mt-8 text-center space-y-2">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Verified Secure Document</p>
                                    <div className="flex justify-center gap-1">
                                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-1 w-4 bg-emerald-500/20 rounded-full" />)}
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
