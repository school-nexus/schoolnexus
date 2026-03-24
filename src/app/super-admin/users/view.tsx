"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ShieldCheck, Loader2, MoreVertical, Shield, UserX, UserCheck } from 'lucide-react';
import { invokeIPC } from "@/lib/electron";
import { toast } from "sonner"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function UsersView() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await invokeIPC<any[]>('get-all-platform-users');
            if (data) setUsers(data);
        } catch (error) {
            console.error("Failed to fetch platform users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUsers();
    }, [])

    const toggleStatus = async (userId: number, currentStatus: boolean) => {
        try {
            await invokeIPC('update-platform-user-status', userId, !currentStatus);
            toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
            fetchUsers();
        } catch (error) {
            toast.error("Failed to update user status");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">Platform Users</h1>
                    <p className="text-slate-500 font-medium">Manage all accounts across all registered institutions.</p>
                </div>
            </div>

            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-black text-slate-900">All Registered Users</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Institution</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 opacity-20" />
                                            Loading users...
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                            No users found in the platform.
                                        </td>
                                    </tr>
                                ) : users.map((user, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900">{user.fullName}</div>
                                            <div className="text-sm text-slate-500">{user.username}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                                                {user.role === 'super_admin' ? (
                                                    <Shield className="w-4 h-4 text-purple-600" />
                                                ) : (
                                                    <Users className="w-4 h-4 text-slate-400" />
                                                )}
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-500">
                                            {user.schoolName ? (
                                                <div className="flex flex-col">
                                                    <span className="text-slate-900 font-bold">{user.schoolName}</span>
                                                    <code className="text-xs bg-slate-100 rounded px-1.5 py-0.5 mt-1 w-fit">{user.schoolSlug}</code>
                                                </div>
                                            ) : (
                                                <span className="text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded-full text-xs">Platform Administrator</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                {user.isActive ? 'Active' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="rounded-xl">
                                                    <DropdownMenuItem 
                                                        className="font-medium cursor-pointer"
                                                        onClick={() => toggleStatus(user.id, user.isActive)}
                                                    >
                                                        {user.isActive ? (
                                                            <><UserX className="w-4 h-4 mr-2" /> Disable Account</>
                                                        ) : (
                                                            <><UserCheck className="w-4 h-4 mr-2" /> Enable Account</>
                                                        )}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
