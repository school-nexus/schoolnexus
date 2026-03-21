"use client"

import { useState, useEffect } from "react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { AlertCircle, Loader2 } from "lucide-react"
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

interface AddEditUserModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user?: User | null
    onSuccess: () => void
}

const ROLES = ["admin", "teacher", "bursar", "librarian", "accountant"]

export function AddEditUserModal({ open, onOpenChange, user, onSuccess }: AddEditUserModalProps) {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
        role: "teacher",
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (user) {
            setFormData({
                ...user,
                password: "",
                confirmPassword: "",
            })
        } else {
            setFormData({
                fullName: "",
                email: "",
                username: "",
                password: "",
                confirmPassword: "",
                role: "teacher",
            })
        }
    }, [user, open])

    const validateForm = () => {
        const newErrors: Record<string, string> = {}

        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required"
        if (!formData.email.trim()) newErrors.email = "Email is required"
        if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            newErrors.email = "Invalid email format"
        }
        if (!formData.username.trim()) newErrors.username = "Username is required"
        if (formData.username.length < 4) {
            newErrors.username = "Username must be at least 4 characters"
        }

        if (!user) {
            // Only validate password for new users
            if (!formData.password) newErrors.password = "Password is required"
            if (formData.password.length < 6) {
                newErrors.password = "Password must be at least 6 characters"
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = "Passwords do not match"
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)
        try {
            const { confirmPassword, ...data } = formData
            const submitData = {
                ...data,
                ...(user && { id: user.id }),
            }

            // Remove password if not provided for edit
            if (user && !formData.password) {
                delete (submitData as { password?: string }).password
            }

            if (user) {
                await userActions.update(submitData) as any as Promise<void>
                toast.success("User updated successfully")
            } else {
                await userActions.create(submitData) as any as Promise<void>
                toast.success("User created successfully")
            }

            onSuccess()
            onOpenChange(false)
        } catch (error: unknown) {
            console.error("Error saving user:", error)
            toast.error("Failed to save user")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{user ? "Edit User" : "Add New User"}</DialogTitle>
                    <DialogDescription>
                        {user
                            ? "Update user information and access permissions"
                            : "Create a new system user account"}
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
                        <Label htmlFor="fullName" className="text-sm font-semibold">
                            Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="fullName"
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                            }
                            className={`mt-1 ${errors.fullName ? "border-red-500" : ""}`}
                        />
                        {errors.fullName && (
                            <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="email" className="text-sm font-semibold">
                            Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, email: e.target.value }))
                            }
                            className={`mt-1 ${errors.email ? "border-red-500" : ""}`}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="username" className="text-sm font-semibold">
                            Username <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="username"
                            placeholder="johndoe"
                            value={formData.username}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, username: e.target.value }))
                            }
                            disabled={!!user}
                            className={`mt-1 ${errors.username ? "border-red-500" : ""} ${
                                user ? "bg-slate-50" : ""
                            }`}
                        />
                        {errors.username && (
                            <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="role" className="text-sm font-semibold">
                            Role <span className="text-red-500">*</span>
                        </Label>
                        <Select value={formData.role} onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, role: value }))
                        }>
                            <SelectTrigger className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES.map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {!user && (
                        <>
                            <div>
                                <Label htmlFor="password" className="text-sm font-semibold">
                                    Password <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, password: e.target.value }))
                                    }
                                    className={`mt-1 ${errors.password ? "border-red-500" : ""}`}
                                />
                                {errors.password && (
                                    <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="confirmPassword" className="text-sm font-semibold">
                                    Confirm Password <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            confirmPassword: e.target.value,
                                        }))
                                    }
                                    className={`mt-1 ${errors.confirmPassword ? "border-red-500" : ""}`}
                                />
                                {errors.confirmPassword && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>
                        </>
                    )}

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
                                    Saving...
                                </>
                            ) : (
                                "Save User"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
