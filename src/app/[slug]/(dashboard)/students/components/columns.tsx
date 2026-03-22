"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Archive, ArrowUpDown, Eye, MoreHorizontal, Pencil, SlidersHorizontal, Trash2 } from 'lucide-react';
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

export type Student = {
    id: string
    firstName: string
    lastName: string
    email: string
    admissionNumber: string
    linNumber?: string
    schoolPayCode?: string
    class: string
    stream: string
    gender: "Male" | "Female"
    status: "Active" | "Inactive" | "Suspended"
    guardianName: string
    guardianPhone: string
    photoUrl?: string
}

interface ActionsCellProps {
    student: Student
}

const ActionsCell = ({ student }: ActionsCellProps) => {
    const { confirm } = useConfirm()

    const handleArchive = async () => {
        if (await confirm({
            title: "Archive Student",
            description: "Are you sure you want to archive this student?",
            confirmText: "Archive",
            variant: "destructive"
        })) {
            try {
                const { studentActions } = await import("@/lib/electron")
                await studentActions.delete(parseInt(student.id))
                toast.success("Student archived successfully")
                window.location.reload()
            } catch (error: unknown) {
                console.error("Failed to archive student:", error)
                toast.error("Failed to archive student")
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
                    <Link href={`/students/profiles?id=${student.id}`} className="flex items-center cursor-pointer">
                        <Eye className="mr-2 h-4 w-4" /> View Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={`/students/add?id=${student.id}`} className="flex items-center cursor-pointer">
                        <Pencil className="mr-2 h-4 w-4" /> Edit Details
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-amber-600 focus:text-amber-600 focus:bg-amber-50 cursor-pointer"
                    onClick={handleArchive}
                >
                    <Archive className="mr-2 h-4 w-4" /> Archive Student
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export const columns: ColumnDef<Student>[] = [
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
                    Student
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const student = row.original
            return (
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-md ring-1 ring-slate-100">
                        <AvatarImage src={fileActions.getUrl(student.photoUrl)} alt={student.firstName} />
                        <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-emerald-100 text-emerald-700 font-bold">
                            {student.firstName[0]}{student.lastName[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{student.firstName} {student.lastName}</span>
                        <span className="text-xs text-slate-500 font-medium">{student.email}</span>
                    </div>
                </div>
            )
        },
    },
    {
        accessorKey: "admissionNumber",
        header: "Admission Number",
        cell: ({ row }) => <div className="font-mono text-[10px] font-medium text-slate-500 bg-slate-100/80 px-2 py-1 rounded-md border border-slate-200/50 w-fit">{String(row.getValue("admissionNumber"))}</div>,
    },
    {
        accessorKey: "linNumber",
        header: "LIN Number",
        cell: ({ row }) => <div className="font-mono text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 w-fit">{String(row.getValue("linNumber") || "N/A")}</div>,
    },
    {
        accessorKey: "schoolPayCode",
        header: "SchoolPay Code",
        cell: ({ row }) => <div className="font-mono text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 w-fit">{String(row.getValue("schoolPayCode") || "N/A")}</div>,
    },
    {
        accessorKey: "class",
        header: "Class",
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="font-medium text-slate-700">{String(row.getValue("class"))}</span>
            </div>
        ),
    },
    {
        accessorKey: "stream",
        header: "Stream",
        cell: ({ row }) => (
            <div className="text-sm text-slate-600">{String(row.getValue("stream"))}</div>
        ),
    },
    {
        accessorKey: "guardianName",
        header: "Guardian",
        cell: ({ row }) => (
            <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-700">{String(row.getValue("guardianName"))}</span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                    {row.original.guardianPhone}
                </span>
            </div>
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
                            "bg-red-50 text-red-700 border-red-200 shadow-sm"
                }>
                    <span className={
                        status === "Active" ? "w-1.5 h-1.5 rounded-full bg-green-500 mr-2" :
                            status === "Inactive" ? "w-1.5 h-1.5 rounded-full bg-slate-500 mr-2" :
                                "w-1.5 h-1.5 rounded-full bg-red-500 mr-2"
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
        cell: ({ row }) => <ActionsCell student={row.original} />,
    },
]

