"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Search,
    Plus,
    Users,
    Shield,
    MoreHorizontal,
    Edit,
    Trash2,
    Mail,
    UserCircle,
    Key,
    Loader2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { userActions } from "@/lib/electron"
import { useConfirm } from "@/components/providers/confirm-provider"
import { AddEditUserModal } from "@/components/settings/add-edit-user-modal"
import { ResetPasswordModal } from "@/components/settings/reset-password-modal"

interface User {
    id: number
    fullName: string
    email: string
    username: string
    role: string
    isActive: boolean
    lastLogin: string | null
}

export default function UsersPage() {
    const { confirm } = useConfirm()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [addEditOpen, setAddEditOpen] = useState(false)
    const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
    const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const data = await userActions.getAll() as User[]
            setUsers(data)
        } catch (error: unknown) {
            console.error("Failed to fetch users:", error)
            toast.error("Failed to load users")
        } finally {
            setLoading(false)
        }
    }

    const handleAddUser = () => {
        setSelectedUser(null)
        setAddEditOpen(true)
    }

    const handleEditUser = async (user: User) => {
        try {
            const fullUser = await userActions.getById(user.id) as User
            setSelectedUser(fullUser)
            setAddEditOpen(true)
        } catch (error: unknown) {
            console.error("Failed to fetch user details:", error)
            toast.error("Failed to load user details")
        }
    }

    const handleResetPassword = (user: User) => {
        setResetPasswordUser(user)
        setResetPasswordOpen(true)
    }

    const handleDeactivate = async (user: User) => {
        if (await confirm({
            title: user.isActive ? "Deactivate User" : "Activate User",
            description: `Are you sure you want to ${user.isActive ? "deactivate" : "activate"} ${user.fullName}?`,
            confirmText: user.isActive ? "Deactivate" : "Activate",
            variant: user.isActive ? "destructive" : "default"
        })) {
            try {
                await userActions.update({ id: user.id, isActive: !user.isActive })
                toast.success(`User ${user.isActive ? "deactivated" : "activated"} successfully`)
                fetchUsers()
            } catch (error: unknown) {
                console.error("Failed to update user status:", error)
                toast.error("Failed to update user status")
            }
        }
    }

    const handleDeleteUser = async (user: User) => {
        if (await confirm({
            title: "Delete User",
            description: `Are you sure you want to delete ${user.fullName}? This action cannot be undone.`,
            confirmText: "Delete",
            variant: "destructive"
        })) {
            try {
                await userActions.delete(user.id)
                toast.success("User deleted successfully")
                fetchUsers()
            } catch (error: unknown) {
                console.error("Failed to delete user:", error)
                toast.error("Failed to delete user")
            }
        }
    }

    const filteredUsers = users.filter(u =>
        (u.fullName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (u.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (u.role?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    )

    const activeUsers = users.filter(u => u.isActive)
    const roles = Array.from(new Set(users.map(u => u.role)))

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    return (
        <>
            <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

                <div className="max-w-6xl mx-auto space-y-8">
                    <PageHeader
                        title="User Management"
                        description="Manage system users, roles, and access permissions."
                        breadcrumbs={[
                            { label: "Dashboard", href: "/dashboard" },
                            { label: "Settings", href: "/settings" },
                            { label: "Users" },
                        ]}
                        actions={
                            <Button
                                onClick={handleAddUser}
                                className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20 h-11 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-95 font-semibold"
                            >
                                <Plus className="mr-2 h-4 w-4" /> Add New User
                            </Button>
                        }
                    />

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center ring-1 ring-teal-100">
                                    <Users className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Total Users</p>
                                    <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100">
                                    <Shield className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Active Users</p>
                                    <p className="text-2xl font-bold text-slate-900">{activeUsers.length}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                            <CardContent className="p-6 flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100">
                                    <Key className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 font-medium">Roles Defined</p>
                                    <p className="text-2xl font-bold text-slate-900">{roles.length}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Users Table */}
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardHeader className="border-b border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-900">System Users</CardTitle>
                                <CardDescription>View and manage registered users.</CardDescription>
                            </div>
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table className="border-collapse">
                                <TableHeader className="bg-emerald-600">
                                    <TableRow className="hover:bg-transparent border-emerald-500/30">
                                        <TableHead className="font-bold text-white h-12 pl-6 border-r border-emerald-500/30">User</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Role</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Status</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Last Login</TableHead>
                                        <TableHead className="text-right font-bold text-white pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredUsers.length > 0 ? filteredUsers.map((user, idx) => (
                                        <TableRow key={user.id} className={cn(
                                            "hover:bg-emerald-50 transition-colors border-emerald-100/50",
                                            idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                        )}>
                                            <TableCell className="pl-6 py-4 border-r border-emerald-100/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                                                        {user.fullName?.charAt(0) || "U"}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{user.fullName}</p>
                                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                                            <Mail className="h-3 w-3" /> {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <Badge className={cn(
                                                    "rounded-lg px-2 py-0.5 text-[10px] font-bold",
                                                    user.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-100 text-slate-500 border-slate-200"
                                                )}>
                                                    {user.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-sm border-r border-emerald-100/50">
                                                {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100">
                                                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-xl">
                                                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                                                            <Key className="mr-2 h-4 w-4" /> Reset Password
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className={cn("cursor-pointer", user.isActive ? "text-red-600 focus:text-red-600 focus:bg-red-50" : "text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50")}
                                                            onClick={() => handleDeactivate(user)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> {user.isActive ? "Deactivate" : "Activate"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                                            onClick={() => handleDeleteUser(user)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-slate-400 border-emerald-100/50">
                                                <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                                <p>No users found matching your search.</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modals */}
            <AddEditUserModal
                open={addEditOpen}
                onOpenChange={setAddEditOpen}
                user={selectedUser}
                onSuccess={fetchUsers}
            />
            <ResetPasswordModal
                open={resetPasswordOpen}
                onOpenChange={setResetPasswordOpen}
                user={resetPasswordUser}
                onSuccess={fetchUsers}
            />
        </>
    )
}

