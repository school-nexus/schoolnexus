// No top-level imports for heavy libraries

export interface SchoolProfile {
    name: string
    registrationNumber: string
    email: string
    phone: string
    address: string
    website: string
    facebook: string
    twitter: string
    linkedin: string
    logo: string
    currency?: string
    motto?: string
}

// Extended type for jsPDF with autotable plugin
type jsPDFWithPlugin = any & { // Use any as base because jsPDF is dynamically imported
    internal: {
        getNumberOfPages: () => number
    }
    lastAutoTable?: {
        finalY: number
    }
}

export interface Student {
    id: number
    firstName: string
    lastName: string
    admissionNumber: string
    gender?: string
    className?: string
    streamName?: string
    termName?: string
    photo?: string
    dateOfBirth?: string
}

export interface Mark {
    subjectName: string
    score: number
    grade?: string
    remarks?: string
    examName?: string
    initials?: string
}

export interface Performance {
    total: number
    average: number
    rank: string | number
    aggregates?: string | number
    division?: string | number
}

export interface AttendanceData {
    present: number
    total: number
}

export interface ReportData {
    student: Student
    marks: Mark[]
    performance: Performance
    attendance: AttendanceData
    gradingScales?: any[]
    schoolInfo?: SchoolProfile
    termName?: string
    year?: string
}
    
export interface ExportColumn {
    header: string
    dataKey: string
}

export interface ExportOptions {
    title: string
    subtitle?: string
    filename: string
    columns: ExportColumn[]
    data: Record<string, unknown>[]
    orientation?: "p" | "l"
}

export const reportUtils = {
    exportToPDF: async ({ title, subtitle, filename, columns, data, orientation = "p" }: ExportOptions) => {
        const { default: jsPDF } = await import("jspdf")
        const { default: autoTable } = await import("jspdf-autotable")
        
        const doc = new jsPDF(orientation) as jsPDFWithPlugin

        // Header
        doc.setFontSize(20)
        doc.setTextColor(16, 185, 129) // Emerald-600
        doc.text(title, 14, 22)

        if (subtitle) {
            doc.setFontSize(10)
            doc.setTextColor(100)
            doc.text(subtitle, 14, 30)
        }

        // Date
        doc.setFontSize(10)
        doc.setTextColor(100)
        doc.text(`Generated on: ${new Date().toLocaleString()}`, doc.internal.pageSize.width - 14, 22, { align: "right" })

        autoTable(doc, {
            startY: subtitle ? 35 : 30,
            head: [columns.map((col: ExportColumn) => col.header)],
            body: data.map((row: Record<string, unknown>) => columns.map((col: ExportColumn) => row[col.dataKey] || "N/A")),
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [16, 185, 129], textColor: 255 }, // Emerald-600
            alternateRowStyles: { fillColor: [248, 250, 252] }, // Slate-50
            margin: { top: 30 },
            didDrawPage: (data: { settings: { margin: { left: number } } }) => {
                // Footer
                const str = "Page " + doc.internal.getNumberOfPages()
                doc.setFontSize(8)
                const pageSize = doc.internal.pageSize
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight()
                doc.text(str, data.settings.margin.left, pageHeight - 10)
            }
        })

        doc.save(`${filename}.pdf`)
    },

    exportToExcel: async ({ filename, columns, data }: Omit<ExportOptions, "title" | "subtitle" | "orientation">) => {
        const XLSX = await import("xlsx")
        
        // Prepare data for Excel
        const excelData = data.map((row: Record<string, unknown>) => {
            const newRow: Record<string, unknown> = {}
            columns.forEach((col: ExportColumn) => {
                newRow[col.header] = row[col.dataKey] || "N/A"
            })
            return newRow
        })

        const worksheet = XLSX.utils.json_to_sheet(excelData)
        const workbook = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(workbook, worksheet, "Report")

        // Auto-size columns
        const maxWidths = excelData.reduce((acc: number[], row: Record<string, unknown>) => {
            Object.keys(row).forEach((key, i) => {
                const width = Math.max(acc[i] || 0, String(row[key] || "").length)
                acc[i] = width
            })
            return acc
        }, [])
        worksheet["!cols"] = maxWidths.map((w: number) => ({ wch: w + 2 }))

        XLSX.writeFile(workbook, `${filename}.xlsx`)
    },

    generateReportCardPDF: async (reportData: ReportData[], schoolInfo: SchoolProfile) => {
        const { default: jsPDF } = await import("jspdf")
        const { default: autoTable } = await import("jspdf-autotable")
        
        const doc = new jsPDF() as jsPDFWithPlugin

        reportData.forEach((data, index) => {
            if (index > 0) doc.addPage()

            // Header
            doc.setFontSize(22)
            doc.setTextColor(16, 185, 129) // Emerald-600
            doc.text(schoolInfo.name || "SCHOOL NEXUS MS", 105, 20, { align: 'center' })

            doc.setFontSize(10)
            doc.setTextColor(100)
            doc.text(`${schoolInfo.address || ''} | ${schoolInfo.phone || ''} | ${schoolInfo.email || ''}`, 105, 28, { align: 'center' })

            doc.setDrawColor(200)
            doc.line(20, 35, 190, 35)

            doc.setFontSize(16)
            doc.setTextColor(30)
            doc.text("STUDENT PROGRESS REPORT", 105, 45, { align: 'center' })

            // Student info
            doc.setFontSize(11)
            doc.setTextColor(50)
            doc.text(`Name: ${data.student.firstName} ${data.student.lastName}`, 20, 60)
            doc.text(`Adm No: ${data.student.admissionNumber}`, 20, 68)
            doc.text(`Class: ${data.student.className || 'N/A'}`, 130, 60)
            doc.text(`Term: ${data.student.termName || 'N/A'}`, 130, 68)

            // Marks table
            autoTable(doc, {
                startY: 75,
                head: [['Subject', 'Score', 'Grade', 'Remarks']],
                body: data.marks.map((m: Mark) => [
                    m.subjectName,
                    m.score,
                    m.grade || 'N/A',
                    m.remarks || ''
                ]),
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] }, // Emerald-600
                styles: { fontSize: 10, cellPadding: 4 }
            })

            // Summary
            const finalY = doc.lastAutoTable?.finalY || 150
            doc.setFontSize(12)
            doc.setTextColor(20)
            doc.text("PERFORMANCE SUMMARY", 20, finalY + 15)

            doc.setFontSize(11)
            doc.text(`Total Marks: ${data.performance.total}`, 20, finalY + 25)
            doc.text(`Average Score: ${data.performance.average}%`, 20, finalY + 33)
            doc.text(`Position in Class: ${data.performance.rank}`, 130, finalY + 25)

            // Attendance
            doc.text(`Attendance: ${data.attendance.present} / ${data.attendance.total} days present`, 20, finalY + 45)

            // Footer
            doc.setFontSize(10)
            doc.setDrawColor(150)
            doc.line(20, 240, 80, 240)
            doc.text("Class Teacher's Signature", 20, 245)

            doc.line(130, 240, 190, 240)
            doc.text("Headteacher's Signature", 130, 245)

            doc.setFontSize(8)
            doc.setTextColor(150)
            doc.text(`Report generated on ${new Date().toLocaleDateString()}`, 105, 280, { align: 'center' })
        })

        doc.save(`Term_Report_${new Date().getTime()}.pdf`)
    }
}
