export function getGradeInfoRepo(scales: any[], score: number) {
    const scale = scales.find(s => score >= s.minScore && score <= s.maxScore);
    if (scale) return { grade: scale.grade, points: scale.points, remark: scale.remark };
    if (score >= 80) return { grade: 'D1', points: 1, remark: 'Excellent' };
    if (score >= 75) return { grade: 'D2', points: 2, remark: 'Very Good' };
    if (score >= 70) return { grade: 'C3', points: 3, remark: 'Good' };
    if (score >= 65) return { grade: 'C4', points: 4, remark: 'Fairly Good' };
    if (score >= 60) return { grade: 'C5', points: 5, remark: 'Fair' };
    if (score >= 55) return { grade: 'C6', points: 6, remark: 'Pass' };
    if (score >= 50) return { grade: 'P7', points: 7, remark: 'Pass' };
    if (score >= 45) return { grade: 'P8', points: 8, remark: 'Weak Pass' };
    return { grade: 'F9', points: 9, remark: 'Fail' };
}

export function calculateAggregatesRepo(subjectAverages: any[], method: string) {
    const core = ['mathematics', 'english', 'science', 'social studies', 'physical education', 'mtc', 'eng', 'sci', 'sst'];
    if (method === 'uneb_ple_aggregates') {
        const corePoints = subjectAverages.filter(s => core.some(c => s.subjectName.toLowerCase().includes(c) || s.subjectCode.toLowerCase().includes(c))).map(s => s.points);
        if (corePoints.length < 4) return corePoints.reduce((a, b) => a + Number(b), 0) + (4 - corePoints.length) * 9;
        return corePoints.slice(0, 4).reduce((a, b) => a + Number(b), 0);
    }
    return subjectAverages.reduce((sum, s) => sum + (Number(s.points) || 9), 0);
}

export function determineDivisionRepo(aggregates: number, average: number, method: string) {
    if (method === 'uneb_ple_aggregates') {
        if (aggregates <= 12) return '1';
        if (aggregates <= 24) return '2';
        if (aggregates <= 28) return '3';
        if (aggregates <= 34) return '4';
        return 'U';
    }
    if (average >= 75) return '1';
    if (average >= 60) return '2';
    if (average >= 50) return '3';
    if (average >= 40) return '4';
    return 'U';
}
