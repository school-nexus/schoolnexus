export const runtime = 'edge';
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { School, CheckCircle2, ShieldCheck, BookOpen, Clock, Users, Database } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitSuccess, setSubmitSuccess] = useState(false)

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        // Simulate API call for requesting the system
        setTimeout(() => {
            setIsSubmitting(false)
            setSubmitSuccess(true)
        }, 1500)
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-200">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 flex items-center justify-center overflow-hidden">
                                <img src="/logo.png" alt="School Nexus Logo" className="h-full w-full object-contain" />
                            </div>
                            <span className="font-extrabold text-xl tracking-tight text-emerald-950">School Nexus</span>
                        </div>
                        <div className="hidden md:flex space-x-8">
                            <a href="#features" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">Features</a>
                            <a href="#plans" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">Plans</a>
                            <a href="#contact" className="text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors">Request Access</a>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href="/school-login">
                                <Button variant="ghost" className="hidden sm:flex text-emerald-700 font-bold hover:bg-emerald-50">
                                    School Login
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 rounded-full px-6">
                                    Admin Login
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-950 -z-10" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay -z-10"></div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-8 drop-shadow-sm">
                        The Operating System for <br className="hidden md:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">Modern Schools</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-emerald-50/80 mb-10 leading-relaxed font-medium">
                        School Nexus centralizes your institution's operations, empowers educators, and provides an unparalleled experience for administrators, teachers, and students.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                        <a href="#contact">
                            <Button className="h-14 px-8 rounded-full bg-white text-emerald-900 font-black text-lg hover:bg-slate-100 transition-all hover:scale-105 shadow-2xl flex items-center gap-2">
                                Request System Setup
                            </Button>
                        </a>
                        <Link href="/school-login">
                            <Button className="h-14 px-8 rounded-full bg-emerald-800/40 text-white font-black text-lg hover:bg-emerald-800/60 transition-all backdrop-blur-sm border border-emerald-500/30">
                                Access Your School
                            </Button>
                        </Link>
                    </div>
                </div>
                
                {/* Dashboard Preview Graphic */}
                <div className="max-w-5xl mx-auto mt-20 px-4 relative z-10">
                    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden aspect-video relative flex items-center justify-center group transform transition-transform hover:scale-[1.01] duration-500">
                        {/* Fake Dashboard UI elements for visual representation */}
                        <div className="absolute top-0 left-0 w-full h-12 bg-white/10 border-b border-white/5 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <div className="grid grid-cols-4 gap-4 p-8 w-full h-full mt-12 opacity-80">
                            <div className="col-span-1 border border-white/10 rounded-xl bg-white/5 p-4 flex flex-col gap-4">
                                <div className="h-6 w-3/4 bg-white/10 rounded-md"></div>
                                <div className="h-4 w-1/2 bg-white/5 rounded-md"></div>
                                <div className="h-4 w-2/3 bg-white/5 rounded-md"></div>
                                <div className="h-4 w-1/3 bg-white/5 rounded-md"></div>
                            </div>
                            <div className="col-span-3 grid grid-rows-3 gap-4">
                                <div className="row-span-1 grid grid-cols-3 gap-4">
                                    <div className="border border-white/10 rounded-xl bg-white/5 p-4"></div>
                                    <div className="border border-white/10 rounded-xl bg-white/5 p-4"></div>
                                    <div className="border border-white/10 rounded-xl bg-emerald-500/20 p-4"></div>
                                </div>
                                <div className="row-span-2 border border-white/10 rounded-xl bg-white/5 p-6 place-content-center text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <School className="w-16 h-16 text-emerald-300" />
                                        <p className="text-emerald-100 font-bold tracking-widest uppercase">Admin Dashboard Preview</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">Everything you need to run your school</h2>
                        <p className="mt-4 text-lg text-slate-500 font-medium">Built specifically to handle the complexities of modern educational institutions.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: Users, title: "Student Management", desc: "Track attendance, performance, and easily communicate with guardians." },
                            { icon: BookOpen, title: "Curriculum Engine", desc: "Plan lessons, manage subjects, and grade exams with intuitive tools." },
                            { icon: ShieldCheck, title: "Secure Data", desc: "Enterprise-grade security ensuring student records are always protected." },
                            { icon: CheckCircle2, title: "Automated Workflows", desc: "Reduce administrative burden by automating repetitive daily tasks." },
                            { icon: Database, title: "Financial Hub", desc: "Manage fee collections, payroll, and generate comprehensive financial reports." },
                            { icon: Clock, title: "Real-time Analytics", desc: "Instant insights into school performance metrics right from your dashboard." }
                        ].map((feature, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/30 transition-colors group cursor-pointer">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed text-sm font-medium">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing / Plans Section */}
            <section id="plans" className="py-24 bg-slate-50 border-t border-slate-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
                        <p className="mt-4 text-lg text-slate-500 font-medium">Choose a plan that scales with your institution's size and needs.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {[
                            { name: "Basic", price: "$99", period: "/mo", target: "For small primary schools", features: ["Up to 500 Students", "Basic Reporting", "Email Support", "Community Forum"] },
                            { name: "Professional", price: "$249", period: "/mo", target: "For growing institutions", popular: true, features: ["Up to 2000 Students", "Advanced Analytics", "Priority Support", "Custom Branding", "SMS Integrations"] },
                            { name: "Enterprise", price: "Custom", period: "", target: "For large school districts", features: ["Unlimited Students", "Dedicated Account Manager", "Custom Integrations", "On-premise Deployment Options", "SLA Guarantee"] }
                        ].map((plan, i) => (
                            <div key={i} className={`relative p-8 rounded-[2rem] border ${plan.popular ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-105 z-10' : 'bg-white border-slate-200'}`}>
                                {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">Most Popular</div>}
                                <div className="mb-6">
                                    <h3 className={`text-2xl font-black ${plan.popular ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                                    <p className={`text-sm font-medium mt-2 ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>{plan.target}</p>
                                </div>
                                <div className="mb-8 flex items-baseline text-5xl font-black">
                                    {plan.price}<span className={`text-lg font-medium ml-1 ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>{plan.period}</span>
                                </div>
                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, j) => (
                                        <li key={j} className="flex items-center gap-3">
                                            <CheckCircle2 className={`w-5 h-5 ${plan.popular ? 'text-emerald-400' : 'text-emerald-500'}`} />
                                            <span className={`text-sm font-medium ${plan.popular ? 'text-slate-300' : 'text-slate-600'}`}>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <a href="#contact">
                                    <Button className={`w-full py-6 rounded-xl font-bold ${plan.popular ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'}`}>
                                        Request This Plan
                                    </Button>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Request Access / Contact Form */}
            <section id="contact" className="py-24 bg-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-emerald-50 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-teal-50 rounded-full blur-3xl opacity-50"></div>
                
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-12">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Request System Access</h2>
                            <p className="mt-3 text-slate-500 font-medium">Fill out your school details below. Our administrators will review and set up your tailored workspace.</p>
                        </div>

                        {submitSuccess ? (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-10 text-center animate-in fade-in zoom-in duration-300">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">Request Received!</h3>
                                <p className="text-slate-600 font-medium max-w-sm mx-auto">
                                    Thank you! Our system administrators will review your request and contact you shortly with your setup instructions and login credentials.
                                </p>
                                <Button 
                                    className="mt-8 bg-slate-900 hidden text-white" 
                                    onClick={() => setSubmitSuccess(false)}
                                >
                                    Submit Another Request
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleContactSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="schoolName" className="font-bold text-slate-700">School Name *</Label>
                                        <Input id="schoolName" required className="h-12 bg-slate-50" placeholder="e.g. Green Valley High" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="adminName" className="font-bold text-slate-700">Admin/Contact Name *</Label>
                                        <Input id="adminName" required className="h-12 bg-slate-50" placeholder="John Doe" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="font-bold text-slate-700">Work Email *</Label>
                                        <Input id="email" type="email" required className="h-12 bg-slate-50" placeholder="admin@school.edu" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="font-bold text-slate-700">Phone Number</Label>
                                        <Input id="phone" type="tel" className="h-12 bg-slate-50" placeholder="+1 (555) 000-0000" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="plan" className="font-bold text-slate-700">Interested Plan *</Label>
                                    <select id="plan" required className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-slate-50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                        <option value="">Select a plan</option>
                                        <option value="basic">Basic ($99/mo)</option>
                                        <option value="professional">Professional ($249/mo)</option>
                                        <option value="enterprise">Enterprise (Custom)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="message" className="font-bold text-slate-700">Additional Requirements or Message</Label>
                                    <textarea 
                                        id="message" 
                                        className="flex min-h-[120px] w-full rounded-md border border-input bg-slate-50 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" 
                                        placeholder="Tell us about specific features you need..."
                                    ></textarea>
                                </div>
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting} 
                                    className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-500/20"
                                >
                                    {isSubmitting ? "Submitting Request..." : "Submit System Request"}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 py-12 border-t border-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 mb-6 opacity-80">
                        <img src="/logo.png" alt="Logo" className="w-6 h-6 grayscale opacity-60" />
                        <span className="text-slate-400 font-bold tracking-widest text-sm uppercase">School Nexus</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">
                        &copy; {new Date().getFullYear()} School Nexus MS. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
