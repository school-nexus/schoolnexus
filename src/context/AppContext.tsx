"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { academicYearActions, termActions } from "@/lib/electron"

interface AppContextType {
    activeYear: any | null
    activeTerm: any | null
    allYears: any[]
    allTerms: any[]
    isLoading: boolean
    refreshContext: () => Promise<void>
    setActiveYear: (id: number) => Promise<void>
    setActiveTerm: (id: number) => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [activeYear, setActiveYear] = useState<any | null>(null)
    const [activeTerm, setActiveTerm] = useState<any | null>(null)
    const [allYears, setAllYears] = useState<any[]>([])
    const [allTerms, setAllTerms] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const refreshContext = async () => {
        setIsLoading(true)
        try {
            const years = await academicYearActions.getAll()
            setAllYears(years)
            const currentYear = years.find((y: any) => y.isActive)
            setActiveYear(currentYear || null)

            if (currentYear) {
                const terms = await termActions.getByYear(currentYear.id)
                setAllTerms(terms)
                const currentTerm = terms.find((t: any) => t.isActive)
                setActiveTerm(currentTerm || null)
            } else {
                setAllTerms([])
                setActiveTerm(null)
            }
        } catch (error) {
            console.error("Failed to load app context:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const setActiveYearHandler = async (id: number) => {
        setIsLoading(true)
        try {
            await academicYearActions.setActive(id)
            await refreshContext()
        } catch (error) {
            console.error("Failed to set active year:", error)
            throw error;
        } finally {
            setIsLoading(false)
        }
    }

    const setActiveTermHandler = async (id: number) => {
        setIsLoading(true)
        try {
            await termActions.setActive(id)
            await refreshContext()
        } catch (error) {
            console.error("Failed to set active term:", error)
            throw error;
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        refreshContext()
    }, [])

    return (
        <AppContext.Provider value={{
            activeYear,
            activeTerm,
            allYears,
            allTerms,
            isLoading,
            refreshContext,
            setActiveYear: setActiveYearHandler,
            setActiveTerm: setActiveTermHandler
        }}>
            {children}
        </AppContext.Provider>
    )
}

export function useApp() {
    const context = useContext(AppContext)
    if (context === undefined) {
        throw new Error("useApp must be used within an AppProvider")
    }
    return context
}

