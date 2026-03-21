"use client"

import { useState, useEffect } from "react"
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { School, Link as LinkIcon, Loader2, AlertCircle } from "lucide-react"
import { invokeIPC } from "@/lib/electron"
import { toast } from "sonner"

interface CreateSchoolModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function CreateSchoolModal({ isOpen, onClose, onSuccess }: CreateSchoolModalProps) {
    const [name, setName] = useState("")
    const [slug, setSlug] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Auto-generate slug from name
    useEffect(() => {
        if (name) {
            const autoSlug = name
                .toLowerCase()
                .replace(/[^\w ]+/g, '')
                .replace(/ +/g, '-')
                .slice(0, 50);
            setSlug(autoSlug);
        } else {
            setSlug("");
        }
    }, [name]);

    const handleCreate = async () => {
        if (!name.trim() || !slug.trim()) {
            setError("School name and slug are required");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            console.log("[CreateSchool] Creating school:", { name, slug });
            const result = await invokeIPC<any>('create-school', [{ 
                name, 
                slug, 
                status: 'Pending Setup',
                createdAt: new Date().toISOString()
            }]);

            if (result) {
                toast.success("School created successfully!");
                onSuccess();
                setName("");
                onClose();
            }
        } catch (err: any) {
            console.error("[CreateSchool] Failed:", err);
            setError(err.message || "Failed to create school. The slug might already be taken.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-0 shadow-2xl bg-white/95 backdrop-blur-xl">
                <DialogHeader>
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                        <School className="h-6 w-6 text-emerald-600" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-slate-900">Add New School Tenant</DialogTitle>
                    <DialogDescription className="text-slate-500 text-sm">
                        Create a unique access point for a new school. This will generate their dedicated dashboard URL.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl text-xs font-bold flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-bold text-slate-700 ml-1">Official School Name</Label>
                        <div className="relative">
                            <School className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                id="name" 
                                placeholder="e.g. Green Valleys High" 
                                className="h-12 pl-12 bg-slate-50 border-slate-200 rounded-2xl focus:bg-white transition-all text-sm font-medium"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug" className="text-xs font-bold text-slate-700 ml-1">Unique Access Slug (URL)</Label>
                        <div className="relative">
                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input 
                                id="slug" 
                                placeholder="green-valleys" 
                                className="h-12 pl-12 bg-slate-50 border-slate-200 rounded-2xl focus:bg-white transition-all text-sm font-medium pr-32"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                disabled={isSubmitting}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                .nexus.io
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium ml-1">
                            URL: <span className="text-emerald-600 font-bold">schoolnexuspro.pages.dev/{slug || '...'}</span>
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-3 sm:gap-0 mt-4">
                    <Button 
                        variant="ghost" 
                        onClick={onClose}
                        className="h-12 rounded-2xl font-bold text-slate-500"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleCreate}
                        className="h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-200"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Register School"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
