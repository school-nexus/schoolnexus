"use client"

import React, { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Printer, Search, SearchX } from 'lucide-react';
import { studentActions, schoolProfileActions, termActions } from "@/lib/electron"
import { toast } from "sonner"
import { ExaminationCardTemplate } from "@/components/reports/examination-card-template"

import { type Student, type SchoolProfile } from "@/lib/report-utils"

interface Term {
    id: number
    name: string
}

export default function ExaminationCardPage() {
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [students, setStudents] = useState<Student[]>([])
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
    const [profile, setProfile] = useState<SchoolProfile | null>(null)
    const [activeTerm, setActiveTerm] = useState<Term | null>(null)

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        try {
            const [data, profileData, term] = await Promise.all([
                studentActions.getAll() as Promise<any[]>,
                schoolProfileActions.get() as Promise<SchoolProfile>,
                termActions.getActive() as Promise<Term>
            ])
            setStudents(data as unknown as Student[])
            setProfile(profileData)
            setActiveTerm(term)
        } catch (error: unknown) {
            console.error("Failed to fetch initial data:", error)
            toast.error("Failed to load required data")
        }
    }

    const handleStudentSearch = () => {
        if (!searchQuery.trim()) {
            toast.error("Please enter a student name or ID to search")
            return
        }

        const query = searchQuery.toLowerCase()
        const found = students.find(s =>
            s.admissionNumber?.toLowerCase().includes(query) ||
            s.firstName.toLowerCase().includes(query) ||
            s.lastName.toLowerCase().includes(query)
        )

        if (found) {
            setSelectedStudent(found)
            toast.success("Student found!")
        } else {
            setSelectedStudent(null)
            toast.error("No candidate found matching your query")
        }
    }

    const handlePrint = () => {
        const printContent = document.getElementById("examination-card-container")
        const originalContent = document.body.innerHTML

        if (printContent) {
            document.body.innerHTML = printContent.outerHTML
            window.print()
            document.body.innerHTML = originalContent
            window.location.reload()
        } else {
            toast.error("Nothing to print")
        }
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-slate-200/20 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-200/20 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <PageHeader
                        title="Examination Cards"
                        description="Generate official examination admission cards for candidates."
                    />

                    <div className="relative w-full md:max-w-md flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search candidate name or Reg No..."
                                className="pl-11 h-12 rounded-xl border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-slate-500/20 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleStudentSearch()}
                            />
                        </div>
                        <Button
                            onClick={handleStudentSearch}
                            disabled={loading || !searchQuery.trim()}
                            className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-black"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                        </Button>
                    </div>
                </div>

                {selectedStudent ? (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 flex flex-col items-center">
                        <div className="w-full flex justify-end mb-6">
                            <Button
                                onClick={handlePrint}
                                variant="outline"
                                className="rounded-xl border-slate-200 hover:bg-slate-50 shadow-sm"
                            >
                                <Printer className="mr-2 h-4 w-4" /> Print Card
                            </Button>
                        </div>
                        <div className="overflow-x-auto w-full flex justify-center pb-8">
                            <ExaminationCardTemplate student={selectedStudent} schoolProfile={profile} activeTerm={activeTerm} />
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200 border-dashed rounded-2xl shadow-sm p-16 flex flex-col items-center justify-center text-center">
                        <div className="h-16 w-16 bg-slate-50 flex items-center justify-center rounded-full mb-4">
                            <SearchX className="h-8 w-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No Candidate Selected</h3>
                        <p className="text-sm text-slate-500 max-w-sm">Use the search bar above to find a candidate and generate their examination admission card.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
