import React from 'react'
import { 
  calculateSubjectTotal, 
  calculateSubjectAverage, 
  calculateTotalMarks,
  calculateAggregates,
  determineDivision,
  formatAttendance
} from '../../../../lib/reportCardUtils'

const UgandaPrimaryReportCard = ({ studentData, examData, schoolData, examColumns = [], reportTitle = 'TERMINAL REPORT CARD', printSettings = {} }) => {
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

  const student = { ...defaultStudentData, ...studentData }
  const exam = { ...defaultExamData, ...examData }
  const school = { ...defaultSchoolData, ...schoolData }

  // Default exam columns if not provided
  const enabledExamColumns = examColumns.length > 0 
    ? examColumns.filter(col => col.enabled)
    : [
        { id: 'bot', label: 'B.O.T', enabled: true },
        { id: 'mid', label: 'MID', enabled: true },
        { id: 'eot', label: 'E.O.T', enabled: true }
      ]

  // Extract just the IDs of enabled columns for calculations
  const enabledColumnIds = enabledExamColumns.map(col => col.id);

  // Calculate totals if not provided
  const totalMarks = exam.totals?.totalMarks || calculateTotalMarks(exam.subjects)
  const aggregates = exam.totals?.aggregates || calculateAggregates(exam.subjects)
  const division = exam.totals?.division || determineDivision(aggregates, exam.subjects.length)

  // Calculate column widths to maintain table width
  const totalColumns = 1 + enabledExamColumns.length + 5; // Subject + Exam columns + Total + Average + Grade + Remarks + Teacher Initials
  const subjectColumnWidth = 25; // Allocate 25% width to subject column
  const remainingWidth = 100 - subjectColumnWidth;
  const otherColumnWidth = remainingWidth / (totalColumns - 1); // Equal width for all other columns

  return (
    <div className="report-card font-sans" style={{
      width: '210mm',
      height: '297mm',
      padding: '3mm',
      fontFamily: 'Arial, Calibri, "Noto Sans", sans-serif',
      fontSize: '11pt',
      backgroundColor: 'white',
      boxSizing: 'border-box',
      margin: '0 auto',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Add print-specific styles */}
      <style>{`
        @media print {
          .report-card {
            width: 210mm;
            height: 297mm;
            padding: 3mm; // Reduced padding for print
            margin: 0;
            box-shadow: none;
            border: 2pt solid #000; // Single border only
            page-break-after: always;
            font-size: 11pt;
            box-sizing: border-box;
            overflow: hidden;
          }
          
          .report-card:last-child {
            page-break-after: auto;
          }
          
          .report-card * {
            box-sizing: border-box;
          }
          
          /* Ensure images are printed */
          img {
            visibility: visible;
            display: block;
          }
        }
        
        @media screen {
          .report-card {
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border: 2pt solid #000; // Single border only
          }
        }
      `}</style>
      {/* Header */}
      <div className="header flex justify-between items-start mb-4 flex-shrink-0">
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
          <h1 className="text-lg font-bold uppercase mb-1" style={{ fontSize: '19pt' }}>{school.name}</h1>
          <p className="text-sm mb-1" style={{ fontSize: '12pt', marginBottom: '2px' }}>{school.address}</p>
          <p className="text-sm mb-1" style={{ fontSize: '12pt', marginBottom: '2px' }}>{school.contact}</p>
          <h2 className="text-base font-bold mb-1" style={{ fontSize: '13pt' }}>{reportTitle}</h2>
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
      <div className="pupil-info mb-4 flex-shrink-0">
        <table className="w-full border-collapse" style={{ fontSize: '11pt' }}>
          <tbody>
            <tr>
              <td className="border border-gray-400 p-1 font-semibold">Name</td>
              <td className="border border-gray-400 p-1">{student.name}</td>
              <td className="border border-gray-400 p-1 font-semibold">Gender</td>
              <td className="border border-gray-400 p-1">{student.gender}</td>
              <td className="border border-gray-400 p-1 text-center align-middle" rowSpan="3" style={{ width: '20%' }}>
                {student.qrCodeUrl !== null && (
                  student.qrCodeUrl ? (
                    <img src={student.qrCodeUrl} alt="QR Code" className="qr-img" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
                  ) : (
                    <div className="bg-gray-200 border-2 border-dashed rounded w-20 h-20 mx-auto" />
                  )
                )}
                <p className="text-xs mt-1">QR Code</p>
              </td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-1 font-semibold">Date of Birth</td>
              <td className="border border-gray-400 p-1">{student.dateOfBirth}</td>
              <td className="border border-gray-400 p-1 font-semibold">Class / Stream</td>
              <td className="border border-gray-400 p-1">{student.class}</td>
            </tr>
            <tr>
              <td className="border border-gray-400 p-1 font-semibold">Registration No.</td>
              <td className="border border-gray-400 p-1">{student.registrationNumber}</td>
              <td className="border border-gray-400 p-1 font-semibold">Attendance</td>
              <td className="border border-gray-400 p-1">{formatAttendance(student.attendance)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Academic Performance Table */}
      <div className="academic-performance mb-4 flex-shrink-0" style={{ overflow: 'hidden' }}>
        <table className="w-full border-collapse" style={{ fontSize: '10pt', width: '100%', tableLayout: 'fixed' }}>
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-1 text-center font-semibold" style={{ width: `${subjectColumnWidth}%` }}>Subject</th>
              {enabledExamColumns.map(column => (
                <th key={column.id} className="border border-gray-400 p-1 text-center font-semibold" style={{ width: `${otherColumnWidth}%` }}>
                  {column.label}
                </th>
              ))}
              <th className="border border-gray-400 p-1 text-center font-semibold" style={{ width: `${otherColumnWidth}%` }}>Total</th>
              <th className="border border-gray-400 p-1 text-center font-semibold" style={{ width: `${otherColumnWidth}%` }}>Average</th>
              <th className="border border-gray-400 p-1 text-center font-semibold" style={{ width: `${otherColumnWidth}%` }}>Grade</th>
              <th className="border border-gray-400 p-1 text-center font-semibold" style={{ width: `${otherColumnWidth}%` }}>Remarks</th>
              <th className="border border-gray-400 p-1 text-center font-semibold" style={{ width: `${otherColumnWidth}%` }}>Teacher Initials</th>
            </tr>
          </thead>
          <tbody>
            {exam.subjects.map((subject, index) => (
              <tr key={index}>
                <td className="border border-gray-400 p-1 font-medium" style={{ width: `${subjectColumnWidth}%` }}>{subject.name}</td>
                {enabledExamColumns.map(column => (
                  <td key={column.id} className="border border-gray-400 p-1 text-center" style={{ width: `${otherColumnWidth}%` }}>
                    {subject[column.id] !== undefined && subject[column.id] !== null && subject[column.id] !== '-' ? subject[column.id] : ''}
                  </td>
                ))}
                <td className="border border-gray-400 p-1 text-center" style={{ width: `${otherColumnWidth}%` }}>{calculateSubjectTotal(subject)}</td>
                <td className="border border-gray-400 p-1 text-center" style={{ width: `${otherColumnWidth}%` }}>{calculateSubjectAverage(subject, enabledColumnIds)}</td>
                <td className="border border-gray-400 p-1 text-center" style={{ width: `${otherColumnWidth}%` }}>{subject.grade}</td>
                <td className="border border-gray-400 p-1 text-center" style={{ width: `${otherColumnWidth}%` }}>{subject.remarks}</td>
                <td className="border border-gray-400 p-1 text-center" style={{ width: `${otherColumnWidth}%` }}>{subject.teacherInitials}</td>
              </tr>
            ))}
            <tr className="bg-gray-50 font-semibold">
              <td className="border border-gray-400 p-1 text-right" colSpan={1 + enabledExamColumns.length} style={{ width: `${subjectColumnWidth + (enabledExamColumns.length * otherColumnWidth)}%` }}>TOTALS</td>
              <td className="border border-gray-400 p-1 text-center" style={{ width: `${otherColumnWidth}%` }}>{totalMarks}</td>
              <td className="border border-gray-400 p-1 text-center" style={{ width: `${otherColumnWidth}%` }}></td>
              <td className="border border-gray-400 p-1 text-center" style={{ width: `${otherColumnWidth}%` }}></td>
              <td className="border border-gray-400 p-1 text-center" style={{ width: `${otherColumnWidth}%` }}></td>
              <td className="border border-gray-400 p-1 text-center" style={{ width: `${otherColumnWidth}%` }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Below Table Information */}
      <div className="below-table-info mb-4 flex-shrink-0">
        <div className="flex justify-between" style={{ fontSize: '11pt' }}>
          <div>
            <span className="font-semibold">Total Marks:</span> {totalMarks}
          </div>
          <div>
            <span className="font-semibold">Aggregates:</span> {aggregates}
          </div>
          <div>
            <span className="font-semibold">Division:</span> {division}
          </div>
          <div>
            <span className="font-semibold">Position in Class:</span> {exam.position.rank} / {exam.position.outOf}
          </div>
        </div>
      </div>

      {/* Grading Scale */}
      <div className="grading-scale mb-4 flex-shrink-0">
        <table className="w-full border-collapse" style={{ fontSize: '10pt' }}>
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-400 p-1 text-center font-semibold">90–100</th>
              <th className="border border-gray-400 p-1 text-center font-semibold">80–89</th>
              <th className="border border-gray-400 p-1 text-center font-semibold">70–79</th>
              <th className="border border-gray-400 p-1 text-center font-semibold">60–69</th>
              <th className="border border-gray-400 p-1 text-center font-semibold">55–59</th>
              <th className="border border-gray-400 p-1 text-center font-semibold">50–54</th>
              <th className="border border-gray-400 p-1 text-center font-semibold">45–49</th>
              <th className="border border-gray-400 p-1 text-center font-semibold">40–44</th>
              <th className="border border-gray-400 p-1 text-center font-semibold">0–39</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-400 p-1 text-center">D1</td>
              <td className="border border-gray-400 p-1 text-center">D2</td>
              <td className="border border-gray-400 p-1 text-center">C3</td>
              <td className="border border-gray-400 p-1 text-center">C4</td>
              <td className="border border-gray-400 p-1 text-center">C5</td>
              <td className="border border-gray-400 p-1 text-center">C6</td>
              <td className="border border-gray-400 p-1 text-center">P7</td>
              <td className="border border-gray-400 p-1 text-center">P8</td>
              <td className="border border-gray-400 p-1 text-center">F9</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Remarks Section */}
      <div className="remarks-section mb-4 flex-shrink-0">
        {exam.classTeacherComment && (
          <div className="mb-3">
            <p className="font-semibold mb-1">Class Teacher's Comment:</p>
            <div className="border border-gray-400 p-2 min-h-8 flex items-center">
              <p className="text-sm">{exam.classTeacherComment}</p>
            </div>
            <div className="flex justify-between mt-2 pt-1">
              <div>
                <p className="text-xs mb-1">Name: ________________________</p>
                <p className="text-xs">Date: ________________________</p>
              </div>
              <div>
                <p className="text-xs">Signature: ________________________</p>
              </div>
            </div>
          </div>
        )}
        
        {exam.headTeacherComment && (
          <div className="mt-3 pt-3 border-t border-gray-300">
            <p className="font-semibold mb-1">Head Teacher's Comment:</p>
            <div className="border border-gray-400 p-2 min-h-8 flex items-center">
              <p className="text-sm">{exam.headTeacherComment}</p>
            </div>
            <div className="flex justify-between mt-2 pt-1">
              <div>
                <p className="text-xs mb-1">Name: ________________________</p>
                <p className="text-xs">Date: ________________________</p>
              </div>
              <div>
                <p className="text-xs">Signature: ________________________</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fees & Next Term Info */}
      {((exam.fees && Object.keys(exam.fees).length > 0) || 
        (exam.nextTerm && Object.keys(exam.nextTerm).length > 0)) && (
        <div className="fees-next-term mb-4 flex-shrink-0">
          <table className="w-full border-collapse" style={{ fontSize: '11pt' }}>
            <tbody>
              {exam.fees && Object.keys(exam.fees).length > 0 && (
                <tr>
                  <td className="border border-gray-400 p-1 font-semibold w-1/3">Debts</td>
                  <td className="border border-gray-400 p-1">{exam.fees.debts}</td>
                </tr>
              )}
              {exam.nextTerm && exam.nextTerm.opensOn && (
                <tr>
                  <td className="border border-gray-400 p-1 font-semibold">Next Term Opens On</td>
                  <td className="border border-gray-400 p-1">{exam.nextTerm.opensOn}</td>
                </tr>
              )}
              {exam.nextTerm && exam.nextTerm.requirements && exam.nextTerm.requirements.length > 0 && (
                <tr>
                  <td className="border border-gray-400 p-1 font-semibold">Other Requirements</td>
                  <td className="border border-gray-400 p-1">
                    {exam.nextTerm.requirements.join(', ')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer - This will take remaining space */}
      <div className="footer text-center mt-auto pt-2 border-t border-gray-400 flex-shrink-0">
        <div className="flex justify-end mb-2" style={{ fontSize: '11pt' }}>
          <div>
            <p>School Stamp: ________________________</p>
          </div>
        </div>
        <div className="mt-2">
          <p className="font-semibold italic" style={{ fontSize: '12pt' }}>"{school.motto}"</p>
        </div>
      </div>
    </div>
  )
}

export default UgandaPrimaryReportCard