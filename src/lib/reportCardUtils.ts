/**
 * Report Card Utility Functions
 * Helper functions for calculating marks, grades, and formatting report data
 */

export interface GradingScale {
  id?: number;
  grade: string;
  minScore: number;
  maxScore: number;
  points: number;
  remark?: string;
}

export interface SubjectData {
    bot?: number;
    mid?: number;
    eot?: number;
    assignment?: number;
    project?: number;
    grade?: string;
    average?: number;
    [key: string]: unknown;
}

export function calculateGrade(score: number, scales?: GradingScale[]): string {
  if (scales && scales.length > 0) {
    // Sort scales by minScore descending to find the highest match
    const matchingScale = [...scales]
      .sort((a, b) => b.minScore - a.minScore)
      .find(s => score >= s.minScore);

    if (matchingScale) return matchingScale.grade;
  }

  // Fallback to default grading logic
  if (score >= 80) return 'D1';
  if (score >= 75) return 'D2';
  if (score >= 70) return 'C3';
  if (score >= 65) return 'C4';
  if (score >= 60) return 'C5';
  if (score >= 55) return 'C6';
  if (score >= 50) return 'P7';
  if (score >= 40) return 'P8';
  return 'F9';
}

export function calculateRemarks(score: number, scales?: GradingScale[]): string {
  if (scales && scales.length > 0) {
    const matchingScale = [...scales]
      .sort((a, b) => b.minScore - a.minScore)
      .find(s => score >= s.minScore);

    if (matchingScale && matchingScale.remark) return matchingScale.remark;
  }

  // Fallback remarks
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 50) return 'Fair';
  if (score >= 40) return 'Pass';
  return 'Weak';
}

export function getGradePoints(grade: string, scales?: GradingScale[]): number {
  if (scales && scales.length > 0) {
    const matchingScale = scales.find(s => s.grade === grade);
    if (matchingScale) return matchingScale.points;
  }

  const points: Record<string, number> = {
    'D1': 1, 'D2': 2, 'C3': 3, 'C4': 4, 'C5': 5,
    'C6': 6, 'P7': 7, 'P8': 8, 'F9': 9
  };
  return points[grade] || 9; // Default to F9 (9 points) if invalid
}

export function calculateSubjectTotal(subject: SubjectData): number {
  // Calculate total from available exam columns
  const columns = ['bot', 'mid', 'eot', 'assignment', 'project']
  return columns.reduce((total, col) => {
    const value = subject[col]
    return total + (typeof value === 'number' ? value : 0)
  }, 0)
}

export function calculateSubjectAverage(subject: SubjectData, enabledColumnIds: string[]): number {
  const values = enabledColumnIds
    .map(col => subject[col])
    .filter((val): val is number => typeof val === 'number' && val > 0)

  if (values.length === 0) return 0
  return Math.round((values.reduce((sum, val) => sum + val, 0) / values.length) * 100) / 100
}

export function calculateTotalMarks(subjects: SubjectData[]): number {
  return subjects.reduce((total, subject) => total + calculateSubjectTotal(subject), 0)
}

export function calculateAggregates(subjects: SubjectData[], scales?: GradingScale[]): number {
  return subjects.reduce((total, subject) => {
    // Priority: Explicit Grade -> Calculate from Average -> Calculate from EOT -> Default F9
    let grade = subject.grade;

    if (!grade) {
      // If no explicit grade, try to calculate from average or EOT
      const score = subject.average || subject.eot || subject.mid || subject.bot || 0;
      grade = calculateGrade(score, scales);
    }

    return total + getGradePoints(grade, scales);
  }, 0)
}

export function determineDivision(aggregates: number): string {
  // Standard PLE Division Cutoffs (Best 4 subjects usually, but we use total provided for now)
  // Division 1: 4 - 12
  // Division 2: 13 - 23
  // Division 3: 24 - 29
  // Division 4: 30 - 36
  // Division U: > 36

  // NOTE: This logic assumes 4 subjects (Eng, Math, Sci, SST). 
  // If subjectCount is different, we might need to adjust or strictly use best 4.
  // For safety in this generic function, we'll stick to the standard range logic 
  // assuming the input `aggregates` is correct for the student's core subjects.

  if (aggregates <= 12) return "I";
  if (aggregates <= 23) return "II";
  if (aggregates <= 29) return "III";
  if (aggregates <= 36) return "IV";
  return "U";
}

export function formatAttendance(attendance: { present: number, total: number }): string {
  if (!attendance || typeof attendance.present !== 'number' || typeof attendance.total !== 'number') {
    return 'N/A'
  }
  return `${attendance.present}/${attendance.total}`
}