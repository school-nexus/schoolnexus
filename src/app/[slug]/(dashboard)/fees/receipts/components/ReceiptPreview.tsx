"use client"

import { Calendar, CheckCircle2, Clock, CreditCard, Mail, MapPin, Phone, School, User } from 'lucide-react';
import { schoolProfileActions, fileActions } from "@/lib/electron"
import { useState, useEffect } from "react"
import { getPaymentMethodInfo } from "@/lib/constants"

import { RawReceipt, RawProfile } from "../page"

interface ReceiptPreviewProps {
    id?: string
    receipt: RawReceipt
    schoolProfile: RawProfile | null
}

import { amountToWordsUGX } from "@/lib/numToWords"

export function ReceiptPreview({ id, receipt, schoolProfile }: ReceiptPreviewProps) {
    const [logoPath, setLogoPath] = useState<string | null>(null)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profile = await schoolProfileActions.get()
                if (profile && profile.logo) {
                    setLogoPath(profile.logo)
                }
            } catch (error) {
                console.error("Failed to fetch school profile:", error)
            }
        }
        fetchProfile()
    }, [])

    const formatCurrency = (amount: number) => {
        if (!amount && amount !== 0) return "0"
        return amount.toLocaleString()
    }

    const paymentInfo = getPaymentMethodInfo(receipt?.paymentMethod || "cash")
    const PaymentIcon = paymentInfo.icon

    const amountInWords = (amount: number) => {
        if (!amount) return "Zero Shillings Only"
        try {
            return amountToWordsUGX(amount)
        } catch (e) {
            return "Amount in Words - Error"
        }
    }

    return (
        <div
            className="receipt-document bg-white mx-auto printable-area"
            id={id || "receipt-content"}
            style={{
                width: "200mm",
                height: "138mm",
                padding: "10mm",
                boxSizing: "border-box",
                backgroundColor: "white",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                fontFamily: "'Inter', system-ui, sans-serif",
                color: "#1e293b",
                overflow: "hidden",
                border: "none",
                boxShadow: "none"
            }}
        >

            {/* HEADER SECTION */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3mm" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {logoPath ? (
                        <img 
                            src={fileActions.getUrl(logoPath)} 
                            style={{ width: "52px", height: "52px", objectFit: "contain" }} 
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
                        width: "52px", height: "52px", 
                        background: "#f0fdf4", 
                        borderRadius: "10px", 
                        display: logoPath ? "none" : "flex", 
                        alignItems: "center", justifyContent: "center" 
                    }}>
                        <School className="w-7 h-7 text-emerald-600" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: "16px", fontWeight: 800, margin: 0, textTransform: "uppercase", color: "#065f46" }}>
                            {schoolProfile?.name || "SCHOOL NEXUS PRIMARY"}
                        </h1>
                        <p style={{ fontSize: "9px", color: "#64748b", margin: "1px 0", fontWeight: 500 }}>
                            {schoolProfile?.address || " Kampala, Uganda"} | {schoolProfile?.phone || "+256 000 000"}
                        </p>
                        <p style={{ fontSize: "8px", fontStyle: "italic", color: "#059669", margin: 0 }}>
                            "{schoolProfile?.motto || "Success Through Learning"}"
                        </p>
                    </div>
                </div>

                <div style={{ textAlign: "right" }}>
                    <div style={{ 
                        display: "inline-block", 
                        padding: "2mm 4mm", 
                        background: "#065f46", 
                        color: "white", 
                        borderRadius: "6px",
                        marginBottom: "1mm"
                    }}>
                        <div style={{ fontSize: "12px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px" }}>Official Receipt</div>
                    </div>
                    <div style={{ fontSize: "10px", fontWeight: 800, color: "#374151" }}>NO: {receipt?.receiptNumber || "RCP-001"}</div>
                    <div style={{ fontSize: "9px", color: "#6b7280", marginTop: "2px" }}>Date: {receipt?.date ? new Date(receipt.date).toLocaleDateString() : "N/A"}</div>
                </div>
            </div>

            {/* WATERMARK */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-15deg)", fontSize: "60px", fontWeight: 900, color: "#f0fdf4", zIndex: 0, opacity: 0.5, pointerEvents: "none" }}>
                PAID
            </div>

            {/* INFO GRID */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "4mm", marginBottom: "3mm", position: "relative", zIndex: 1 }}>
                {/* Received From */}
                <div style={{ border: "0.5px solid #e5e7eb", borderRadius: "8px", padding: "3mm" }}>
                    <h2 style={{ fontSize: "8.5px", fontWeight: 800, textTransform: "uppercase", color: "#64748b", marginBottom: "2mm" }}>Received From:</h2>
                    <div style={{ fontSize: "12px", fontWeight: 800, color: "#111827", marginBottom: "1mm" }}>{receipt?.studentName || "Student Name"}</div>
                    <div style={{ display: "flex", gap: "6mm" }}>
                        <div style={{ fontSize: "9.5px", color: "#4b5563" }}>ADM No: <span style={{ fontWeight: 700 }}>{receipt?.studentAdmNo || "N/A"}</span></div>
                        <div style={{ fontSize: "9.5px", color: "#4b5563" }}>Class: <span style={{ fontWeight: 700 }}>{receipt?.className || "N/A"}</span></div>
                    </div>
                    <div style={{ fontSize: "9px", color: "#4b5563", marginTop: "1mm", borderTop: "0.5px dashed #e5e7eb", paddingTop: "1mm" }}>
                        Guardian: <span style={{ fontWeight: 600 }}>{receipt?.guardianName || receipt?.paidBy || "N/A"}</span>
                    </div>
                </div>

                {/* Academic Context */}
                <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: "3mm" }}>
                    <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "2mm", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <span style={{ fontSize: "8px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Academic Year</span>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "#065f46" }}>{receipt?.academicYearName || "2024"}</span>
                    </div>
                    <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "2mm", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                        <span style={{ fontSize: "8px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Term</span>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: "#065f46" }}>{receipt?.termName || "Term One"}</span>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div style={{ position: "relative", zIndex: 1 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left", padding: "2mm 3mm", fontSize: "9.5px", fontWeight: 800, borderBottom: "1.5px solid #065f46", color: "#065f46" }}>Description of Payment</th>
                            <th style={{ textAlign: "right", padding: "2mm 3mm", fontSize: "9.5px", fontWeight: 800, borderBottom: "1.5px solid #065f46", color: "#065f46" }}>Amount (UGX)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: "3mm" }}>
                                <div style={{ fontSize: "10px", fontWeight: 700 }}>School Fees Installment</div>
                                <div style={{ fontSize: "8px", color: "#64748b", marginTop: "0.5mm" }}>Payment Method: <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{receipt?.paymentMethod || "Cash"}</span> | Ref: {receipt?.reference || "N/A"}</div>
                            </td>
                            <td style={{ padding: "3mm", textAlign: "right", fontSize: "13px", fontWeight: 900, color: "#065f46" }}>
                                {formatCurrency(receipt?.amount)}
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div style={{ 
                    marginTop: "2mm", 
                    padding: "2mm", 
                    background: "#ecfdf5", 
                    borderRadius: "6px", 
                    border: "0.5px solid #d1fae5",
                    fontSize: "8.5px",
                    color: "#065f46",
                    display: "flex",
                    gap: "4px"
                }}>
                    <strong style={{ fontWeight: 900 }}>AMOUNT IN WORDS:</strong> 
                    <span style={{ textTransform: "uppercase", fontWeight: 700 }}>{amountInWords(receipt?.amount)}</span>
                </div>
            </div>

            {/* SIGNATURES */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10mm", marginTop: "3mm", alignItems: "flex-end", position: "relative", zIndex: 1 }}>
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span style={{ fontSize: "11px", fontWeight: 900, fontStyle: "italic", color: "#059669", letterSpacing: "1px" }}>VERIFIED PAYMENT</span>
                    </div>
                    <div style={{ fontSize: "7.5px", color: "#64748b" }}>
                        Notes: {receipt?.notes || "Thank you for your payment."}
                    </div>
                </div>
                <div style={{ textAlign: "center" }}>
                    <div style={{ borderTop: "1px solid #1e293b", width: "45mm", marginLeft: "auto", paddingTop: "1.5mm" }}>
                        <div style={{ fontSize: "9px", fontWeight: 800, color: "#1e293b" }}>CASHIER'S SIGNATURE</div>
                        <div style={{ fontSize: "6.5px", color: "#94a3b8", marginTop: "0.5mm" }}>Printed: {new Date().toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Footer Line */}
            <div style={{ 
                marginTop: "3mm", 
                textAlign: "center", 
                fontSize: "7px", 
                color: "#9ca3af",
                borderTop: "0.5px solid #f3f4f6",
                paddingTop: "1.5mm"
            }}>
                THIS IS A SYSTEM GENERATED RECEIPT. VALID ONLY WHEN STAMPED. SCHOOL NEXUS MS
            </div>
        </div>
    )
}
