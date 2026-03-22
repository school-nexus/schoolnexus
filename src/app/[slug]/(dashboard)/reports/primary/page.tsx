export const runtime = 'edge';
"use client"

import React, { Suspense, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PrimaryReportTemplate } from "@/components/reports/primary-report-template"
import { ArrowLeft, Download, Eye, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { studentActions, reportActions, termActions } from "@/lib/electron"
import { type ReportData, type Student } from "@/lib/report-utils"

// Local Student interface removed in favor of shared one

interface Term {
    id: number
    name: string
}

function PrimaryReportContent() {
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [reportData, setReportData] = useState<ReportData | null>(null)
    const [termName, setTermName] = useState("TERM ONE")
    const [year, setYear] = useState(new Date().getFullYear().toString())

    useEffect(() => {
        const fetchRealData = async () => {
            try {
                // Fetch first student to use as preview
                const students = await studentActions.getAll() as Student[]
                const activeTerm = await termActions.getActive() as Term

                if (activeTerm) {
                    setTermName(activeTerm.name)
                }

                if (students && students.length > 0) {
                    const firstStudent = students[0]
                    const reports = await reportActions.getTermlyReport({
                        studentId: firstStudent.id,
                        termId: activeTerm?.id
                    })

                    if (reports && reports.length > 0) {
                        setReportData(reports[0] as unknown as ReportData)
                    } else {
                        // Fallback structure if student has no marks yet but exists
                        setReportData({
                            student: {
                                id: firstStudent.id,
                                firstName: firstStudent.firstName,
                                lastName: firstStudent.lastName,
                                className: (firstStudent as any).class?.name || "N/A",
                                admissionNumber: firstStudent.admissionNumber || "N/A",
                                dateOfBirth: firstStudent.dateOfBirth,
                                photo: firstStudent.photo
                            },
                            marks: [],
                            attendance: { present: 0, total: 0 },
                            performance: { total: 0, average: 0, rank: 0 }
                        })
                    }
                } else {
                    toast.warning("No students found in database for preview.")
                }
            } catch (error: unknown) {
                console.error("Failed to load real data for preview:", error)
                toast.error("Failed to load preview data")
            } finally {
                setLoading(false)
            }
        }

        fetchRealData()
    }, [])

    const mockSettings = {
        reportTitle: 'Student Report Card',
        showBot: true,
        showMid: true,
        showEot: true,
        showGrading: true,
        showFees: true,
        showNextTerm: true,
        showComments: true,
        showDob: true,
        showAttendance: true,
        showDivision: true,
        themeColor: 'emerald' as const
    };

    const handleDownloadPDF = async () => {
        try {
            toast.info("PDF generation feature available in Individual Reports!")
        } catch (error) {
            console.error("Error generating PDF:", error)
            toast.error("Failed to generate PDF")
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Header */}
            <div className="bg-emerald-900 border-b border-emerald-800 shadow-md relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-400 via-transparent to-transparent"></div>
                <div className="max-w-7xl mx-auto px-6 py-6 relative z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/reports/templates')}
                                className="rounded-xl text-emerald-100 hover:text-white hover:bg-emerald-800/50"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Templates
                            </Button>
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tight">Primary Report Template</h1>
                                <p className="text-emerald-200 mt-1 font-medium">Live Preview with Real Database Records</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={handleDownloadPDF}
                                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold shadow-lg shadow-emerald-500/20"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Export PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="space-y-6">
                    {/* Info Card */}
                    <Card className="border-none shadow-md bg-white overflow-hidden relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                        <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <Eye className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-2">Live Database Preview</h3>
                                    <p className="text-sm text-slate-600 mb-4 max-w-3xl leading-relaxed">
                                        This view demonstrates the UNEB PLE Primary Report Template populated with <strong className="text-emerald-700">real data</strong> from your database.
                                        It queries the first available student and their termly marks. Access individual student reports from the main Reports Dashboard to generate for specific students.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 font-bold bg-emerald-50 text-emerald-700 text-[10px] uppercase tracking-wider rounded-md border border-emerald-100">Live IPC Fetch</span>
                                        <span className="px-3 py-1 font-bold bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider rounded-md border border-slate-200">UNEB Format</span>
                                        <span className="px-3 py-1 font-bold bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider rounded-md border border-slate-200">Dynamic Grading</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Report Template Container */}
                    <div className="flex justify-center bg-transparent py-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl">
                                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                                <p className="text-slate-500 font-medium animate-pulse">Fetching live student records...</p>
                            </div>
                        ) : reportData ? (
                            <div className="bg-white shadow-2xl rounded-sm overflow-hidden ring-1 ring-slate-900/5">
                                <PrimaryReportTemplate
                                    data={reportData}
                                    settings={mockSettings}
                                    termName={termName}
                                    year={year}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-4xl text-center px-6">
                                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                                    <Eye className="w-8 h-8 text-amber-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2">No Records Found</h3>
                                <p className="text-slate-500 max-w-md mx-auto">Please add students and enter their marks to see the live template preview.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function PrimaryReportPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>}>
            <PrimaryReportContent />
        </Suspense>
    )
}