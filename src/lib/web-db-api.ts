/**
 * Web Database API for School Nexus Academy
 * This is a server-only API that communicates with the database
 * It's designed to work in the web environment without bundling native modules
 */

'use server';

// For the web version, we'll need to communicate with a backend service
// This could be a separate API service or use IPC in electron
export async function getStudentsWebApi() {
  // In a real implementation, this would call an external API
  // For now, returning a mock response to allow build to succeed
  console.log("Web API: Fetching students");
  return [];
}

export async function getTermsWebApi() {
  // In a real implementation, this would call an external API
  // For now, returning a mock response to allow build to succeed
  console.log("Web API: Fetching terms");
  return [];
}

export async function getStudentReportDataWebApi(studentId: number, termId?: number) {
  // In a real implementation, this would call an external API
  // For now, returning a mock response to allow build to succeed
  console.log("Web API: Fetching student report data", { studentId, termId });
  return { studentId, termId, report: "Mock report data" };
}