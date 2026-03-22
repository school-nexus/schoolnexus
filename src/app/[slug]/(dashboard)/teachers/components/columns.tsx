"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, MoreHorizontal, Pencil, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useConfirm } from "@/components/providers/confirm-provider"
import { toast } from "sonner"
import { fileActions } from "@/lib/electron"

export type Teacher = {
    id: string
    firstName: string
    lastName: string
    email: string
    teacherId: string
    qualification: string
    subject: string
    gender: "Male" | "Female"
    status: "Active" | "Inactive" | "On Leave"
    phone: string
    experience: number
    photoUrl?: string
}

interface ActionsCellProps {
    teacher: Teacher
}

const ActionsCell = ({ teacher }: ActionsCellProps) => {
    const { confirm } = useConfirm()

    const onDelete = async () => {
        if (await confirm({
            title: "Delete Teacher",
            description: `Are you sure you want to PERMANENTLY delete ${teacher.firstName} ${teacher.lastName}? This action cannot be undone.`,
            confirmText: "Delete Teacher",
            variant: "destructive"
        })) {
            try {
                const { teacherActions } = await import("@/lib/electron")
                await teacherActions.delete(parseInt(teacher.id))
                toast.success("Teacher deleted successfully")
                window.location.reload()
            } catch (error) {
                console.error("Failed to delete teacher:", error)
                toast.error("Failed to delete teacher")
            }
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href={`/teachers/profiles?id=${teacher.id}`} className="flex items-center cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" /> View Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={`/teachers/add?id=${teacher.id}`} className="flex items-center cursor-pointer">
                        <Pencil className="mr-2 h-4 w-4" /> Edit Details
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                    onClick={onDelete}
                >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Teacher
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export const columns: ColumnDef<Teacher>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "firstName",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="-ml-4"
                >
                    Teacher
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const teacher = row.original
            return (
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-md ring-1 ring-slate-100">
                        <AvatarImage src={fileActions.getUrl(teacher.photoUrl)} alt={teacher.firstName} />
                        <AvatarFallback className="bg-gradient-to-br from-teal-100 to-pink-100 text-teal-700 font-bold">
                            {teacher.firstName[0]}{teacher.lastName[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{teacher.firstName} {teacher.lastName}</span>
                        <span className="text-xs text-slate-500 font-medium">{teacher.email}</span>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "teacherId",
        header: "Teacher ID",
        cell: ({ row }) => <div className="font-mono text-[10px] font-medium text-slate-500 bg-slate-100/80 px-2 py-1 rounded-md border border-slate-200/50 w-fit">{String(row.getValue("teacherId"))}</div>,
    },
    {
        accessorKey: "qualification",
        header: "Qualification",
        cell: ({ row }) => (
            <div className="font-medium text-slate-700">{String(row.getValue("qualification"))}</div>
        ),
    },
    {
        accessorKey: "subject",
        header: "Subject",
        cell: ({ row }) => (
            <div className="text-sm text-slate-600">{String(row.getValue("subject"))}</div>
        ),
    },
    {
        accessorKey: "phone",
        header: "Contact",
        cell: ({ row }) => (
            <div className="text-sm text-slate-600">{String(row.getValue("phone"))}</div>
        ),
    },
    {
        accessorKey: "experience",
        header: "Exp (Yrs)",
        cell: ({ row }) => (
            <div className="text-sm text-slate-600 text-center">{String(row.getValue("experience") || 0)}</div>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return (
                <Badge variant="outline" className={
                    status === "Active" ? "bg-green-50 text-green-700 border-green-200 shadow-sm" :
                        status === "Inactive" ? "bg-slate-50 text-slate-700 border-slate-200 shadow-sm" :
                            "bg-amber-50 text-amber-700 border-amber-200 shadow-sm"
                }>
                    <span className={
                        status === "Active" ? "w-1.5 h-1.5 rounded-full bg-green-500 mr-2" :
                            status === "Inactive" ? "w-1.5 h-1.5 rounded-full bg-slate-500 mr-2" :
                                "w-1.5 h-1.5 rounded-full bg-amber-500 mr-2"
                    }></span>
                    {status}
                </Badge>
            )
        },
    },
    {
        id: "actions",
        header: ({ table }) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 data-[state=open]:bg-accent">
                        <span>View</span>
                        <SlidersHorizontal className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[150px]">
                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {table
                        .getAllColumns()
                        .filter(
                            (column) =>
                                typeof column.accessorFn !== "undefined" &&
                                column.getCanHide()
                        )
                        .map((column) => {
                            return (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={column.getIsVisible()}
                                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                >
                                    {column.id}
                                </DropdownMenuCheckboxItem>
                            )
                        })}
                </DropdownMenuContent>
            </DropdownMenu>
        ),
        cell: ({ row }) => <ActionsCell teacher={row.original} />,
    },
]

