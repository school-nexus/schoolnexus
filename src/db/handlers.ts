import { db } from './index-electron.js';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { hashPassword } from '../lib/auth-utils.js';
import { logDebug } from '../lib/logger.js';
import {
  schoolProfile,
  academicYears,
  terms,
  users,
  roles,
  backups,
  classes,
  streams,
  subjects,
  teachers,
  teacherDocuments,
  subjectAllocations,
  students,
  guardians,
  attendance,
  exams,
  examTypes,
  marks,
  feeStructures,
  feeAssignments,
  feePayments,
  income,
  expenses,
  budget,
  gradingScales,
  examSubjects,
  settings,
  invoices,
  studentGroups,
  studentGroupMembers,
  studentDocuments,
  reportTemplates,
  payroll,
  salaryPayments,
  transactionCategories,
} from './schema.js';
import {
  eq,
  sql,
  and,
  or,
  count,
  desc,
  gte,
  lte,
  lt,
  gt,
  between,
  sum,
  inArray,
  like,
  ne,
  asc,
} from 'drizzle-orm';
import { repository } from './repository.js';

const ELECTRON_SCHOOL_ID = 1;

export const setupHandlers = (ipcMain: any) => {
  logDebug('[Handlers] Starting IPC handler registration...');

  ipcMain.handle('get-school-profile', async () => {
    try {
      return await repository.profile.get(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      logDebug('[Handlers] Error getting school profile', error);
      throw error;
    }
  });

  ipcMain.handle('update-school-profile', async (_event: any, data: any) => {
    try {
      return await repository.profile.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating school profile:', error);
      throw error;
    }
  });

  // --- ACADEMIC YEARS ---

  ipcMain.handle('get-academic-years', async () => {
    try {
      return await repository.academicYears.getAll(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting academic years:', error);
      throw error;
    }
  });

  ipcMain.handle('update-academic-year', async (_event: any, data: any) => {
    try {
      return await repository.academicYears.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating academic year:', error);
      throw error;
    }
  });

  ipcMain.handle('set-active-academic-year', async (_event: any, id: number) => {
    try {
      return await repository.academicYears.setActive(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error setting active academic year:', error);
      throw error;
    }
  });

  ipcMain.handle('archive-academic-year', async (_event: any, id: number) => {
    try {
      return await repository.academicYears.archive(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error archiving academic year:', error);
      throw error;
    }
  });

  // --- TERMS ---

  ipcMain.handle('delete-term', async (_event: any, id: number) => {
    try {
      return await repository.terms.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting term:', error);
      throw error;
    }
  });

  ipcMain.handle('get-terms', async (_event: any, academicYearId: number) => {
    try {
      return await repository.terms.getByYear(db, ELECTRON_SCHOOL_ID, academicYearId);
    } catch (error) {
      console.error('Error getting terms:', error);
      throw error;
    }
  });

  ipcMain.handle('update-term', async (_event: any, data: any) => {
    try {
      return await repository.terms.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating term:', error);
      throw error;
    }
  });

  ipcMain.handle('get-active-term', async () => {
    try {
      return await repository.terms.getActive(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting active term:', error);
      throw error;
    }
  });

  ipcMain.handle('set-active-term', async (_event: any, { id, academicYearId }: any) => {
    try {
      return await repository.terms.setActiveTerm(db, ELECTRON_SCHOOL_ID, id, academicYearId);
    } catch (error) {
      console.error('Error setting active term:', error);
      throw error;
    }
  });

  // --- USERS ---

  ipcMain.handle('get-users', async () => {
    try {
      return await repository.users.getAll(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  });

  ipcMain.handle('create-user', async (_event: any, userData: any) => {
    try {
      const { password, ...rest } = userData;
      let data = { ...rest, schoolId: ELECTRON_SCHOOL_ID };
      if (password) {
        data.passwordHash = await hashPassword(password);
      }
      return await repository.users.create(db, data);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  });

  ipcMain.handle('update-user', async (_event: any, data: any) => {
    try {
      const updateData = { ...data };
      if (data.password) {
        updateData.passwordHash = await hashPassword(data.password);
        delete updateData.password;
      }
      return await repository.users.update(db, ELECTRON_SCHOOL_ID, updateData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-user', async (_event: any, id: number) => {
    try {
      return await repository.users.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  });

  ipcMain.handle('get-user-by-id', async (_event: any, id: number) => {
    try {
      return await repository.users.getById(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw error;
    }
  });

  ipcMain.handle('reset-user-password', async (_event: any, { userId, newPassword }: { userId: number; newPassword: string }) => {
    try {
      const passwordHash = await hashPassword(newPassword);
      return await repository.users.resetPassword(db, ELECTRON_SCHOOL_ID, userId, passwordHash);
    } catch (error) {
      console.error('Error resetting user password:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'get-student-documents',
    async (_event: any, studentId: number) => {
      try {
        return await repository.studentDocuments.getByStudent(db, ELECTRON_SCHOOL_ID, studentId);
      } catch (error) {
        console.error('Error getting student documents:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('add-student-document', async (_event: any, data: any) => {
    try {
      return await repository.studentDocuments.create(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error adding student document:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-student-document', async (_event: any, id: number) => {
    try {
      return await repository.studentDocuments.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting student document:', error);
      throw error;
    }
  });

  ipcMain.handle('authenticate', async (_event: any, { username, password, schoolId }: any) => {
    try {
      return await repository.users.authenticate(db, username, password, schoolId !== undefined ? schoolId : ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error authenticating:', error);
      throw error;
    }
  });

  ipcMain.handle('login-user', async (_event: any, { username, password, schoolId }: any) => {
    try {
      return await repository.users.authenticate(db, username, password, schoolId !== undefined ? schoolId : ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  });

  // --- CLASSES & STREAMS ---

  ipcMain.handle('get-classes', async () => {
    try {
      return await repository.classes.getAll(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      logDebug('[Handlers] Error getting classes', error);
      throw error;
    }
  });

  ipcMain.handle('update-class', async (_event: any, data: any) => {
    try {
      return await repository.classes.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-class', async (_event: any, id: number) => {
    try {
      return await repository.classes.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error: any) {
      console.error('Error deleting class:', error);
      throw error;
    }
  });

  ipcMain.handle('get-streams', async (_event: any, classId?: number) => {
    try {
      if (classId) {
        return await repository.streams.getByClass(db, ELECTRON_SCHOOL_ID, classId);
      }
      return await db.select().from(streams).where(eq(streams.schoolId, ELECTRON_SCHOOL_ID));
    } catch (error) {
      logDebug('[Handlers] Error getting streams', error);
      throw error;
    }
  });

  ipcMain.handle('update-stream', async (_event: any, data: any) => {
    try {
      return await repository.streams.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating stream:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-stream', async (_event: any, id: number) => {
    try {
      return await repository.streams.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error: any) {
      console.error('Error deleting stream:', error);
      throw error;
    }
  });

  // --- SUBJECTS ---

  ipcMain.handle('get-subjects', async () => {
    try {
      return await repository.subjects.getAll(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting subjects:', error);
      throw error;
    }
  });

  ipcMain.handle('update-subject', async (_event: any, data: any) => {
    try {
      return await repository.subjects.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating subject:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-subject', async (_event: any, id: number) => {
    try {
      return await repository.subjects.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting subject:', error);
      throw error;
    }
  });

  // --- SUBJECT ALLOCATIONS ---

  ipcMain.handle('get-subject-allocations', async (_event: any, yearId: number) => {
    try {
      return await repository.subjectAllocations.getByYear(db, ELECTRON_SCHOOL_ID, yearId);
    } catch (error) {
      console.error('Error getting subject allocations:', error);
      throw error;
    }
  });

  ipcMain.handle('create-subject-allocation', async (_event: any, data: any) => {
    try {
      return await repository.subjectAllocations.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error creating subject allocation:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-subject-allocation', async (_event: any, data: any) => {
    try {
      return await repository.subjectAllocations.delete(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error deleting subject allocation:', error);
      throw error;
    }
  });

  // --- TEACHERS ---

  ipcMain.handle('get-teachers', async () => {
    try {
      return await repository.teachers.getAll(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting teachers:', error);
      throw error;
    }
  });

  ipcMain.handle('get-teacher-by-id', async (_event: any, id: number) => {
    try {
      return await repository.teachers.getById(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error getting teacher by id:', error);
      throw error;
    }
  });

  ipcMain.handle('create-teacher', async (_event: any, data: any) => {
    try {
      return await repository.teachers.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error creating teacher:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'get-teacher-documents',
    async (_event: any, teacherId: number) => {
      try {
        return await repository.teacherDocuments.getByTeacher(db, ELECTRON_SCHOOL_ID, teacherId);
      } catch (error) {
        console.error('Error getting teacher documents:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('add-teacher-document', async (_event: any, data: any) => {
    try {
      return await repository.teacherDocuments.create(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error adding teacher document:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-teacher-document', async (_event: any, id: number) => {
    try {
      return await repository.teacherDocuments.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting teacher document:', error);
      throw error;
    }
  });

  ipcMain.handle('get-teacher-stats', async (_event: any, teacherId: number) => {
    try {
      return await repository.teachers.getStats(db, ELECTRON_SCHOOL_ID, teacherId);
    } catch (error) {
      console.error('Error getting teacher stats:', error);
      throw error;
    }
  });

  ipcMain.handle('update-teacher', async (_event: any, data: any) => {
    try {
      return await repository.teachers.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-teacher', async (_event: any, id: number) => {
    try {
      return await repository.teachers.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting teacher:', error);
      throw error;
    }
  });

  // --- FILE HANDLING ---

  ipcMain.handle(
    'save-file',
    async (
      _event: any,
      {
        fileBuffer,
        category,
        id,
        fileName,
      }: {
        fileBuffer: Buffer;
        category: string;
        id: string | number;
        fileName: string;
      }
    ) => {
      try {
        const userDataPath = app.getPath('userData');
        const uploadDir = path.join(
          userDataPath,
          'uploads',
          category,
          id.toString()
        );

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(fileBuffer));

        // Return relative path for platform-agnostic file actions (resolves to app-data:// or /api/files/)
        return path.join(category, id.toString(), fileName).replace(/\\/g, '/');
      } catch (error) {
        console.error('Error saving file:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('delete-file', async (_event: any, relativePath: string) => {
    try {
      const userDataPath = app.getPath('userData');
      const fullPath = path.join(userDataPath, 'uploads', relativePath);

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  });

  // --- SEEDING ---

  ipcMain.handle('seed-database', async () => {
    try {
      console.log('Verifying database state...');

      // Check if critical data exists to determine if we should seed
      const userCount = await db.select({ count: count() }).from(users);
      const examCount = await db.select({ count: count() }).from(examTypes);
      const classCount = await db.select({ count: count() }).from(classes);

      if (userCount[0].count > 0 && examCount[0].count > 0 && classCount[0].count > 0) {
        return {
          success: true,
          message: 'Database already initialized.',
        };
      }

      console.log('Seeding initial data...');

      // 1. Create Admin User
      const [admin] = await db
        .insert(users)
        .values({
          username: 'admin',
          passwordHash: 'admin123',
          fullName: 'System Administrator',
          role: 'Administrator',
          email: 'admin@school.com',
        })
        .returning();

      // 2. School Profile
      await db.insert(schoolProfile).values({
        name: 'School Nexus Academy',
        address: '123 Education Road, Kampala',
        phone: '+256 700 123456',
        email: 'info@schoolnexus.com',
        website: 'www.schoolnexus.com',
        motto: 'Excellence in Learning',
        currency: 'UGX',
      });

      // 3. Academic Year & Term
      const [year] = await db
        .insert(academicYears)
        .values({
          name: '2024',
          startDate: '2024-01-01',
          endDate: '2024-12-15',
          isActive: true,
        })
        .returning();

      const [term] = await db
        .insert(terms)
        .values({
          academicYearId: year.id,
          name: 'Term 1',
          startDate: '2024-02-05',
          endDate: '2024-05-03',
          isActive: true,
        })
        .returning();

      // 4. Classes
      const classesData = [
        { name: 'Primary One', code: 'P.1' },
        { name: 'Primary Two', code: 'P.2' },
      ];

      for (const cls of classesData) {
        const [newClass] = await db.insert(classes).values(cls).returning();
        await db.insert(streams).values([
          { classId: newClass.id, name: 'Blue', roomNumber: `Block A - ${cls.code}B` },
          { classId: newClass.id, name: 'Red', roomNumber: `Block A - ${cls.code}R` },
        ]);
      }

      // 5. Subjects
      await db.insert(subjects).values([
        { name: 'Mathematics', code: 'MTC', category: 'Core' },
        { name: 'English', code: 'ENG', category: 'Core' },
      ]);

      // 6. Exam Types
      await db.insert(examTypes).values([
        { name: 'Mid Term', shortCode: 'MID', weightage: 30 },
        { name: 'End of Term', shortCode: 'E.O.T', weightage: 70 },
      ]);

      // 7. Transaction Categories
      await db.insert(transactionCategories).values([
        { name: 'Tuition Fees', type: 'Income', description: 'Student tuition payments' },
        { name: 'Stationery', type: 'Expense', description: 'Office and classroom supplies' },
      ]);

      // 8. Settings
      await db.insert(settings).values([
        { key: 'admission_id_prefix', value: 'SNA', category: 'General' },
        { key: 'school_name', value: 'School Nexus Academy', category: 'General' },
      ]);

      // 9. Grading Scale
      await db.insert(gradingScales).values([
        { grade: 'D1', minScore: 90, maxScore: 100, points: 1, remark: 'Excellent' },
        { grade: 'D2', minScore: 80, maxScore: 89, points: 2, remark: 'Very Good' },
      ]);

      // 10. Report Template
      await db.insert(reportTemplates).values({
        name: 'Default Term Report',
        type: 'Term Report',
        description: 'Standard termly report card',
        content: JSON.stringify({ layout: 'primary', sections: ['header', 'marks_table'] }),
        status: 'Active',
      });

      return { success: true, message: 'Database seeding complete.' };
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    }
  });

  // --- STUDENTS ---

  ipcMain.handle('get-students', async () => {
    try {
      return await repository.students.getAll(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      logDebug('[Handlers] Error getting students', error);
      throw error;
    }
  });

  ipcMain.handle('get-student-by-id', async (_event: any, id: number) => {
    try {
      const student = await repository.students.getById(db, ELECTRON_SCHOOL_ID, id);
      if (student) {
        const guardians = await repository.guardians.getByStudent(db, ELECTRON_SCHOOL_ID, id);
        return { ...student, guardians };
      }
      return null;
    } catch (error) {
      console.error('Error getting student:', error);
      throw error;
    }
  });

  ipcMain.handle('create-student', async (_event: any, data: any) => {
    try {
      const {
        guardianName,
        guardianPhone,
        guardianEmail,
        guardianRelation,
        ...studentData
      } = data;

      const [newStudent] = await repository.students.update(db, ELECTRON_SCHOOL_ID, studentData);

      if (newStudent && (guardianName || guardianPhone || guardianEmail)) {
        await repository.guardians.upsertByStudent(db, ELECTRON_SCHOOL_ID, newStudent.id, {
          name: guardianName || 'Unknown',
          relationship: guardianRelation || 'Other',
          phone: guardianPhone,
          email: guardianEmail,
        });
      }
      return newStudent;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  });

  ipcMain.handle('update-student', async (_event: any, data: any) => {
    try {
      if (!data.id) throw new Error('Student ID required for update');

      const {
        id,
        guardianName,
        guardianPhone,
        guardianEmail,
        guardianRelation,
        guardianRelationship,
        ...studentData
      } = data;

      const results = await repository.students.update(db, ELECTRON_SCHOOL_ID, { ...studentData, id });
      const updatedStudent = results[0];

      if (updatedStudent) {
        const guardianData: any = {};
        if (guardianName) guardianData.name = guardianName;
        if (guardianPhone) guardianData.phone = guardianPhone;
        if (guardianRelation || guardianRelationship)
          guardianData.relationship = guardianRelation || guardianRelationship;
        if (guardianEmail) guardianData.email = guardianEmail;

        if (Object.keys(guardianData).length > 0) {
          await repository.guardians.upsertByStudent(db, ELECTRON_SCHOOL_ID, id, guardianData);
        }
      }

      return [updatedStudent];
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-student', async (_event: any, id: number) => {
    try {
      return await repository.students.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  });

  ipcMain.handle('restore-student', async (_event: any, id: number) => {
    try {
      return await repository.students.restore(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error restoring student:', error);
      throw error;
    }
  });

  ipcMain.handle('restore-students', async (_event: any, ids: number[]) => {
    try {
      return await repository.students.restoreBulk(db, ELECTRON_SCHOOL_ID, ids);
    } catch (error) {
      console.error('Error restoring students bulk:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'permanent-delete-student',
    async (_event: any, id: number) => {
      try {
        return await repository.students.permanentDelete(db, ELECTRON_SCHOOL_ID, id);
      } catch (error) {
        console.error('Error permanently deleting student:', error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    'permanent-delete-students',
    async (_event: any, ids: number[]) => {
      try {
        return await repository.students.permanentDeleteBulk(db, ELECTRON_SCHOOL_ID, ids);
      } catch (error) {
        console.error('Error permanently deleting students bulk:', error);
        throw error;
      }
    }
  );

  // Helper to compute school name initials
  const getSchoolInitials = async (): Promise<string> => {
    try {
      const profile = await db.select().from(schoolProfile).limit(1);
      if (profile && profile[0] && profile[0].name) {
        const words = profile[0].name.split(/[\s&]+/);
        const initials = words
          .map((word: string) => word.charAt(0).toUpperCase())
          .filter((char: string) => /[A-Z]/.test(char))
          .join('');
        if (initials.length > 0) return initials;
      }
    } catch (e) {
      console.error('Error computing school initials:', e);
    }
    return 'STU'; // Ultimate fallback
  };

  ipcMain.handle('get-admission-prefix', async () => {
    try {
      return await repository.students.getAdmissionPrefix(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting admission prefix:', error);
      return 'STU';
    }
  });

  ipcMain.handle(
    'bulk-import-students',
    async (_event: any, studentsData: any[]) => {
      try {
        const results = {
          success: 0,
          failed: 0,
          errors: [] as { row: number; error: string }[],
        };

        // Pre-fetch classes and streams for lookup
        const allClasses = await db.select().from(classes);
        const allStreams = await db.select().from(streams);

        // Fetch admission prefix from settings, falling back to dynamic school initials
        const settingsRecords = await db.select().from(settings).where(eq(settings.key, 'admission_id_prefix'));
        const prefix = (settingsRecords.length > 0 && settingsRecords[0].value) ? settingsRecords[0].value : await getSchoolInitials();
        const currentYear = new Date().getFullYear().toString();
        const basePrefix = `${prefix}/${currentYear}/`;

        // Find existing admission numbers for this prefix to determine max sequence
        const existingStudents = await db.select({ admissionNumber: students.admissionNumber })
          .from(students)
          .where(like(students.admissionNumber, `${basePrefix}%`));

        let maxSeq = 0;
        for (const s of existingStudents) {
          if (s.admissionNumber) {
            const parts = s.admissionNumber.split('/');
            if (parts.length > 1) {
              const seq = parseInt(parts[parts.length - 1], 10);
              if (!isNaN(seq) && seq > maxSeq) {
                maxSeq = seq;
              }
            }
          }
        }

        // Helper to find streamId and classId from class and stream names
        const findLocation = (className: string | undefined, streamName: string | undefined) => {
          if (!className) return { classId: null, streamId: null, error: 'Class name is required' };

          const normalizeClass = (name: string) => {
            let n = name.toLowerCase().trim();
            n = n.replace(/\\bone\\b/g, '1')
              .replace(/\\btwo\\b/g, '2')
              .replace(/\\bthree\\b/g, '3')
              .replace(/\\bfour\\b/g, '4')
              .replace(/\\bfive\\b/g, '5')
              .replace(/\\bsix\\b/g, '6')
              .replace(/\\bseven\\b/g, '7')
              .replace(/\\beight\\b/g, '8')
              .replace(/\\bnine\\b/g, '9');
            return n.replace(/[^a-z0-9]/g, '');
          };

          const normalizedInput = normalizeClass(className);
          const normalizedStreamName = streamName ? streamName.toLowerCase().replace(/[^a-z0-9]/g, '') : null;

          // Try to find exact class match
          let matchedClass = allClasses.find(
            (c: any) =>
              normalizeClass(c.name) === normalizedInput ||
              (c.code && normalizeClass(c.code) === normalizedInput)
          );

          if (!matchedClass) {
            // Try partial match
            matchedClass = allClasses.find(
              (c: any) =>
                normalizeClass(c.name).includes(normalizedInput) ||
                normalizedInput.includes(normalizeClass(c.name))
            );
          }

          if (matchedClass) {
            let matchedStream = null;
            if (normalizedStreamName) {
              matchedStream = allStreams.find(
                (s: any) => {
                  if (s.classId !== matchedClass!.id) return false;
                  const sn = s.name.toLowerCase().replace(/[^a-z0-9]/g, '');
                  return sn === normalizedStreamName ||
                    sn.includes(normalizedStreamName) ||
                    normalizedStreamName.includes(sn);
                }
              );
            }

            // Fallback to first stream if no specific stream matched
            if (!matchedStream && allStreams.some((s: any) => s.classId === matchedClass!.id)) {
              matchedStream = allStreams.find((s: any) => s.classId === matchedClass!.id);
            }

            return {
              classId: matchedClass.id,
              streamId: matchedStream?.id || null,
              error: null
            };
          }

          return { classId: null, streamId: null, error: `Class '${className}' not found` };
        };

        for (let i = 0; i < studentsData.length; i++) {
          const studentRow = studentsData[i];
          try {
            // Basic validation
            if (!studentRow.firstName || !studentRow.lastName) {
              throw new Error('First Name and Last Name are required');
            }

            // Generate admission number if not provided
            let admissionNumber = studentRow.admissionNumber;
            if (!admissionNumber) {
              maxSeq++;
              admissionNumber = `${basePrefix}${String(maxSeq).padStart(3, '0')}`;
            } else if (typeof admissionNumber === 'string') {
              // Extract sequence number from existing admission number to prevent collisions
              // Handles formats like SN-001, SN/2024/001, or just 001
              const numericMatch = admissionNumber.match(/(\d+)$/);
              if (numericMatch) {
                const seq = parseInt(numericMatch[1], 10);
                if (!isNaN(seq) && seq > maxSeq) {
                  maxSeq = seq;
                }
              }
            }

            // Resolve IDs from names
            const { classId, streamId, error: locationError } = findLocation(studentRow.class, studentRow.stream);

            if (locationError) {
              throw new Error(locationError);
            }

            const studentRecord = {
              admissionNumber,
              firstName: studentRow.firstName,
              lastName: studentRow.lastName,
              gender: studentRow.gender || 'Other',
              dob: studentRow.dateOfBirth || studentRow.dob || null,
              nationality: studentRow.nationality || null,
              classId,
              streamId,
              status: 'Active',
              email: studentRow.email || null,
              enrollmentDate:
                studentRow.admissionDate ||
                studentRow.enrollmentDate ||
                new Date().toISOString().split('T')[0],
              parentNames:
                studentRow.guardianName || studentRow.parentNames || null,
              parentContact:
                studentRow.guardianPhone || studentRow.parentContact || null,
              address: studentRow.address || null,
              linNumber: studentRow.linNumber || null,
              schoolPayCode: studentRow.schoolPayCode || null,
              previousSchool: studentRow.previousSchool || null,
            };

            const [newStudent] = await db
              .insert(students)
              .values(studentRecord)
              .returning();

            // Create guardian if data provided
            if ((studentRow.guardianName || studentRow.parentNames) && newStudent) {
              await db.insert(guardians).values({
                studentId: newStudent.id,
                name: studentRow.guardianName || studentRow.parentNames,
                relationship: studentRow.guardianRelationship || 'Guardian',
                phone: studentRow.guardianPhone || studentRow.parentContact || null,
                email: studentRow.guardianEmail || null,
              });
            }

            results.success++;
          } catch (err: any) {
            results.failed++;
            results.errors.push({
              row: i + 1,
              error: err.message || 'Unknown error',
            });
          }
        }

        return results;
      } catch (error) {
        console.error('Error bulk importing students:', error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    'promote-students',
    async (
      _event: any,
      data: { studentIds: number[]; targetStreamId?: number; status?: string }
    ) => {
      try {
        return await repository.students.promoteBulk(db, ELECTRON_SCHOOL_ID, data);
      } catch (error) {
        console.error('Error promoting students:', error);
        throw error;
      }
    }
  );

  // --- EXAMS ---

  ipcMain.handle('get-exams', async () => {
    try {
      return await repository.exams.getAll(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting exams:', error);
      throw error;
    }
  });

  ipcMain.handle('get-exams-by-term', async (_event: any, termId: number) => {
    try {
      return await repository.exams.getByTerm(db, ELECTRON_SCHOOL_ID, termId);
    } catch (error) {
      console.error('Error getting exams by term:', error);
      throw error;
    }
  });

  ipcMain.handle('get-exam-types', async () => {
    try {
      return await repository.examTypes.getAll(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting exam types:', error);
      throw error;
    }
  });

  ipcMain.handle('create-exam-type', async (_event: any, data: any) => {
    try {
      return await repository.examTypes.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error creating exam type:', error);
      throw error;
    }
  });

  ipcMain.handle('update-exam-type', async (_event: any, data: any) => {
    try {
      return await repository.examTypes.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating exam type:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-exam-type', async (_event: any, id: number) => {
    try {
      return await repository.examTypes.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting exam type:', error);
      throw error;
    }
  });

  ipcMain.handle('create-exam', async (_event: any, data: any) => {
    try {
      return await repository.exams.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error creating exam:', error);
      throw error;
    }
  });

  ipcMain.handle('update-exam', async (_event: any, data: any) => {
    try {
      return await repository.exams.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating exam:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-exam', async (_event: any, id: number) => {
    try {
      return await repository.exams.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting exam:', error);
      throw error;
    }
  });

  ipcMain.handle('get-exam-types', async () => {
    try {
      return await repository.examTypes.getAll(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting exam types:', error);
      throw error;
    }
  });

  ipcMain.handle('create-exam-type', async (_event: any, data: any) => {
    try {
      return await repository.examTypes.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error creating exam type:', error);
      throw error;
    }
  });

  ipcMain.handle('update-exam-type', async (_event: any, data: any) => {
    try {
      return await repository.examTypes.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating exam type:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-exam-type', async (_event: any, id: number) => {
    try {
      return await repository.examTypes.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting exam type:', error);
      throw error;
    }
  });

  // --- MARKS ---

  ipcMain.handle(
    'get-marks-by-exam-subject',
    async (
      _event: any,
      { examId, subjectId }: { examId: number; subjectId: number }
    ) => {
      try {
        return await db
          .select({
            id: marks.id,
            studentId: marks.studentId,
            subjectId: marks.subjectId,
            examId: marks.examId,
            score: marks.score,
            grade: marks.grade,
            remarks: marks.remarks,
            studentName: sql`${students.firstName} || ' ' || ${students.lastName}`,
            subjectName: subjects.name,
          })
          .from(marks)
          .innerJoin(students, eq(marks.studentId, students.id))
          .innerJoin(subjects, eq(marks.subjectId, subjects.id))
          .where(and(eq(marks.examId, examId), eq(marks.subjectId, subjectId)));
      } catch (error) {
        console.error('Error getting marks by exam and subject:', error);
        throw error;
      }
    }
  );


  // --- GRADING ---

  ipcMain.handle('get-grading-scales', async () => {
    try {
      return await repository.gradingScales.getAll(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting grading scales:', error);
      throw error;
    }
  });

  ipcMain.handle('create-grading-scale', async (_event: any, data: any) => {
    try {
      return await repository.gradingScales.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error creating grading scale:', error);
      throw error;
    }
  });

  ipcMain.handle('update-grading-scale', async (_event: any, data: any) => {
    try {
      return await repository.gradingScales.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating grading scale:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-grading-scale', async (_event: any, id: number) => {
    try {
      return await repository.gradingScales.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting grading scale:', error);
      throw error;
    }
  });

  // --- ATTENDANCE ---

  ipcMain.handle('get-attendance-by-date', async (_event: any, params: any) => {
    try {
      return await repository.attendance.getByDate(db, ELECTRON_SCHOOL_ID, params.date, params.termId);
    } catch (error) {
      console.error('Error getting attendance:', error);
      throw error;
    }
  });

  ipcMain.handle('get-students-for-attendance', async (_event: any, streamId: number) => {
    try {
      return await repository.attendance.getForAttendance(db, ELECTRON_SCHOOL_ID, streamId);
    } catch (error) {
      console.error('Error getting students for attendance:', error);
      throw error;
    }
  });

  ipcMain.handle('get-attendance-by-student', async (_event: any, studentId: number) => {
    try {
      return await repository.attendance.getByStudent(db, ELECTRON_SCHOOL_ID, studentId);
    } catch (error) {
      console.error('Error getting attendance by student:', error);
      throw error;
    }
  });

  ipcMain.handle('save-attendance', async (_event: any, records: any[]) => {
    try {
      return await repository.attendance.update(db, ELECTRON_SCHOOL_ID, records);
    } catch (error) {
      console.error('Error saving attendance:', error);
      throw error;
    }
  });

  // --- FEES ---


  ipcMain.handle('get-student-fees', async (_event: any, studentId: number) => {
    try {
      return await repository.invoices.getStudentFeeSummary(db, ELECTRON_SCHOOL_ID, studentId);
    } catch (error) {
      console.error('Error getting student fees:', error);
      throw error;
    }
  });

  ipcMain.handle('get-fee-payments', async (_event: any, studentId: number) => {
    try {
      return await repository.feePayments.getByStudent(db, ELECTRON_SCHOOL_ID, studentId);
    } catch (error) {
      console.error('Error getting fee payments:', error);
      throw error;
    }
  });

  ipcMain.handle('create-fee-payment', async (_event: any, data: any) => {
    try {
      if (data.invoiceId) {
        return await repository.feePayments.create(db, ELECTRON_SCHOOL_ID, data);
      } else {
        const createdPayments = await repository.feePayments.autoAllocate(db, ELECTRON_SCHOOL_ID, data);
        return createdPayments[0];
      }
    } catch (error) {
      console.error('Error creating fee payment:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'get-fee-structures',
    async (_event: any, params?: { termId?: number; classId?: number }) => {
      try {
        if (params?.termId && params?.classId) {
          return await repository.feeStructures.getByTermAndClass(db, ELECTRON_SCHOOL_ID, params.termId, params.classId);
        }
        return await repository.feeStructures.getAll(db, ELECTRON_SCHOOL_ID);
      } catch (error) {
        console.error('Error getting fee structures:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('delete-fee-payment', async (_event: any, id: number) => {
    try {
      return await repository.feePayments.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting fee payment:', error);
      throw error;
    }
  });

  ipcMain.handle('create-fee-structure', async (_event: any, data: any) => {
    try {
      return await repository.feeStructures.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error creating fee structure:', error);
      throw error;
    }
  });

  ipcMain.handle('update-fee-structure', async (_event: any, data: any) => {
    try {
      return await repository.feeStructures.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating fee structure:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-fee-structure', async (_event: any, id: number) => {
    try {
      return await repository.feeStructures.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting fee structure:', error);
      throw error;
    }
  });

  ipcMain.handle('get-fee-assignments', async (_event: any, filters?: any) => {
    try {
      return await repository.feeAssignments.getDetailedReport(db, ELECTRON_SCHOOL_ID, filters);
    } catch (error) {
      console.error('Error getting fee assignments:', error);
      throw error;
    }
  });

  ipcMain.handle('get-all-payments', async () => {
    try {
      return await repository.feePayments.getReport(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting all payments:', error);
      throw error;
    }
  });


  ipcMain.handle('bulk-delete-fee-assignments', async (_event: any, data: any) => {
    try {
      return await repository.feeAssignments.bulkDelete(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error bulk deleting fee assignments:', error);
      throw error;
    }
  });

  ipcMain.handle('update-fee-assignment', async (_event: any, id: number, data: any) => {
    try {
      const [updatedAssignment] = await repository.feeAssignments.update(db, ELECTRON_SCHOOL_ID, { ...data, id });
      if (!updatedAssignment) throw new Error('Fee assignment not found');
      return { success: true, assignment: updatedAssignment };
    } catch (error) {
      console.error('Error updating fee assignment:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-fee-assignment', async (_event: any, id: number) => {
    try {
      const [deletedAssignment] = await repository.feeAssignments.delete(db, ELECTRON_SCHOOL_ID, id);
      if (!deletedAssignment) throw new Error('Fee assignment not found');
      return { success: true, assignment: deletedAssignment };
    } catch (error) {
      console.error('Error deleting fee assignment:', error);
      throw error;
    }
  });

  ipcMain.handle('bulk-create-fee-assignments', async (_event: any, data: any) => {
    try {
      return await repository.feeAssignments.bulkCreate(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error bulk creating fee assignments:', error);
      throw error;
    }
  });

  ipcMain.handle('get-invoices', async (_event: any, filters?: any) => {
    try {
      const results = await repository.invoices.getAll(db, ELECTRON_SCHOOL_ID, filters);
      // Enriching with joined data is done in the repository or kept simple here if repository is basic
      // For now, let's keep it simple as repository returns basic invoice data
      return results;
    } catch (error) {
      console.error('Error getting invoices:', error);
      throw error;
    }
  });

  ipcMain.handle('get-invoice-by-id', async (_event: any, id: number) => {
    try {
      return await repository.invoices.getDetailed(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error getting invoice by id:', error);
      throw error;
    }
  });

  ipcMain.handle('get-payment-by-id', async (_event: any, id: number) => {
    try {
      return await repository.feePayments.getDetailed(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error getting payment by id:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'generate-invoices',
    async (_event: any, { classId, termId, dueDate, studentId }: any) => {
      try {
        let targetStudents: { id: number }[] = [];
        let targetClassId = classId;

        if (studentId) {
          // If generating for a single student, fetch their details
          const [student] = await db
            .select({
              id: students.id,
              classId: students.classId,
              streamId: students.streamId,
            })
            .from(students)
            .where(eq(students.id, studentId));

          if (student) {
            targetStudents = [{ id: student.id }];
            // If student has a stream, get the class from the stream, otherwise use student's class
            if (student.streamId) {
              const [stream] = await db
                .select({ classId: streams.classId })
                .from(streams)
                .where(eq(streams.id, student.streamId))
                .limit(1);
              targetClassId = stream?.classId || student.classId;
            } else {
              targetClassId = student.classId;
            }
          }
        } else if (classId) {
          // 1. Get all students in the class (both with and without streams)
          const studentsWithStreams = await db
            .select({ id: students.id })
            .from(students)
            .innerJoin(streams, eq(students.streamId, streams.id))
            .where(
              and(eq(streams.classId, classId), eq(students.status, 'Active'))
            );

          const studentsWithoutStreams = await db
            .select({ id: students.id })
            .from(students)
            .where(
              and(
                eq(students.classId, classId),
                eq(students.status, 'Active'),
                sql`${students.streamId} IS NULL`
              )
            );

          // Combine both groups
          targetStudents = [...studentsWithStreams, ...studentsWithoutStreams];
        }

        if (targetStudents.length === 0) {
          return { count: 0 };
        }

        const results = [];

        for (const student of targetStudents) {
          // Get fee structures for this student's class or general fees
          const applicableFees = await db
            .select()
            .from(feeStructures)
            .where(
              and(
                eq(feeStructures.termId, termId),
                or(
                  eq(feeStructures.classId, targetClassId),
                  sql`${feeStructures.classId} IS NULL`
                )
              )
            );

          if (applicableFees.length === 0) continue;

          const totalAmount = applicableFees.reduce((sum: number, fee: any) => sum + fee.amount, 0);

          // Check for existing invoice
          const [existingInvoice] = await db
            .select()
            .from(invoices)
            .where(and(eq(invoices.studentId, student.id), eq(invoices.termId, termId)))
            .limit(1);

          let invoiceId: number;

          if (existingInvoice) {
            invoiceId = existingInvoice.id;
            // Update existing invoice amount
            await db
              .update(invoices)
              .set({ amount: existingInvoice.amount + totalAmount })
              .where(eq(invoices.id, invoiceId));
          } else {
            // Create new invoice
            const [newInvoice] = await db
              .insert(invoices)
              .values({
                studentId: student.id,
                termId: termId,
                amount: totalAmount,
                dueDate: dueDate || null,
                invoiceNumber: `INV-${Date.now()}-${student.id}`,
              })
              .returning();
            invoiceId = newInvoice.id;
          }

          results.push({ studentId: student.id, invoiceId, amount: totalAmount });
        }

        return { success: true, count: results.length };
      } catch (error) {
        console.error('Error generating invoices:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('delete-invoice', async (_event: any, id: number) => {
    try {
      return await repository.invoices.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  });


  // --- DASHBOARD STATS ---

  ipcMain.handle('get-dashboard-stats', async () => {
    try {
      return await repository.dashboard.getStats(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  });

  ipcMain.handle('get-dashboard-charts-data', async () => {
    try {
      return await repository.dashboard.getChartsData(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting dashboard charts:', error);
      throw error;
    }
  });


  ipcMain.handle('get-top-debtors', async () => {
    try {
      return await repository.invoices.getTopDebtors(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting top debtors:', error);
      throw error;
    }
  });

  // --- GUARDIANS ---

  ipcMain.handle('get-guardians', async (_event: any, studentId: number) => {
    try {
      return await db
        .select()
        .from(guardians)
        .where(eq(guardians.studentId, studentId));
    } catch (error) {
      console.error('Error getting guardians:', error);
      throw error;
    }
  });

  ipcMain.handle('get-all-guardians', async () => {
    try {
      // Join with students to get student names if needed, but for now just return guardians
      // Ideally we should join to get student name for the report
      const result = await db
        .select({
          id: guardians.id,
          studentId: guardians.studentId,
          fullName: guardians.name, // Mapping name to fullName as expected by frontend
          relationship: guardians.relationship,
          phone: guardians.phone,
          email: guardians.email,
          occupation: sql`'N/A'`, // Placeholder as occupation is not in schema yet
          studentName: sql`(${students.firstName} || ' ' || ${students.lastName})`,
        })
        .from(guardians)
        .leftJoin(students, eq(guardians.studentId, students.id))
        .orderBy(guardians.name);

      return result;
    } catch (error) {
      console.error('Error getting all guardians:', error);
      throw error;
    }
  });

  ipcMain.handle('update-guardian', async (_event: any, data: any) => {
    try {
      if (data.id) {
        return await db
          .update(guardians)
          .set(data)
          .where(eq(guardians.id, data.id))
          .returning();
      }
      return await db.insert(guardians).values(data).returning();
    } catch (error) {
      console.error('Error updating guardian:', error);
      throw error;
    }
  });

  // --- EXPENSES ---

  ipcMain.handle('get-expenses', async () => {
    try {
      return await repository.expenses.getAll(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting expenses:', error);
      throw error;
    }
  });

  ipcMain.handle('create-expense', async (_event: any, data: any) => {
    try {
      return await repository.expenses.record(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  });

  ipcMain.handle('update-expense', async (_event: any, data: any) => {
    try {
      return await repository.expenses.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-expense', async (_event: any, id: number) => {
    try {
      return await repository.expenses.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  });

  ipcMain.handle('get-expense-stats', async () => {
    try {
      return await repository.expenses.getStats(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting expense stats:', error);
      throw error;
    }
  });

  // --- INCOME ---

  ipcMain.handle('get-income', async () => {
    try {
      return await repository.income.getAll(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting income:', error);
      throw error;
    }
  });

  ipcMain.handle('create-income', async (_event: any, data: any) => {
    try {
      return await repository.income.record(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error creating income:', error);
      throw error;
    }
  });

  ipcMain.handle('get-termly-report-data', async (_event: any, filters: any) => {
    try {
      return await repository.reports.getTermlyReportData(db, ELECTRON_SCHOOL_ID, filters);
    } catch (error) {
      console.error('Error getting termly report data:', error);
      throw error;
    }
  });

  ipcMain.handle('get-class-performance', async (_event: any, filters: any) => {
    try {
      return await repository.analytics.getClassPerformance(db, ELECTRON_SCHOOL_ID, filters);
    } catch (error) {
      console.error('Error getting class performance:', error);
      throw error;
    }
  });

  ipcMain.handle('get-performance-analytics', async (_event: any, filters: any) => {
    try {
      return await repository.analytics.getPerformanceAnalytics(db, ELECTRON_SCHOOL_ID, filters);
    } catch (error) {
      console.error('Error getting performance analytics:', error);
      throw error;
    }
  });

  ipcMain.handle('get-exam-marks-report', async (_event: any, filters: any) => {
    try {
      return await repository.reports.getExamMarksReport(db, ELECTRON_SCHOOL_ID, filters);
    } catch (error) {
      console.error('Error getting exam marks report:', error);
      throw error;
    }
  });

  ipcMain.handle('get-income-stats', async () => {
    try {
      return await repository.income.getStats(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting income stats:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-income', async (_event: any, id: number) => {
    try {
      return await repository.income.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting income:', error);
      throw error;
    }
  });

  // --- BUDGET ---

  ipcMain.handle('get-budgets', async (_event: any, yearId: number) => {
    try {
      return await repository.budget.getByYear(db, ELECTRON_SCHOOL_ID, yearId);
    } catch (error) {
      console.error('Error getting budgets:', error);
      throw error;
    }
  });

  ipcMain.handle('create-budget', async (_event: any, data: any) => {
    try {
      return await repository.budget.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  });

  ipcMain.handle('update-budget', async (_event: any, data: any) => {
    try {
      return await repository.budget.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-budget', async (_event: any, id: number) => {
    try {
      return await repository.budget.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  });

  ipcMain.handle('get-budget-stats', async () => {
    try {
      return await repository.budget.getStats(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting budget stats:', error);
      throw error;
    }
  });

  ipcMain.handle('get-budget-forecast', async (_event: any, targetYearId: number) => {
    try {
      return await repository.budget.getForecast(db, ELECTRON_SCHOOL_ID, targetYearId);
    } catch (error) {
      console.error('Error calculating budget forecast:', error);
      throw error;
    }
  });

  // --- MARKS ---

  ipcMain.handle('get-marks-by-exam', async (_event: any, examId: number) => {
    try {
      return await repository.marks.getByExam(db, ELECTRON_SCHOOL_ID, examId);
    } catch (error) {
      console.error('Error getting marks by exam:', error);
      throw error;
    }
  });

  ipcMain.handle('get-marks-by-student', async (_event: any, studentId: number) => {
    try {
      return await repository.marks.getByStudent(db, ELECTRON_SCHOOL_ID, studentId);
    } catch (error) {
      console.error('Error getting marks by student:', error);
      throw error;
    }
  });

  ipcMain.handle('update-marks', async (_event: any, data: any) => {
    try {
      return await repository.marks.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating marks:', error);
      throw error;
    }
  });

  // --- REPORTS ---

  ipcMain.handle('get-teacher-report-data', async (_event: any, filters: any) => {
    try {
      return await repository.reports.getTeacherReport(db, ELECTRON_SCHOOL_ID, filters);
    } catch (error) {
      console.error('Error getting teacher report data:', error);
      throw error;
    }
  });

  ipcMain.handle('get-attendance-report', async () => {
    try {
      return await repository.reports.getAttendanceReport(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting attendance report:', error);
      throw error;
    }
  });

  ipcMain.handle('get-financial-report', async () => {
    try {
      return await repository.reports.getFinancialReport(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting financial report:', error);
      throw error;
    }
  });

  // --- PAYROLL ---

  ipcMain.handle('get-all-payroll', async () => {
    try {
      return await repository.payroll.getAll(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting all payroll:', error);
      throw error;
    }
  });

  ipcMain.handle('create-payroll', async (_event: any, data: any) => {
    try {
      return await repository.payroll.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error creating payroll:', error);
      throw error;
    }
  });

  ipcMain.handle('update-payroll', async (_event: any, data: any) => {
    try {
      return await repository.payroll.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating payroll:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-payroll', async (_event: any, id: number) => {
    try {
      return await repository.payroll.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting payroll:', error);
      throw error;
    }
  });

  ipcMain.handle('get-salary-payments', async (_event: any, payrollId?: number) => {
    try {
      return await repository.salaryPayments.getAll(db, ELECTRON_SCHOOL_ID, payrollId);
    } catch (error) {
      console.error('Error getting salary payments:', error);
      throw error;
    }
  });

  ipcMain.handle('process-salary-payment', async (_event: any, data: any) => {
    try {
      return await repository.salaryPayments.record(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error processing salary payment:', error);
      throw error;
    }
  });

  ipcMain.handle('get-payroll-stats', async () => {
    try {
      const allPayroll = await db.select().from(payroll).where(and(eq(payroll.status, 'Active'), eq(payroll.schoolId, ELECTRON_SCHOOL_ID)));
      const [totalPaymentsResult] = await db
        .select({ total: sum(salaryPayments.amountPaid) })
        .from(salaryPayments)
        .where(eq(salaryPayments.schoolId, ELECTRON_SCHOOL_ID));

      const monthlyTotal = allPayroll.reduce((sum: number, p: any) => sum + (p.baseSalary || 0) + (p.allowances || 0) - (p.deductions || 0), 0);
      const totalPaid = Number(totalPaymentsResult?.total || 0);

      return {
        activeStaffCount: allPayroll.length,
        monthlyTotal,
        totalPaid,
      };
    } catch (error) {
      console.error('Error getting payroll stats:', error);
      throw error;
    }
  });


  // --- STUDENT GROUPS ---

  ipcMain.handle('get-student-groups', async () => {
    try {
      return await repository.studentGroups.getAll(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting student groups:', error);
      throw error;
    }
  });

  ipcMain.handle('create-student-group', async (_event: any, data: any) => {
    try {
      return await repository.studentGroups.create(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error creating student group:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-student-group', async (_event: any, id: number) => {
    try {
      return await repository.studentGroups.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting student group:', error);
      throw error;
    }
  });

  ipcMain.handle('get-group-members', async (_event: any, groupId: number) => {
    try {
      return await repository.studentGroupMembers.getMembers(db, ELECTRON_SCHOOL_ID, groupId);
    } catch (error) {
      console.error('Error getting group members:', error);
      throw error;
    }
  });

  ipcMain.handle('add-group-member', async (_event: any, data: any) => {
    try {
      return await repository.studentGroupMembers.add(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error adding group member:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'remove-group-member',
    async (_event: any, data: { groupId: number; studentId: number }) => {
      try {
        return await repository.studentGroupMembers.remove(db, ELECTRON_SCHOOL_ID, data);
      } catch (error) {
        console.error('Error removing group member:', error);
        throw error;
      }
    }
  );

  // --- REPORT TEMPLATES ---

  ipcMain.handle('get-report-templates', async () => {
    try {
      return await repository.reportTemplates.getAll(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting report templates:', error);
      throw error;
    }
  });

  ipcMain.handle('create-report-template', async (_event: any, data: any) => {
    try {
      return await repository.reportTemplates.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error creating report template:', error);
      throw error;
    }
  });

  ipcMain.handle('update-report-template', async (_event: any, data: any) => {
    try {
      return await repository.reportTemplates.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating report template:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-report-template', async (_event: any, id: number) => {
    try {
      return await repository.reportTemplates.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting report template:', error);
      throw error;
    }
  });
  ipcMain.handle('get-student-report-data', async (_event: any, params: any) => {
    try {
      return await repository.reports.getStudentReportData(db, ELECTRON_SCHOOL_ID, params);
    } catch (error) {
      console.error('Error getting student report data:', error);
      throw error;
    }
  });
  ipcMain.handle('save-marks', async (_event: any, marksList: any[]) => {
    try {
      return await repository.marks.update(db, ELECTRON_SCHOOL_ID, marksList);
    } catch (error) {
      console.error('Error saving marks:', error);
      throw error;
    }
  });

  // Setup wizard handlers
  ipcMain.handle('has-completed-setup', async () => {
    try {
      return await repository.setup.hasCompleted(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Setup check failed:', error);
      return false;
    }
  });

  ipcMain.handle('initialize-database', async () => {
    try {
      console.log('Starting fresh database initialization...');

      const { closeDatabase, initializeDatabase, getDbPath } = await import('./index-electron.js');

      // Close current connection
      try {
        closeDatabase();
      } catch (e) {
        console.error('Error closing database before reset:', e);
      }

      // Delete existing database file
      const dbPath = getDbPath();
      if (fs.existsSync(dbPath)) {
        try {
          console.log(`Deleting existing database at: ${dbPath}`);
          fs.unlinkSync(dbPath);
          console.log('Database file deleted successfully');
        } catch (unlinkError) {
          console.error(`Failed to delete database file at ${dbPath}:`, unlinkError);
          // If we can't delete it, we might still be able to proceed if initializeDatabase overwrites it
          // better-sqlite3 handles this sometimes, but it's safer to alert
        }
      }

      // Re-initialize (creates fresh file and runs "migration" setup)
      const fresh = await initializeDatabase();

      // Create the initial admin setting
      // We use the fresh db instance from initializeDatabase to be 100% sure
      await fresh.db.insert(settings).values({
        key: 'setup_completed',
        value: 'false',
        category: 'system'
      }).onConflictDoUpdate({
        target: settings.key,
        set: { value: 'false' }
      });

      console.log('Fresh database file created and initialized successfully');
      return { success: true, message: 'Fresh database created successfully' };
    } catch (error) {
      console.error('Database initialization failed:', error);
      return { success: false, message: 'Database initialization failed', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  ipcMain.handle('mark-setup-completed', async () => {
    try {
      return await repository.setup.markAsCompleted(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Failed to mark setup as completed:', error);
      throw error;
    }
  });

  ipcMain.handle('get-database-status', async () => {
    try {
      const initialized = await repository.setup.hasCompleted(db, ELECTRON_SCHOOL_ID);
      return {
        connected: true,
        initialized,
        message: initialized ? 'Database is ready' : 'Database needs initialization'
      };
    } catch (error) {
      console.error('Database status check failed:', error);
      return {
        connected: false,
        initialized: false,
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  });

  ipcMain.handle('save-setup-data', async (_event: any, data: any) => {
    try {
      return await repository.setup.saveInitialData(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error saving setup data:', error);
      throw error;
    }
  });

  ipcMain.handle('complete-setup', async (_event: any, { schoolId, data }: any) => {
    try {
      const targetSchoolId = schoolId !== undefined ? schoolId : ELECTRON_SCHOOL_ID;
      // 1. Save all initial data
      await repository.setup.saveInitialData(db, targetSchoolId, data);
      // 2. Mark as completed
      return await repository.setup.markAsCompleted(db, targetSchoolId);
    } catch (error) {
      console.error('Complete setup failed:', error);
      throw error;
    }
  });

  // --- ROLES HANDLERS ---

  ipcMain.handle('get-roles', async () => {
    try {
      return await repository.roles.getAll(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting roles:', error);
      throw error;
    }
  });

  ipcMain.handle('create-role', async (_event: any, data: any) => {
    try {
      return await repository.roles.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  });

  ipcMain.handle('update-role', async (_event: any, data: any) => {
    try {
      return await repository.roles.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-role', async (_event: any, id: number) => {
    try {
      return await repository.roles.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  });

  ipcMain.handle('get-users-by-role', async (_event: any, roleName: string) => {
    try {
      const usersWithRole = await repository.users.getByRole(db, ELECTRON_SCHOOL_ID, roleName);
      return usersWithRole.length; // Maintaining original return behavior
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  });

  // --- BACKUP HANDLERS ---

  ipcMain.handle('get-backups', async () => {
    try {
      return await repository.backups.getAll(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting backups:', error);
      throw error;
    }
  });

  ipcMain.handle('create-backup', async () => {
    try {
      const dbPath = path.join(app.getPath('userData'), 'school-nexus.db');
      const backupDir = path.join(app.getPath('userData'), 'backups');

      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup-${timestamp}.db`;
      const backupPath = path.join(backupDir, backupName);

      fs.copyFileSync(dbPath, backupPath);

      const stats = fs.statSync(backupPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      return await repository.backups.record(db, ELECTRON_SCHOOL_ID, {
        name: `Manual Backup - ${new Date().toLocaleDateString()}`,
        filePath: backupPath,
        size: `${sizeMB} MB`,
        type: 'Manual',
        status: 'Success',
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      await repository.backups.record(db, ELECTRON_SCHOOL_ID, {
        name: `Failed Backup - ${new Date().toLocaleDateString()}`,
        type: 'Manual',
        status: 'Failed',
      });
      throw error;
    }
  });

  ipcMain.handle('restore-backup', async (_event: any, backupId: number) => {
    try {
      const backup = await db.select().from(backups).where(eq(backups.id, backupId)).limit(1);

      if (backup.length === 0) {
        throw new Error('Backup not found');
      }

      const backupPath = backup[0].filePath;
      if (!backupPath || !fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }

      const dbPath = path.join(app.getPath('userData'), 'school-nexus.db');

      // Close current database connection before restoring
      // Note: This would require proper handling in the main process
      fs.copyFileSync(backupPath, dbPath);

      return { success: true };
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-backup', async (_event: any, id: number) => {
    try {
      const b = await repository.backups.getById(db, ELECTRON_SCHOOL_ID, id);
      if (b && b.filePath && fs.existsSync(b.filePath)) {
        fs.unlinkSync(b.filePath);
      }
      return await repository.backups.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw error;
    }
  });
  // --- TRANSACTION CATEGORIES ---

  ipcMain.handle('get-transaction-categories', async () => {
    try {
      return await repository.transactionCategories.getAll(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting transaction categories:', error);
      throw error;
    }
  });

  ipcMain.handle('create-transaction-category', async (_event: any, data: any) => {
    try {
      return await repository.transactionCategories.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error creating transaction category:', error);
      throw error;
    }
  });

  ipcMain.handle('update-transaction-category', async (_event: any, data: any) => {
    try {
      return await repository.transactionCategories.update(db, ELECTRON_SCHOOL_ID, data);
    } catch (error) {
      console.error('Error updating transaction category:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-transaction-category', async (_event: any, id: number) => {
    try {
      return await repository.transactionCategories.delete(db, ELECTRON_SCHOOL_ID, id);
    } catch (error) {
      console.error('Error deleting transaction category:', error);
      throw error;
    }
  });


  ipcMain.handle('download-backup', async (_event: any, id: number) => {
    try {
      const backup = await db.select().from(backups).where(eq(backups.id, id)).limit(1);

      if (backup.length === 0) {
        throw new Error('Backup not found');
      }

      const backupPath = backup[0].filePath;
      if (!backupPath || !fs.existsSync(backupPath)) {
        throw new Error('Backup file not found');
      }

      return backupPath;
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw error;
    }
  });

  // --- SETTINGS HANDLERS ---

  ipcMain.handle('get-settings', async () => {
    try {
      return await repository.settings.get(db, ELECTRON_SCHOOL_ID);
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  });

  ipcMain.handle('update-setting', async (_event: any, { key, value, category }: any) => {
    try {
      return await repository.settings.update(db, key, value, ELECTRON_SCHOOL_ID, category);
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  });


  logDebug('[Handlers] IPC handler registration complete.');
};
