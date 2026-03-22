import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, SlidersHorizontal, UserCog } from 'lucide-react';
;
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface ReportSettings {
    reportTitle: string;
    showBot: boolean;
    showMid: boolean;
    showEot: boolean;
    showGrading: boolean;
    showFees: boolean;
    showNextTerm: boolean;
    showComments: boolean;
    showDob: boolean;
    showAttendance: boolean;
    showDivision: boolean;
    themeColor: string;
}

interface ReportSettingsDialogProps {
    settings: ReportSettings;
    onSettingsChange: (settings: ReportSettings) => void;
}

const colorThemes = [
    { id: 'emerald', name: 'Success Emerald', primary: '#10b981', secondary: '#059669', gradient: 'from-emerald-600 to-emerald-800', bg: 'bg-emerald-600' },
    { id: 'blue', name: 'Royal Blue', primary: '#3b82f6', secondary: '#1d4ed8', gradient: 'from-blue-600 to-blue-800', bg: 'bg-blue-600' },
    { id: 'purple', name: 'Noble Purple', primary: '#a855f7', secondary: '#7e22ce', gradient: 'from-purple-600 to-purple-800', bg: 'bg-purple-600' },
    { id: 'slate', name: 'Professional Slate', primary: '#64748b', secondary: '#334155', gradient: 'from-slate-600 to-slate-800', bg: 'bg-slate-600' },
    { id: 'emerald-gold', name: 'Emerald & Gold', primary: '#059669', secondary: '#d97706', gradient: 'from-emerald-700 to-amber-600', bg: 'bg-emerald-700' },
    { id: 'blue-indigo', name: 'Ocean Deep', primary: '#1e40af', secondary: '#4338ca', gradient: 'from-blue-800 to-indigo-900', bg: 'bg-blue-800' },
    { id: 'rose-purple', name: 'Velvet Rose', primary: '#e11d48', secondary: '#7e22ce', gradient: 'from-rose-600 to-purple-700', bg: 'bg-rose-600' },
    { id: 'amber-orange', name: 'Autumn Flare', primary: '#d97706', secondary: '#ea580c', gradient: 'from-amber-500 to-orange-700', bg: 'bg-amber-500' },
    { id: 'cyan-teal', name: 'Tropical Breeze', primary: '#0891b2', secondary: '#0d9488', gradient: 'from-cyan-600 to-teal-700', bg: 'bg-cyan-600' },
    { id: 'slate-black', name: 'Modern Dark', primary: '#1e293b', secondary: '#020617', gradient: 'from-slate-800 to-slate-950', bg: 'bg-slate-800' },
];

export function ReportSettingsDialog({
    settings,
    onSettingsChange,
}: ReportSettingsDialogProps) {
    const [localSettings, setLocalSettings] = useState<ReportSettings>({
        ...settings,
        reportTitle: settings.reportTitle || 'Termly Report Card',
        showDivision: settings.showDivision ?? true,
    });
    const [open, setOpen] = useState(false);

    const handleSave = () => {
        onSettingsChange(localSettings);
        setOpen(false);
    };

    const updateSetting = (key: keyof ReportSettings, value: any) => {
        setLocalSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-white hover:bg-slate-50 border-slate-200 shadow-sm transition-all hover:scale-[1.02]">
                    <Settings className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold text-slate-700">Template Settings</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] gap-0 p-0 overflow-hidden border-none shadow-2xl bg-slate-50">
                <DialogHeader className="p-6 bg-slate-900 text-white">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                            <SlidersHorizontal className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold tracking-tight">Report Template Customization</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Configure the layout, content sections, and visual themes for student report cards.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex flex-col md:flex-row h-[500px]">
                    {/* Left Panel: Navigation/General */}
                    <div className="w-full md:w-1/3 bg-white border-r border-slate-200 p-6 space-y-6">
                        <div className="space-y-4">
                            <h4 className="font-bold text-xs uppercase tracking-widest text-slate-500">General Information</h4>
                            <div className="space-y-2">
                                <Label htmlFor="reportTitle" className="text-xs font-semibold">Report Title (Main Header)</Label>
                                <Input
                                    id="reportTitle"
                                    value={localSettings.reportTitle}
                                    onChange={(e) => updateSetting('reportTitle', e.target.value)}
                                    className="h-9 bg-slate-50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                                    placeholder="e.g. TERMLY REPORT CARD"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-bold text-xs uppercase tracking-widest text-slate-500">Color Theme</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {colorThemes.map((theme) => (
                                    <button
                                        key={theme.id}
                                        onClick={() => updateSetting('themeColor', theme.id)}
                                        className={cn(
                                            "group flex flex-col p-2 rounded-lg border transition-all text-left relative overflow-hidden",
                                            localSettings.themeColor === theme.id
                                                ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/10"
                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                        )}
                                    >
                                        <div className={cn("absolute inset-0 opacity-[0.03]", theme.bg)} />
                                        <div className={cn("h-6 w-full rounded-md bg-gradient-to-r mb-1.5", theme.gradient)} />
                                        <span className={cn(
                                            "text-[10px] font-bold truncate",
                                            localSettings.themeColor === theme.id ? "text-emerald-700" : "text-slate-600"
                                        )}>
                                            {theme.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Toggles */}
                    <div className="w-full md:w-2/3 p-6 space-y-6 overflow-y-auto bg-slate-50/50">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <h4 className="font-bold text-xs uppercase tracking-widest text-slate-500">Marks & Grading</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { id: 'showBot', label: 'B.O.T Column' },
                                    { id: 'showMid', label: 'Mid Term Column' },
                                    { id: 'showEot', label: 'E.O.T Column' },
                                    { id: 'showGrading', label: 'Grading Scale Legend' },
                                    { id: 'showDivision', label: 'Show Division' },
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:border-emerald-200 transition-colors">
                                        <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer text-slate-700">{item.label}</Label>
                                        <Checkbox
                                            id={item.id}
                                            checked={(localSettings as any)[item.id]}
                                            onCheckedChange={(c) => updateSetting(item.id as any, c)}
                                            className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <h4 className="font-bold text-xs uppercase tracking-widest text-slate-500">Student Details</h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { id: 'showDob', label: 'Date of Birth & Age' },
                                    { id: 'showAttendance', label: 'Attendance Record' },
                                    { id: 'showFees', label: 'Fees Balance' },
                                    { id: 'showNextTerm', label: 'Next Term Details' },
                                    { id: 'showComments', label: 'Teacher Comments' },
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white hover:border-emerald-200 transition-colors">
                                        <Label htmlFor={item.id} className="text-sm font-medium cursor-pointer text-slate-700">{item.label}</Label>
                                        <Checkbox
                                            id={item.id}
                                            checked={(localSettings as any)[item.id]}
                                            onCheckedChange={(c) => updateSetting(item.id as any, c)}
                                            className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-800 leading-relaxed font-medium">
                            <span className="font-bold block mb-1 flex items-center gap-2">
                                <UserCog className="h-3 w-3" />
                                Customization Tip:
                            </span>
                            Toggle sections to fit more content or simplify the report card. Hidden sections will remove their corresponding data from the final print.
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 bg-white border-t border-slate-200">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="font-bold text-slate-500">Cancel</Button>
                    <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 font-bold shadow-lg shadow-emerald-600/20">
                        Apply & Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
