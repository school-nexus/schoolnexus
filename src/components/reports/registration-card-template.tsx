import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Calendar, MapPin, Phone, Mail, Award, User, Fingerprint } from "lucide-react";

interface RegistrationCardProps {
    student: any;
    schoolProfile: any;
}

export function RegistrationCardTemplate({ student, schoolProfile }: RegistrationCardProps) {
    if (!student) return null;

    return (
        <div className="w-[850px] h-[540px] bg-white text-slate-900 border-[12px] border-slate-900 mx-auto relative overflow-hidden flex-shrink-0 shadow-2xl" id="registration-card-container">
            {/* Elegant Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: `radial-gradient(#0f172a 2px, transparent 2px)`, backgroundSize: '32px 32px' }} />

            {/* Background Watermark Logo */}
            {schoolProfile?.logo && (
                <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none flex items-center justify-center bg-no-repeat bg-center"
                    style={{ backgroundImage: `url(${schoolProfile.logo})`, backgroundSize: '50%' }}
                />
            )}

            <div className="p-10 h-full flex flex-col relative z-10">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-6 border-b-4 border-emerald-500 pb-6">
                    <div className="flex items-center gap-6">
                        {schoolProfile?.logo ? (
                            <div className="p-1 bg-white rounded-xl shadow-lg ring-1 ring-slate-200">
                                <img src={schoolProfile.logo} alt="School Logo" className="w-24 h-24 object-contain" />
                            </div>
                        ) : (
                            <div className="w-24 h-24 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-300 ring-1 ring-slate-200">LOGO</div>
                        )}
                        <div>
                            <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tighter leading-none mb-2">
                                {schoolProfile?.name || 'School Name'}
                            </h1>
                            <div className="space-y-1">
                                <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wide">
                                    <MapPin className="h-3 w-3 text-emerald-500" /> {schoolProfile?.address || 'School Address'}
                                </p>
                                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-3 uppercase tracking-widest">
                                    <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5 text-emerald-500" /> {schoolProfile?.phone || 'Phone'}</span>
                                    <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5 text-emerald-500" /> {schoolProfile?.email || 'Email'}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Official Document Label */}
                    <div className="text-right">
                        <div className="bg-slate-900 text-white px-4 py-2 rounded-lg mb-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]">Official Record</p>
                            <p className="text-lg font-black leading-none">REG-ST-2024</p>
                        </div>
                        <Badge variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 font-bold px-3">
                            ORIGINAL DOCUMENT
                        </Badge>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="flex-1 grid grid-cols-12 gap-10">
                    {/* Left Panel: Photo & Security */}
                    <div className="col-span-4 flex flex-col items-center">
                        <div className="relative group">
                            <div className="w-44 h-44 bg-slate-100 border-4 border-white rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-200 relative z-10">
                                {student?.photo ? (
                                    <img src={student.photo} alt="Student" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50">
                                        <User className="w-16 h-16 text-slate-200" />
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">No Photo</span>
                                    </div>
                                )}
                            </div>
                            {/* Decorative Corner */}
                            <div className="absolute -bottom-3 -right-3 w-20 h-20 bg-emerald-500 rounded-2xl -z-0 opacity-20 blur-xl" />
                        </div>

                        <div className="w-full mt-8 space-y-3">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
                                <div className="absolute right-0 top-0 h-full w-1 bg-emerald-500 scale-y-0 group-hover:scale-y-100 transition-transform" />
                                <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest mb-1 flex items-center gap-1">
                                    <Fingerprint className="h-3 w-3" /> System Identity
                                </p>
                                <p className="font-mono font-black text-base text-slate-900">{String(student.id).padStart(6, '0')}</p>
                            </div>
                            <div className="bg-slate-900 p-3 rounded-xl shadow-lg relative overflow-hidden group">
                                <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <p className="text-[9px] uppercase font-black text-emerald-400 tracking-widest mb-1">Admission Number</p>
                                <p className="font-mono font-black text-lg text-white">{student.admissionNumber || 'PENDING'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Student Data */}
                    <div className="col-span-8 space-y-6">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">Student Full Name</label>
                                <p className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                                    {student.firstName} {student.lastName}
                                </p>
                            </div>
                            <div className="text-right">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1.5">Classification</label>
                                <div className="flex flex-col items-end gap-1">
                                    <p className="text-xl font-black text-slate-900 uppercase">{student.class?.name || '---'}</p>
                                    {student.stream?.name && (
                                        <Badge className="bg-emerald-600 text-white border-none font-bold px-3">
                                            Stream: {student.stream.name}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                            <div>
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Gender</label>
                                <p className="font-bold text-slate-800 uppercase text-sm">{student.gender || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Date of Birth</label>
                                <p className="font-bold text-slate-800 text-sm italic">
                                    <Calendar className="h-3 w-3 inline mr-1 text-emerald-500" />
                                    {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block mb-1">Entry Date</label>
                                <p className="font-bold text-slate-800 text-sm">
                                    {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-emerald-50 p-5 rounded-2xl border-2 border-emerald-100/50 mt-6 relative overflow-hidden shadow-inner">
                            <div className="absolute top-0 right-0 p-2 opacity-10">
                                <ShieldCheck className="h-16 w-16 text-emerald-600" />
                            </div>
                            <div className="relative z-10 flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1">Account Standing</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <p className="font-black text-emerald-900 uppercase text-lg italic">Active Scholar</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Academic Year</p>
                                    <p className="font-black text-slate-900 text-base">{new Date().getFullYear()} Session</p>
                                </div>
                            </div>
                        </div>

                        {/* Security QR Code Area */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white rounded-lg border-2 border-slate-900 shadow-md">
                                    {/* Mock QR Code */}
                                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 3H9V9H3V3ZM5 5V7H7V5H5Z" fill="black" />
                                        <path d="M15 3H21V9H15V3ZM17 5V7H19V5H17Z" fill="black" />
                                        <path d="M3 15H9V21H3V15ZM5 17V19H7V17H5Z" fill="black" />
                                        <path d="M15 15H17V17H15V15Z" fill="black" />
                                        <path d="M19 15H21V17H19V15Z" fill="black" />
                                        <path d="M17 17H19V19H17V17Z" fill="black" />
                                        <path d="M15 19H17V21H15V19Z" fill="black" />
                                        <path d="M19 19H21V21H19V19Z" fill="black" />
                                        <rect x="10" y="3" width="2" height="2" fill="black" />
                                        <rect x="12" y="5" width="2" height="2" fill="black" />
                                        <rect x="10" y="7" width="2" height="2" fill="black" />
                                        <rect x="12" y="10" width="2" height="2" fill="black" />
                                        <rect x="10" y="12" width="2" height="2" fill="black" />
                                        <rect x="12" y="15" width="2" height="2" fill="black" />
                                        <rect x="10" y="17" width="2" height="2" fill="black" />
                                        <rect x="12" y="19" width="2" height="2" fill="black" />
                                        <rect x="3" y="10" width="2" height="2" fill="black" />
                                        <rect x="5" y="12" width="2" height="2" fill="black" />
                                        <rect x="7" y="10" width="2" height="2" fill="black" />
                                        <rect x="15" y="10" width="2" height="2" fill="black" />
                                        <rect x="17" y="12" width="2" height="2" fill="black" />
                                        <rect x="19" y="10" width="2" height="2" fill="black" />
                                        <rect x="21" y="12" width="1" height="1" fill="black" />
                                    </svg>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 max-w-[120px] leading-tight uppercase">
                                    Scan to verify student enrollment status online.
                                </p>
                            </div>

                            {/* Official Seal Positioning */}
                            <div className="relative h-24 w-24 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500/20 border-dashed animate-[spin_10s_linear_infinite]" />
                                <div className="bg-emerald-600/10 p-4 rounded-full border-2 border-emerald-500/30 flex items-center justify-center">
                                    <Award className="h-10 w-10 text-emerald-600 shadow-sm" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Bar */}
                <div className="mt-8 border-t-4 border-slate-900 pt-6 flex justify-between items-end">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Verification Hash</p>
                        <p className="font-mono text-[9px] font-bold text-slate-300 uppercase">
                            SHA256: {Math.random().toString(36).substring(2, 15).toUpperCase()}
                        </p>
                        <p className="text-[10px] font-bold text-slate-700 mt-2">
                            Issued: {new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}
                        </p>
                    </div>

                    <div className="text-center group">
                        <div className="mb-1 pointer-events-none opacity-40">
                            {/* Stylized Signature Mockup */}
                            <p className="font-serif italic text-2xl text-slate-900 tracking-tighter select-none">
                                Head Teacher
                            </p>
                        </div>
                        <div className="w-56 border-b-2 border-slate-900 mb-2 border-dashed shadow-sm"></div>
                        <p className="text-[10px] font-black uppercase text-slate-900 tracking-[0.25em]">Office of the Registrar</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
