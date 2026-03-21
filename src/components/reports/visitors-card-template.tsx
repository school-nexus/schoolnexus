import React from 'react';

interface VisitorCardProps {
    data: {
        visitorName: string;
        purpose: string;
        personToSee: string;
        category: string;
        timeIn: string;
        date: string;
    };
    schoolProfile: any;
}

export function VisitorCardTemplate({ data, schoolProfile }: VisitorCardProps) {
    // Generate a pseudo-random pass number based on the time
    const passNumber = `V-${new Date(data.date).getTime().toString().slice(-6)}`;

    return (
        <div className="w-[450px] h-[650px] bg-white text-slate-900 border-[8px] border-emerald-900 mx-auto relative overflow-hidden flex-shrink-0" id="visitor-card-container">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5" style={{
                backgroundImage: `repeating-linear-gradient(45deg, #10b981 0, #10b981 2px, transparent 2px, transparent 8px)`
            }} />

            {/* Header / Lanyard area */}
            <div className="h-20 bg-emerald-900 flex justify-center items-center relative z-10 w-full mb-6">
                <div className="w-20 h-4 bg-white/20 rounded-full border border-white/40 absolute -top-2"></div>
                <h1 className="text-white font-black tracking-widest uppercase text-xl text-center px-4 leading-tight">
                    {schoolProfile?.name || 'School Name'}
                </h1>
            </div>

            <div className="px-8 flex flex-col items-center relative z-10">
                {/* Logo and Photo Area */}
                <div className="flex flex-col items-center mb-6">
                    {schoolProfile?.logo ? (
                        <img src={schoolProfile.logo} alt="School Logo" className="w-16 h-16 object-contain mb-4" />
                    ) : (
                        <div className="w-16 h-16 bg-emerald-100 flex items-center justify-center font-bold text-emerald-800 mb-4 rounded-full">LOGO</div>
                    )}

                    <div className="bg-emerald-600 text-white px-6 py-2 rounded-full font-black text-2xl tracking-widest uppercase shadow-md mb-2">
                        VISITOR PASS
                    </div>
                    <p className="font-mono text-slate-500 font-bold text-sm tracking-wider border-b-2 border-slate-200 pb-1">NO. {passNumber}</p>
                </div>

                {/* Details Card */}
                <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-6 space-y-4 shadow-sm mb-6">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Category</p>
                        <p className="font-black text-emerald-700 uppercase bg-emerald-100 px-3 py-1 rounded inline-block text-sm">
                            {data.category || 'GENERAL VISITOR'}
                        </p>
                    </div>

                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Visitor Name</p>
                        <p className="font-black text-xl text-slate-900 uppercase underline decoration-slate-300 decoration-2 underline-offset-4">{data.visitorName || '_________________________'}</p>
                    </div>

                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Person To See</p>
                        <p className="font-bold text-lg text-slate-800 uppercase">{data.personToSee || '____________________'}</p>
                    </div>

                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Purpose of Visit</p>
                        <p className="font-bold text-slate-800 italic line-clamp-2">{data.purpose || '__________________________________'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                        <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Date</p>
                            <p className="font-bold font-mono text-slate-700">{new Date(data.date).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Time In</p>
                            <p className="font-bold font-mono text-slate-700">{data.timeIn || '--:--'}</p>
                        </div>
                    </div>
                </div>

                {/* Return Instructions */}
                <div className="text-center mt-auto w-full">
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-snug">
                        Valid for today only. Must be worn visibly at all times. Please return to security upon departure.
                    </p>
                    <div className="mt-4 pt-4 border-t-2 border-slate-200 w-full flex justify-between">
                        <div className="w-32">
                            <div className="border-b border-slate-400 h-6 mb-1 border-dashed"></div>
                            <p className="text-[9px] uppercase font-bold text-slate-400">Security / Escort Sign</p>
                        </div>
                        <div className="w-32">
                            <div className="border-b border-slate-400 h-6 mb-1 border-dashed"></div>
                            <p className="text-[9px] uppercase font-bold text-slate-400">Time Out</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
