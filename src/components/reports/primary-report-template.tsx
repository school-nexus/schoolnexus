'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { reportActions, fileActions } from '@/lib/electron';
import { ReportSettings } from './report-settings-dialog';
import { 
  type ReportData, 
  type SchoolProfile,
  type Mark
} from '@/lib/report-utils';

export interface PrimaryReportTemplateProps {
  data?: ReportData; // The student report data object from the API
  settings?: ReportSettings;
  schoolInfo?: SchoolProfile;
  termName?: string;
  year?: string;
  // Database integration props
  useDatabaseData?: boolean;
  studentId?: number;
  termId?: number;
  onExport?: () => void;
}

export function PrimaryReportTemplate({
  data: providedData,
  settings: providedSettings,
  schoolInfo: providedSchoolInfo,
  termName: providedTermName,
  year: providedYear,
  useDatabaseData = false,
  studentId,
  termId,
  onExport,
}: PrimaryReportTemplateProps) {
  const [databaseData, setDatabaseData] = React.useState<ReportData | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Load report data from database if in database mode
  React.useEffect(() => {
    const loadReportData = async () => {
      if (!studentId) return;

      setLoading(true);
      try {
        const data = await reportActions.getStudentReport({
          studentId,
          termId
        }) as unknown as ReportData | null;
        if (data) {
          setDatabaseData(data);
        }
      } catch (error) {
        console.error('Failed to fetch report data:', error);
      } finally {
        setLoading(true); // Keep loading true for a moment to ensure state is set
        setTimeout(() => setLoading(false), 100);
      }
    };

    if (useDatabaseData && studentId) {
      loadReportData();
    }
  }, [useDatabaseData, studentId, termId]);

  // Default settings
  const defaultSettings: ReportSettings = {
    showBot: true,
    showMid: true,
    showEot: true,
    showGrading: true,
    showFees: true,
    showNextTerm: true,
    showComments: true,
    showDob: true,
    showAttendance: true,
    showDivision: true,
    reportTitle: 'Termly Report Card',
    themeColor: 'emerald'
  };

  // Reconciliation: Prioritize database data, then provided data
  // Reconciliation: Prioritize database data, then provided data
  const data = databaseData || providedData;

  // Reconcile settings: If providedSettings has old property names, map them
  const settings: ReportSettings = providedSettings ? {
    ...defaultSettings,
    ...providedSettings,
    // Add mapping for properties used in some pages but missing from interface
    showBot: (providedSettings as any).showBotColumn ?? providedSettings.showBot,
    showMid: (providedSettings as any).showMidColumn ?? providedSettings.showMid,
    showEot: (providedSettings as any).showEotColumn ?? providedSettings.showEot,
    showGrading: (providedSettings as any).showGradingScale ?? providedSettings.showGrading,
    showComments: ((providedSettings as any).showTeacherComments || (providedSettings as any).showHeadTeacherComments) ?? providedSettings.showComments,
  } : defaultSettings;

  const schoolInfo = databaseData?.schoolInfo || providedSchoolInfo;
  const termName = databaseData?.termName || providedTermName;
  const year = databaseData?.year || providedYear;

  if (loading) {
    return (
      <div className="w-[210mm] mx-auto bg-white p-[10mm] min-h-[297mm] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Preparing Report Card...</p>
        </div>
      </div>
    );
  }
  if (!data) return null;

  const { student, marks, attendance, performance } = data;

  // Dynamic Grading Helper
  const calculateGrade = (score: number) => {
    if (data.gradingScales && data.gradingScales.length > 0) {
      const scale = data.gradingScales.find((s: { minScore: number; maxScore: number; grade: string }) => score >= s.minScore && score <= s.maxScore);
      if (scale) return scale.grade;
    }
    // Fallback
    if (score >= 80) return 'D1';
    if (score >= 75) return 'D2';
    if (score >= 70) return 'C3';
    if (score >= 65) return 'C4';
    if (score >= 60) return 'C5';
    if (score >= 55) return 'C6';
    if (score >= 50) return 'P7';
    if (score >= 45) return 'P8';
    return score > 0 ? 'F9' : '-';
  };

  const getRemarks = (score: number) => {
    if (data.gradingScales && data.gradingScales.length > 0) {
      const scale = data.gradingScales.find((s: { minScore: number; maxScore: number; remark?: string }) => score >= s.minScore && score <= s.maxScore);
      if (scale) return scale.remark || '-';
    }
    // Fallback
    if (score >= 80) return 'Excellent';
    if (score >= 75) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 65) return 'Fairly Good';
    if (score >= 60) return 'Fair';
    if (score >= 50) return 'Pass';
    if (score >= 45) return 'Weak Pass';
    return score > 0 ? 'Fail' : '-';
  };

  // Process marks to aggregate by subject
  const subjectMap = new Map<string, any>();

  marks.forEach((mark: Mark) => {
    if (!subjectMap.has(mark.subjectName)) {
      subjectMap.set(mark.subjectName, {
        name: mark.subjectName,
        bot: '-',
        mid: '-',
        eot: '-',
        grade: '-',
        remarks: '-',
        initials: '',
        scores: [] as number[], // Track scores for averaging
      });
    }
    const subjectEntry = subjectMap.get(mark.subjectName);

    const examNameLower = (mark.examName || '').toLowerCase();
    const isBot = examNameLower.includes('beginning') || examNameLower.includes('bot');
    const isMid = examNameLower.includes('mid');
    const isEot = examNameLower.includes('end') || examNameLower.includes('eot') || examNameLower.includes('final');

    if (isBot) subjectEntry.bot = mark.score;
    if (isMid) subjectEntry.mid = mark.score;
    if (isEot) subjectEntry.eot = mark.score;

    // Track for dynamic average if column is active
    if ((isBot && settings.showBot) || (isMid && settings.showMid) || (isEot && settings.showEot)) {
      subjectEntry.scores.push(mark.score);
      // Update initials if available
      if (mark.initials) subjectEntry.initials = mark.initials;
    }
  });

  // Calculate final grade and remarks per subject based on active columns
  const subjects = Array.from(subjectMap.values()).map(subj => {
    if (subj.scores.length > 0) {
      const averageScore = subj.scores.reduce((a: number, b: number) => a + b, 0) / subj.scores.length;
      return {
        ...subj,
        grade: calculateGrade(averageScore),
        remarks: getRemarks(averageScore),
      };
    }
    return subj;
  });

  // Use utils for calculations (imported or local if not available, but assuming passed in performance is correct or we recalculate if needed)
  // For now, we trust the `performance` object passed in, but we can verify aggregates if missing
  // const aggregates = performance.aggregates || calculateAggregates(subjects);
  // const division = performance.division || determineDivision(aggregates, subjects.length);

  // Actually, let's use the props or data. But if undefined, we show '-'
  // In a real app we might want to recalculate here using the utils I added to lib.
  // For this generic template, I'll assume data is pre-calculated or I'll just use what's there.
  // Wait, I updated utils.ts but I'm not importing them here yet. 
  // I should import them if I want to use dynamic calculation.
  // However, to keep it simple and safe:

  const displayAggregates = performance.aggregates ? performance.aggregates : '-';
  const displayDivision = performance.division ? performance.division : '-';
  const displayAverage = performance.average ? performance.average : '-';
  const displayTotal = performance.total ? performance.total : '-';

  // Theme Helpers
  const themeColors: Record<string, any> = {
    emerald: {
      border: 'border-emerald-600',
      bg: 'bg-emerald-600',
      text: 'text-emerald-900',
      subHeader: 'bg-emerald-50',
      accent: 'text-emerald-700'
    },
    blue: {
      border: 'border-blue-600',
      bg: 'bg-blue-600',
      text: 'text-blue-900',
      subHeader: 'bg-blue-50',
      accent: 'text-blue-700'
    },
    purple: {
      border: 'border-purple-600',
      bg: 'bg-purple-600',
      text: 'text-purple-900',
      subHeader: 'bg-purple-50',
      accent: 'text-purple-700'
    },
    slate: {
      border: 'border-slate-800',
      bg: 'bg-slate-800',
      text: 'text-slate-900',
      subHeader: 'bg-slate-50',
      accent: 'text-slate-700'
    },
    'emerald-gold': {
      border: 'border-emerald-700',
      bg: 'bg-gradient-to-r from-emerald-700 to-amber-600',
      text: 'text-emerald-950',
      subHeader: 'bg-emerald-50/50',
      accent: 'text-emerald-800'
    },
    'blue-indigo': {
      border: 'border-blue-800',
      bg: 'bg-gradient-to-r from-blue-800 to-indigo-900',
      text: 'text-blue-950',
      subHeader: 'bg-blue-50/50',
      accent: 'text-blue-800'
    },
    'rose-purple': {
      border: 'border-rose-700',
      bg: 'bg-gradient-to-r from-rose-600 to-purple-700',
      text: 'text-rose-950',
      subHeader: 'bg-rose-50/50',
      accent: 'text-rose-800'
    },
    'amber-orange': {
      border: 'border-amber-700',
      bg: 'bg-gradient-to-r from-amber-500 to-orange-700',
      text: 'text-amber-950',
      subHeader: 'bg-amber-50/50',
      accent: 'text-amber-800'
    },
    'cyan-teal': {
      border: 'border-cyan-700',
      bg: 'bg-gradient-to-r from-cyan-600 to-teal-700',
      text: 'text-cyan-950',
      subHeader: 'bg-cyan-50/50',
      accent: 'text-cyan-800'
    },
    'slate-black': {
      border: 'border-slate-900',
      bg: 'bg-gradient-to-r from-slate-800 to-slate-950',
      text: 'text-slate-950',
      subHeader: 'bg-slate-100',
      accent: 'text-slate-900'
    }
  };

  const theme = themeColors[settings.themeColor] || themeColors.emerald;

  // Report Title from settings or default
  const reportTitle = settings.reportTitle || "Termly Report Card";

  return (
    <div className="w-[210mm] mx-auto bg-white p-[8mm] min-h-[297mm] text-slate-900 font-sans text-sm relative print:p-0 print:w-full">
      {/* Outer Border */}
      <div className={cn("border-[3px] h-full p-1 relative", theme.border)}>
        <div className={cn("border h-full p-6 flex flex-col gap-5", theme.border)}>

          {/* Header Section */}
          <div className={cn("flex justify-between items-start border-b-2 pb-4", theme.border)}>
            {/* LEFT: School Logo */}
            <div className="w-24 h-24 relative overflow-hidden flex items-center justify-center border border-slate-200">
              {schoolInfo?.logo ? (
                <img src={fileActions.getUrl(schoolInfo.logo)} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <div className={cn("w-full h-full flex items-center justify-center bg-slate-100 text-xs text-center p-2", theme.accent)}>School Logo</div>
              )}
            </div>

            <div className="text-center flex-1 px-4">
              <h1 className={cn("text-3xl font-extrabold tracking-tight uppercase mb-1", theme.accent)}>
                {schoolInfo?.name || 'SCHOOL NAME'}
              </h1>
              <div className="text-xs space-y-1 font-medium text-slate-600">
                <p>{schoolInfo?.address || 'P.O. BOX 123, CITY, COUNTRY'}</p>
                <p>Tel: {schoolInfo?.phone || '+123 456 789'} | Email: {schoolInfo?.email || 'info@school.com'}</p>
                <p className="font-bold tracking-wider mt-2">MOTTO: "{schoolInfo?.motto || 'Education for Excellence'}"</p>
              </div>
              <div className={cn("mt-4 inline-block px-8 py-1.5 text-white font-bold text-lg rounded-sm uppercase tracking-widest", theme.bg)}>
                {reportTitle}
              </div>
            </div>

            {/* RIGHT: Student Photo */}
            <div className="w-24 h-24 relative border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
              {student.photo ? (
                <img src={fileActions.getUrl(student.photo)} alt="Student" className="w-full h-full object-cover" />
              ) : (
                <div className="text-[10px] text-slate-400 text-center">Student<br />Photo</div>
              )}
            </div>
          </div>

          {/* Student Info */}
          <div className={cn("grid grid-cols-2 gap-x-8 gap-y-2 text-sm", theme.text)}>
            <div className="flex border-b border-slate-200 pb-1">
              <span className="font-bold w-32 uppercase text-xs opacity-70">Student Name:</span>
              <span className="font-semibold uppercase truncate">{student.firstName} {student.lastName}</span>
            </div>

            <div className="flex border-b border-slate-200 pb-1">
              <span className="font-bold w-32 uppercase text-xs opacity-70">Admission No:</span>
              <span className="font-semibold">{student.admissionNumber}</span>
            </div>

            <div className="flex border-b border-slate-200 pb-1">
              <span className="font-bold w-32 uppercase text-xs opacity-70">Class / Stream:</span>
              <span className="font-semibold">{student.className}</span>
            </div>

            {/* Swapped Position: Term/Year is here now (was DOB) */}
            <div className="flex border-b border-slate-200 pb-1">
              <span className="font-bold w-32 uppercase text-xs opacity-70">Term / Year:</span>
              <span className="font-semibold uppercase">{termName} - {year}</span>
            </div>

            {/* Swapped Position: DOB is here now (was Term/Year) */}
            {settings.showDob && (
              <div className="flex border-b border-slate-200 pb-1">
                <span className="font-bold w-32 uppercase text-xs opacity-70">Date of Birth:</span>
                <span className="font-semibold">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
              </div>
            )}

            {settings.showAttendance && (
              <div className="flex border-b border-slate-200 pb-1">
                <span className="font-bold w-32 uppercase text-xs opacity-70">Attendance:</span>
                <span className="font-semibold">{attendance.present} / {attendance.total} Days</span>
              </div>
            )}

          </div>

          {/* Results Table */}
          <div className={cn("border rounded-sm overflow-hidden", theme.border)}>
            <table className="w-full text-xs">
              <thead>
                <tr className={cn("text-white uppercase", theme.bg)}>
                  <th className="py-2 px-3 text-left border-r border-white/20 w-[25%]">Subject</th>
                  {settings.showBot && <th className="py-2 px-2 text-center border-r border-white/20 w-[8%]">B.O.T</th>}
                  {settings.showMid && <th className="py-2 px-2 text-center border-r border-white/20 w-[8%]">MID</th>}
                  {settings.showEot && <th className="py-2 px-2 text-center border-r border-white/20 w-[8%]">E.O.T</th>}
                  <th className="py-2 px-2 text-center border-r border-white/20 w-[8%]">Grade</th>
                  <th className="py-2 px-3 text-left border-r border-white/20">Remarks</th>
                  <th className="py-2 px-2 text-center w-[10%]">Initials</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject, index) => (
                  <tr key={index} className="border-b border-slate-200 last:border-0 hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold border-r border-slate-200">{subject.name}</td>
                    {settings.showBot && <td className="py-2 px-2 text-center border-r border-slate-200 font-medium">{subject.bot}</td>}
                    {settings.showMid && <td className="py-2 px-2 text-center border-r border-slate-200 font-medium">{subject.mid}</td>}
                    {settings.showEot && <td className="py-2 px-2 text-center border-r border-slate-200 font-medium">{subject.eot}</td>}
                    <td className="py-2 px-2 text-center border-r border-slate-200 font-bold">{subject.grade}</td>
                    <td className="py-2 px-3 border-r border-slate-200 italic text-slate-600 truncate max-w-[150px]">{subject.remarks}</td>
                    <td className="py-2 px-2 text-center font-mono text-[10px] text-slate-400">{subject.initials || '...'}</td>
                  </tr>
                ))}
                {subjects.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 italic">No results found for this term.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Performance Summary */}
          <div className={cn("grid grid-cols-5 gap-4 px-2 py-3 rounded-sm border", theme.subHeader, theme.border)}>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Total Marks</span>
              <span className={cn("text-xl font-black", theme.accent)}>{displayTotal}</span>
            </div>
            <div className="flex flex-col items-center border-l border-slate-300/50">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Average</span>
              <span className={cn("text-xl font-black", theme.accent)}>{displayAverage}</span>
            </div>
            <div className="flex flex-col items-center border-l border-slate-300/50">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Aggregates</span>
              <span className={cn("text-xl font-black", theme.accent)}>{displayAggregates}</span>
            </div>
            {/* New Division Section */}
            {settings.showDivision && (
              <div className="flex flex-col items-center border-l border-slate-300/50">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Division</span>
                <span className={cn("text-xl font-black", theme.accent)}>{displayDivision}</span>
              </div>
            )}
            <div className="flex flex-col items-center border-l border-slate-300/50">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Position</span>
              <span className={cn("text-xl font-black", theme.accent)}>{performance.rank}</span>
            </div>
          </div>

          {/* Grading Scale - Full Width now */}
          {settings.showGrading && (
            <div className="w-full">
              <div className={cn("border text-xs w-full", theme.border)}>
                <div className={cn("bg-slate-100 font-bold px-2 py-1 border-b text-center", theme.subHeader)}>GRADING SCALE</div>
                <div className="grid grid-cols-9 divide-x divide-slate-200">
                  <div className="p-1 text-center"><span className="font-bold block">D1</span><span className="text-[10px] text-slate-500">80-100</span></div>
                  <div className="p-1 text-center"><span className="font-bold block">D2</span><span className="text-[10px] text-slate-500">75-79</span></div>
                  <div className="p-1 text-center"><span className="font-bold block">C3</span><span className="text-[10px] text-slate-500">70-74</span></div>
                  <div className="p-1 text-center"><span className="font-bold block">C4</span><span className="text-[10px] text-slate-500">65-69</span></div>
                  <div className="p-1 text-center"><span className="font-bold block">C5</span><span className="text-[10px] text-slate-500">60-64</span></div>
                  <div className="p-1 text-center"><span className="font-bold block">C6</span><span className="text-[10px] text-slate-500">55-59</span></div>
                  <div className="p-1 text-center"><span className="font-bold block">P7</span><span className="text-[10px] text-slate-500">50-54</span></div>
                  <div className="p-1 text-center"><span className="font-bold block">P8</span><span className="text-[10px] text-slate-500">40-49</span></div>
                  <div className="p-1 text-center"><span className="font-bold block">F9</span><span className="text-[10px] text-slate-500">0-39</span></div>
                </div>
              </div>
            </div>
          )}


          {/* Comments */}
          {settings.showComments && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-slate-500">Class Teacher's Remarks:</p>
                <div className="border-b border-slate-300 border-dashed pb-1 pt-2 font-medium italic min-h-[30px] flex items-end">
                  <span className="text-slate-800">Has shown great improvement this term. Keep it up!</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase text-slate-500">Head Teacher's Remarks:</p>
                <div className="border-b border-slate-300 border-dashed pb-1 pt-2 font-medium italic min-h-[30px] flex items-end">
                  <span className="text-slate-800">Promoted to the next class.</span>
                </div>
              </div>
            </div>
          )}

          {/* Fee Balance - Moved below remarks */}
          {settings.showFees && (
            <div className="w-full">
              <div className={cn("border p-2 flex justify-between items-center bg-slate-50/50", theme.border)}>
                <div className="flex gap-2 items-center">
                  <span className="text-xs font-bold uppercase opacity-60">Fee Balance:</span>
                  <span className="text-sm font-bold text-red-600">UGX 0</span>
                </div>
                <span className="text-[10px] text-slate-500 italic">Please clear outstanding balance before next term begins.</span>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto space-y-4">
            {settings.showNextTerm && (
              <div className={cn("flex justify-between items-center text-xs p-2 rounded-sm border", theme.subHeader, theme.border)}>
                <div><span className="font-bold">Next Term Begins On:</span> 5th February 2026</div>
                <div><span className="font-bold">Next Term Ends On:</span> 2nd May 2026</div>
              </div>
            )}

            <div className="flex justify-between items-end pt-4">
              <div className="text-center">
                <div className="w-32 border-b border-slate-400 mb-1"></div>
                <p className="text-[10px] font-bold uppercase tracking-wider">Class Teacher' Sign</p>
              </div>
              <div className="text-center">
                <div className="w-32 border-b border-slate-400 mb-1"></div>
                <p className="text-[10px] font-bold uppercase tracking-wider">Head Teacher' Sign</p>
              </div>
              <div className="text-center">
                <div className={cn("w-24 h-24 border rounded-full flex items-center justify-center opacity-20", theme.border)}>
                  <span className="text-[8px] uppercase -rotate-12">Official Stamp</span>
                </div>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
