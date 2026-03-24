'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from 'lucide-react';

interface LoginClientProps {
    mode: 'electron' | 'web-platform' | 'web-school';
    schoolId?: number;
    schoolSlug?: string;
    schoolName?: string;
}

export function LoginClient({ mode, schoolId, schoolSlug, schoolName }: LoginClientProps) {
    const { login, isLoading: authLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const isPlatform = mode === 'web-platform' || mode === 'electron';

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            await login(email, password, schoolId);
            // Redirection is handled in AuthContext.tsx
        } catch (error: any) {
            // Error is already logged/toasted in AuthContext
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md border-0 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-emerald-950 text-white p-8 text-center">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                        <ShieldCheck className="w-8 h-8 text-emerald-400" />
                    </div>
                    <CardTitle className="text-2xl font-black">{isPlatform ? 'Platform Admin' : (schoolName || 'School Portal')}</CardTitle>
                    <CardDescription className="text-emerald-200/60 font-medium">
                        {isPlatform ? 'System Management Access' : `Login to ${schoolSlug || 'your school'}`}
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
                            disabled={authLoading}
                            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all"
                        >
                            {authLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Sign In'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
