'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from "sonner";

interface SetupWizardClientProps {
    isPlatform: boolean;
    schoolSlug?: string;
}

export function SetupWizardClient({ isPlatform, schoolSlug }: SetupWizardClientProps) {
    console.log("[Setup Wizard Client] Rendering:", { isPlatform, schoolSlug });
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleComplete = async () => {
        setLoading(true);
        try {
            // Simplified setup completion via RPC
            const response = await fetch('/api/rpc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-school-slug': schoolSlug || 'platform' },
                body: JSON.stringify({
                    channel: 'complete-setup',
                    args: [isPlatform ? 1 : 0] // Dummy IDs for demo
                })
            });

            if (response.ok) {
                toast.success("Setup Completed Successfully");
                router.push(isPlatform ? "/super-admin" : `/${schoolSlug}`);
            } else {
                toast.error("Failed to save setup. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#014737] flex items-center justify-center p-4 overflow-y-auto">
            <Card className="w-full max-w-2xl border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/95 backdrop-blur-xl">
                <CardHeader className="bg-emerald-950 text-white p-12 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse" />
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                        <Sparkles className="w-10 h-10 text-emerald-400" />
                    </div>
                    <CardTitle className="text-4xl font-black tracking-tight mb-2">Welcome to School Nexus</CardTitle>
                    <CardDescription className="text-emerald-200/60 text-lg font-medium italic">
                        Let's get your {isPlatform ? 'Platform' : 'School'} ready for operation.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-12">
                    <div className="flex justify-between mb-12 relative px-4">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0" />
                        {[1, 2, 3].map((s) => (
                            <div key={s} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-black transition-all duration-500 ${s <= step ? 'bg-emerald-600 text-white shadow-lg scale-110' : 'bg-slate-200 text-slate-500'}`}>
                                {s < step ? <CheckCircle2 className="w-6 h-6" /> : s}
                            </div>
                        ))}
                    </div>

                    <div className="min-h-[200px] flex flex-col justify-center text-center space-y-4">
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4">
                                <h3 className="text-2xl font-black text-slate-900 mb-2">Institutional Profile</h3>
                                <p className="text-slate-500 font-medium">Verify your basic information and branding settings.</p>
                            </div>
                        )}
                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4">
                                <h3 className="text-2xl font-black text-slate-900 mb-2">Regional Configuration</h3>
                                <p className="text-slate-500 font-medium">Set your timezone, currency, and academic calendar.</p>
                            </div>
                        )}
                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-bottom-4">
                                <h3 className="text-2xl font-black text-slate-900 mb-2">Ready to Launch</h3>
                                <p className="text-slate-500 font-medium">Everything is set! Click below to enter your dashboard.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 flex gap-4">
                        {step > 1 && (
                            <Button variant="ghost" onClick={() => setStep(step - 1)} className="flex-1 h-14 rounded-2xl font-bold text-slate-500">Back</Button>
                        )}
                        <Button 
                            onClick={step === 3 ? handleComplete : () => setStep(step + 1)}
                            disabled={loading}
                            className="flex-[2] h-14 bg-emerald-950 hover:bg-black text-white font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 group"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>
                                {step === 3 ? 'Finish Setup' : 'Continue'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
