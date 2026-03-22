'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, BookOpen, Calendar, Camera, CheckCircle2, Loader2, Mail, MapPin, Phone, Save, School, Shield, Sparkles, Upload, User, UserPlus, X } from 'lucide-react';
;
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { studentActions, streamActions, classActions, guardianActions, fileActions } from '@/lib/electron';
import Link from 'next/link';

const studentFormSchema = z.object({
    // Personal Details
    photo: z.any().optional(),
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    gender: z.enum(['Male', 'Female'], { required_error: 'Gender is required' }),
    nationality: z.string().min(1, 'Nationality is required'),

    // Contact Information
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z.string().min(1, 'Address is required'),

    // Academic Information
    admissionNumber: z.string().min(1, 'Admission number is required'),
    admissionDate: z.string().min(1, 'Admission date is required'),
    classId: z.number({ required_error: 'Class is required' }),
    streamId: z.number().optional(),
    linNumber: z.string().optional(),
    schoolPayCode: z.string().optional(),

    // Guardian Information
    guardianName: z.string().min(2, 'Guardian name is required'),
    guardianRelationship: z.string().min(1, 'Relationship is required'),
    guardianPhone: z.string().min(1, 'Guardian phone is required'),
    guardianEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
    guardianAddress: z.string().optional(),

    // Additional Information
    medicalConditions: z.string().optional(),
    specialNeeds: z.string().optional(),
    previousSchool: z.string().optional(),
    notes: z.string().optional(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface RawClass {
    id: number
    name: string
}

interface RawStream {
    id: number
    name: string
    classId: number
}

interface ExistingStudent {
    id: number
    firstName: string
    lastName: string
    dob: string | null
    gender: 'Male' | 'Female'
    nationality: string | null
    email: string | null
    phone: string | null
    address: string
    admissionNumber: string
    enrollmentDate: string | null
    classId: number
    streamId: number | null
    linNumber: string | null
    schoolPayCode: string | null
    medicalConditions: string | null
    specialNeeds: string | null
    previousSchool: string | null
    notes: string | null
    photoUrl: string | null
}

interface Guardian {
    id: number
    name: string
    relationship: string
    phone: string
    email: string | null
    address: string | null
}

function AddStudentFormContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const studentId = searchParams.get('id');
    const isEditMode = !!studentId;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [streams, setStreams] = useState<RawStream[]>([]);
    const [classes, setClasses] = useState<RawClass[]>([]);
    const [existingStudent, setExistingStudent] = useState<ExistingStudent | null>(null);
    const [admissionPrefix, setAdmissionPrefix] = useState('STU');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<StudentFormValues>({
        resolver: zodResolver(studentFormSchema),
        defaultValues: {
            nationality: 'Ugandan',
            admissionDate: new Date().toISOString().split('T')[0],
        },
        mode: 'onChange',
    });

    const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = form;
    const formData = watch();


    const fetchClassesAndStreams = async () => {
        try {
            const [classesData, streamsData] = await Promise.all([
                classActions.getAll() as Promise<RawClass[]>,
                streamActions.getAll() as Promise<RawStream[]>
            ]);
            setClasses(classesData);
            setStreams(streamsData);
        } catch (error: unknown) {
            console.error('Failed to fetch classes/streams:', error);
        }
    };

    const loadStudentData = async (id: number) => {
        try {
            setIsLoading(true);
            const allStudents = await studentActions.getAll() as any as ExistingStudent[];
            const student = allStudents.find((s) => s.id === id);

            if (student) {
                setExistingStudent(student);

                // Get guardian data
                const guardianData = await guardianActions.getByStudent(id) as Guardian[];
                const guardian = guardianData?.[0];

                // Populate form with student data
                reset({
                    firstName: student.firstName,
                    lastName: student.lastName,
                    dateOfBirth: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
                    gender: student.gender,
                    nationality: student.nationality || 'Ugandan',
                    email: student.email || '',
                    phone: student.phone || '',
                    address: student.address || '',
                    admissionNumber: student.admissionNumber,
                    admissionDate: student.enrollmentDate ? new Date(student.enrollmentDate).toISOString().split('T')[0] : '',
                    classId: student.classId,
                    streamId: student.streamId || undefined,
                    linNumber: student.linNumber || '',
                    schoolPayCode: student.schoolPayCode || '',
                    guardianName: guardian?.name || '',
                    guardianRelationship: guardian?.relationship || '',
                    guardianPhone: guardian?.phone || '',
                    guardianEmail: guardian?.email || '',
                    guardianAddress: guardian?.address || '',
                    medicalConditions: student.medicalConditions || '',
                    specialNeeds: student.specialNeeds || '',
                    previousSchool: student.previousSchool || '',
                    notes: student.notes || '',
                });

                // Load existing photo
                if (student.photoUrl) {
                    setPhotoPreview(student.photoUrl);
                    setValue('photo', student.photoUrl);
                }
            } else {
                toast.error('Student not found');
                router.push('/students');
            }
        } catch (error: unknown) {
            console.error('Failed to load student data:', error);
            toast.error('Failed to load student data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClassesAndStreams();
        // Fetch dynamic admission prefix
        studentActions.getAdmissionPrefix().then((p: string) => {
            if (p) setAdmissionPrefix(p);
        }).catch((error: unknown) => {
            console.error('Failed to fetch admission prefix:', error);
        });
        if (isEditMode && studentId) {
            loadStudentData(parseInt(studentId));
        }
    }, [isEditMode, studentId]);

    const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setPhotoPreview(result);
                setValue('photo', result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = () => {
        setPhotoPreview(null);
        setValue('photo', undefined);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const onSubmit = async (data: StudentFormValues) => {
        try {
            setIsSubmitting(true);

            // Prepare student data
            const studentData = {
                firstName: data.firstName,
                lastName: data.lastName,
                dob: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : null,
                gender: data.gender,
                nationality: data.nationality,
                email: data.email || undefined,
                phone: data.phone || undefined,
                address: data.address,
                admissionNumber: data.admissionNumber,
                enrollmentDate: data.admissionDate ? new Date(data.admissionDate).toISOString() : undefined,
                classId: data.classId,
                streamId: data.streamId || undefined,
                linNumber: data.linNumber || undefined,
                schoolPayCode: data.schoolPayCode || undefined,
                medicalConditions: data.medicalConditions || undefined,
                specialNeeds: data.specialNeeds || undefined,
                previousSchool: data.previousSchool || undefined,
                notes: data.notes || undefined,
                photoUrl: data.photo || undefined,
                guardianName: data.guardianName,
                guardianPhone: data.guardianPhone,
                guardianEmail: data.guardianEmail || undefined,
                guardianRelation: data.guardianRelationship,
                isActive: true,
            };

            let savedStudent;

            if (isEditMode && studentId) {
                // Update existing student
                savedStudent = await studentActions.update({ id: parseInt(studentId), ...studentData });
                toast.success('Student updated successfully');
            } else {
                // Create new student
                savedStudent = await studentActions.create(studentData);
                toast.success('Student added successfully');
            }

            // Navigate back to students list
            router.push('/students');

        } catch (error: unknown) {
            console.error('Failed to save student:', error);
            toast.error(isEditMode ? 'Failed to update student' : 'Failed to add student');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 flex items-center justify-center">
                <Card className="w-full max-w-md bg-white/80 backdrop-blur-xl border-slate-200/60 shadow-xl">
                    <CardContent className="p-6 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-emerald-600" />
                        <p className="text-slate-600 font-medium">Loading student data...</p>
                    </CardContent>
                </Card>
            </div>
        );
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
                        <Link href="/students" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors mb-2 group">
                            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                            Back to Student List
                        </Link>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            {isEditMode ? 'Edit Student' : 'New Admission'}
                            <div className="p-1.5 bg-emerald-100 rounded-lg">
                                <UserPlus className="w-6 h-6 text-emerald-600" />
                            </div>
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">{isEditMode ? 'Update the student record below.' : 'Register a new student to the school management system.'}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column - Photo & Tips */}
                        <div className="lg:col-span-4 space-y-6">
                            <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden sticky top-8">
                                <CardHeader className="border-b border-slate-100 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-50 shadow-sm rounded-lg">
                                            <Camera className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-slate-900">Student Photo</CardTitle>
                                            <CardDescription className="text-slate-500">Upload a clear face photo.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 flex flex-col items-center">
                                    <div className="relative group mb-8">
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={cn(
                                                "w-52 h-52 rounded-3xl border-4 border-white shadow-2xl flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-emerald-500/20",
                                                photoPreview ? "bg-white" : "bg-gradient-to-br from-slate-50 to-slate-100 border-dashed border-slate-300"
                                            )}
                                        >
                                            {photoPreview ? (
                                                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center text-slate-400 group-hover:text-emerald-500 transition-colors">
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
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                        />
                                    </div>

                                    <div className="w-full space-y-4">
                                        <div className="bg-emerald-50/50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl text-sm flex gap-3 items-start backdrop-blur-sm">
                                            <Sparkles className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
                                            <p className="leading-relaxed font-medium">A clear photo helps in quick identification and generates a professional ID card.</p>
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
                                            <CardDescription className="text-slate-500">Basic identity information.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2.5">
                                        <Label htmlFor="firstName" className="text-sm font-bold text-slate-700 ml-1">First Name <span className="text-red-500">*</span></Label>
                                        <div className="relative group">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <Input id="firstName" {...register('firstName')} placeholder="e.g. John" className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        </div>
                                        {errors.firstName && <p className="text-xs font-medium text-red-500 ml-1">{errors.firstName.message}</p>}
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="lastName" className="text-sm font-bold text-slate-700 ml-1">Last Name <span className="text-red-500">*</span></Label>
                                        <div className="relative group">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <Input id="lastName" {...register('lastName')} placeholder="e.g. Doe" className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        </div>
                                        {errors.lastName && <p className="text-xs font-medium text-red-500 ml-1">{errors.lastName.message}</p>}
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="dateOfBirth" className="text-sm font-bold text-slate-700 ml-1">Date of Birth <span className="text-red-500">*</span></Label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                            <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        </div>
                                        {errors.dateOfBirth && <p className="text-xs font-medium text-red-500 ml-1">{errors.dateOfBirth.message}</p>}
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="gender" className="text-sm font-bold text-slate-700 ml-1">Gender <span className="text-red-500">*</span></Label>
                                        <Select onValueChange={(value) => setValue('gender', value as 'Male' | 'Female')} defaultValue={formData.gender}>
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
                                    <div className="space-y-2.5">
                                        <Label htmlFor="nationality" className="text-sm font-bold text-slate-700 ml-1">Nationality <span className="text-red-500">*</span></Label>
                                        <Input id="nationality" {...register('nationality')} placeholder="e.g. Ugandan" className="h-12 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        {errors.nationality && <p className="text-xs font-medium text-red-500 ml-1">{errors.nationality.message}</p>}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Contact Information */}
                            <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden">
                                <CardHeader className="border-b border-slate-100 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-50 shadow-sm rounded-xl">
                                            <Mail className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold text-slate-900">Contact Information</CardTitle>
                                            <CardDescription className="text-slate-500">Address and personal contact details.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2.5">
                                        <Label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">Email Address</Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                            <Input id="email" type="email" {...register('email')} placeholder="student@school.edu" className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        </div>
                                        {errors.email && <p className="text-xs font-medium text-red-500 ml-1">{errors.email.message}</p>}
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="phone" className="text-sm font-bold text-slate-700 ml-1">Phone Number</Label>
                                        <div className="relative group">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                            <Input id="phone" {...register('phone')} placeholder="+256 700 000000" className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        </div>
                                        {errors.phone && <p className="text-xs font-medium text-red-500 ml-1">{errors.phone.message}</p>}
                                    </div>
                                    <div className="space-y-2.5 md:col-span-2">
                                        <Label htmlFor="address" className="text-sm font-bold text-slate-700 ml-1">Home Address <span className="text-red-500">*</span></Label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-3.5 top-4 w-4 h-4 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
                                            <Textarea id="address" {...register('address')} placeholder="Enter full residential address..." className="min-h-[100px] pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl resize-none py-3" />
                                        </div>
                                        {errors.address && <p className="text-xs font-medium text-red-500 ml-1">{errors.address.message}</p>}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Academic Information */}
                            <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden">
                                <CardHeader className="border-b border-slate-100 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-50 shadow-sm rounded-xl">
                                            <BookOpen className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold text-slate-900">Academic Information</CardTitle>
                                            <CardDescription className="text-slate-500">Enrollment details.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2.5">
                                        <Label htmlFor="admissionNumber" className="text-sm font-bold text-slate-700 ml-1">Admission Number <span className="text-red-500">*</span></Label>
                                        <div className="relative group">
                                            <School className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            <Input id="admissionNumber" {...register('admissionNumber')} placeholder={`e.g. ${admissionPrefix}/${new Date().getFullYear()}/001`} className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        </div>
                                        {errors.admissionNumber && <p className="text-xs font-medium text-red-500 ml-1">{errors.admissionNumber.message}</p>}
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="admissionDate" className="text-sm font-bold text-slate-700 ml-1">Admission Date <span className="text-red-500">*</span></Label>
                                        <div className="relative group">
                                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            <Input id="admissionDate" type="date" {...register('admissionDate')} className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        </div>
                                        {errors.admissionDate && <p className="text-xs font-medium text-red-500 ml-1">{errors.admissionDate.message}</p>}
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="classId" className="text-sm font-bold text-slate-700 ml-1">Class <span className="text-red-500">*</span></Label>
                                        <Select onValueChange={(value) => setValue('classId', parseInt(value))} value={formData.classId?.toString()}>
                                            <SelectTrigger className="h-12 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl">
                                                <SelectValue placeholder="Select class" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {classes.map((cls) => (
                                                    <SelectItem key={cls.id} value={cls.id.toString()}>
                                                        {cls.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.classId && <p className="text-xs font-medium text-red-500 ml-1">{errors.classId.message}</p>}
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="streamId" className="text-sm font-bold text-slate-700 ml-1">Stream (Optional)</Label>
                                        <Select onValueChange={(value) => setValue('streamId', parseInt(value))} value={formData.streamId?.toString()}>
                                            <SelectTrigger className="h-12 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl">
                                                <SelectValue placeholder="Select stream" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                {streams.map((stream) => (
                                                    <SelectItem key={stream.id} value={stream.id.toString()}>
                                                        {stream.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="linNumber" className="text-sm font-bold text-slate-700 ml-1">LIN Number (Optional)</Label>
                                        <div className="relative group">
                                            <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            <Input id="linNumber" {...register('linNumber')} placeholder="e.g. LIN12345678" className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        </div>
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="schoolPayCode" className="text-sm font-bold text-slate-700 ml-1">SchoolPay Code (Optional)</Label>
                                        <div className="relative group">
                                            <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            <Input id="schoolPayCode" {...register('schoolPayCode')} placeholder="e.g. SPC123456" className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Guardian Information */}
                            <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden">
                                <CardHeader className="border-b border-slate-100 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-50 shadow-sm rounded-xl">
                                            <Shield className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold text-slate-900">Guardian Information</CardTitle>
                                            <CardDescription className="text-slate-500">Emergency contact and guardian details.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2.5">
                                        <Label htmlFor="guardianName" className="text-sm font-bold text-slate-700 ml-1">Guardian Name <span className="text-red-500">*</span></Label>
                                        <div className="relative group">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                            <Input id="guardianName" {...register('guardianName')} className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        </div>
                                        {errors.guardianName && <p className="text-xs font-medium text-red-500 ml-1">{errors.guardianName.message}</p>}
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="guardianRelationship" className="text-sm font-bold text-slate-700 ml-1">Relationship <span className="text-red-500">*</span></Label>
                                        <Select onValueChange={(value) => setValue('guardianRelationship', value)} defaultValue={formData.guardianRelationship}>
                                            <SelectTrigger className="h-12 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl">
                                                <SelectValue placeholder="Select relationship" />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-xl">
                                                <SelectItem value="Father">Father</SelectItem>
                                                <SelectItem value="Mother">Mother</SelectItem>
                                                <SelectItem value="Guardian">Guardian</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.guardianRelationship && <p className="text-xs font-medium text-red-500 ml-1">{errors.guardianRelationship.message}</p>}
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="guardianPhone" className="text-sm font-bold text-slate-700 ml-1">Guardian Phone <span className="text-red-500">*</span></Label>
                                        <div className="relative group">
                                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                            <Input id="guardianPhone" {...register('guardianPhone')} className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        </div>
                                        {errors.guardianPhone && <p className="text-xs font-medium text-red-500 ml-1">{errors.guardianPhone.message}</p>}
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="guardianEmail" className="text-sm font-bold text-slate-700 ml-1">Guardian Email</Label>
                                        <div className="relative group">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                            <Input id="guardianEmail" type="email" {...register('guardianEmail')} className="h-12 pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                        </div>
                                        {errors.guardianEmail && <p className="text-xs font-medium text-red-500 ml-1">{errors.guardianEmail.message}</p>}
                                    </div>
                                    <div className="space-y-2.5 md:col-span-2">
                                        <Label htmlFor="guardianAddress" className="text-sm font-bold text-slate-700 ml-1">Guardian Address</Label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-3.5 top-4 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                            <Textarea id="guardianAddress" {...register('guardianAddress')} className="min-h-[80px] pl-11 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl resize-none py-3" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Additional Information */}
                            <Card className="border-slate-200/60 shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-900/5 overflow-hidden">
                                <CardHeader className="border-b border-slate-100 pb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-50 shadow-sm rounded-xl">
                                            <AlertCircle className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-bold text-slate-900">Additional Information</CardTitle>
                                            <CardDescription className="text-slate-500">Health and other records.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2.5">
                                        <Label htmlFor="medicalConditions" className="text-sm font-bold text-slate-700 ml-1">Medical Conditions</Label>
                                        <Textarea id="medicalConditions" {...register('medicalConditions')} placeholder="Allergies or situations to be aware of..." className="min-h-[80px] bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl resize-none" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="specialNeeds" className="text-sm font-bold text-slate-700 ml-1">Special Needs</Label>
                                        <Textarea id="specialNeeds" {...register('specialNeeds')} placeholder="Any special educational needs..." className="min-h-[80px] bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl resize-none" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="previousSchool" className="text-sm font-bold text-slate-700 ml-1">Previous School</Label>
                                        <Input id="previousSchool" {...register('previousSchool')} className="h-12 bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label htmlFor="notes" className="text-sm font-bold text-slate-700 ml-1">Additional Notes</Label>
                                        <Textarea id="notes" {...register('notes')} className="min-h-[80px] bg-white/50 border-slate-200 focus:bg-white transition-all rounded-xl resize-none" />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Submit Actions */}
                            <div className="flex items-center justify-end gap-4 pt-6">
                                <Button type="button" variant="ghost" className="h-12 px-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl font-bold" onClick={() => router.back()}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="h-12 px-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/20 border-0 transition-all hover:scale-[1.02] active:scale-95 rounded-xl font-bold"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5 mr-2" /> {isEditMode ? 'Update Student' : 'Register Student'}
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

export default function AddStudentForm() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>}>
            <AddStudentFormContent />
        </Suspense>
    );
}