"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle } from 'lucide-react';
interface ConfirmOptions {
    title?: string
    description?: string
    confirmText?: string
    cancelText?: string
    variant?: "destructive" | "default"
}

interface ConfirmContextType {
    confirm: (options?: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [options, setOptions] = useState<ConfirmOptions>({})
    const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null)

    const confirm = useCallback((opts?: ConfirmOptions) => {
        setOptions(opts || {})
        setOpen(true)
        return new Promise<boolean>((resolve) => {
            setResolveRef(() => resolve)
        })
    }, [])

    const handleConfirm = () => {
        setOpen(false)
        if (resolveRef) resolveRef(true)
    }

    const handleCancel = () => {
        setOpen(false)
        if (resolveRef) resolveRef(false)
    }

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent className="max-w-[400px] p-0 overflow-hidden border-none shadow-2xl shadow-red-500/10 bg-white">
                    <div className="bg-red-50 p-6 flex flex-col items-center justify-center text-center border-b border-red-100">
                        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold text-red-900 text-center">
                                {options.title || "Are you sure?"}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-red-800/80 text-center mt-2">
                                {options.description || "This action cannot be undone."}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>
                    <AlertDialogFooter className="p-4 bg-white gap-3 sm:justify-center">
                        <AlertDialogCancel
                            onClick={handleCancel}
                            className="flex-1 h-11 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 mt-0"
                        >
                            {options.cancelText || "Cancel"}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 font-bold"
                        >
                            {options.confirmText || "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ConfirmContext.Provider>
    )
}

export function useConfirm() {
    const context = useContext(ConfirmContext)
    if (!context) {
        throw new Error("useConfirm must be used within a ConfirmProvider")
    }
    return context
}
