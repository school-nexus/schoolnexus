"use client"


import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { feeActions, schoolProfileActions } from "@/lib/electron"
import { ReceiptPreview } from "../../components/ReceiptPreview"
import { RawReceipt, RawProfile } from "../../page"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, Download, Mail, Printer, ShieldCheck, Sparkles } from 'lucide-react';
import { printReceipt, exportReceiptToPDF, setupPrintPreview } from "@/lib/printUtils"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function ReceiptPreviewPage() {
    const router = useRouter()
    const params = useParams()
    const [receipt, setReceipt] = useState<RawReceipt | null>(null)
    const [schoolProfile, setSchoolProfile] = useState<RawProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const loadReceipt = async () => {
            try {
                const [receiptData, profile] = await Promise.all([
                    feeActions.getPaymentById(parseInt(params.id as string)) as Promise<RawReceipt>,
                    schoolProfileActions.get() as Promise<RawProfile>
                ])
                setReceipt(receiptData)
                setSchoolProfile(profile)
                setupPrintPreview('receipt-content')
            } catch (error: unknown) {
                console.error("Failed to load receipt:", error)
                toast.error("Security handshake failed or record missing")
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            loadReceipt()
        }
    }, [params.id])

    const handlePrint = async () => {
        try {
            await printReceipt(receipt?.receiptNumber || undefined)
            toast.success("Pushing to physical printer...")
        } catch (error) {
            console.error("Print failed:", error)
            toast.error("Printer connection error")
        }
    }

    const handleExport = async () => {
        try {
            await exportReceiptToPDF(receipt?.receiptNumber || undefined)
            toast.success("Generating digital archive (PDF)...")
        } catch (error) {
            console.error("PDF export failed:", error)
            toast.error("Digital export failed")
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="mt-4 text-[10px] font-black uppercase tracking-[4px] text-slate-400">Verifying Transaction...</p>
            </div>
        )
    }

    if (!receipt) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-white rounded-[32px] shadow-xl flex items-center justify-center mb-6">
                    <ShieldCheck className="w-10 h-10 text-slate-200" />
                </div>
                <h1 className="text-2xl font-black text-slate-900">Record Not Found</h1>
                <p className="text-slate-500 italic mt-2 max-w-xs">The receipt transaction data is currently unavailable in the central ledger.</p>
                <Button onClick={() => router.back()} className="mt-8 rounded-2xl h-12 px-8 font-black bg-slate-900 text-white">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    RETURN TO DASHBOARD
                </Button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* ═══════════════ PREMIUM ACTION BAR ═══════════════ */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm px-6 py-4 mb-8">
                <div className="max-w-[185mm] mx-auto flex items-center justify-between">
                    <Button
                        onClick={() => router.back()}
                        variant="ghost"
                        className="rounded-xl font-bold text-slate-500 hover:text-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>

                    <div className="flex gap-3">
                        <div className="hidden md:flex bg-slate-100 p-1 rounded-xl mr-2">
                            <Button variant="ghost" size="sm" className="rounded-lg h-8 px-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
                                <Mail className="w-3.5 h-3.5 mr-1.5" />
                                Email
                            </Button>
                        </div>
                        <Button
                            onClick={handleExport}
                            variant="outline"
                            className="rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest border-slate-200"
                        >
                            <Download className="h-4 w-4 mr-2 opacity-50" />
                            Digital Copy
                        </Button>
                        <Button
                            onClick={handlePrint}
                            className="rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                        >
                            <Printer className="h-4 w-4 mr-2 text-white" />
                            Print Receipt
                        </Button>
                    </div>
                </div>
            </div>

            {/* ═══════════════ DOCUMENT CONTAINER ═══════════════ */}
            <div className="max-w-[185mm] mx-auto px-4 md:px-0">
                <div className="relative group">
                    {/* Decorative Background Elements */}
                    <div className="absolute -inset-4 bg-gradient-to-b from-emerald-100/50 to-transparent rounded-[48px] -z-10 blur-xl opacity-50 transition-opacity group-hover:opacity-100" />

                    <div className="bg-white rounded-[40px] shadow-2xl shadow-emerald-200/20 overflow-hidden ring-1 ring-emerald-100 ring-inset">
                        <ReceiptPreview
                            receipt={receipt}
                            schoolProfile={schoolProfile}
                        />
                    </div>

                    {/* Floating Badge */}
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-slate-900 rounded-full flex flex-col items-center justify-center text-white shadow-2xl shadow-slate-200 border-4 border-white -rotate-12 group-hover:rotate-0 transition-transform duration-500">
                        <CheckCircle2 className="w-5 h-5 mb-1 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase tracking-tighter leading-none">Verified</span>
                        <span className="text-[10px] font-black uppercase tracking-tighter leading-none">Record</span>
                    </div>
                </div>

                {/* Document Footer Disclaimer */}
                <div className="mt-12 text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="h-[1px] w-12 bg-slate-200" />
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <div className="h-[1px] w-12 bg-slate-200" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-300">Secured via School Nexus MS</p>
                    <p className="text-[10px] italic font-medium text-slate-400 max-w-sm mx-auto">
                        This document is a certified transaction record. Ensure the watermark is visible for authenticity.
                    </p>
                </div>
            </div>
        </div>
    )
}
