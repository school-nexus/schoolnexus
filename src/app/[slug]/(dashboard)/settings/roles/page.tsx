export const runtime = 'edge';
"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Shield,
    Plus,
    Search,
    Users,
    Lock,
    CheckCircle2,
    XCircle,
    MoreHorizontal,
    ChevronRight,
    Key,
    UserCircle,
    Settings2,
    Loader2,
    Edit,
    Trash2,
    Copy,
    Eye,
    Filter,
    RefreshCw,
    UserCheck,
    AlertTriangle
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
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { roleActions, userActions } from "@/lib/electron"
import { toast } from "sonner"

interface Role {
    id: number;
    name: string;
    description: string | null;
    permissions: string | null;
    type: string;
    status: string;
    created_at: string;
    userCount?: number;
}

interface User {
    id: number;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
    lastLogin: string | null;
}

export default function UserRolesPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [roles, setRoles] = useState<Role[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isViewUsersDialogOpen, setIsViewUsersDialogOpen] = useState(false)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [usersForRole, setUsersForRole] = useState<User[]>([])
    const [userLoading, setUserLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissions: 'VIEW_ONLY',
        status: 'Active'
    })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchRoles()
    }, [])

    const fetchRoles = async () => {
        setLoading(true)
        try {
            const rolesData = await roleActions.getAll() as Role[]

            // Fetch user count for each role
            const rolesWithCounts = await Promise.all(
                rolesData.map(async (role) => {
                    try {
                        const userCount = await roleActions.getUserCount(role.name)
                        return { ...role, userCount }
                    } catch (error: unknown) {
                        console.error(`Failed to fetch user count for role ${role.name}:`, error)
                        return { ...role, userCount: 0 }
                    }
                })
            )

            setRoles(rolesWithCounts)
        } catch (error: unknown) {
            console.error("Failed to fetch roles:", error)
            toast.error("Failed to load roles")
        } finally {
            setLoading(false)
        }
    }

    const filteredRoles = roles.filter(role =>
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleCreateRole = async () => {
        setSaving(true)
        try {
            await roleActions.create(formData) as any as Promise<void>
            toast.success("Role created successfully!")
            setIsCreateDialogOpen(false)
            setFormData({ name: '', description: '', permissions: 'VIEW_ONLY', status: 'Active' })
            fetchRoles()
        } catch (error: unknown) {
            console.error("Failed to create role:", error)
            toast.error("Failed to create role")
        } finally {
            setSaving(false)
        }
    }

    const handleUpdateRole = async () => {
        if (!selectedRole) return
        setSaving(true)
        try {
            await roleActions.update({
                id: selectedRole.id,
                ...formData
            }) as any as Promise<void>
            toast.success("Role updated successfully!")
            setIsEditDialogOpen(false)
            setSelectedRole(null)
            setFormData({ name: '', description: '', permissions: 'VIEW_ONLY', status: 'Active' })
            fetchRoles()
        } catch (error: unknown) {
            console.error("Failed to update role:", error)
            toast.error("Failed to update role")
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteRole = async () => {
        if (!selectedRole) return
        setSaving(true)
        try {
            await roleActions.delete(selectedRole.id) as any as Promise<void>
            toast.success("Role deleted successfully!")
            setIsDeleteDialogOpen(false)
            setSelectedRole(null)
            fetchRoles()
        } catch (error: unknown) {
            console.error("Failed to delete role:", error)
            toast.error("Failed to delete role")
        } finally {
            setSaving(false)
        }
    }

    const openEditDialog = (role: Role) => {
        setSelectedRole(role)
        setFormData({
            name: role.name,
            description: role.description || '',
            permissions: role.permissions || 'VIEW_ONLY',
            status: role.status
        })
        setIsEditDialogOpen(true)
    }

    const openDeleteDialog = (role: Role) => {
        setSelectedRole(role)
        setIsDeleteDialogOpen(true)
    }

    const handleDuplicateRole = async (role: Role) => {
        try {
            const newName = `${role.name} (Copy)`
            await roleActions.create({
                name: newName,
                description: role.description || `Copy of ${role.name}`,
                permissions: role.permissions,
                type: 'Custom',
                status: role.status
            }) as any as Promise<void>
            toast.success(`Role "${newName}" duplicated successfully!`)
            fetchRoles()
        } catch (error: unknown) {
            console.error("Failed to duplicate role:", error)
            toast.error("Failed to duplicate role")
        }
    }

    const handleViewUsers = async (role: Role) => {
        setUserLoading(true)
        setSelectedRole(role)
        setIsViewUsersDialogOpen(true)

        try {
            const allUsers = await userActions.getAll() as User[]
            const roleUsers = allUsers.filter(u => u.role === role.name)
            setUsersForRole(roleUsers)
        } catch (error: unknown) {
            console.error("Failed to fetch users for role:", error)
            toast.error("Failed to load users for this role")
            setUsersForRole([])
        } finally {
            setUserLoading(false)
        }
    }

    const getPermissionBadges = (permissions: string | null) => {
        if (!permissions) return [<Badge key="none" variant="outline" className="bg-slate-100">VIEW_ONLY</Badge>]

        const perms = permissions.split(',').map(p => p.trim())
        return perms.slice(0, 3).map((perm, idx) => (
            <Badge key={idx} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                {perm.replace(/_/g, ' ').toLowerCase().replace(/\w/g, l => l.toUpperCase())}
            </Badge>
        ))
    }

    const getStatusIcon = (status: string) => {
        return status === 'Active' ?
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
            <XCircle className="h-4 w-4 text-red-500" />
    }

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-100/20 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/20 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-8">
                <PageHeader
                    title="User Roles & Permissions"
                    description="Define system access levels and manage permissions for different staff roles."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Settings", href: "/settings" },
                        { label: "User Roles" },
                    ]}
                    actions={
                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                variant="outline"
                                className="h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-all hover:scale-105 active:scale-95"
                                onClick={fetchRoles}
                                disabled={loading}
                            >
                                <RefreshCw className={cn("mr-2 h-4 w-4 text-emerald-600", loading && "animate-spin")} /> Refresh
                            </Button>
                            <Button variant="outline" className="h-11 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold transition-all hover:scale-105 active:scale-95">
                                <Settings2 className="mr-2 h-4 w-4 text-emerald-600" /> Global Permissions
                            </Button>
                            <Button
                                className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20 h-11 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-95 font-semibold"
                                onClick={() => setIsCreateDialogOpen(true)}
                            >
                                <Plus className="mr-2 h-4 w-4" /> Create New Role
                            </Button>
                        </div>
                    }
                />

                {/* Role Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center ring-1 ring-teal-100">
                                <Shield className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Total Roles</p>
                                <p className="text-2xl font-bold text-slate-900">{roles.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-100">
                                <Users className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">Active Roles</p>
                                <p className="text-2xl font-bold text-slate-900">{roles.filter(r => r.status === 'Active').length}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center ring-1 ring-amber-100">
                                <Lock className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 font-medium">System Roles</p>
                                <p className="text-2xl font-bold text-slate-900">{roles.filter(r => r.type === 'System').length}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table Section */}
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search roles..."
                                className="pl-11 h-11 bg-slate-50/50 border-slate-200 focus:bg-white transition-all rounded-xl"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table className="border-collapse">
                                <TableHeader className="bg-emerald-600">
                                    <TableRow className="hover:bg-transparent border-emerald-500/30">
                                        <TableHead className="font-bold text-white h-14 border-r border-emerald-500/30">Role Name</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Type</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Users</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Primary Permissions</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Status</TableHead>
                                        <TableHead className="text-right font-bold text-white pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRoles.map((role, idx) => (
                                        <TableRow key={role.id} className={cn(
                                            "hover:bg-emerald-50 transition-colors border-emerald-100/50 group",
                                            idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                        )}>
                                            <TableCell className="font-bold text-slate-900 py-4 border-r border-emerald-100/50">
                                                <div className="flex flex-col">
                                                    <span>{role.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">ROL{String(role.id).padStart(3, '0')}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <Badge variant="outline" className={cn(
                                                    "rounded-lg px-2 py-0.5 text-[10px] font-bold",
                                                    role.type === 'System' ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-teal-50 text-teal-700 border-teal-100"
                                                )}>
                                                    {role.type}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-600 font-medium border-r border-emerald-100/50">
                                                <div className="flex items-center gap-2">
                                                    <UserCircle className="h-4 w-4 text-slate-300" />
                                                    <span className={cn(
                                                        "font-bold",
                                                        (role.userCount || 0) > 0 ? "text-emerald-600" : "text-slate-400"
                                                    )}>
                                                        {role.userCount || 0} Users
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {getPermissionBadges(role.permissions)}
                                                    {role.permissions && role.permissions.split(',').length > 3 && (
                                                        <Badge variant="outline" className="bg-slate-100 text-slate-500">
                                                            +{role.permissions.split(',').length - 3} more
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(role.status)}
                                                    <Badge className={cn(
                                                        "rounded-lg px-2 py-0.5 text-[10px] font-bold",
                                                        role.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                                                    )}>
                                                        {role.status}
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100">
                                                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                                        <DropdownMenuLabel>Role Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="cursor-pointer" onClick={() => openEditDialog(role)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit Role
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleViewUsers(role)}>
                                                            <Eye className="mr-2 h-4 w-4" /> View Assigned Users
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleDuplicateRole(role)}>
                                                            <Copy className="mr-2 h-4 w-4" /> Duplicate Role
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="cursor-pointer" onClick={() => {
                                                            toast.info(`Exporting permissions for ${role.name}...`)
                                                            // TODO: Implement export functionality
                                                        }}>
                                                            <Filter className="mr-2 h-4 w-4" /> Export Permissions
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => openDeleteDialog(role)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Role
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* RBAC Info Card */}
                <Card className="border-none shadow-xl shadow-slate-200/40 bg-slate-900 text-white overflow-hidden">
                    <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                <Lock className="h-8 w-8 text-teal-400" />
                            </div>
                            <div>
                                <h4 className="text-xl font-bold">Role-Based Access Control (RBAC)</h4>
                                <p className="text-slate-400 text-sm leading-relaxed mt-1">
                                    Our system uses granular RBAC to ensure that staff only have access to the modules they need.
                                    You can customize permissions for each role down to the specific action (View, Create, Edit, Delete).
                                </p>
                            </div>
                        </div>
                        <Button className="bg-teal-600 hover:bg-teal-700 text-white h-12 px-8 rounded-xl font-bold shadow-lg shadow-teal-500/20 whitespace-nowrap">
                            View Permission Matrix
                        </Button>
                    </CardContent>
                </Card>

                {/* Create Role Dialog */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create New Role</DialogTitle>
                            <DialogDescription>
                                Define a new role and its permissions in the system.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Role Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Head of Department"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the role"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="permissions">Permissions</Label>
                                <Input
                                    id="permissions"
                                    value={formData.permissions}
                                    onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                                    placeholder="e.g., VIEW_STUDENTS,MANAGE_MARKS"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateRole} disabled={saving || !formData.name}>
                                {saving ? 'Creating...' : 'Create Role'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Role Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Edit Role</DialogTitle>
                            <DialogDescription>
                                Update the role details and permissions.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Role Name</Label>
                                <Input
                                    id="edit-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Input
                                    id="edit-description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-permissions">Permissions</Label>
                                <Input
                                    id="edit-permissions"
                                    value={formData.permissions}
                                    onChange={(e) => setFormData({ ...formData, permissions: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-status">Status</Label>
                                <Input
                                    id="edit-status"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    placeholder="Active or Inactive"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpdateRole} disabled={saving || !formData.name}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Role Dialog */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent className="sm:max-w-[450px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-red-600">
                                <AlertTriangle className="h-5 w-5" /> Delete Role
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete the role <span className="font-semibold">"{selectedRole?.name}"</span>?
                                This action cannot be undone and will affect {(selectedRole?.userCount || 0) > 0 ? `${selectedRole?.userCount} users` : 'no users'}.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={handleDeleteRole} disabled={saving}>
                                {saving ? 'Deleting...' : 'Delete Role'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* View Users Dialog */}
                <Dialog open={isViewUsersDialogOpen} onOpenChange={setIsViewUsersDialogOpen}>
                    <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-emerald-600" />
                                Users with Role: {selectedRole?.name}
                            </DialogTitle>
                            <DialogDescription>
                                Showing all users assigned to the "{selectedRole?.name}" role
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-hidden">
                            {userLoading ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                                </div>
                            ) : (
                                <div className="overflow-y-auto max-h-96">
                                    {usersForRole.length > 0 ? (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>User</TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Last Login</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {usersForRole.map((user) => (
                                                    <TableRow key={user.id}>
                                                        <TableCell className="font-medium">{user.fullName}</TableCell>
                                                        <TableCell className="text-slate-600">{user.email}</TableCell>
                                                        <TableCell>
                                                            <Badge className={cn(
                                                                "rounded-full px-2 py-0.5 text-xs",
                                                                user.isActive ?
                                                                    "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                                    "bg-slate-100 text-slate-600 border-slate-200"
                                                            )}>
                                                                {user.isActive ? "Active" : "Inactive"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-slate-500 text-sm">
                                                            {user.lastLogin ?
                                                                new Date(user.lastLogin).toLocaleDateString() :
                                                                'Never'
                                                            }
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            <UserCircle className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                                            <p>No users assigned to this role</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsViewUsersDialogOpen(false)}>
                                Close
                            </Button>
                            <Button
                                onClick={() => {
                                    toast.info(`Assigning new users to ${selectedRole?.name}...`)
                                    // TODO: Implement assign users functionality
                                }}
                            >
                                Assign Users
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

