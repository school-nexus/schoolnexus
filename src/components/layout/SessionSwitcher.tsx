"use client"

import { BookOpen, ChevronDown, CheckCircle2, Calendar, Clock } from "lucide-react"
import { useApp } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { academicYearActions, termActions } from "@/lib/electron"
import { useState } from "react"

export function SessionSwitcher() {
    const {
        activeYear,
        activeTerm,
        allYears,
        allTerms,
        setActiveYear,
        setActiveTerm,
        isLoading
    } = useApp()
    const [isProcessing, setIsProcessing] = useState(false)

    const handleYearChange = async (year: any) => {
        if (year.id === activeYear?.id) return
        setIsProcessing(true)
        try {
            await setActiveYear(year.id)
            toast.success(`Academic Year switched to ${year.name}`)
        } catch (error) {
            toast.error("Failed to switch academic year")
        } finally {
            setIsProcessing(false)
        }
    }

    const handleTermChange = async (term: any) => {
        if (term.id === activeTerm?.id) return
        setIsProcessing(true)
        try {
            await setActiveTerm(term.id)
            toast.success(`Term switched to ${term.name}`)
        } catch (error) {
            toast.error("Failed to switch term")
        } finally {
            setIsProcessing(false)
        }
    }

    const currentYearLabel = activeYear ? `${activeYear.name} Year` : "Select Year"
    const currentTermLabel = activeTerm ? activeTerm.name : "Select Term"

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLoading || isProcessing}
                    className="group flex gap-2.5 h-8 px-3 text-[10px] font-bold bg-emerald-700/50 hover:bg-emerald-600/70 text-white border border-emerald-500/30 rounded-xl transition-all backdrop-blur-sm"
                >
                    <div className="flex items-center justify-center p-1 rounded-md bg-white/20 group-hover:bg-white/30 transition-colors shadow-sm">
                        <BookOpen className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="flex flex-col items-start leading-none gap-0.5">
                        <span className="text-white/70 text-[8px] uppercase tracking-tighter">Academic Session</span>
                        <span className="text-white">{currentYearLabel} • {currentTermLabel}</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-2 rounded-xl border-emerald-500/30 bg-emerald-800/95 backdrop-blur-xl shadow-xl ring-1 ring-emerald-500/50 text-white">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
                <DropdownMenuLabel className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] px-3 pt-3 pb-2 flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    Active Session Context
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-emerald-500/30 mx-2" />

                <div className="mt-2 px-1">
                    <p className="px-2 pb-2 text-[9px] font-bold text-emerald-300/70 uppercase tracking-widest">Select Academic Year</p>
                    <div className="space-y-1">
                        {allYears.map((year) => (
                            <div key={year.id} className="relative group/year">
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger
                                        onClick={() => handleYearChange(year)}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer border border-transparent",
                                            year.id === activeYear?.id
                                                ? "bg-emerald-600/50 border-emerald-400/30 font-bold"
                                                : "hover:bg-emerald-700/50 focus:bg-emerald-700/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Calendar className={cn("h-3.5 w-3.5", year.id === activeYear?.id ? "text-emerald-300" : "text-emerald-500")} />
                                            <div className="flex flex-col">
                                                <span className="text-sm">{year.name} Session</span>
                                                <span className="text-[9px] opacity-60 font-medium">{year.startDate} - {year.endDate}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {year.id === activeYear?.id && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                                            <ChevronDown className="h-3 w-3 opacity-30 -rotate-90 group-hover/year:translate-x-0.5 transition-transform" />
                                        </div>
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuPortal>
                                        <DropdownMenuSubContent className="w-56 p-1 rounded-xl border-emerald-500/30 bg-emerald-900/95 backdrop-blur-xl text-white">
                                            <DropdownMenuLabel className="text-[9px] font-bold text-emerald-300/70 uppercase tracking-wider px-2 py-1.5">
                                                Available Terms ({year.name})
                                            </DropdownMenuLabel>
                                            <DropdownMenuSeparator className="bg-emerald-500/30" />
                                            {/* In a real app, if the year is NOT activeYear, we might need to fetch terms for it. 
                                                But usually you switch Year FIRST. For simplicity, we'll show terms for ACTIVE year.
                                            */}
                                            {year.id === activeYear?.id ? (
                                                allTerms.map((term) => (
                                                    <DropdownMenuItem
                                                        key={term.id}
                                                        onClick={() => handleTermChange(term)}
                                                        className={cn(
                                                            "flex flex-col items-start p-3 rounded-lg focus:bg-emerald-700/50 transition-all cursor-pointer mb-1",
                                                            term.id === activeTerm?.id ? "bg-emerald-600/30 border border-emerald-500/20" : ""
                                                        )}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <span className="text-sm font-bold">{term.name}</span>
                                                            {term.id === activeTerm?.id && <Badge className="bg-emerald-500 text-[8px] font-black h-4 px-1">ACTIVE</Badge>}
                                                        </div>
                                                        <span className="text-[9px] opacity-60">{term.startDate} - {term.endDate}</span>
                                                    </DropdownMenuItem>
                                                ))
                                            ) : (
                                                <div className="p-3 text-center text-[10px] text-emerald-300/50">
                                                    Switch to this year to see its terms.
                                                </div>
                                            )}
                                        </DropdownMenuSubContent>
                                    </DropdownMenuPortal>
                                </DropdownMenuSub>
                            </div>
                        ))}
                    </div>
                </div>

                <DropdownMenuSeparator className="bg-emerald-500/30 mt-4 mb-2 mx-2" />
                <div className="p-2 bg-emerald-900/40 rounded-lg mx-1 border border-emerald-500/10">
                    <p className="text-[9px] leading-relaxed text-emerald-200/60 italic font-medium px-1">
                        <Clock className="h-3 w-3 inline mr-1 mb-0.5" />
                        Context switches refresh all board data instantly.
                    </p>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
