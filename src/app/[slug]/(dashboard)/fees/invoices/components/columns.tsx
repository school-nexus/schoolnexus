"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    MoreHorizontal, Eye, Printer, Trash2,
    ArrowUpDown, Calendar, User, CreditCard,
    Hash, FileText, AlertCircle, CheckCircle2,
    Clock, BadgeInfo
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

import { RawInvoice } from "../InvoicesPageContent"

export const columns = (
    handleView: (invoice: RawInvoice) => void,
    handlePrint: (invoice: RawInvoice) => void,
    handleDelete: (invoice: RawInvoice) => void,
    router: AppRouterInstance
): ColumnDef<RawInvoice>[] => [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    aria-label="Select all"
                    className="translate-y-[2px] rounded-md border-slate-300"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                    className="translate-y-[2px] rounded-md border-slate-300"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "invoiceNumber",
            size: 160,
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    className="font-bold p-0 hover:bg-transparent"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Invoice #
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 leading-none">#{row.getValue("invoiceNumber")}</span>
                </div>
            ),
        },
        {
            accessorKey: "studentName",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    className="font-bold p-0 hover:bg-transparent"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Student
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const studentName = row.original.studentName
                const admissionNumber = row.original.studentAdmNo || row.original.student?.admissionNumber || "N/A"
                return (
                    <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{studentName}</span>
                        <div className="font-mono text-[9px] font-medium text-slate-500 bg-slate-100/80 px-1.5 py-0.5 rounded border border-slate-200/50 w-fit mt-1">
                            {admissionNumber}
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: "className",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    className="font-bold p-0 hover:bg-transparent"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Class
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <Badge variant="outline" className="bg-slate-50 border-slate-100 text-slate-600 font-medium text-[10px] rounded-lg px-2 py-0.5">
                    {row.getValue("className")}
                </Badge>
            ),
        },
        {
            accessorKey: "amount",
            header: ({ column }) => (
                <div className="text-right">
                    <Button
                        variant="ghost"
                        className="font-bold p-0 hover:bg-transparent ml-auto"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Amount
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            ),
            cell: ({ row }) => {
                const amount = parseFloat(row.getValue("amount"))
                const formatted = new Intl.NumberFormat("en-UG", {
                    style: "currency",
                    currency: "UGX",
                    maximumFractionDigits: 0
                }).format(amount)

                return <div className="text-right font-bold text-slate-900">{formatted}</div>
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string
                const isOverdue = row.original.dueDate && new Date(row.original.dueDate) < new Date() && status !== "Paid"

                return (
                    <div className="flex flex-col gap-1">
                        <Badge variant="outline" className={cn(
                            "shadow-sm",
                            status.toLowerCase() === "paid" ? "bg-green-50 text-green-700 border-green-200" :
                                status.toLowerCase() === "partially paid" ? "bg-blue-50 text-blue-700 border-blue-100" :
                                    "bg-amber-50 text-amber-700 border-amber-100"
                        )}>
                            <span className={cn(
                                "w-1.5 h-1.5 rounded-full mr-2",
                                status.toLowerCase() === "paid" ? "bg-green-500" :
                                    status.toLowerCase() === "partially paid" ? "bg-blue-500" :
                                        "bg-amber-500"
                            )} />
                            {status}
                        </Badge>
                        {isOverdue && (
                            <div className="flex items-center gap-1 text-[9px] font-black text-red-500 uppercase italic">
                                <AlertCircle className="w-3 h-3" />
                                Overdue
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => {
                const date = new Date(row.original.createdAt || Date.now())
                return (
                    <div className="text-xs text-slate-600 font-medium">
                        {date.toLocaleDateString()}
                    </div>
                )
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                const invoice = row.original

                return (
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-lg"
                            onClick={() => handleView(invoice)}
                        >
                            <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg"
                            onClick={() => handlePrint(invoice)}
                        >
                            <Printer className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 rounded-lg">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-slate-100">
                                <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 py-1.5 flex items-center gap-2">
                                    <BadgeInfo className="w-3 h-3" />
                                    Invoice Actions
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="rounded-lg font-bold"
                                    onClick={() => router.push(`/fees/invoices/preview/${invoice.id}`)}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Full View
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg font-bold">
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Record Payment
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50 rounded-lg font-black italic"
                                    onClick={() => handleDelete(invoice)}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Invoice
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )
            },
        },
    ]
