"use client"

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    searchKey?: string
    searchPlaceholder?: string
    filterColumn?: string
    filterOptions?: { label: string; value: string }[]
    facets?: {
        column: string
        title: string
        options: { label: string; value: string }[]
    }[]
    bulkActions?: (selectedRows: TData[]) => React.ReactNode
    className?: string
    containerClassName?: string
    showViewOptions?: boolean
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchPlaceholder = "Search...",
    filterColumn,
    filterOptions,
    facets,
    bulkActions,
    className,
    containerClassName,
    showViewOptions = true,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [rowSelection, setRowSelection] = React.useState({})

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    })

    return (
        <div className={cn("space-y-4", containerClassName)}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                    {searchKey && (
                        <Input
                            placeholder={searchPlaceholder}
                            value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                            onChange={(event) =>
                                table.getColumn(searchKey)?.setFilterValue(event.target.value)
                            }
                            className="max-w-[200px] h-9"
                        />
                    )}
                    {filterColumn && filterOptions && (
                        <Select
                            value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? "all"}
                            onValueChange={(value) =>
                                table.getColumn(filterColumn)?.setFilterValue(value === "all" ? undefined : value)
                            }
                        >
                            <SelectTrigger className="w-[180px] h-9">
                                <SelectValue placeholder="Filter by..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                {filterOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                    {facets?.map((facet) => (
                        table.getColumn(facet.column) && (
                            <Select
                                key={facet.column}
                                value={(table.getColumn(facet.column)?.getFilterValue() as string) ?? "all"}
                                onValueChange={(value) =>
                                    table.getColumn(facet.column)?.setFilterValue(value === "all" ? undefined : value)
                                }
                            >
                                <SelectTrigger className="w-[150px] h-9 border-dashed">
                                    <SelectValue placeholder={facet.title} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All {facet.title}s</SelectItem>
                                    {facet.options.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )
                    ))}
                    {bulkActions && table.getFilteredSelectedRowModel().rows.length > 0 && (
                        <>
                            <div className="h-6 w-px bg-slate-200 mx-2" />
                            {bulkActions(table.getFilteredSelectedRowModel().rows.map(row => row.original))}
                        </>
                    )}
                </div>
                {showViewOptions && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="ml-auto h-9">
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                View
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
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
                )}
            </div>
            <div className={cn("rounded-xl border border-emerald-100/50 bg-white shadow-xl shadow-slate-200/20 overflow-hidden", className)}>
                <Table className="border-collapse">
                    <TableHeader className="bg-emerald-600">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-emerald-500/30">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="h-11 text-[11px] font-bold text-white uppercase tracking-wider border-r border-emerald-500/30 last:border-0">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row, idx) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                    className={cn(
                                        "hover:bg-emerald-50 transition-colors border-emerald-100/50",
                                        idx % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                    )}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-3 text-sm border-r border-emerald-100/50 last:border-0">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center text-gray-500"
                                >
                                    No results found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-2">
                <div className="flex-1 text-xs text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="h-8 w-20"
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="h-8 w-20"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}

