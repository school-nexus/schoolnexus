export const runtime = 'edge';
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/ui/page-header"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Search,
    Filter,
    Download,
    Users,
    Layers,
    MoreHorizontal,
    Plus,
    Edit,
    Loader2,
    Trash2,
    X,
    User,
    DollarSign,
    Percent,
    Award,
    Building2
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { feeActions, classActions, streamActions, groupActions, studentActions, schoolProfileActions } from "@/lib/electron"
import { toast } from "sonner"
import { useConfirm } from "@/components/providers/confirm-provider"
import { cn } from "@/lib/utils"

interface FeeGroup {
    id: number
    name: string
    description: string
    discountPercentage?: number
    sponsor?: string
    createdAt: string
    memberCount: number
}

interface RawFeeStructure {
    id: number
    name: string
    amount: number
}

interface RawStudent {
    id: number
    firstName: string
    lastName: string
    admissionNumber: string
}

interface RawProfile {
    currency: string
}

export default function FeeGroupsPage() {
    const { confirm } = useConfirm()
    const [customGroups, setCustomGroups] = useState<FeeGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [profile, setProfile] = useState<RawProfile | null>(null)

    // Create Group State
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newGroupName, setNewGroupName] = useState("")
    const [newGroupDesc, setNewGroupDesc] = useState("")
    const [newDiscountPercent, setNewDiscountPercent] = useState("")
    const [newSponsor, setNewSponsor] = useState("")
    const [isCreating, setIsCreating] = useState(false)

    // Manage Members State
    const [isManageMembersOpen, setIsManageMembersOpen] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState<FeeGroup | null>(null)
    const [groupMembers, setGroupMembers] = useState<RawStudent[]>([])
    const [memberSearch, setMemberSearch] = useState("")
    const [allStudents, setAllStudents] = useState<RawStudent[]>([])
    const [isAddingMember, setIsAddingMember] = useState(false)

    useEffect(() => {
        fetchData()
        fetchStudents()
    }, [])

    const fetchStudents = async () => {
        try {
            const students = await studentActions.getAll() as RawStudent[]
            setAllStudents(students)
        } catch (error: unknown) {
            console.error("Failed to fetch students:", error)
        }
    }

    const fetchData = async () => {
        try {
            const [groupsData, profileData] = await Promise.all([
                groupActions.getAll() as Promise<FeeGroup[]>,
                schoolProfileActions.get() as Promise<RawProfile>
            ])
            setCustomGroups(groupsData)
            setProfile(profileData)
        } catch (error: unknown) {
            console.error("Failed to fetch data:", error)
            toast.error("Failed to load fee groups")
        } finally {
            setLoading(false)
        }
    }

    const handleCreateGroup = async () => {
        if (!newGroupName) {
            toast.error("Group name is required")
            return
        }

        setIsCreating(true)
        try {
            await groupActions.create({
                name: newGroupName,
                description: newGroupDesc,
                discountPercentage: newDiscountPercent ? parseFloat(newDiscountPercent) : 0,
                sponsor: newSponsor || null
            })
            toast.success("Special group created successfully")
            setIsCreateOpen(false)
            setNewGroupName("")
            setNewGroupDesc("")
            setNewDiscountPercent("")
            setNewSponsor("")
            fetchData()
        } catch (error: unknown) {
            console.error("Failed to create group:", error)
            toast.error("Failed to create group")
        } finally {
            setIsCreating(false)
        }
    }

    const handleDeleteGroup = async (id: number) => {
        if (await confirm({
            title: "Delete Special Student Group",
            description: "Are you sure you want to delete this special group? All members will be removed and lose their benefits.",
            confirmText: "Delete Group",
            variant: "destructive"
        })) {
            try {
                await groupActions.delete(id)
                toast.success("Group deleted successfully")
                fetchData()
            } catch (error: unknown) {
                console.error("Failed to delete group:", error)
                toast.error("Failed to delete group")
            }
        }
    }

    const handleManageMembers = async (group: FeeGroup) => {
        setSelectedGroup(group)
        setIsManageMembersOpen(true)
        try {
            const members = await groupActions.getMembers(group.id) as RawStudent[]
            setGroupMembers(members)
        } catch (error: unknown) {
            console.error("Failed to fetch members:", error)
            toast.error("Failed to load group members")
        }
    }

    const handleAddMember = async (studentId: number) => {
        if (!selectedGroup) return
        setIsAddingMember(true)
        try {
            await groupActions.addMember({
                groupId: selectedGroup.id,
                studentId
            })
            toast.success("Student added to special group successfully")
            const members = await groupActions.getMembers(selectedGroup.id) as RawStudent[]
            setGroupMembers(members)
            setMemberSearch("")
            fetchData() // Update counts
        } catch (error: unknown) {
            console.error("Failed to add member:", error)
            toast.error("Failed to add member")
        } finally {
            setIsAddingMember(false)
        }
    }

    const handleRemoveMember = async (studentId: number) => {
        if (!selectedGroup) return
        if (!await confirm({
            title: "Remove Student from Group",
            description: "Are you sure you want to remove this student from the special group? They will lose their benefits.",
            confirmText: "Remove",
            variant: "destructive"
        })) return

        try {
            await groupActions.removeMember({
                groupId: selectedGroup.id,
                studentId
            })
            toast.success("Student removed from group successfully")
            const members = await groupActions.getMembers(selectedGroup.id) as RawStudent[]
            setGroupMembers(members)
            fetchData() // Update counts
        } catch (error: unknown) {
            console.error("Failed to remove member:", error)
            toast.error("Failed to remove member")
        }
    }

    const filteredStudents = memberSearch.length > 1
        ? allStudents.filter(s =>
            (s.firstName?.toLowerCase().includes(memberSearch.toLowerCase()) ||
                s.lastName?.toLowerCase().includes(memberSearch.toLowerCase()) ||
                s.admissionNumber?.toLowerCase().includes(memberSearch.toLowerCase())) &&
            !groupMembers.some(m => m.id === s.id)
        ).slice(0, 5)
        : []

    const formatCurrency = (amount: number) => `${amount.toLocaleString()} ${profile?.currency || 'UGX'}`

    const filteredGroups = customGroups.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto space-y-8">
                <PageHeader
                    title="Special Student Groups"
                    description="Manage special student groups for bursaries, sponsorships, and discounts."
                    breadcrumbs={[
                        { label: "Dashboard", href: "/dashboard" },
                        { label: "Fees", href: "/fees" },
                        { label: "Special Groups" },
                    ]}
                    actions={
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 h-11 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]">
                                    <Plus className="mr-2 h-4 w-4" /> Create Special Group
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl shadow-emerald-500/20 bg-white font-sans">
                                <DialogHeader className="bg-gradient-to-br from-emerald-600 to-teal-600 p-6 text-white">
                                    <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-white">
                                        <Award className="h-6 w-6 text-emerald-100" />
                                        Create Special Student Group
                                    </DialogTitle>
                                    <p className="text-emerald-100/80 mt-1.5 text-sm">
                                        Define a group for students with special fee arrangements.
                                    </p>
                                </DialogHeader>
                                <div className="space-y-6 p-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Group Name *</Label>
                                        <Input
                                            placeholder="e.g. Bursary Students, Sponsors, Alumni Children"
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</Label>
                                        <Textarea
                                            placeholder="Describe the purpose of this group..."
                                            value={newGroupDesc}
                                            onChange={(e) => setNewGroupDesc(e.target.value)}
                                            className="min-h-[100px] rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all resize-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Discount Percentage</Label>
                                            <div className="relative">
                                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    min="0"
                                                    max="100"
                                                    value={newDiscountPercent}
                                                    onChange={(e) => setNewDiscountPercent(e.target.value)}
                                                    className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 pl-10 transition-all font-medium"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sponsor/Organization</Label>
                                            <div className="relative">
                                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    placeholder="Organization name"
                                                    value={newSponsor}
                                                    onChange={(e) => setNewSponsor(e.target.value)}
                                                    className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 pl-10 transition-all font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100 gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsCreateOpen(false)}
                                        className="h-11 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateGroup}
                                        disabled={isCreating}
                                        className="h-11 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Group"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    }
                />

                <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search special groups..."
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
                                        <TableHead className="font-bold text-white h-14 border-r border-emerald-500/30">Group Name</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Description</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Benefits</TableHead>
                                        <TableHead className="font-bold text-white border-r border-emerald-500/30">Members</TableHead>
                                        <TableHead className="text-right font-bold text-white pr-6">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredGroups.length > 0 ? filteredGroups.map((group, idx) => (
                                        <TableRow key={group.id} className={cn(
                                            "hover:bg-emerald-50 transition-colors border-emerald-100/50",
                                            idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                        )}>
                                            <TableCell className="font-bold text-slate-900 py-4 border-r border-emerald-100/50">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                                                        <Award className="h-4 w-4" />
                                                    </div>
                                                    <div>
                                                        <span>{group.name}</span>
                                                        {group.sponsor && (
                                                            <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                                                                <Building2 className="h-3 w-3" />
                                                                Sponsored by {group.sponsor}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-600 border-r border-emerald-100/50">{group.description || "-"}</TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <div className="flex flex-col gap-1">
                                                    {group.discountPercentage && group.discountPercentage > 0 && (
                                                        <Badge className="bg-blue-50 text-blue-700 border-blue-100 w-fit">
                                                            <Percent className="h-3 w-3 mr-1" />
                                                            {group.discountPercentage}% Discount
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="border-r border-emerald-100/50">
                                                <Badge className="bg-violet-50 text-violet-700 border-violet-100">
                                                    {group.memberCount} Students
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100">
                                                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40 rounded-xl">
                                                        <DropdownMenuItem 
                                                            onClick={() => handleManageMembers(group)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Users className="mr-2 h-4 w-4" /> Manage Members
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem 
                                                            onClick={() => handleDeleteGroup(group.id)}
                                                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Group
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-slate-400 border-emerald-100/50">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Users className="h-12 w-12 text-slate-200" />
                                                    <p className="text-lg font-medium">No special student groups found</p>
                                                    <p className="text-slate-500">Create your first special group to categorize students with special fee arrangements.</p>
                                                    <Button 
                                                        variant="outline" 
                                                        onClick={() => setIsCreateOpen(true)} 
                                                        className="mt-3"
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" /> Create Group
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Dialog open={isManageMembersOpen} onOpenChange={setIsManageMembersOpen}>
                    <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl shadow-emerald-500/20 bg-white">
                        <DialogHeader className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <DialogTitle className="text-xl font-bold flex items-center gap-2 text-white">
                                        <Users className="h-5 w-5 text-emerald-400" />
                                        Manage Group Members
                                    </DialogTitle>
                                    <CardDescription className="text-slate-400 mt-1">
                                        {selectedGroup?.name} - {selectedGroup?.sponsor ? `Sponsored by ${selectedGroup.sponsor}` : 'Special Group'}
                                    </CardDescription>
                                </div>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                    {groupMembers.length} Students
                                </Badge>
                            </div>
                        </DialogHeader>

                        <div className="p-6 space-y-8">
                            {/* Add Member Section */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Add Student to Special Group</Label>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                    <Input
                                        placeholder="Search by name or admission number..."
                                        className="pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                                        value={memberSearch}
                                        onChange={(e) => setMemberSearch(e.target.value)}
                                    />
                                </div>

                                {/* Search Results Dropdown */}
                                {filteredStudents.length > 0 && (
                                    <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xl shadow-slate-200/50 bg-white divide-y divide-slate-50 animate-in fade-in zoom-in-95 duration-200">
                                        {filteredStudents.map(student => (
                                            <div key={student.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-emerald-100/50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                                        {student.firstName[0]}{student.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-700 group-hover:text-emerald-700 transition-colors">{student.firstName} {student.lastName}</p>
                                                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{student.admissionNumber}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAddMember(student.id)}
                                                    disabled={isAddingMember}
                                                    className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20"
                                                >
                                                    <Plus className="h-3 w-3 mr-1.5" /> Add to Group
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-slate-100" />

                            {/* Members List */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Group Members</Label>
                                    <span className="text-xs font-medium text-slate-400">{groupMembers.length} students</span>
                                </div>

                                <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/30">
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar divide-y divide-slate-100">
                                        {groupMembers.length > 0 ? groupMembers.map(member => (
                                            <div key={member.id} className="p-3 flex items-center justify-between hover:bg-white transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                                        <User className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-700">{member.firstName} {member.lastName}</p>
                                                        <p className="text-xs text-slate-500">{member.admissionNumber}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                    onClick={() => handleRemoveMember(member.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )) : (
                                            <div className="p-12 flex flex-col items-center justify-center text-center gap-3">
                                                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <Users className="h-6 w-6 text-slate-300" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">No members in this group yet</p>
                                                    <p className="text-xs text-slate-500 mt-1">Search for students above to add them to this special group.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100">
                            <Button
                                onClick={() => setIsManageMembersOpen(false)}
                                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 font-bold"
                            >
                                Done
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
