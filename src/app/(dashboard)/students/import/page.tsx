"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Clock, XCircle, FileText, Download, UploadCloud, Loader2, Table, ChevronRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { studentActions } from "@/lib/electron"
import Link from "next/link"

interface ParsedStudent {
    firstName: string
    lastName: string
    gender: string
    dateOfBirth?: string
    nationality?: string
    admissionNumber?: string
    admissionDate?: string
    class?: string
    stream?: string
    guardianName?: string
    guardianRelationship?: string
    guardianPhone?: string
    guardianEmail?: string
    address?: string
    linNumber?: string
    schoolPayCode?: string
    previousSchool?: string
}

interface ImportResult {
    success: number
    failed: number
    errors: { row: number; error: string }[]
}

export default function BulkImportPage() {
    const [file, setFile] = useState<File | null>(null)
    const [parsedData, setParsedData] = useState<ParsedStudent[]>([])
    const [isParting, setIsParsing] = useState(false)
    const [isImporting, setIsImporting] = useState(false)
    const [importResult, setImportResult] = useState<ImportResult | null>(null)
    const [dragActive, setDragActive] = useState(false)
    const [admissionPrefix, setAdmissionPrefix] = useState('STU')
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        studentActions.getAdmissionPrefix().then((p: string) => {
            if (p) setAdmissionPrefix(p)
        }).catch((error: unknown) => {
            console.error("Failed to fetch admission prefix:", error)
        })
    }, [])

    const parseCSV = (text: string): ParsedStudent[] => {
        const lines = text.trim().split(/\r?\n/)
        if (lines.length < 2) return []

        // Robust CSV splitter that handles quoted values with commas
        const splitCSV = (line: string) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim().replace(/^"|"$/g, ''));
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim().replace(/^"|"$/g, ''));
            return result;
        };

        const headers = splitCSV(lines[0]).map(h => h.toLowerCase());
        const students: ParsedStudent[] = []

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = splitCSV(lines[i]);
            const student: Partial<ParsedStudent> = {}

            headers.forEach((header, index) => {
                const value = values[index] || ''
                // Map common column names
                if (header === 'firstname' || (header.includes('first') && header.includes('name'))) student.firstName = value
                else if (header === 'lastname' || (header.includes('last') && header.includes('name'))) student.lastName = value
                else if (header === 'gender' || header === 'sex') student.gender = value
                else if (header === 'dob' || header.includes('birth')) student.dateOfBirth = value
                else if (header.includes('nation')) student.nationality = value
                else if (header.includes('admission date') || (header.includes('admission') && header.includes('date'))) student.admissionDate = value
                else if (header.includes('admission number') || header.includes('adm no') || header.includes('admin no') || header === 'admission') student.admissionNumber = value
                else if (header === 'class' || header === 'grade') student.class = value
                else if (header === 'stream' || header === 'section') student.stream = value
                else if (header.includes('guardian') && (header.includes('relation') || header.includes('type'))) student.guardianRelationship = value
                else if (header.includes('phone') || header.includes('contact') || header.includes('tel')) student.guardianPhone = value
                else if (header.includes('guardian') && (header.includes('name') || header.includes('parent'))) student.guardianName = value
                else if (header.includes('email')) student.guardianEmail = value
                else if (header.includes('address')) student.address = value
                else if (header === 'lin' || header.includes('lin number') || header.includes('lin no') || header.includes('lin_')) student.linNumber = value
                else if (header.includes('paycode') || header.includes('schoolpay') || header.includes('school pay')) student.schoolPayCode = value
                else if (header.includes('previous') && header.includes('school')) student.previousSchool = value
            })

            if (student.firstName && student.lastName && student.gender) {
                students.push(student as ParsedStudent)
            }
        }

        return students
    }

    const handleFileChange = async (selectedFile: File) => {
        setFile(selectedFile)
        setImportResult(null)
        setParsedData([])

        if (selectedFile.name.endsWith('.csv')) {
            setIsParsing(true)
            try {
                const text = await selectedFile.text()
                const parsed = parseCSV(text)
                setParsedData(parsed)
                if (parsed.length > 0) {
                    toast.success(`Parsed ${parsed.length} students from file`)
                } else {
                    toast.error("No valid student data found in file")
                }
            } catch (error: unknown) {
                console.error("Failed to parse file:", error)
                toast.error("Failed to parse file")
            } finally {
                setIsParsing(false)
            }
        } else {
            toast.error("Please upload a CSV file. Excel support coming soon.")
        }
    }

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0])
        }
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileChange(e.target.files[0])
        }
    }

    const handleImport = async () => {
        if (parsedData.length === 0) {
            toast.error("No data to import")
            return
        }

        setIsImporting(true)
        try {
            const result = await studentActions.bulkImport(parsedData) as any
            setImportResult(result)
            if (result.success > 0) {
                toast.success(`Successfully imported ${result.success} students`)
            }
            if (result.failed > 0) {
                toast.error(`Failed to import ${result.failed} students`)
            }
        } catch (error: unknown) {
            console.error("Import failed:", error)
            toast.error("Import failed. Please try again.")
        } finally {
            setIsImporting(false)
        }
    }

    const downloadTemplate = () => {
        const year = new Date().getFullYear()
        const headers = "First Name,Last Name,Gender,Date of Birth,Nationality,Admission Number,Admission Date,Class,Stream,Guardian Name,Guardian Relationship,Guardian Phone,Guardian Email,Address,LIN Number,SchoolPay Code,Previous School"
        const row1 = `John,Doe,Male,2015-05-10,Ugandan,${admissionPrefix}/${year}/001,${year}-02-01,Primary One,North,"Jane Doe",Mother,+256700123456,jane.doe@example.com,"Kampala, Uganda",LIN12345678,SPC123456,St. Peters Academy`
        const row2 = `Mary,Smith,Female,2014-08-22,Kenyan,${admissionPrefix}/${year}/002,${year}-02-01,Primary Two,South,"James Smith",Father,+256701234567,james.smith@example.com,"Entebbe, Uganda",LIN87654321,SPC654321,Greenhill Primary`
        const template = `${headers}\n${row1}\n${row2}`

        const blob = new Blob([template], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'student_import_template.csv'
        a.click()
        URL.revokeObjectURL(url)
        toast.success("Template downloaded")
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/50 relative overflow-hidden font-sans p-6 md:p-8">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-100/30 blur-[120px] rounded-full -z-10 pointer-events-none" />

            <div className="max-w-6xl mx-auto space-y-8 pb-12">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <Link href="/dashboard" className="hover:text-emerald-600 transition-colors">Dashboard</Link>
                    <ChevronRight className="h-3 w-3" />
                    <Link href="/students" className="hover:text-emerald-600 transition-colors">Students</Link>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-emerald-600 font-bold">Import</span>
                </nav>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Bulk Import Students</h1>
                        <p className="text-slate-500 text-base max-w-2xl font-medium leading-relaxed">
                            Efficiently onboard multiple students by uploading a CSV file with their enrollment details.
                        </p>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-8">
                        <Alert className="bg-emerald-50/80 border-emerald-200 text-emerald-800 backdrop-blur-sm shadow-sm rounded-xl">
                            <AlertCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                            <AlertTitle className="text-emerald-900 font-bold text-base ml-2">Important Instructions</AlertTitle>
                            <AlertDescription className="text-emerald-700 mt-3 text-sm leading-relaxed ml-2">
                                <ul className="list-disc pl-4 space-y-1.5 marker:text-emerald-400">
                                    <li>Required columns: <strong className="font-semibold text-emerald-900">First Name, Last Name, Gender, Class, Admission Number, Admission Date, Nationality, Guardian Name, Guardian Relationship, Guardian Phone</strong>.</li>
                                    <li>Optional columns: Stream, Date of Birth, Guardian Email, Address, LIN Number, SchoolPay Code.</li>
                                    <li>Maximum file size: <strong className="font-semibold text-emerald-900">10MB</strong>.</li>
                                    <li>Supported format: <strong className="font-semibold text-emerald-900">.csv</strong>.</li>
                                </ul>
                            </AlertDescription>
                        </Alert>

                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 overflow-hidden">
                            <CardHeader className="border-b border-slate-100 pb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                                        <UploadCloud className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl text-slate-800">Upload File</CardTitle>
                                        <CardDescription className="text-slate-500">Drag and drop your file here or click to browse.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-emerald-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
                                    <div
                                        className={cn(
                                            "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 transition-all cursor-pointer",
                                            dragActive ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-slate-50/50 hover:bg-white hover:border-emerald-400",
                                            file ? "border-emerald-400 bg-emerald-50/50" : ""
                                        )}
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".csv"
                                            onChange={handleInputChange}
                                            className="hidden"
                                        />
                                        {isParting ? (
                                            <Loader2 className="h-12 w-12 text-emerald-600 animate-spin" />
                                        ) : file ? (
                                            <>
                                                <div className="mx-auto h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm">
                                                    <FileSpreadsheet className="h-10 w-10 text-emerald-600" />
                                                </div>
                                                <div className="mt-6 text-center space-y-2">
                                                    <p className="text-lg font-semibold text-slate-700">{file.name}</p>
                                                    <p className="text-sm text-emerald-600 font-medium">{parsedData.length} students ready to import</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="mx-auto h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-100 transition-all duration-300 shadow-sm">
                                                    <Upload className="h-10 w-10 text-emerald-600" aria-hidden="true" />
                                                </div>
                                                <div className="mt-6 text-center space-y-2">
                                                    <p className="text-lg font-semibold text-slate-700">
                                                        <span className="text-emerald-600 hover:underline">Click to upload</span> or drag and drop
                                                    </p>
                                                    <p className="text-sm text-slate-500">CSV file up to 10MB</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Preview Table */}
                                {parsedData.length > 0 && (
                                    <div className="mt-8 border border-slate-200 rounded-xl overflow-hidden">
                                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
                                            <Table className="h-4 w-4 text-slate-500" />
                                            <span className="text-sm font-semibold text-slate-700">Preview (First 5 rows)</span>
                                        </div>
                                        <div className="overflow-x-auto rounded-xl border border-emerald-100 shadow-sm">
                                            <table className="w-full text-sm border-collapse">
                                                <thead className="bg-emerald-600">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-bold text-white border-r border-emerald-500/30">First Name</th>
                                                        <th className="px-4 py-3 text-left font-bold text-white border-r border-emerald-500/30">Last Name</th>
                                                        <th className="px-4 py-3 text-left font-bold text-white border-r border-emerald-500/30">Gender</th>
                                                        <th className="px-4 py-3 text-left font-bold text-white border-r border-emerald-500/30">DOB</th>
                                                        <th className="px-4 py-3 text-left font-bold text-white">Guardian</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {parsedData.slice(0, 5).map((student, i) => (
                                                        <tr key={i} className={cn(
                                                            "border-b border-emerald-100/50 transition-colors hover:bg-emerald-50",
                                                            i % 2 === 0 ? "bg-white" : "bg-emerald-50/30"
                                                        )}>
                                                            <td className="px-4 py-3 text-slate-700 font-medium border-r border-emerald-100/50">{student.firstName}</td>
                                                            <td className="px-4 py-3 text-slate-700 font-medium border-r border-emerald-100/50">{student.lastName}</td>
                                                            <td className="px-4 py-3 text-slate-700 border-r border-emerald-100/50">
                                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{student.gender}</Badge>
                                                            </td>
                                                            <td className="px-4 py-3 text-slate-700 border-r border-emerald-100/50">{student.dateOfBirth || '-'}</td>
                                                            <td className="px-4 py-3 text-slate-700">{student.guardianName || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Import Result */}
                                {importResult && (
                                    <Alert className={cn(
                                        "mt-6 rounded-xl",
                                        importResult.failed === 0 ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"
                                    )}>
                                        {importResult.failed === 0 ? (
                                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                        ) : (
                                            <AlertCircle className="h-5 w-5 text-amber-600" />
                                        )}
                                        <AlertTitle className="font-bold">Import Complete</AlertTitle>
                                        <AlertDescription className="mt-2">
                                            <p>Successfully imported: <strong>{importResult.success}</strong> students</p>
                                            {importResult.failed > 0 && (
                                                <>
                                                    <p>Failed: <strong>{importResult.failed}</strong> students</p>
                                                    <ul className="mt-2 text-sm">
                                                        {importResult.errors.slice(0, 5).map((err, i) => (
                                                            <li key={i}>Row {err.row}: {err.error}</li>
                                                        ))}
                                                    </ul>
                                                </>
                                            )}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-slate-100">
                                    <Button
                                        variant="outline"
                                        className="w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 h-11 rounded-xl"
                                        onClick={downloadTemplate}
                                    >
                                        <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                                        Download Template
                                    </Button>
                                    <Button
                                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 h-11 px-8 rounded-xl transition-all hover:scale-[1.02] disabled:opacity-50"
                                        onClick={handleImport}
                                        disabled={parsedData.length === 0 || isImporting}
                                    >
                                        {isImporting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Importing...
                                            </>
                                        ) : (
                                            <>Start Import</>
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-none shadow-xl shadow-slate-200/40 bg-white/80 backdrop-blur-xl ring-1 ring-slate-200/50 h-full">
                            <CardHeader className="border-b border-slate-100 pb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg text-slate-800">Quick Tips</CardTitle>
                                        <CardDescription className="text-slate-500">For successful imports</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <ul className="space-y-4 text-sm text-slate-600">
                                    <li className="flex gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                        <span>Use column headers: First Name, Last Name, Gender</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                        <span>Date format: YYYY-MM-DD (e.g., 2015-05-10)</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                        <span>Gender values: Male or Female</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                                        <span>Download the template for reference</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}

