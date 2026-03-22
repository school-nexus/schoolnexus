"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from "sonner"
import { userActions } from "@/lib/electron"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface User {
    id: number
    fullName: string
    email: string
    username: string
    role: string
    isActive: boolean
    lastLogin: string | null
}

interface ResetPasswordModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user?: User | null
    onSuccess: () => void
}

export function ResetPasswordModal({ open, onOpenChange, user, onSuccess }: ResetPasswordModalProps) {
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!newPassword) newErrors.newPassword = "New password is required"
        if (newPassword.length < 6) {
            newErrors.newPassword = "Password must be at least 6 characters"
        }
        if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm() || !user) return

        setIsLoading(true)
        try {
            await userActions.resetPassword(user.id, newPassword) as any as Promise<void>
            toast.success("Password reset successfully")
            setNewPassword("")
            setConfirmPassword("")
            onSuccess()
            onOpenChange(false)
        } catch (error: unknown) {
            console.error("Error resetting password:", error)
            toast.error("Failed to reset password")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                        Set a new password for {user?.fullName}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {Object.keys(errors).length > 0 && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-700 text-sm">
                                Please fix the errors below before proceeding.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div>
                        <Label htmlFor="newPassword" className="text-sm font-semibold">
                            New Password <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative mt-1">
                            <Input
                                id="newPassword"
                                type={showNewPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className={errors.newPassword ? "border-red-500 pr-10" : "pr-10"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showNewPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {errors.newPassword && (
                            <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="confirmPassword" className="text-sm font-semibold">
                            Confirm Password <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative mt-1">
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                        )}
                    </div>

                    <DialogFooter className="gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-teal-600 hover:bg-teal-700"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                "Reset Password"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
