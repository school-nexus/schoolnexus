'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import {
    User, Mail, Phone, MapPin, Calendar, BookOpen,
    Shield, CheckCircle2, Loader2, Upload, X, Camera,
    Save, School, AlertCircle, Briefcase, GraduationCap,
    ArrowLeft, Sparkles, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { teacherActions, subjectActions, fileActions } from '@/lib/electron';

const teacherFormSchema = z.object({
    // Personal Details
    photo: z.any().optional(),
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Valid phone number is required'),
    gender: z.string().min(1, 'Gender is required'),
    address: z.string().min(5, 'Address is required'),

    // Professional Info
    qualification: z.string().min(1, 'Qualification is required'),
    experience: z.string().optional(),
    joinDate: z.string().min(1, 'Join date is required'),
    subjects: z.array(z.string()).min(1, 'At least one subject is required'),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

interface RawTeacher {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    gender?: string;
    address?: string;
    qualifications?: string;
    experience?: string | number;
    joinDate?: string;
    subject?: string;
    subjects?: string;
    photoUrl?: string;
}

interface RawSubject {
    id: number;
    name: string;
}

function AddTeacherPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const teacherId = searchParams.get('id');
    const isEditMode = !!teacherId;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [existingTeacher, setExistingTeacher] = useState<RawTeacher | null>(null);
    const [subjects, setSubjects] = useState<RawSubject[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<TeacherFormValues>({
        resolver: zodResolver(teacherFormSchema),
        defaultValues: {
            joinDate: new Date().toISOString().split('T')[0],
            subjects: [],
        },
        mode: 'onChange',
    });

    const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = form;
    const formData = watch();

    // Load subjects
    useEffect(() => {
        const loadSubjects = async () => {
            try {
                const data = await subjectActions.getAll() as RawSubject[];
                setSubjects(data);
            } catch (error) {
                console.error('Failed to load subjects:', error);
                toast.error('Failed to load subjects');
            }
        };
        loadSubjects();
    }, []);

    // Load teacher data when in edit mode
    useEffect(() => {
        if (isEditMode && teacherId) {
            loadTeacherData(parseInt(teacherId));
        }
    }, [teacherId, isEditMode]);

    const loadTeacherData = async (id: number) => {
        try {
            setIsLoading(true);
            const allTeachers = await teacherActions.getAll() as RawTeacher[];
            const teacher = allTeachers.find((t) => t.id === id);

            if (teacher) {
                setExistingTeacher(teacher);

                let teacherSubjects: string[] = [];
                try {
                    if (teacher.subjects) {
                        teacherSubjects = JSON.parse(teacher.subjects);
                    } else if (teacher.subject) {
                        // Fallback for legacy data
                        teacherSubjects = [teacher.subject];
                    }
                } catch (e) {
                    console.error("Error parsing subjects:", e);
                    teacherSubjects = [];
                }

                // Populate form with existing data
                reset({
                    firstName: teacher.firstName || '',
                    lastName: teacher.lastName || '',
                    email: teacher.email || '',
                    phone: teacher.phone || '',
                    gender: teacher.gender || '',
                    address: teacher.address || '',
                    qualification: teacher.qualifications || '',
                    experience: teacher.experience?.toString() || '',
                    joinDate: teacher.joinDate || new Date().toISOString().split('T')[0],
                    subjects: teacherSubjects,
                });

                if (teacher.photoUrl) {
                    setPhotoPreview(fileActions.getUrl(teacher.photoUrl));
                }
            } else {
                toast.error('Teacher not found');
                router.push('/teachers');
            }
        } catch (error) {
            console.error('Failed to load teacher data:', error);
            toast.error('Failed to load teacher data');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Keep preview as base64 for immediate feedback
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
                setValue('photo', file);
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = () => {
        setPhotoPreview(null);
        setValue('photo', null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubjectToggle = (subjectName: string) => {
        const currentSubjects = formData.subjects || [];
        if (currentSubjects.includes(subjectName)) {
            setValue('subjects', currentSubjects.filter(s => s !== subjectName));
        } else {
            setValue('subjects', [...currentSubjects, subjectName]);
        }
    };

    async function onSubmit(data: TeacherFormValues) {
        setIsSubmitting(true);
        try {
            const teacherData = {
                ...data,
                subjects: JSON.stringify(data.subjects),
                photoUrl: existingTeacher?.photoUrl || null
            };

            let savedTeacher;
            if (isEditMode && existingTeacher) {
                // Update existing teacher
                const results = await teacherActions.update({ id: existingTeacher.id, ...teacherData });
                savedTeacher = Array.isArray(results) ? results[0] : results;
            } else {
                // Create new teacher
                const results = await teacherActions.create(teacherData);
                savedTeacher = Array.isArray(results) ? results[0] : results;
            }

            // Handle photo upload if a new photo was selected
            if (data.photo instanceof File && savedTeacher) {
                try {
                    const photoPath = await fileActions.save(data.photo, 'teachers', savedTeacher.id);
                    await teacherActions.update({ id: savedTeacher.id, photoUrl: photoPath });
                } catch (error) {
                    console.error('Failed to upload teacher photo:', error);
                    toast.error('Teacher saved but photo upload failed');
                }
            }

            toast.success(isEditMode ? 'Teacher updated successfully!' : 'Teacher registered successfully!');

            router.push('/teachers');
        } catch (error) {
            console.error('Failed to save teacher:', error);
            toast.error(isEditMode ? 'Failed to update teacher. Please try again.' : 'Failed to register teacher. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] w-full bg-slate-50/50 relative overflow-hidden font-sans">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-teal-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div>
                        <Link href="/teachers" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors mb-2 group">
                            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            Back to Teacher List
                        </Link>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            {isEditMode ? 'Edit Teacher' : 'Add New Teacher'}
                            <div className="p-1.5 bg-teal-100 rounded-lg">
                                <UserPlus className="w-6 h-6 text-teal-600" />
                            </div>
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">{isEditMode ? 'Update the teacher details below.' : 'Register a new staff member to the school management system.'}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column - Photo & Basic Info */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden sticky top-8">
                                <CardHeader className="border-b border-slate-100 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-50 shadow-sm rounded-lg">
                                            <Camera className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-slate-900">Profile Photo</CardTitle>
                                            <CardDescription className="text-slate-500">Upload a professional photo.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 flex flex-col items-center">
                                    <div className="relative group mb-8">
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={cn(
                                                "w-52 h-52 rounded-3xl border-4 border-white shadow-2xl flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-teal-500/20",
                                                photoPreview ? "bg-white" : "bg-gradient-to-br from-slate-50 to-slate-100 border-dashed border-slate-300"
                                            )}
                                        >
                                            {photoPreview ? (
                                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center text-slate-400 group-hover:text-teal-500 transition-colors">
                                                    <div className="p-4 bg-white rounded-2xl shadow-sm mb-3 group-hover:shadow-md transition-all">
                                                        <Upload className="w-10 h-10" />
                                                    </div>
                                                    <span className="text-xs font-bold uppercase tracking-widest">Upload Photo</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                        </div>
                                        {photoPreview && (
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); removePhoto(); }}
                                                className="absolute -top-3 -right-3 bg-white text-red-500 p-2.5 rounded-2xl shadow-xl hover:bg-red-50 transition-all hover:scale-110 border border-red-100"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handlePhotoChange}
                                        />
                                    </div>

                                    <div className="w-full space-y-4">
                                        <div className="bg-teal-50/50 border border-teal-100 text-teal-700 p-4 rounded-2xl text-sm flex gap-3 items-start backdrop-blur-sm">
                                            <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-teal-500" />
                                            <p className="leading-relaxed font-medium">A professional photo helps in better identification within the staff directory.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Form Sections */}
                        <div className="lg:col-span-8 space-y-8">
                            {/* Personal Details Section */}
                            <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden">
                                <CardHeader className="border-b border-slate-100 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-50 shadow-sm rounded-xl">
                                            <User className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold text-slate-900">Personal Details</CardTitle>
                                            <CardDescription className="text-slate-500">Basic contact and identity information.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2.5">
                                        <Label htmlFor="firstName" className="text-sm font-bold text-slate-700 ml-1">First Name <span className="text-red-500">*</span></Label>
                                        <div className="relative group">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <Input id="firstName" {...register('firstName')} placeholder="e.g. Sarah" className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        </div>
                                        {errors.firstName && <p className="text-xs font-medium text-red-500 ml-1">{errors.firstName.message}</p>}
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="lastName" className="text-sm font-bold text-slate-700 ml-1">Last Name <span className="text-red-500">*</span></Label>
                                        <div className="relative group">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <Input id="lastName" {...register('lastName')} placeholder="e.g. Wilson" className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        </div>
                                        {errors.lastName && <p className="text-xs font-medium text-red-500 ml-1">{errors.lastName.message}</p>}
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">Email Address <span className="text-red-500">*</span></Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <Input id="email" type="email" {...register('email')} placeholder="sarah.wilson@school.edu" className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        </div>
                                        {errors.email && <p className="text-xs font-medium text-red-500 ml-1">{errors.email.message}</p>}
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="phone" className="text-sm font-bold text-slate-700 ml-1">Phone Number <span className="text-red-500">*</span></Label>
                                        <div className="relative group">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <Input id="phone" {...register('phone')} placeholder="+256 772 123456" className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        </div>
                                        {errors.phone && <p className="text-xs font-medium text-red-500 ml-1">{errors.phone.message}</p>}
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="gender" className="text-sm font-bold text-slate-700 ml-1">Gender <span className="text-red-500">*</span></Label>
                                        <Select onValueChange={(value) => setValue('gender', value)} defaultValue={formData.gender}>
                                            <SelectTrigger className="h-12 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl">
                                                <SelectValue placeholder="Select gender" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.gender && <p className="text-xs font-medium text-red-500 ml-1">{errors.gender.message}</p>}
                                    </div>
                                    <div className="space-y-2.5 md:col-span-2">
                                        <Label htmlFor="address" className="text-sm font-bold text-slate-700 ml-1">Residential Address <span className="text-red-500">*</span></Label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-3.5 top-4 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <Textarea id="address" {...register('address')} placeholder="Enter full residential address..." className="min-h-[120px] pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl resize-none py-3" />
                                        </div>
                                        {errors.address && <p className="text-xs font-medium text-red-500 ml-1">{errors.address.message}</p>}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Professional Info Section */}
                            <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden">
                                <CardHeader className="border-b border-slate-100 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-50 shadow-sm rounded-xl">
                                            <Briefcase className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold text-slate-900">Professional Details</CardTitle>
                                            <CardDescription className="text-slate-500">Qualifications and teaching assignment.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2.5">
                                        <Label htmlFor="qualification" className="text-sm font-bold text-slate-700 ml-1">Highest Qualification <span className="text-red-500">*</span></Label>
                                        <div className="relative group">
                                            <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors z-10" />
                                            <Select onValueChange={(value) => setValue('qualification', value)} defaultValue={formData.qualification}>
                                                <SelectTrigger className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl">
                                                    <SelectValue placeholder="Select qualification" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-xl">
                                                    <SelectItem value="Bachelors">Bachelor's Degree</SelectItem>
                                                    <SelectItem value="Masters">Master's Degree</SelectItem>
                                                    <SelectItem value="Diploma">Diploma</SelectItem>
                                                    <SelectItem value="Certificate">Certificate</SelectItem>
                                                    <SelectItem value="PhD">PhD</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {errors.qualification && <p className="text-xs font-medium text-red-500 ml-1">{errors.qualification.message}</p>}
                                    </div>

                                    <div className="space-y-2.5 md:col-span-2">
                                        <Label className="text-sm font-bold text-slate-700 ml-1">Assigned Subjects <span className="text-red-500">*</span></Label>
                                        <div className="bg-white/50 border border-slate-200 rounded-xl p-4">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {subjects.map(s => (
                                                    <div key={s.id} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer" onClick={() => handleSubjectToggle(s.name)}>
                                                        <div className={cn(
                                                            "w-5 h-5 rounded border flex items-center justify-center transition-all",
                                                            formData.subjects?.includes(s.name)
                                                                ? "bg-teal-600 border-teal-600 text-white"
                                                                : "border-slate-300 bg-white"
                                                        )}>
                                                            {formData.subjects?.includes(s.name) && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 select-none">{s.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {subjects.length === 0 && (
                                                <p className="text-sm text-slate-400 text-center py-4">No subjects available. Please add subjects first.</p>
                                            )}
                                        </div>
                                        {errors.subjects && <p className="text-xs font-medium text-red-500 ml-1">{errors.subjects.message}</p>}
                                    </div>

                                    <div className="space-y-2.5">
                                        <Label htmlFor="experience" className="text-sm font-bold text-slate-700 ml-1">Years of Experience</Label>
                                        <div className="relative group">
                                            <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                            <Input id="experience" type="number" {...register('experience')} placeholder="e.g. 5" className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="joinDate" className="text-sm font-bold text-slate-700 ml-1">Joining Date <span className="text-red-500">*</span></Label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                            <Input id="joinDate" type="date" {...register('joinDate')} className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        </div>
                                        {errors.joinDate && <p className="text-xs font-medium text-red-500 ml-1">{errors.joinDate.message}</p>}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Submit Actions */}
                            <div className="flex items-center justify-end gap-4 pt-6">
                                <Button type="button" variant="ghost" className="h-12 px-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-bold" onClick={() => window.history.back()}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-12 px-10 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-xl shadow-teal-500/20 border-0 transition-all hover:scale-[1.02] active:scale-95 rounded-xl font-bold"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5 mr-2" /> {isEditMode ? 'Update Teacher' : 'Register Teacher'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AddTeacherPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>}>
            <AddTeacherPageContent />
        </Suspense>
    );
}

