import React from 'react';
import { AlertCircle, Award, Calendar, CheckCircle2, ShieldCheck, User } from 'lucide-react';
;
import { Badge } from "@/components/ui/badge";

interface ExaminationCardProps {
    student: any;
    schoolProfile: any;
    activeTerm: any;
}

export function ExaminationCardTemplate({ student, schoolProfile, activeTerm }: ExaminationCardProps) {
    if (!student) return null;

    const subjects = [
        "Mathematics", "English Language", "Integrated Science", "Social Studies",
        "Religious Education", "Literacy I", "Literacy II"
    ];

    return (
        <div className="w-[850px] bg-white text-slate-900 border-[10px] border-sky-900 mx-auto relative overflow-hidden flex-shrink-0 shadow-2xl" id="examination-card-container">
            {/* Security Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: `repeating-linear-gradient(60deg, #0369a1 0, #0369a1 1px, transparent 1px, transparent 10px)` }} />

            {/* Background Watermark */}
            {schoolProfile?.logo && (
                <div
                    className="absolute inset-0 opacity-[0.05] pointer-events-none flex items-center justify-center bg-no-repeat bg-center"
                    style={{ backgroundImage: `url(${schoolProfile.logo})`, backgroundSize: '65%', backgroundPosition: 'center 35%' }}
                />
            )}

            <div className="p-10 relative z-10 flex flex-col min-h-[1080px]">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-8 pb-6 border-b-4 border-sky-600">
                    <div className="flex gap-6 items-center">
                        {schoolProfile?.logo ? (
                            <img src={schoolProfile.logo} alt="School Logo" className="w-24 h-24 object-contain" />
                        ) : (
                            <div className="w-24 h-24 bg-sky-50 rounded-2xl flex items-center justify-center font-black text-sky-200 border-2 border-sky-100 italic">LOGO</div>
                        )}
                        <div className="space-y-1">
                            <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tighter leading-none mb-2">
                                {schoolProfile?.name || 'School Name'}
                            </h1>
                            <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                {schoolProfile?.address || 'School Location'} &bull; {schoolProfile?.phone || 'Contact Number'}
                            </p>
                            <Badge className="bg-sky-600 text-white border-none font-black px-4 py-1 mt-2 text-xs tracking-widest uppercase">
                                Examination Admission Permit
                            </Badge>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400 mb-1">Session / Term</p>
                            <p className="text-xl font-black leading-none">{activeTerm?.name || 'Term One'}</p>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date().getFullYear()} Academic Year</p>
                        </div>
                    </div>
                </div>

                {/* Candidate Dashboard */}
                <div className="grid grid-cols-12 gap-8 mb-10">
                    <div className="col-span-3 flex flex-col items-center">
                        <div className="w-40 h-40 bg-white border-[6px] border-white rounded-2xl shadow-xl ring-1 ring-slate-200 overflow-hidden mb-4">
                            {student?.photo ? (
                                <img src={student.photo} alt="Student" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-slate-200">
                                    <User className="w-16 h-16" />
                                    <span className="text-[9px] font-black uppercase mt-1">No Photo</span>
                                </div>
                            )}
                        </div>
                        <div className="w-full space-y-2">
                            <div className="bg-slate-900 text-white p-2 rounded-lg text-center shadow-md">
                                <p className="text-[8px] font-black uppercase text-sky-400 tracking-widest mb-0.5">Index Number</p>
                                <p className="font-mono font-black text-base">{student.admissionNumber || 'SN-ERR'}</p>
                            </div>
                            <div className="bg-sky-50 border border-sky-100 p-2 rounded-lg text-center">
                                <p className="text-[8px] font-black uppercase text-sky-600 tracking-widest mb-0.5">Internal Rank</p>
                                <p className="font-black text-slate-900 text-sm italic">Candidate {student.id}</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-9 space-y-6">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Scholar Information</label>
                                <p className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">
                                    {student.firstName} {student.lastName}
                                </p>
                                <p className="text-sm font-bold text-slate-500 mt-1">{student.gender} Scholar &bull; {student.class?.name || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Allocated Stream</label>
                                <p className="text-xl font-black text-sky-700 uppercase">{student.stream?.name || 'General Stream'}</p>
                                <div className="flex items-center justify-end gap-2 mt-1">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Clearance Verified</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-sky-50/50 p-5 rounded-2xl border-2 border-sky-100 flex items-center justify-between shadow-inner">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <Calendar className="h-5 w-5 text-sky-600" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-sky-600 uppercase tracking-widest leading-none mb-1">Valid Dates</p>
                                    <p className="font-black text-slate-900 text-sm uppercase italic">Full Assessment Week</p>
                                </div>
                            </div>
                            <div className="h-10 w-px bg-sky-200" />
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                    <ShieldCheck className="h-5 w-5 text-sky-600" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-sky-600 uppercase tracking-widest leading-none mb-1">Status</p>
                                    <p className="font-black text-emerald-700 text-sm uppercase italic">Fully Eligible</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Examination Grid */}
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <Award className="h-5 w-5 text-sky-700" />
                        <h4 className="text-xs font-black uppercase text-slate-900 tracking-widest">Attendance Registry & Invigilator Log</h4>
                    </div>

                    <table className="w-full border-collapse rounded-xl overflow-hidden shadow-sm">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-4 text-left w-14 text-[10px] font-black uppercase tracking-widest">No.</th>
                                <th className="p-4 text-left text-[10px] font-black uppercase tracking-widest">Subject Description</th>
                                <th className="p-4 text-left w-24 text-[10px] font-black uppercase tracking-widest">Session</th>
                                <th className="p-4 text-left w-32 text-[10px] font-black uppercase tracking-widest">Paper Date</th>
                                <th className="p-4 text-center w-44 text-[10px] font-black uppercase tracking-widest">Invigilator Seal</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {subjects.map((subject, index) => (
                                <tr key={index} className="border-b border-slate-100 hover:bg-sky-50/20 transition-colors">
                                    <td className="p-4 font-black text-slate-400 text-sm">{index + 1}</td>
                                    <td className="p-4 font-black text-slate-900 text-sm uppercase">{subject}</td>
                                    <td className="p-4 font-bold text-slate-500 text-[10px] italic">AM / PM</td>
                                    <td className="p-4 border-l border-slate-50"></td>
                                    <td className="p-4 border-l border-slate-50 relative overflow-hidden">
                                        <div className="absolute inset-x-4 inset-y-2 border border-slate-100 border-dashed rounded flex items-center justify-center">
                                            <span className="text-[8px] font-bold text-slate-200 uppercase tracking-tighter">Official Sign Required</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Rules Section */}
                <div className="mt-10 p-8 bg-slate-900 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-10 opacity-10">
                        <AlertCircle className="h-32 w-32 text-white" />
                    </div>

                    <div className="relative z-10 grid grid-cols-2 gap-10">
                        <div>
                            <h4 className="flex items-center gap-2 text-sky-400 text-xs font-black uppercase tracking-[0.2em] mb-4">
                                <AlertCircle className="h-4 w-4" /> Examination Protocol
                            </h4>
                            <ul className="space-y-3">
                                {[
                                    "Candidate must present this card at every session.",
                                    "Entry prohibited 30 minutes after commencement.",
                                    "Unauthorised materials lead to disqualification.",
                                    "Maintain absolute silence in the examination hall."
                                ].map((rule, i) => (
                                    <li key={i} className="flex items-start gap-3 text-white/80 text-[10px] font-bold leading-tight">
                                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 mt-1 shrink-0" /> {rule}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex flex-col justify-end">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="text-center group">
                                    <div className="h-12 flex items-end justify-center mb-1 opacity-40">
                                        <p className="font-serif italic text-white text-xl select-none">Head Teacher</p>
                                    </div>
                                    <div className="border-b border-sky-500/50 mb-2 border-dashed" />
                                    <p className="text-[8px] font-black text-sky-400 uppercase tracking-widest">Office of DOS</p>
                                </div>
                                <div className="flex items-center justify-center">
                                    <div className="h-20 w-20 rounded-full border-2 border-sky-500/30 border-dashed flex items-center justify-center bg-white/5">
                                        <p className="text-[8px] font-black text-white/20 uppercase text-center tracking-tighter leading-tight">Official<br />School<br />Seal</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
