"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { School, User, Calendar, MapPin, Phone, Mail, QrCode } from "lucide-react"
import { cn } from "@/lib/utils"
import { schoolProfileActions, fileActions } from "@/lib/electron"
import { calculateGrade, calculateRemarks, type GradingScale } from "@/lib/reportCardUtils"
import { type SchoolProfile } from "@/lib/report-utils"

interface Student {
    id: number
    admissionNumber: string
    firstName: string
    lastName: string
    middleName?: string
}

interface RawExam {
    id: number
    name: string
}

interface RawMark {
    subjectId: number
    score: number
}

interface RawSubject {
    id: number
    name: string
    code: string
}

interface MarksheetPreviewProps {
    student: Student
    exam?: RawExam
    marks: RawMark[]
    subjects: RawSubject[]
    stats: {
        total: number
        average: string
        grade: string
        aggregate: number
        division: string
    }
    rank: number
    gradingScales?: GradingScale[]
}

export function MarksheetPreview({ student, exam, marks, subjects, stats, rank, gradingScales }: MarksheetPreviewProps) {
    const [schoolInfo, setSchoolInfo] = useState<SchoolProfile | null>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            const profile = await schoolProfileActions.get() as SchoolProfile
            if (profile) setSchoolInfo(profile)
        }
        fetchProfile()
    }, [])

    return (
        <div className="space-y-8 p-2 bg-white">
            {/* Header Section - Professional Style */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
                <div className="w-24 h-24 rounded-xl flex items-center justify-center overflow-hidden bg-slate-50 border border-slate-100">
                    {schoolInfo?.logo ? (
                        <img
                            src={fileActions.getUrl(schoolInfo.logo)}
                            alt="Logo"
                            className="h-full w-full object-contain p-1"
                        />
                    ) : (
                        <School className="h-10 w-10 text-slate-300" />
                    )}
                </div>

                <div className="flex-1 text-center px-4">
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 mb-1 uppercase">
                        {schoolInfo?.name || "School Nexus"}
                    </h1>
                    <p className="text-[11px] font-medium text-slate-600 flex items-center justify-center gap-2">
                        <MapPin className="h-3 w-3" /> {schoolInfo?.address || "P.O. Box 123, Kampala, Uganda"}
                    </p>
                    <p className="text-[11px] font-medium text-slate-600 flex items-center justify-center gap-4 mt-1">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {schoolInfo?.phone || "+256 123 456 789"}</span>
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {schoolInfo?.email || "info@schoolnexus.com"}</span>
                    </p>
                    <div className="mt-4 inline-block px-6 py-1 bg-slate-900 text-white rounded-full text-[10px] font-bold tracking-widest uppercase">
                        Official Academic Marksheet
                    </div>
                    <p className="text-xs font-black mt-2 text-slate-800 uppercase">
                        {exam?.name || "Terminal Examination Report"}
                    </p>
                </div>

                <div className="w-24 h-24 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center bg-slate-50/50">
                    <QrCode className="h-10 w-10 text-slate-300 mb-1" />
                    <span className="text-[8px] font-bold text-slate-400 uppercase">Verify</span>
                </div>
            </div>

            {/* Student Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
                <div className="md:col-span-12 grid grid-cols-2 border rounded-xl overflow-hidden divide-x divide-y">
                    <div className="p-3 flex items-center gap-3 bg-slate-50/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase w-24">Student Name</span>
                        <span className="text-sm font-bold text-slate-900">{student.firstName} {student.lastName}</span>
                    </div>
                    <div className="p-3 flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase w-24">Admission No.</span>
                        <span className="text-sm font-bold text-slate-900 font-mono">{student.admissionNumber}</span>
                    </div>
                    <div className="p-3 flex items-center gap-3 bg-slate-50/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase w-24">Academic Year</span>
                        <span className="text-sm font-bold text-slate-900">2024/2025</span>
                    </div>
                    <div className="p-3 flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase w-24">Term</span>
                        <span className="text-sm font-bold text-slate-900">Term 1</span>
                    </div>
                </div>
            </div>

            {/* Marks Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-slate-900">
                        <TableRow className="hover:bg-transparent border-slate-800">
                            <TableHead className="text-[10px] font-black text-white uppercase tracking-wider p-3">Code</TableHead>
                            <TableHead className="text-[10px] font-black text-white uppercase tracking-wider p-3">Subject</TableHead>
                            <TableHead className="text-[10px] font-black text-white uppercase tracking-wider text-center p-3">Score</TableHead>
                            <TableHead className="text-[10px] font-black text-white uppercase tracking-wider text-center p-3">Grade</TableHead>
                            <TableHead className="text-[10px] font-black text-white uppercase tracking-wider text-right p-3">Remarks</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subjects.map((subject, idx) => {
                            const mark = marks.find(m => m.subjectId === subject.id)
                            const score = mark?.score || 0

                            const grade = calculateGrade(score, gradingScales)
                            const remark = calculateRemarks(score, gradingScales)

                            return (
                                <TableRow key={subject.id} className={cn(
                                    "border-slate-100",
                                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                                )}>
                                    <TableCell className="py-2.5 text-xs font-mono font-bold text-slate-500">{subject.code}</TableCell>
                                    <TableCell className="py-2.5 text-sm font-bold text-slate-800">{subject.name}</TableCell>
                                    <TableCell className="py-2.5 text-center text-sm font-black text-slate-900">{score}</TableCell>
                                    <TableCell className="py-2.5 text-center">
                                        <span className={cn(
                                            "inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-black border",
                                            grade.startsWith('D') ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                grade.startsWith('C') ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                    grade.startsWith('P') ? "bg-amber-50 text-amber-700 border-amber-100" :
                                                        "bg-red-50 text-red-700 border-red-100"
                                        )}>
                                            {grade}
                                        </span>
                                    </TableCell>
                                    <TableCell className="py-2.5 text-right text-[11px] text-slate-500 font-medium italic">{remark}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 pt-4">
                <div className="p-4 border rounded-xl bg-emerald-50/50 text-center border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Aggregate</p>
                    <p className="text-xl font-black text-emerald-900">{stats.aggregate}</p>
                </div>
                <div className="p-4 border rounded-xl bg-emerald-50/50 text-center border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Division</p>
                    <p className="text-xl font-black text-emerald-900">{stats.division}</p>
                </div>
                <div className="p-4 border rounded-xl bg-slate-50/50 text-center border-slate-200">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Rank</p>
                    <p className="text-xl font-black text-slate-900">#{rank}</p>
                </div>
                <div className="p-4 border rounded-xl bg-slate-50/50 text-center border-slate-200">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Average</p>
                    <p className="text-xl font-black text-slate-900">{stats.average}%</p>
                </div>
            </div>

            {/* Footer Section */}
            <div className="pt-12 flex justify-between items-end">
                <div className="text-center">
                    <div className="w-40 border-b border-slate-300 mb-1"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">School Stamp</span>
                </div>
                <div className="text-center">
                    <div className="w-48 border-b border-slate-300 mb-1"></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Head Teacher's Signature</span>
                </div>
            </div>

            <div className="text-center pt-8">
                <p className="text-[9px] text-slate-400 font-medium italic">"Knowledge is Power"</p>
            </div>
        </div>
    )
}
