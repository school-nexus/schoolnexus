"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { userActions } from "@/lib/electron"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { comparePassword } from "@/lib/auth-utils"

interface User {
    id: number
    username: string
    fullName: string
    role: string
    email: string
}

interface AuthContextType {
    user: User | null
    isLoading: boolean
    login: (username: string, password: string, redirectTo?: string) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        // Check for persisted user session
        const storedUser = localStorage.getItem("school_nexus_user")
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser))
            } catch (e) {
                console.error("Failed to parse stored user", e)
                localStorage.removeItem("school_nexus_user")
            }
        }

        // Add a small delay to ensure context is ready
        const timer = setTimeout(() => {
            setIsLoading(false)
        }, 50)

        return () => clearTimeout(timer)
    }, [])

    const login = async (username: string, password: string, redirectTo?: string) => {
        setIsLoading(true)
        try {
            const users = await userActions.getAll()
            const foundUser = users.find((u: any) => u.username === username)

            if (foundUser && foundUser.password && await comparePassword(password, foundUser.password as string)) {
                setUser(foundUser as any)
                localStorage.setItem("school_nexus_user", JSON.stringify(foundUser))
                // Set cookies for middleware protection
                document.cookie = `school_nexus_session=${foundUser.id}; path=/; max-age=86400; SameSite=Lax`
                document.cookie = `school_nexus_role=${foundUser.role || 'user'}; path=/; max-age=86400; SameSite=Lax`
                
                toast.success(`Welcome back, ${foundUser.fullName}`)
                
                // Redirect logic
                if (redirectTo) {
                    router.push(redirectTo)
                } else {
                    router.push("/dashboard")
                }
            } else {
                throw new Error("Invalid credentials")
            }
        } catch (error: any) {
            console.error("Login failed:", error)
            // Only toast for unexpected errors, not for invalid credentials
            if (error.message !== "Invalid credentials") {
                toast.error("Login failed. Please try again.")
            }
            throw error
        } finally {
            setIsLoading(false)
        }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem("school_nexus_user")
        // Clear cookies
        document.cookie = "school_nexus_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        document.cookie = "school_nexus_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        router.push("/login")
        toast.success("Logged out successfully")
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}

