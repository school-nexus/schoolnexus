"use client"

import { School, Phone, Mail, MapPin, Hash, Calendar, GraduationCap, Scale, User, FileText, CheckCircle2, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { schoolProfileActions, fileActions } from "@/lib/electron"
import { cn } from "@/lib/utils"
import { amountToWordsUGX } from "@/lib/numToWords"

import { RawInvoice, RawProfile } from "../InvoicesPageContent"

interface InvoicePreviewProps {
    id?: string
    invoice: RawInvoice
    schoolProfile: RawProfile | null
}

export function InvoicePreview({ id, invoice, schoolProfile }: InvoicePreviewProps) {
    const [logoPath, setLogoPath] = useState<string | null>(null)
    const issueDate = new Date(invoice?.createdAt || Date.now()).toLocaleDateString()

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profile = await schoolProfileActions.get()
                if (profile && profile.logo) {
                    setLogoPath(profile.logo)
                }
            } catch (error: unknown) {
                console.error("Failed to fetch school profile:", error)
            }
        }
        fetchProfile()
    }, [])

    const formatCurrency = (amount: number) => {
        if (!amount && amount !== 0) return "0"
        return amount.toLocaleString()
    }

    const calculateBalance = () => {
        const total = invoice?.amount || 0
        const paid = invoice?.paidAmount || 0
        return total - paid
    }

    interface StatusConfig {
        label: string
        color: string
        bg: string
    }

    const statusMap: Record<string, StatusConfig> = {
        "paid": { label: "Fully Paid", color: "#059669", bg: "#f0fdf4" },
        "partially paid": { label: "Partially Paid", color: "#2563eb", bg: "#eff6ff" },
        "pending": { label: "Payment Due", color: "#dc2626", bg: "#fef2f2" }
    }
    const status = statusMap[invoice?.status?.toLowerCase() || "pending"] || statusMap["pending"]

    return (
        <div
            className="invoice-document bg-white mx-auto printable-area"
            id={id || "invoice-content"}
            style={{
                width: "138mm",
                height: "200mm",
                padding: "10mm",
                boxSizing: "border-box",
                backgroundColor: "white",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                fontFamily: "'Inter', system-ui, sans-serif",
                color: "#1e293b",
                border: "none",
                boxShadow: "none"
            }}
        >

            {/* HEADER SECTION */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "5mm", marginTop: "2mm" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    {logoPath ? (
                        <img 
                            src={fileActions.getUrl(logoPath)} 
                            style={{ width: "48px", height: "48px", objectFit: "contain" }} 
                            alt="Logo"
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const fallback = target.nextElementSibling as HTMLDivElement;
                                if (fallback) fallback.style.display = "flex";
                            }}
                        />
                    ) : null}
                    <div style={{ 
                        width: "48px", height: "48px", 
                        background: "#f1f5f9", 
                        borderRadius: "8px", 
                        display: logoPath ? "none" : "flex", 
                        alignItems: "center", justifyContent: "center" 
                    }}>
                        <School className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: "14px", fontWeight: 800, margin: 0, textTransform: "uppercase", color: "#0f172a", letterSpacing: "-0.2px" }}>
                            {schoolProfile?.name || "SCHOOL NEXUS"}
                        </h1>
                        <p style={{ fontSize: "8px", color: "#64748b", margin: "1px 0", fontWeight: 500 }}>
                            {schoolProfile?.motto || "Excellence in Education"}
                        </p>
                    </div>
                </div>

                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "20px", fontWeight: 900, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "2px", lineHeight: 1 }}>INVOICE</div>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "#334155", marginTop: "2px" }}>#{invoice?.invoiceNumber || "INV-001"}</div>
                </div>
            </div>

            {/* CONTACT STRIP */}
            <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                padding: "2mm 0", 
                borderTop: "0.5px solid #e2e8f0", 
                borderBottom: "0.5px solid #e2e8f0",
                fontSize: "7.5px",
                color: "#475569",
                marginBottom: "4mm"
            }}>
                <div style={{ display: "flex", gap: "10px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><MapPin className="w-2.5 h-2.5" /> {schoolProfile?.address || "Main Street, City"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Phone className="w-2.5 h-2.5" /> {schoolProfile?.phone || "+256 000 000"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <Mail className="w-2.5 h-2.5" /> {schoolProfile?.email || "info@school.com"}
                </div>
            </div>

            {/* BILLING GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6mm", marginBottom: "6mm" }}>
                {/* BILL TO */}
                <div>
                    <h2 style={{ fontSize: "8px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", marginBottom: "2mm", letterSpacing: "0.5px" }}>Bill To:</h2>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#0f172a" }}>{invoice?.studentName || "Student Name"}</div>
                    <div style={{ fontSize: "9px", color: "#475569", marginTop: "1px" }}>Adm No: <span style={{ fontWeight: 600 }}>{invoice?.studentAdmNo || "N/A"}</span></div>
                    <div style={{ fontSize: "9px", color: "#475569" }}>Class: <span style={{ fontWeight: 600 }}>{invoice?.className || "N/A"}</span></div>
                    <div style={{ fontSize: "9px", color: "#475569", marginTop: "3px" }}>Parent: {invoice?.guardianName || "Guardian Name"}</div>
                </div>

                {/* INVOICE DETAILS */}
                <div style={{ background: "#f8fafc", padding: "3mm", borderRadius: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                        <span style={{ fontSize: "8px", color: "#64748b", fontWeight: 600 }}>Issue Date:</span>
                        <span style={{ fontSize: "9px", color: "#0f172a", fontWeight: 700 }}>{issueDate}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                        <div style={{ 
                            fontSize: "7px", 
                            fontWeight: 800, 
                            padding: "1px 6px", 
                            borderRadius: "4px", 
                            background: status.bg, 
                            color: status.color,
                            textTransform: "uppercase" 
                        }}>
                            {status.label}
                        </div>
                    </div>
                </div>
            </div>

            {/* TABLE SECTION */}
            <div style={{ flex: 1 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "#0f172a" }}>
                            <th style={{ textAlign: "left", padding: "3mm 4mm", color: "white", fontSize: "9px", fontWeight: 700, borderRadius: "4px 0 0 4px" }}>Description</th>
                            <th style={{ textAlign: "right", padding: "3mm 4mm", color: "white", fontSize: "9px", fontWeight: 700, borderRadius: "0 4px 4px 0", width: "35mm" }}>Amount (UGX)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style={{ borderBottom: "0.5px solid #f1f5f9" }}>
                            <td style={{ padding: "4mm", verticalAlign: "top" }}>
                                <div style={{ fontSize: "10px", fontWeight: 700, color: "#1e293b" }}>School Fees Payment</div>
                                <div style={{ fontSize: "8px", color: "#64748b", marginTop: "1mm" }}>Academic Tuition and Functional Fees for the current term.</div>
                            </td>
                            <td style={{ padding: "4mm", textAlign: "right", fontSize: "10px", fontWeight: 700, color: "#1e293b" }}>
                                {formatCurrency(invoice?.amount)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* SUMMARY SECTION */}
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "4mm 0", borderTop: "2px solid #0f172a" }}>
                <div style={{ width: "55mm" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2mm", fontSize: "9px" }}>
                        <span style={{ color: "#64748b", fontWeight: 600 }}>Sub-Total:</span>
                        <span style={{ fontWeight: 700 }}>UGX {formatCurrency(invoice?.amount)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4mm", fontSize: "9px" }}>
                        <span style={{ color: "#059669", fontWeight: 600 }}>Total Paid:</span>
                        <span style={{ fontWeight: 700, color: "#059669" }}>- UGX {formatCurrency(invoice?.paidAmount || 0)}</span>
                    </div>
                    <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        padding: "3mm", 
                        background: "#0f172a", 
                        color: "white", 
                        borderRadius: "6px",
                        alignItems: "center"
                    }}>
                        <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase" }}>Balance:</span>
                        <span style={{ fontSize: "13px", fontWeight: 900 }}>UGX {formatCurrency(calculateBalance())}</span>
                    </div>
                </div>
            </div>

            {/* Amount in Words */}
            <div style={{ 
                marginTop: "2mm", 
                padding: "2mm", 
                background: "#f8fafc", 
                borderRadius: "4px",
                fontSize: "7.5px",
                color: "#475569",
                border: "0.5px solid #e2e8f0"
            }}>
                <span style={{ fontWeight: 800, textTransform: "uppercase" }}>Amount in Words:</span> {amountToWordsUGX(calculateBalance())}
            </div>

            {/* FOOTER SECTION */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10mm", marginTop: "4mm", borderTop: "0.5px solid #f1f5f9", paddingTop: "4mm" }}>
                <div>
                    <h3 style={{ fontSize: "8px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", marginBottom: "2mm" }}>Payment Instructions:</h3>
                    <div style={{ fontSize: "7.5px", color: "#475569", lineHeight: 1.5 }}>
                        - Use ADM No: <span style={{ fontWeight: 700 }}>{invoice?.studentAdmNo}</span> as reference.<br/>
                        - Bank: Standard Chartered Bank<br/>
                        - Acc Name: {schoolProfile?.name || "School Nexus"}<br/>
                        - Acc No: 01020304050
                    </div>
                </div>
                <div style={{ textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "20mm" }}>
                    <div style={{ marginBottom: "auto" }}>
                        <div style={{ fontSize: "7px", color: "#94a3b8", fontWeight: 600 }}>Authorized Signature & Stamp</div>
                    </div>
                    <div>
                        <div style={{ borderTop: "1px solid #1e293b", width: "40mm", marginLeft: "auto", paddingTop: "1mm" }}>
                            <div style={{ fontSize: "8px", fontWeight: 700, color: "#1e293b" }}>HEAD TEACHER</div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ 
                textAlign: "center", 
                marginTop: "4mm", 
                fontSize: "7px", 
                color: "#94a3b8", 
                fontStyle: "italic",
                borderTop: "1px dashed #e2e8f0",
                paddingTop: "2mm"
            }}>
                This is a system generated document. Powered by School Nexus MS.
            </div>
        </div>
    )
}
