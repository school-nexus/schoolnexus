/**
 * UNEB PLE Grading System Utilities
 * 
 * This module provides utilities for calculating grades, aggregates, and divisions
 * according to the Uganda National Examinations Board (UNEB) Primary Leaving Examination standards.
 */

export interface GradeScale {
    grade: string
    min: number
    max: number
    points: number
    remark: string
}

export interface SubjectResult {
    subject: string
    score: number
    grade?: string
    points?: number
}

export interface StudentResults {
    subjects: SubjectResult[]
    totalMarks?: number
    aggregates?: number
    division?: string
    distinctions?: number
}

/**
 * UNEB PLE Grading Scale (D1-F9)
 */
export const UNEB_GRADING_SCALE: GradeScale[] = [
    { grade: "D1", min: 90, max: 100, points: 1, remark: "Distinction One" },
    { grade: "D2", min: 80, max: 89, points: 2, remark: "Distinction Two" },
    { grade: "C3", min: 70, max: 79, points: 3, remark: "Credit Three" },
    { grade: "C4", min: 60, max: 69, points: 4, remark: "Credit Four" },
    { grade: "C5", min: 55, max: 59, points: 5, remark: "Credit Five" },
    { grade: "C6", min: 50, max: 54, points: 6, remark: "Credit Six" },
    { grade: "P7", min: 45, max: 49, points: 7, remark: "Pass Seven" },
    { grade: "P8", min: 40, max: 44, points: 8, remark: "Pass Eight" },
    { grade: "F9", min: 0, max: 39, points: 9, remark: "Fail Nine" },
]

/**
 * Calculate grade and points for a given score
 */
export function calculateGrade(score: number): { grade: string; points: number; remark: string } {
    const gradeInfo = UNEB_GRADING_SCALE.find(
        (scale) => score >= scale.min && score <= scale.max
    )

    return gradeInfo
        ? { grade: gradeInfo.grade, points: gradeInfo.points, remark: gradeInfo.remark }
        : { grade: "F9", points: 9, remark: "Fail Nine" }
}

/**
 * Calculate aggregates (sum of points across all subjects)
 * Lower aggregates = better performance
 */
export function calculateAggregates(subjects: SubjectResult[]): number {
    return subjects.reduce((total, subject) => {
        const { points } = calculateGrade(subject.score)
        return total + points
    }, 0)
}

/**
 * Count the number of distinctions (D1 and D2 grades)
 */
export function countDistinctions(subjects: SubjectResult[]): number {
    return subjects.filter((subject) => {
        const { grade } = calculateGrade(subject.score)
        return grade === "D1" || grade === "D2"
    }).length
}

/**
 * Determine division based on aggregates
 * Division I: 4-12 aggregates
 * Division II: 13-23 aggregates
 * Division III: 24-29 aggregates
 * Division IV: 30+ aggregates
 * Division U: Ungraded (if any F9)
 */
export function calculateDivision(aggregates: number, subjects: SubjectResult[]): string {
    // Check for F9 (Ungraded)
    const hasFailure = subjects.some((subject) => {
        const { grade } = calculateGrade(subject.score)
        return grade === "F9"
    })

    if (hasFailure) return "U"

    if (aggregates >= 4 && aggregates <= 12) return "I"
    if (aggregates >= 13 && aggregates <= 23) return "II"
    if (aggregates >= 24 && aggregates <= 29) return "III"
    if (aggregates >= 30) return "IV"

    return "U"
}

/**
 * Calculate complete student results including grades, aggregates, and division
 */
export function calculateStudentResults(subjects: SubjectResult[]): StudentResults {
    // Calculate grades and points for each subject
    const processedSubjects = subjects.map((subject) => {
        const { grade, points } = calculateGrade(subject.score)
        return {
            ...subject,
            grade,
            points,
        }
    })

    // Calculate total marks
    const totalMarks = subjects.reduce((sum, subject) => sum + subject.score, 0)

    // Calculate aggregates
    const aggregates = calculateAggregates(subjects)

    // Determine division
    const division = calculateDivision(aggregates, subjects)

    // Count distinctions
    const distinctions = countDistinctions(subjects)

    return {
        subjects: processedSubjects,
        totalMarks,
        aggregates,
        division,
        distinctions,
    }
}

/**
 * Get performance summary text based on division
 */
export function getPerformanceSummary(division: string, distinctions: number): string {
    const distinctionText = distinctions > 0
        ? ` with ${distinctions} distinction${distinctions > 1 ? 's' : ''}`
        : ''

    switch (division) {
        case "I":
            return `Excellent Performance - Division I${distinctionText}`
        case "II":
            return `Very Good Performance - Division II${distinctionText}`
        case "III":
            return `Good Performance - Division III${distinctionText}`
        case "IV":
            return `Fair Performance - Division IV`
        case "U":
            return `Ungraded - Needs Improvement`
        default:
            return "Performance Not Calculated"
    }
}

/**
 * Validate if a score is within valid range (0-100)
 */
export function isValidScore(score: number): boolean {
    return score >= 0 && score <= 100
}

/**
 * Calculate average score across all subjects
 */
export function calculateAverage(subjects: SubjectResult[]): number {
    if (subjects.length === 0) return 0
    const total = subjects.reduce((sum, subject) => sum + subject.score, 0)
    return Math.round((total / subjects.length) * 10) / 10
}
