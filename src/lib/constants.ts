import { Banknote, CreditCard, Smartphone } from "lucide-react"
import React from "react"

export const PAYMENT_METHODS = {
    CASH: {
        id: 'cash',
        label: 'Cash',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        icon: Banknote
    },
    BANK_TRANSFER: {
        id: 'bank_transfer',
        label: 'Bank Transfer',
        color: 'bg-blue-50 text-blue-700 border-blue-100',
        icon: CreditCard
    },
    MOBILE_MONEY: {
        id: 'mobile_money',
        label: 'Mobile Money',
        color: 'bg-teal-50 text-teal-700 border-teal-100',
        icon: Smartphone
    },
    CARD: {
        id: 'card',
        label: 'Card',
        color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
        icon: CreditCard
    }
}

export const getPaymentMethodInfo = (method: string) => {
    const m = method?.toLowerCase().replace(/\\s+/g, '_')
    switch (m) {
        case 'cash': return PAYMENT_METHODS.CASH
        case 'bank_transfer':
        case 'bank': return PAYMENT_METHODS.BANK_TRANSFER
        case 'mobile_money':
        case 'mobile': return PAYMENT_METHODS.MOBILE_MONEY
        case 'card': return PAYMENT_METHODS.CARD
        default: return {
            id: m || 'unknown',
            label: method || 'Unknown',
            color: 'bg-slate-50 text-slate-700 border-slate-100',
            icon: Banknote
        }
    }
}
