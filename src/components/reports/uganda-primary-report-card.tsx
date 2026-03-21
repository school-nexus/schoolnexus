import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  calculateSubjectTotal,
  calculateSubjectAverage,
  calculateTotalMarks,
  calculateAggregates,
  determineDivision,
  formatAttendance
} from '@/lib/reportCardUtils'

interface UgandaPrimaryReportCardProps {
  studentData?: any
  examData?: any
  schoolData?: any
  examColumns?: any[]
  reportTitle?: string
  printSettings?: any
  // Database integration props
  useDatabaseData?: boolean
  studentId?: number
  termId?: number
}

const UgandaPrimaryReportCard: React.FC<UgandaPrimaryReportCardProps> = ({
  studentData,
  examData,
  schoolData,
  examColumns = [],
  reportTitle = 'TERMINAL REPORT CARD',
  printSettings = {},
  useDatabaseData = false,
  studentId,
  termId
}) => {
  // Database integration state
  const [databaseData, setDatabaseData] = useState<any>(null)
  const [dbLoading, setDbLoading] = useState(false)

  // Load report data from database
  const loadReportData = async (studentId: number, termId?: number) => {
    setDbLoading(true)
    try {
      const params = new URLSearchParams({ studentId: studentId.toString() })
      if (termId) {
        params.append('termId', termId.toString())
      }

      const response = await fetch(`/api/reports/student-report?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDatabaseData(data)
      }
    } catch (error) {
      console.error('Failed to fetch report data:', error)
    } finally {
      setDbLoading(false)
    }
  }

  // Load data when database mode is enabled
  useEffect(() => {
    if (useDatabaseData && studentId) {
      loadReportData(studentId, termId)
    }
  }, [useDatabaseData, studentId, termId])

  // Use database data or provided props
  const currentStudentData = databaseData?.studentInfo || studentData
  const currentExamData = databaseData?.marks || examData
  const currentSchoolData = databaseData?.schoolInfo || schoolData

  // Default data if not provided
  const defaultStudentData = {
    name: 'John Doe',
    gender: 'Male',
    dateOfBirth: '12/03/2014',
    class: 'P.5 Blue',
    registrationNumber: '2024/045',
    attendance: { present: 80, total: 90 },
    photoUrl: '',
    qrCodeUrl: ''
  }

  const defaultExamData = {
    term: '1',
    year: '2025',
    subjects: [
      { name: 'English', bot: 40, mid: 50, eot: 65, total: 155, average: 52, grade: 'C6', remarks: 'Fair', teacherInitials: 'AB' },
      { name: 'Mathematics', bot: 60, mid: 70, eot: 75, total: 205, average: 68, grade: 'C4', remarks: 'Good', teacherInitials: 'CD' },
      { name: 'Science', bot: 55, mid: 65, eot: 72, total: 192, average: 64, grade: 'C4', remarks: 'Consistent', teacherInitials: 'EF' },
      { name: 'Social Studies', bot: 48, mid: 60, eot: 70, total: 178, average: 59, grade: 'C5', remarks: 'Improving', teacherInitials: 'GH' }
    ],
    totals: { totalMarks: 730, aggregates: 21, division: 2 },
    position: { rank: 5, outOf: 42 },
    classTeacherComment: 'Good progress, needs focus on Science',
    headTeacherComment: 'Promoted to next class',
    fees: { debts: 'UGX 150,000' },
    nextTerm: { opensOn: '15th May 2025', requirements: ['Math set', 'Ream paper'] }
  }

  const defaultSchoolData = {
    name: 'CREAMLAND PRIMARY SCHOOL',
    address: 'P.O. Box 123, Kampala, Uganda',
    contact: 'Tel: +256 123 456 789 | Email: info@creamlandps.ug',
    logoUrl: '',
    motto: 'Knowledge is Power'
  }

  const student = { ...defaultStudentData, ...currentStudentData }
  const exam = { ...defaultExamData, ...currentExamData }
  const school = { ...defaultSchoolData, ...currentSchoolData }

  // Default exam columns if not provided
  const enabledExamColumns = examColumns.length > 0
    ? examColumns.filter((col: any) => col.enabled)
    : [
        { id: 'bot', label: 'B.O.T', enabled: true },
        { id: 'mid', label: 'MID', enabled: true },
        { id: 'eot', label: 'E.O.T', enabled: true }
      ]

  // Extract just the IDs of enabled columns for calculations
  const enabledColumnIds = enabledExamColumns.map((col: any) => col.id)

  // Calculate totals if not provided
  const totalMarks = exam.totals?.totalMarks || calculateTotalMarks(exam.subjects)
  const aggregates = exam.totals?.aggregates || calculateAggregates(exam.subjects)
  const division = exam.totals?.division || determineDivision(aggregates)

  // Calculate column widths to maintain table width
  const totalColumns = 1 + enabledExamColumns.length + 5 // Subject + Exam columns + Total + Average + Grade + Remarks + Teacher Initials
  const subjectColumnWidth = 25 // Allocate 25% width to subject column
  const remainingWidth = 100 - subjectColumnWidth
  const otherColumnWidth = remainingWidth / (totalColumns - 1)

  return (
    <div className="report-card font-sans max-w-4xl mx-auto bg-white border-2 border-gray-300 shadow-lg" style={{
      width: '210mm',
      height: '297mm',
      padding: '15mm',
      fontFamily: 'Arial, Calibri, "Noto Sans", sans-serif',
      fontSize: '11pt',
      backgroundColor: 'white',
      boxSizing: 'border-box',
      margin: '0 auto',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div className="header flex justify-between items-start mb-6 flex-shrink-0">
        <div className="left-section" style={{ width: '20%' }}>
          {printSettings.includeSchoolLogo && school.logoUrl !== null && (
            school.logoUrl ? (
              <img src={school.logoUrl} alt="School Logo" className="logo-img" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
            ) : (
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-20 h-20" />
            )
          )}
        </div>

        <div className="center-section text-center" style={{ width: '60%' }}>
          <h1 className="text-2xl font-bold uppercase mb-2" style={{ fontSize: '19pt' }}>{school.name}</h1>
          <p className="text-sm mb-1" style={{ fontSize: '12pt', marginBottom: '2px' }}>{school.address}</p>
          <p className="text-sm mb-1" style={{ fontSize: '12pt', marginBottom: '2px' }}>{school.contact}</p>
          <h2 className="text-lg font-bold mb-1" style={{ fontSize: '13pt' }}>{reportTitle}</h2>
          <p className="text-sm" style={{ fontSize: '12pt' }}>TERM {exam.term} – {exam.year}</p>
        </div>

        <div className="right-section text-right" style={{ width: '20%' }}>
          {student.photoUrl !== null && (
            student.photoUrl ? (
              <img src={student.photoUrl} alt="Student Photo" className="photo-img" style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
            ) : (
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-28 h-28 ml-auto" />
            )
          )}
        </div>
      </div>

      {/* Pupil Information Block */}
      <Card className="mb-6 flex-shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Name:</span>
                <span>{student.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Gender:</span>
                <span>{student.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Date of Birth:</span>
                <span>{student.dateOfBirth}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Class:</span>
                <span>{student.class}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Registration No.:</span>
                <span>{student.registrationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Attendance:</span>
                <span>{formatAttendance(student.attendance)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            {student.qrCodeUrl !== null && (
              student.qrCodeUrl ? (
                <img src={student.qrCodeUrl} alt="QR Code" className="qr-img" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
              ) : (
                <div className="bg-gray-200 border-2 border-dashed rounded w-20 h-20" />
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Academic Performance Table */}
      <Card className="mb-6 flex-shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Academic Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-center font-semibold">Subject</th>
                  {enabledExamColumns.map((column: any) => (
                    <th key={column.id} className="border border-gray-300 p-2 text-center font-semibold">
                      {column.label}
                    </th>
                  ))}
                  <th className="border border-gray-300 p-2 text-center font-semibold">Total</th>
                  <th className="border border-gray-300 p-2 text-center font-semibold">Average</th>
                  <th className="border border-gray-300 p-2 text-center font-semibold">Grade</th>
                  <th className="border border-gray-300 p-2 text-center font-semibold">Remarks</th>
                  <th className="border border-gray-300 p-2 text-center font-semibold">Teacher</th>
                </tr>
              </thead>
              <tbody>
                {exam.subjects.map((subject: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2 font-medium">{subject.name}</td>
                    {enabledExamColumns.map((column: any) => (
                      <td key={column.id} className="border border-gray-300 p-2 text-center">
                        {subject[column.id] !== undefined && subject[column.id] !== null && subject[column.id] !== '-' ? subject[column.id] : ''}
                      </td>
                    ))}
                    <td className="border border-gray-300 p-2 text-center font-semibold">{calculateSubjectTotal(subject)}</td>
                    <td className="border border-gray-300 p-2 text-center font-semibold">{calculateSubjectAverage(subject, enabledColumnIds)}</td>
                    <td className="border border-gray-300 p-2 text-center">
                      <Badge variant="outline">{subject.grade}</Badge>
                    </td>
                    <td className="border border-gray-300 p-2 text-center">{subject.remarks}</td>
                    <td className="border border-gray-300 p-2 text-center">{subject.teacherInitials}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td className="border border-gray-300 p-2 text-right" colSpan={1 + enabledExamColumns.length}>TOTALS</td>
                  <td className="border border-gray-300 p-2 text-center">{totalMarks}</td>
                  <td className="border border-gray-300 p-2 text-center"></td>
                  <td className="border border-gray-300 p-2 text-center"></td>
                  <td className="border border-gray-300 p-2 text-center"></td>
                  <td className="border border-gray-300 p-2 text-center"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalMarks}</div>
            <div className="text-sm text-gray-600">Total Marks</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{aggregates}</div>
            <div className="text-sm text-gray-600">Aggregates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{division}</div>
            <div className="text-sm text-gray-600">Division</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{exam.position.rank}/{exam.position.outOf}</div>
            <div className="text-sm text-gray-600">Position</div>
          </CardContent>
        </Card>
      </div>

      {/* Grading Scale */}
      <Card className="mb-6 flex-shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">UNEB Grading Scale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
            <div className="p-2 bg-green-100 rounded">
              <div className="font-bold text-green-800">90-100: D1</div>
            </div>
            <div className="p-2 bg-blue-100 rounded">
              <div className="font-bold text-blue-800">80-89: D2</div>
            </div>
            <div className="p-2 bg-yellow-100 rounded">
              <div className="font-bold text-yellow-800">70-79: C3</div>
            </div>
            <div className="p-2 bg-orange-100 rounded">
              <div className="font-bold text-orange-800">60-69: C4</div>
            </div>
            <div className="p-2 bg-red-100 rounded">
              <div className="font-bold text-red-800">55-59: C5</div>
            </div>
            <div className="p-2 bg-pink-100 rounded">
              <div className="font-bold text-pink-800">50-54: C6</div>
            </div>
            <div className="p-2 bg-purple-100 rounded">
              <div className="font-bold text-purple-800">45-49: P7</div>
            </div>
            <div className="p-2 bg-gray-100 rounded">
              <div className="font-bold text-gray-800">0-39: F9</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Remarks Section */}
      <div className="space-y-4 mb-6 flex-shrink-0">
        {exam.classTeacherComment && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Class Teacher&apos;s Comment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{exam.classTeacherComment}</p>
              <div className="flex justify-between text-sm">
                <div>
                  <div className="border-b border-gray-300 w-32 inline-block mr-4">Name: ________________</div>
                  <div className="border-b border-gray-300 w-24 inline-block">Date: ________</div>
                </div>
                <div>
                  <div className="border-b border-gray-300 w-32 inline-block">Signature: ________________</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {exam.headTeacherComment && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Head Teacher&apos;s Comment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{exam.headTeacherComment}</p>
              <div className="flex justify-between text-sm">
                <div>
                  <div className="border-b border-gray-300 w-32 inline-block mr-4">Name: ________________</div>
                  <div className="border-b border-gray-300 w-24 inline-block">Date: ________</div>
                </div>
                <div>
                  <div className="border-b border-gray-300 w-32 inline-block">Signature: ________________</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fees & Next Term Info */}
      {(exam.fees || exam.nextTerm) && (
        <Card className="mb-6 flex-shrink-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold">Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exam.fees && (
                <div className="flex justify-between p-3 bg-red-50 border border-red-200 rounded">
                  <span className="font-medium">Outstanding Fees:</span>
                  <span className="font-semibold text-red-700">{exam.fees.debts}</span>
                </div>
              )}
              {exam.nextTerm && exam.nextTerm.opensOn && (
                <div className="flex justify-between p-3 bg-blue-50 border border-blue-200 rounded">
                  <span className="font-medium">Next Term Opens:</span>
                  <span className="font-semibold text-blue-700">{exam.nextTerm.opensOn}</span>
                </div>
              )}
              {exam.nextTerm && exam.nextTerm.requirements && exam.nextTerm.requirements.length > 0 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="font-medium mb-2">Requirements for Next Term:</div>
                  <ul className="list-disc list-inside text-sm text-green-700">
                    {exam.nextTerm.requirements.map((req: string, index: number) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="mt-auto pt-6 border-t-2 border-gray-300 flex-shrink-0">
        <div className="text-center">
          <div className="flex justify-end mb-4">
            <div className="text-sm">
              <span className="font-medium">School Stamp:</span>
              <div className="border-b-2 border-gray-400 w-32 inline-block ml-2"></div>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-lg font-semibold italic text-gray-700">&ldquo;{school.motto}&rdquo;</p>
          </div>
          <div className="text-sm text-gray-600">
            <p>Primary Leaving Examination Certificate</p>
            <p className="mt-2">Certificate ID: PLE-{student.registrationNumber}-{exam.year}</p>
            <p>Issue Date: {new Date().toLocaleDateString('en-UG')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UgandaPrimaryReportCard