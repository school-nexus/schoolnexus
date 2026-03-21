"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
    calculateStudentResults,
    getPerformanceSummary,
    calculateGrade,
    type SubjectResult
} from "@/lib/grading/uneb-ple"
import { Award, TrendingUp, Calculator } from "lucide-react"

export function GradeCalculatorDemo() {
    const [subjects, setSubjects] = useState<SubjectResult[]>([
        { subject: "English", score: 85 },
        { subject: "Mathematics", score: 92 },
        { subject: "Science", score: 78 },
        { subject: "Social Studies", score: 88 },
    ])

    const results = calculateStudentResults(subjects)

    const updateScore = (index: number, score: number) => {
        const newSubjects = [...subjects]
        newSubjects[index].score = Math.min(100, Math.max(0, score))
        setSubjects(newSubjects)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="border-none shadow-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white">
                <CardHeader>
                    <CardTitle className="text-2xl font-black flex items-center gap-2">
                        <Award className="h-6 w-6" />
                        UNEB PLE Grade Calculator
                    </CardTitle>
                    <CardDescription className="text-teal-100">
                        Calculate grades, aggregates, and divisions according to Uganda Primary Leaving Examination standards
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Subject Scores Input */}
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Subject Scores</CardTitle>
                    <CardDescription>Enter scores (0-100) for each subject</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {subjects.map((subject, index) => {
                        const gradeInfo = calculateGrade(subject.score)
                        return (
                            <div key={index} className="grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-3">
                                    <Label className="text-sm font-bold text-slate-700">{subject.subject}</Label>
                                </div>
                                <div className="col-span-3">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={subject.score}
                                        onChange={(e) => updateScore(index, parseInt(e.target.value) || 0)}
                                        className="h-10 rounded-xl border-slate-200"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Badge className={`
                                        rounded-lg px-3 py-1 text-xs font-black
                                        ${gradeInfo.grade.startsWith('D') ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                            gradeInfo.grade.startsWith('C') ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                gradeInfo.grade.startsWith('P') ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                    'bg-red-100 text-red-700 border-red-200'}
                                    `}>
                                        {gradeInfo.grade}
                                    </Badge>
                                </div>
                                <div className="col-span-2 text-center">
                                    <span className="text-sm font-bold text-slate-600">{gradeInfo.points} pts</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-xs text-slate-500">{gradeInfo.remark}</span>
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            {/* Results Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Calculator className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Total Marks</p>
                        <p className="text-3xl font-black text-emerald-900">{results.totalMarks}</p>
                        <p className="text-xs text-emerald-600 mt-1">out of {subjects.length * 100}</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
                    <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-2">
                            <TrendingUp className="h-5 w-5 text-teal-600" />
                        </div>
                        <p className="text-xs font-bold text-teal-600 uppercase mb-1">Aggregates</p>
                        <p className="text-3xl font-black text-teal-900">{results.aggregates}</p>
                        <p className="text-xs text-teal-600 mt-1">Lower is better</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Award className="h-5 w-5 text-emerald-600" />
                        </div>
                        <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Division</p>
                        <p className="text-3xl font-black text-emerald-900">{results.division}</p>
                        <p className="text-xs text-emerald-600 mt-1">
                            {results.division === "I" && "4-12 aggregates"}
                            {results.division === "II" && "13-23 aggregates"}
                            {results.division === "III" && "24-29 aggregates"}
                            {results.division === "IV" && "30+ aggregates"}
                            {results.division === "U" && "Ungraded"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                    <CardContent className="p-6 text-center">
                        <div className="flex items-center justify-center mb-2">
                            <Award className="h-5 w-5 text-amber-600" />
                        </div>
                        <p className="text-xs font-bold text-amber-600 uppercase mb-1">Distinctions</p>
                        <p className="text-3xl font-black text-amber-900">{results.distinctions}</p>
                        <p className="text-xs text-amber-600 mt-1">D1 & D2 grades</p>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Summary */}
            <Card className="border-none shadow-lg bg-gradient-to-r from-slate-900 to-slate-800 text-white">
                <CardContent className="p-6">
                    <p className="text-lg font-bold text-center">
                        {getPerformanceSummary(results.division || "U", results.distinctions || 0)}
                    </p>
                </CardContent>
            </Card>

            {/* Grading Scale Reference */}
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg font-bold">UNEB PLE Grading Scale</CardTitle>
                    <CardDescription>Official Uganda Primary Leaving Examination grading system</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                            <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Distinctions</p>
                            <div className="space-y-1">
                                <p className="text-sm"><span className="font-black">D1:</span> 90-100 (1 pt)</p>
                                <p className="text-sm"><span className="font-black">D2:</span> 80-89 (2 pts)</p>
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                            <p className="text-xs font-bold text-emerald-600 uppercase mb-2">Credits</p>
                            <div className="space-y-1">
                                <p className="text-sm"><span className="font-black">C3:</span> 70-79 (3 pts)</p>
                                <p className="text-sm"><span className="font-black">C4:</span> 60-69 (4 pts)</p>
                                <p className="text-sm"><span className="font-black">C5:</span> 55-59 (5 pts)</p>
                                <p className="text-sm"><span className="font-black">C6:</span> 50-54 (6 pts)</p>
                            </div>
                        </div>
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                            <p className="text-xs font-bold text-amber-600 uppercase mb-2">Passes & Fail</p>
                            <div className="space-y-1">
                                <p className="text-sm"><span className="font-black">P7:</span> 45-49 (7 pts)</p>
                                <p className="text-sm"><span className="font-black">P8:</span> 40-44 (8 pts)</p>
                                <p className="text-sm"><span className="font-black text-red-600">F9:</span> 0-39 (9 pts)</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

