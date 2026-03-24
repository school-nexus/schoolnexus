"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Clock, Loader2 } from 'lucide-react';
import { invokeIPC } from "@/lib/electron";
import { format } from "date-fns";

export default function LogsView() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLogs()
    }, [])

    const fetchLogs = async () => {
        setLoading(true)
        try {
            const data = await invokeIPC<any[]>('get-system-logs')
            setLogs(data || [])
        } catch (error) {
            console.error("Failed to fetch logs:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">System Logs</h1>
                    <p className="text-slate-500 font-medium">Audit trail of all administrative actions across the platform.</p>
                </div>
                <Button className="font-bold rounded-xl flex items-center gap-2" variant="outline">
                    <Download className="w-4 h-4" /> Export CSV
                </Button>
            </div>
            
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
                            <p className="font-medium animate-pulse">Retrieving audit trail...</p>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 text-center">
                            <div className="bg-slate-50 p-6 rounded-full mb-4">
                                <Clock className="w-12 h-12 text-slate-300" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 mb-2">Audit Log is Empty</h2>
                            <p className="text-slate-500 font-medium max-w-md">No administrative actions have been recorded in the platform system log yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 bg-slate-50/80 uppercase font-black tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 rounded-tl-xl whitespace-nowrap">Timestamp</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Action</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Actor</th>
                                        <th className="px-6 py-4 rounded-tr-xl whitespace-nowrap">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-600">
                                                {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-800">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs mr-3">
                                                        {(log.actorName || 'SYS').substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="font-bold text-slate-900">{log.actorName || 'System Process'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 max-w-md truncate">
                                                {log.details || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
