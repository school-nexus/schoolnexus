"use client"

import React, { useState, useEffect, Suspense } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PrimaryReportTemplate } from "@/components/reports/primary-report-template"
import { ArrowLeft, Download, Eye } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { reportActions, schoolProfileActions } from "@/lib/electron"
import { reportUtils, type SchoolProfile, type ReportData } from "@/lib/report-utils"

// Removed local SchoolInfo and TermlyReportData as we use shared ReportData and SchoolProfile

function IndividualReportContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const studentId = searchParams.get("student")
    const termId = searchParams.get("term")
    const [schoolInfo, setSchoolInfo] = useState<SchoolProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchSchoolInfo()
    }, [])

    const fetchSchoolInfo = async () => {
        try {
            const school = await schoolProfileActions.get() as SchoolProfile
            setSchoolInfo(school)
        } catch (error: unknown) {
            console.error("Error fetching school info:", error)
            toast.error("Failed to load school information")
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadPDF = async () => {
        if (!studentId) return

        try {
            // Get report data first
            const studentReports = await reportActions.getTermlyReport({
                studentId: parseInt(studentId),
                termId: termId ? parseInt(termId) : undefined,
            }) as unknown as ReportData[]

            if (studentReports.length === 0) {
                toast.error("No report data found for this student")
                return
            }

            const formattedReport = studentReports[0]
            
            if (schoolInfo) {
                await reportUtils.generateReportCardPDF([formattedReport], schoolInfo)
            }

            toast.success("Report card downloaded successfully")
        } catch (error: unknown) {
            console.error("Error downloading PDF:", error)
            toast.error("Failed to download report card")
        }
    }

    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading report...</p>
                </div>
            </div>
        )
    }

    if (!studentId) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 flex items-center justify-center">
                <Card>
                    <CardContent className="p-6 text-center">
                        <h2 className="text-lg font-semibold text-slate-900 mb-2">Invalid Request</h2>
                        <p className="text-slate-600 mb-4">Student ID is required to generate a report.</p>
                        <Button onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <PageHeader
                        title="Individual Student Report"
                        description="Generate and view detailed report cards for individual students."
                        breadcrumbs={[
                            { label: "Dashboard", href: "/dashboard" },
                            { label: "Reports", href: "/reports" },
                            { label: "Student Report" },
                        ]}
                    />

                    <div className="flex gap-2 print:hidden">
                        <Button
                            variant="outline"
                            onClick={handlePrint}
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            Print
                        </Button>
                        <Button
                            onClick={handleDownloadPDF}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.back()}
                            className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Reports
                        </Button>
                    </div>
                </div>

                {/* Report Template */}
                <Card>
                    <CardHeader>
                        <CardTitle>Student Report Card</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <PrimaryReportTemplate
                            studentId={parseInt(studentId)}
                            termId={termId ? parseInt(termId) : undefined}
                            useDatabaseData={true}
                            settings={{
                                reportTitle: 'Student Report Card',
                                showAttendance: true,
                                showGrading: true,
                                showComments: true,
                                showNextTerm: true,
                                showFees: true,
                                showBot: true,
                                showMid: true,
                                showEot: true,
                                showDob: true,
                                showDivision: true,
                                themeColor: 'emerald'
                            }}
                            schoolInfo={schoolInfo || undefined}
                        />
                    </CardContent>
                </Card>

                {/* Instructions */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Report Options</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <h4 className="font-medium text-slate-700">View Options</h4>
                                <ul className="text-sm text-slate-600 space-y-1">
                                    <li>• Dynamic data loading from database</li>
                                    <li>• Real-time grade calculations</li>
                                    <li>• Comprehensive student information</li>
                                    <li>• Attendance integration</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium text-slate-700">Export Options</h4>
                                <ul className="text-sm text-slate-600 space-y-1">
                                    <li>• Print directly from browser</li>
                                    <li>• Download as PDF document</li>
                                    <li>• Responsive design for all devices</li>
                                    <li>• Print-optimized layout</li>
                                </ul>
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
                            <p className="text-sm text-emerald-700">
                                <strong>Real Data:</strong> This report template connects to your actual database and displays
                                current student marks, attendance, and performance data in real-time.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function IndividualReportPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>}>
            <IndividualReportContent />
        </Suspense>
    )
}