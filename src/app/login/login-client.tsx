'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from 'lucide-react';
import { toast } from "sonner";

interface LoginClientProps {
    isPlatform: boolean;
    schoolSlug?: string;
}

export function LoginClient({ isPlatform, schoolSlug }: LoginClientProps) {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // Simplified login logic for demo/optimization phase
            if (email === "admin@schoolnexus.com" && password === "admin123") {
                toast.success("Login Successful");
                router.push(isPlatform ? "/super-admin" : `/${schoolSlug}`);
            } else {
                toast.error("Invalid credentials (Demo: admin@schoolnexus.com / admin123)");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-emerald-950 text-white p-8 text-center">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                        <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    </div>
                    <CardTitle className="text-2xl font-black">{isPlatform ? 'Platform Admin' : 'School Portal'}</CardTitle>
                    <CardDescription className="text-emerald-200/60 font-medium">
                        {isPlatform ? 'System Management Access' : `Login to ${schoolSlug}`}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                            <Input 
                                type="email"
                                placeholder="name@example.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 border-slate-200 rounded-xl focus:ring-emerald-500 font-medium"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                            <Input 
                                type="password"
                                placeholder="••••••••" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 border-slate-200 rounded-xl focus:ring-emerald-500 font-medium"
                                required
                            />
                        </div>
                        <Button 
                            disabled={loading}
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
