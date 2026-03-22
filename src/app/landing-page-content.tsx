"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
    BookOpen, 
    CheckCircle2, 
    Clock, 
    Database, 
    School, 
    ShieldCheck, 
    Users, 
    ArrowRight, 
    Sparkles, 
    Smartphone, 
    Globe,
    ChevronRight,
    PlayCircle
} from 'lucide-react';
import Link from "next/link"

export default function LandingPageContent() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setTimeout(() => {
            setIsSubmitting(false)
            setSubmitSuccess(true)
        }, 1500)
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-200">
            {/* Global Gradient Background */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-emerald-50/50 via-white to-white -z-20" />
            
            {/* Navigation */}
            <nav className="fixed w-full z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-4">
                    <div className="glass rounded-2xl flex justify-between items-center h-16 px-6 shadow-sm border-white/40">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                                <School className="text-white w-5 h-5" />
                            </div>
                            <span className="font-black text-xl tracking-tight text-slate-900">SchoolNexus</span>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">Features</a>
                            <a href="#plans" className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">Pricing</a>
                            <a href="#contact" className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">Contact</a>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/login">
                                <Button variant="ghost" className="text-slate-600 font-bold hover:bg-white/50">
                                    Admin Login
                                </Button>
                            </Link>
                            <Link href="/school-login">
                                <Button className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-5 h-10 shadow-lg shadow-slate-200 transition-all hover:scale-105 active:scale-95">
                                    School Login
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 lg:pt-56 lg:pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="text-left space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-black uppercase tracking-widest animate-fade-in">
                                <Sparkles className="w-3 h-3" /> The Multi-Tenant OS for Education
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]">
                                Empower Your <span className="text-gradient">Institution</span> with Nexus
                            </h1>
                            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-xl">
                                A premium, unified platform designed to streamline administration, automate academics, and elevate the standard of learning across your entire school network.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <a href="#contact">
                                    <Button className="h-14 px-8 rounded-2xl bg-emerald-600 text-white font-black text-lg hover:bg-emerald-700 transition-all hover:scale-105 shadow-xl shadow-emerald-200 flex items-center gap-2">
                                        Get Started <ArrowRight className="w-5 h-5" />
                                    </Button>
                                </a>
                                <Button variant="ghost" className="h-14 px-8 rounded-2xl text-slate-600 font-black text-lg hover:bg-slate-50 flex items-center gap-2">
                                    <PlayCircle className="w-6 h-6 text-emerald-600" /> Watch Demo
                                </Button>
                            </div>
                            <div className="flex items-center gap-8 pt-4">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="user" />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Trusted by 50+ Modern Schools</p>
                            </div>
                        </div>
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-100 to-teal-100 rounded-[3rem] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity" />
                            <div className="relative rounded-[2.5rem] overflow-hidden border border-white shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]">
                                <img src="/assets/landing_hero.png" alt="School Nexus Hero" className="w-full h-auto object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                                <div className="absolute bottom-8 left-8 right-8 p-6 glass rounded-2xl border-white/20">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-white font-black text-xl mb-1">Modern Administration</p>
                                            <p className="text-white/80 text-sm font-medium">Simplify complex workflows in seconds.</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                            <ShieldCheck className="text-white w-6 h-6" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Spotlight */}
            <section id="features" className="py-32 bg-slate-950 text-white relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
                
                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-24">
                        <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Built for Enterprise Education</h2>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed">Everything you need to orchestrate institutional excellence, from student lifecycle management to complex financial analytics.</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-24 items-center mb-32">
                        <div className="order-2 lg:order-1 relative">
                            <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/5">
                                <img src="/assets/student_dashboard.png" alt="Student Management" className="w-full h-auto" />
                            </div>
                        </div>
                        <div className="order-1 lg:order-2 space-y-8">
                            <h3 className="text-3xl font-black">Student Lifecycle & Achievement</h3>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed">
                                Track every dimension of the student experience. From admission to graduation, monitor attendance, academic performance, and behavior with precision.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Dynamic Academic Reporting",
                                    "Real-time Attendance Tracking",
                                    "Automated Grading Engine",
                                    "Parent Portal & Communication"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300 font-bold uppercase text-xs tracking-widest">
                                        <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <ChevronRight className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-24 items-center">
                        <div className="space-y-8">
                            <h3 className="text-3xl font-black text-emerald-400">Financial Intelligence Hub</h3>
                            <p className="text-slate-400 text-lg font-medium leading-relaxed">
                                Transform your school's treasury management.nexus provides institutional-grade tools for fee collection, payroll, and auditing.
                            </p>
                            <ul className="space-y-4">
                                {[
                                    "Smart Fee Collection & Invoicing",
                                    "Automated Staff Payroll",
                                    "Expended & Budget Tracking",
                                    "Comprehensive Financial Audits"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300 font-bold uppercase text-xs tracking-widest">
                                        <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                            <ChevronRight className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-slate-900/50 backdrop-blur-3xl">
                                <img src="/assets/finance_analytics.png" alt="Finance Analytics" className="w-full h-auto" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="plans" className="py-32 bg-white relative">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <span className="text-emerald-600 font-black uppercase tracking-widest text-xs">Flexible Models</span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mt-4 tracking-tight">Institutional Pricing</h2>
                        <p className="mt-4 text-slate-500 font-medium text-lg max-w-2xl mx-auto">Scalable plans tailored for primary schools, secondary institutions, and higher learning centers.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            { name: "Basic", price: "500,000", period: "/term", target: "For small primary schools", features: ["Up to 300 Students", "Student Registry", "Basic Attendance", "Term reports"] },
                            { name: "Professional", price: "1,200,000", period: "/term", target: "For growing secondary schools", popular: true, features: ["Up to 1000 Students", "Financial Management", "Bulk SMS Notifications", "Advanced Analytics", "Parent App Access"] },
                            { name: "Enterprise", price: "Custom", period: "", target: "For large school networks", features: ["Unlimited Students", "Multi-Campus Sync", "Custom Integrations", "Dedicated Account Manager", "White-label Support"] }
                        ].map((plan, i) => (
                            <div key={i} className={`relative p-10 rounded-[2.5rem] border ${plan.popular ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-105 z-10' : 'bg-slate-50 border-slate-100 shadow-sm'}`}>
                                {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Best Value</div>}
                                <div className="mb-8">
                                    <h3 className={`text-2xl font-black ${plan.popular ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                                    <p className={`text-sm font-bold mt-2 uppercase tracking-wide opacity-60`}>{plan.target}</p>
                                </div>
                                <div className="mb-10 flex items-baseline gap-1">
                                    {plan.price !== 'Custom' && <span className="text-lg font-black opacity-50">UGX</span>}
                                    <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                                    <span className={`text-sm font-bold opacity-60 ml-1`}>{plan.period}</span>
                                </div>
                                <ul className="space-y-4 mb-10">
                                    {plan.features.map((feature, j) => (
                                        <li key={j} className="flex items-center gap-3">
                                            <CheckCircle2 className={`w-5 h-5 ${plan.popular ? 'text-emerald-400' : 'text-emerald-500'}`} />
                                            <span className={`text-sm font-bold opacity-80`}>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <a href="#contact">
                                    <Button className={`w-full h-14 rounded-2xl font-black text-lg transition-all ${plan.popular ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-white hover:bg-slate-100 text-slate-900 border border-slate-200'}`}>
                                        Request Setup
                                    </Button>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Request Access / Contact Form */}
            <section id="contact" className="py-32 bg-slate-50 relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-6 lg:px-8 relative z-10">
                    <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-8 sm:p-16">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Expand Your Network</h2>
                            <p className="mt-4 text-slate-500 font-medium">Join the growing ecosystem of high-performance schools using Nexus.</p>
                        </div>

                        {submitSuccess ? (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-12 text-center animate-in fade-in zoom-in duration-300">
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 mb-4">Request Transmitted!</h3>
                                <p className="text-slate-600 font-bold max-w-sm mx-auto opacity-70">
                                    Our platform administrators have been notified. We will process your institutional credentials shortly.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleContactSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <Label htmlFor="schoolName" className="font-black text-slate-900 uppercase text-xs tracking-widest">School Name</Label>
                                        <Input id="schoolName" required className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-emerald-500 px-6 font-bold" placeholder="Green Valley High" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="adminName" className="font-black text-slate-900 uppercase text-xs tracking-widest">Admin Contact</Label>
                                        <Input id="adminName" required className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-emerald-500 px-6 font-bold" placeholder="John Doe" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <Label htmlFor="email" className="font-black text-slate-900 uppercase text-xs tracking-widest">Professional Email</Label>
                                        <Input id="email" type="email" required className="h-14 bg-slate-50 border-slate-100 rounded-2xl focus:ring-emerald-500 px-6 font-bold" placeholder="admin@school.edu" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="plan" className="font-black text-slate-900 uppercase text-xs tracking-widest">Tier of Interest</Label>
                                        <select id="plan" required className="flex h-14 w-full items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-6 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                            <option value="">Select Plan</option>
                                            <option value="basic">Basic (UGX 500k)</option>
                                            <option value="professional">Professional (UGX 1.2M)</option>
                                            <option value="enterprise">Enterprise (Custom)</option>
                                        </select>
                                    </div>
                                </div>
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting} 
                                    className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xl rounded-2xl shadow-xl shadow-emerald-500/20 transform transition-all active:scale-[0.98]"
                                >
                                    {isSubmitting ? "Processing..." : "Submit System Request"}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white py-16 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center">
                            <School className="text-white w-5 h-5" />
                        </div>
                        <span className="font-black text-lg tracking-wider text-slate-900 uppercase">SchoolNexus</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 mb-12">
                        <a href="#" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">About</a>
                        <a href="#" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Status</a>
                        <a href="#" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Privacy</a>
                        <a href="#" className="text-sm font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest">Logistics</a>
                    </div>
                    <p className="text-slate-300 text-xs font-black uppercase tracking-[0.2em]">
                        &copy; {new Date().getFullYear()} School Nexus MS • The Operating System for Modern Schools
                    </p>
                </div>
            </footer>
        </div>
    )
}
