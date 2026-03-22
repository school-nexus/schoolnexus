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

export const setupHandlers = (ipcMain: any) => {
  logDebug('[Handlers] Starting IPC handler registration...');
  
  ipcMain.handle('get-school-profile', async () => {
    try {
      logDebug('[Handlers] get-school-profile called');

      const profile = await db.select().from(schoolProfile).limit(1);
      return profile[0] || null;
    } catch (error) {
      logDebug('[Handlers] Error getting school profile', error);
      throw error;
    }
  });

  ipcMain.handle('update-school-profile', async (_event: any, data: any) => {
    try {
      const existing = await db.select().from(schoolProfile).limit(1);
      if (existing.length > 0) {
        return await db
          .update(schoolProfile)
          .set(data)
          .where(eq(schoolProfile.id, existing[0].id))
          .returning();
      } else {
        return await db.insert(schoolProfile).values(data).returning();
      }
    } catch (error) {
      console.error('Error updating school profile:', error);
      throw error;
    }
  });

  // --- ACADEMIC YEARS ---

  ipcMain.handle('get-academic-years', async () => {
    try {
      return await db
        .select()
        .from(academicYears)
        .orderBy(academicYears.startDate);
    } catch (error) {
      console.error('Error getting academic years:', error);
      throw error;
    }
  });

  ipcMain.handle('update-academic-year', async (_event: any, data: any) => {
    try {
      if (data.id) {
        return await db
          .update(academicYears)
          .set(data)
          .where(eq(academicYears.id, data.id))
          .returning();
      } else {
        return await db.insert(academicYears).values(data).returning();
      }
    } catch (error) {
      console.error('Error updating academic year:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'set-active-academic-year',
    async (_event: any, id: number) => {
      try {
        await db.update(academicYears).set({ isActive: false });
        return await db
          .update(academicYears)
          .set({ isActive: true })
          .where(eq(academicYears.id, id))
          .returning();
      } catch (error) {
        console.error('Error setting active academic year:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('archive-academic-year', async (_event: any, id: number) => {
    try {
      return await db
        .update(academicYears)
        .set({ status: 'Archived', isActive: false })
        .where(eq(academicYears.id, id))
        .returning();
    } catch (error) {
      console.error('Error archiving academic year:', error);
      throw error;
    }
  });

  // --- TERMS ---

  ipcMain.handle('delete-term', async (_event: any, id: number) => {
    try {
      // Check for dependencies
      const [examDeps] = await db.select({ count: count() }).from(exams).where(eq(exams.termId, id));
      const [attendanceDeps] = await db.select({ count: count() }).from(attendance).where(eq(attendance.termId, id));
      const [feeDeps] = await db.select({ count: count() }).from(feeStructures).where(eq(feeStructures.termId, id));
      const [invoiceDeps] = await db.select({ count: count() }).from(invoices).where(eq(invoices.termId, id));

      const totalDeps = (examDeps?.count || 0) + (attendanceDeps?.count || 0) + (feeDeps?.count || 0) + (invoiceDeps?.count || 0);

      if (totalDeps > 0) {
        throw new Error(`Cannot delete term with active records (${totalDeps} dependencies found: ${examDeps?.count || 0} exams, ${attendanceDeps?.count || 0} attendance records, ${feeDeps?.count || 0} fee structures, ${invoiceDeps?.count || 0} invoices). Please delete or move these records first.`);
      }

      return await db.delete(terms).where(eq(terms.id, id)).returning();
    } catch (error) {
      console.error('Error deleting term:', error);
      throw error;
    }
  });

  ipcMain.handle('get-terms', async (_event: any, academicYearId?: number) => {
    try {
      if (academicYearId) {
        return await db
          .select()
          .from(terms)
          .where(eq(terms.academicYearId, academicYearId))
          .orderBy(terms.startDate);
      }

      // If no ID provided, return all terms joined with year info
      return await db
        .select({
          id: terms.id,
          name: terms.name,
          startDate: terms.startDate,
          endDate: terms.endDate,
          isActive: terms.isActive,
          academicYearId: terms.academicYearId,
          year: academicYears.name, // Include year name for UI context
        })
        .from(terms)
        .leftJoin(academicYears, eq(terms.academicYearId, academicYears.id))
        .orderBy(desc(academicYears.startDate), terms.startDate);
    } catch (error) {
      console.error('Error getting terms:', error);
      throw error;
    }
  });

  ipcMain.handle('update-term', async (_event: any, data: any) => {
    try {
      if (data.id) {
        return await db
          .update(terms)
          .set(data)
          .where(eq(terms.id, data.id))
          .returning();
      } else {
        return await db.insert(terms).values(data).returning();
      }
    } catch (error) {
      console.error('Error updating term:', error);
      throw error;
    }
  });

  ipcMain.handle('get-active-term', async () => {
    try {
      const [activeTerm] = await db
        .select()
        .from(terms)
        .where(eq(terms.isActive, true))
        .limit(1);
      return activeTerm || null;
    } catch (error) {
      console.error('Error getting active term:', error);
      throw error;
    }
  });

  ipcMain.handle('set-active-term', async (_event: any, id: number) => {
    try {
      // Get the academic year of this term
      const [term] = await db.select().from(terms).where(eq(terms.id, id)).limit(1);
      if (!term) throw new Error('Term not found');

      // Deactivate all terms in the same academic year
      await db
        .update(terms)
        .set({ isActive: false })
        .where(eq(terms.academicYearId, term.academicYearId));

      // Activate the selected term
      return await db
        .update(terms)
        .set({ isActive: true })
        .where(eq(terms.id, id))
        .returning();
    } catch (error) {
      console.error('Error setting active term:', error);
      throw error;
    }
  });

  // --- USERS ---

  ipcMain.handle('get-users', async () => {
    try {
      return await db.select().from(users).orderBy(users.fullName);
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  });

  ipcMain.handle('create-user', async (_event: any, userData: any) => {
    try {
      const { password, ...rest } = userData;

      // Ensure we have a username
      if (!rest.username) {
        throw new Error('Username is required');
      }

      // Check if user already exists
      const existing = await db.select().from(users).where(eq(users.username, rest.username)).limit(1);

      const passwordHash = password ? await hashPassword(password) : (existing.length > 0 ? existing[0].passwordHash : null);
      if (!passwordHash && !existing.length) {
        throw new Error('Password is required for new users');
      }

      if (existing.length > 0) {
        console.log(`[Users] User ${rest.username} already exists, updating...`);
        const updated = await db
          .update(users)
          .set({ ...rest, passwordHash })
          .where(eq(users.id, existing[0].id))
          .returning();
        return updated[0];
      }

      console.log(`[Users] Creating new user: ${rest.username}`);
      try {
        const newUser = await db.insert(users).values({ ...rest, passwordHash }).returning();
        return newUser[0];
      } catch (insertError: any) {
        // Fallback in case of race condition or if the check for existing failed due to stale connection
        if (insertError.code === 'SQLITE_CONSTRAINT_UNIQUE' || insertError.message?.includes('UNIQUE constraint failed')) {
          console.log(`[Users] Unique constraint hit for ${rest.username}, falling back to update`);
          const retryExisting = await db.select().from(users).where(eq(users.username, rest.username)).limit(1);
          if (retryExisting.length > 0) {
            const updated = await db
              .update(users)
              .set({ ...rest, passwordHash })
              .where(eq(users.id, retryExisting[0].id))
              .returning();
            return updated[0];
          }
        }
        throw insertError;
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  });

  ipcMain.handle('update-user', async (_event: any, data: any) => {
    try {
      if (data.id) {
        return await db
          .update(users)
          .set(data)
          .where(eq(users.id, data.id))
          .returning();
      } else {
        return await db.insert(users).values(data).returning();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-user', async (_event: any, id: number) => {
    try {
      return await db.delete(users).where(eq(users.id, id)).returning();
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  });

  ipcMain.handle('get-user-by-id', async (_event: any, id: number) => {
    try {
      const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return user[0] || null;
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw error;
    }
  });

  ipcMain.handle('reset-user-password', async (_event: any, { userId, newPassword }: { userId: number; newPassword: string }) => {
    try {
      const passwordHash = await hashPassword(newPassword);
      const updated = await db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, userId))
        .returning();
      return updated[0];
    } catch (error) {
      console.error('Error resetting user password:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'get-student-documents',
    async (_event: any, studentId: number) => {
      try {
        return await db
          .select()
          .from(studentDocuments)
          .where(eq(studentDocuments.studentId, studentId));
      } catch (error) {
        console.error('Error getting student documents:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('add-student-document', async (_event: any, data: any) => {
    try {
      return await db.insert(studentDocuments).values(data).returning();
    } catch (error) {
      console.error('Error adding student document:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-student-document', async (_event: any, id: number) => {
    try {
      return await db
        .delete(studentDocuments)
        .where(eq(studentDocuments.id, id))
        .returning();
    } catch (error) {
      console.error('Error deleting student document:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'authenticate',
    async (_event: any, { username, password }: any) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (user && user.passwordHash === password) {
          // In a real app, use bcrypt.compare
          return user;
        }
        return null;
      } catch (error) {
        console.error('Error authenticating:', error);
        throw error;
      }
    }
  );

  // --- CLASSES & STREAMS ---

  ipcMain.handle('get-classes', async () => {
    try {
      logDebug('[Handlers] get-classes called');
      if (!db) {
        logDebug('[Handlers] ERROR: get-classes called but db is undefined');
        throw new Error('Database not initialized');
      }
      return await db.select().from(classes).orderBy(classes.code);
    } catch (error) {
      logDebug('[Handlers] Error getting classes', error);
      throw error;
    }
  });

  ipcMain.handle('update-class', async (_event: any, data: any) => {
    try {
      if (data.id) {
        return await db
          .update(classes)
          .set(data)
          .where(eq(classes.id, data.id))
          .returning();
      } else {
        return await db.insert(classes).values(data).returning();
      }
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-class', async (_event: any, id: number) => {
    try {
      // Check for dependencies
      const classStreams = await db
        .select()
        .from(streams)
        .where(eq(streams.classId, id));
      if (classStreams.length > 0) {
        throw new Error(
          'Cannot delete class with active streams. Please delete streams first.'
        );
      }

      return await db.delete(classes).where(eq(classes.id, id)).returning();
    } catch (error: any) {
      console.error('Error deleting class:', error);
      throw error; // Re-throw to be caught by frontend
    }
  });

  ipcMain.handle('get-streams', async (_event: any, classId?: number) => {
    try {
      logDebug(`[Handlers] get-streams called (classId: ${classId})`);
      if (!db) {
        logDebug('[Handlers] ERROR: get-streams called but db is undefined');
        throw new Error('Database not initialized');
      }
      if (classId) {
        return await db
          .select()
          .from(streams)
          .where(eq(streams.classId, classId));
      }
      return await db.select().from(streams);
    } catch (error) {
      logDebug('[Handlers] Error getting streams', error);
      throw error;
    }
  });

  ipcMain.handle('update-stream', async (_event: any, data: any) => {
    try {
      if (data.id) {
        return await db
          .update(streams)
          .set(data)
          .where(eq(streams.id, data.id))
          .returning();
      } else {
        return await db.insert(streams).values(data).returning();
      }
    } catch (error) {
      console.error('Error updating stream:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-stream', async (_event: any, id: number) => {
    try {
      // Check for dependencies
      const streamStudents = await db
        .select()
        .from(students)
        .where(eq(students.streamId, id));
      if (streamStudents.length > 0) {
        throw new Error(
          'Cannot delete stream with active students. Please reassign or delete students first.'
        );
      }

      const allocations = await db
        .select()
        .from(subjectAllocations)
        .where(eq(subjectAllocations.streamId, id));
      if (allocations.length > 0) {
        throw new Error(
          'Cannot delete stream with subject allocations. Please remove allocations first.'
        );
      }

      return await db.delete(streams).where(eq(streams.id, id)).returning();
    } catch (error: any) {
      console.error('Error deleting stream:', error);
      throw error;
    }
  });

  // --- SUBJECTS ---

  ipcMain.handle('get-subjects', async () => {
    try {
      return await db.select().from(subjects).orderBy(subjects.name);
    } catch (error) {
      console.error('Error getting subjects:', error);
      throw error;
    }
  });

  ipcMain.handle('update-subject', async (_event: any, data: any) => {
    try {
      if (data.id) {
        return await db
          .update(subjects)
          .set(data)
          .where(eq(subjects.id, data.id))
          .returning();
      } else {
        return await db.insert(subjects).values(data).returning();
      }
    } catch (error) {
      console.error('Error updating subject:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-subject', async (_event: any, id: number) => {
    try {
      return await db.delete(subjects).where(eq(subjects.id, id)).returning();
    } catch (error) {
      console.error('Error deleting subject:', error);
      throw error;
    }
  });

  // --- SUBJECT ALLOCATIONS ---

  ipcMain.handle(
    'get-subject-allocations',
    async (_event: any, yearId: number) => {
      try {
        return await db
          .select()
          .from(subjectAllocations)
          .where(eq(subjectAllocations.academicYearId, yearId));
      } catch (error) {
        console.error('Error getting subject allocations:', error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    'create-subject-allocation',
    async (
      _event: any,
      data: {
        teacherId: number;
        subjectId: number;
        streamId: number;
        academicYearId: number;
      }
    ) => {
      try {
        // Check if allocation already exists
        const existing = await db
          .select()
          .from(subjectAllocations)
          .where(
            and(
              eq(subjectAllocations.subjectId, data.subjectId),
              eq(subjectAllocations.streamId, data.streamId),
              eq(subjectAllocations.academicYearId, data.academicYearId)
            )
          );
        if (existing.length > 0) {
          // Update existing allocation with new teacher
          return await db
            .update(subjectAllocations)
            .set({ teacherId: data.teacherId })
            .where(eq(subjectAllocations.id, existing[0].id))
            .returning();
        }
        return await db.insert(subjectAllocations).values(data).returning();
      } catch (error) {
        console.error('Error creating subject allocation:', error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    'delete-subject-allocation',
    async (
      _event: any,
      data: { subjectId: number; streamId: number; academicYearId: number }
    ) => {
      try {
        return await db
          .delete(subjectAllocations)
          .where(
            and(
              eq(subjectAllocations.subjectId, data.subjectId),
              eq(subjectAllocations.streamId, data.streamId),
              eq(subjectAllocations.academicYearId, data.academicYearId)
            )
          )
          .returning();
      } catch (error) {
        console.error('Error deleting subject allocation:', error);
        throw error;
      }
    }
  );

  // --- TEACHERS ---

  ipcMain.handle('get-teachers', async () => {
    try {
      return await db.select().from(teachers).orderBy(teachers.firstName);
    } catch (error) {
      console.error('Error getting teachers:', error);
      throw error;
    }
  });

  ipcMain.handle('get-teacher-by-id', async (_event: any, id: number) => {
    try {
      const [teacher] = await db
        .select()
        .from(teachers)
        .where(eq(teachers.id, id))
        .limit(1);
      return teacher || null;
    } catch (error) {
      console.error('Error getting teacher by id:', error);
      throw error;
    }
  });

  ipcMain.handle('create-teacher', async (_event: any, data: any) => {
    try {
      // Map form fields to schema if necessary
      const teacherData = {
        ...data,
        qualification: data.qualification || data.qualifications,
        joinedDate: data.joinedDate || data.joinDate,
        experience: data.experience ? parseInt(data.experience.toString()) : null
      };
      // Remove any fields that don't belong in the teachers table
      delete (teacherData as any).qualifications;
      delete (teacherData as any).joinDate;

      return await db.insert(teachers).values(teacherData).returning();
    } catch (error) {
      console.error('Error creating teacher:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'get-teacher-documents',
    async (_event: any, teacherId: number) => {
      try {
        return await db
          .select()
          .from(teacherDocuments)
          .where(eq(teacherDocuments.teacherId, teacherId));
      } catch (error) {
        console.error('Error getting teacher documents:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('add-teacher-document', async (_event: any, data: any) => {
    try {
      return await db.insert(teacherDocuments).values(data).returning();
    } catch (error) {
      console.error('Error adding teacher document:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-teacher-document', async (_event: any, id: number) => {
    try {
      return await db
        .delete(teacherDocuments)
        .where(eq(teacherDocuments.id, id))
        .returning();
    } catch (error) {
      console.error('Error deleting teacher document:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'get-teacher-stats',
    async (_event: any, teacherId: number) => {
      try {
        // Get active academic year
        const activeYear = await db
          .select()
          .from(academicYears)
          .where(eq(academicYears.isActive, true))
          .limit(1);
        const yearId = activeYear[0]?.id;

        if (!yearId) return { classes: 0, students: 0 };

        // Get allocations for this teacher in active year
        const allocations = await db
          .select()
          .from(subjectAllocations)
          .where(
            and(
              eq(subjectAllocations.teacherId, teacherId),
              eq(subjectAllocations.academicYearId, yearId)
            )
          );

        // Count unique classes
        const classCount = new Set(allocations.map((a: any) => a.streamId)).size;

        // Count total students in these streams
        let studentCount = 0;
        if (allocations.length > 0) {
          const streamIds = allocations.map((a: any) => a.streamId);
          // Use a raw query or multiple queries to count students in these streams
          // For simplicity, we'll fetch students in these streams
          const studentsInStreams = await db
            .select({ count: count() })
            .from(students)
            .where(
              and(
                inArray(students.streamId, streamIds),
                eq(students.status, 'Active')
              )
            );
          studentCount = studentsInStreams[0]?.count || 0;
        }

        return { classes: classCount, students: studentCount };
      } catch (error) {
        console.error('Error getting teacher stats:', error);
        return { classes: 0, students: 0 };
      }
    }
  );

  ipcMain.handle('update-teacher', async (_event: any, data: any) => {
    try {
      const { id, ...updateData } = data;
      const mappedData = {
        ...updateData,
        qualification: updateData.qualification || updateData.qualifications,
        joinedDate: updateData.joinedDate || updateData.joinDate,
        experience: updateData.experience ? parseInt(updateData.experience.toString()) : null
      };
      // Clean up fields
      delete (mappedData as any).qualifications;
      delete (mappedData as any).joinDate;

      if (id) {
        return await db
          .update(teachers)
          .set(mappedData)
          .where(eq(teachers.id, id))
          .returning();
      } else {
        return await db.insert(teachers).values(mappedData).returning();
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-teacher', async (_event: any, id: number) => {
    try {
      // Hard delete as requested
      return await db.delete(teachers).where(eq(teachers.id, id)).returning();
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
      logDebug('[Handlers] get-students called');
      if (!db) {
        logDebug('[Handlers] ERROR: get-students called but db is undefined');
        throw new Error('Database not initialized');
      }

      const result = await db
        .select({
          id: students.id,
          admissionNumber: students.admissionNumber,
          firstName: students.firstName,
          lastName: students.lastName,
          gender: students.gender,
          dob: students.dob,
          nationality: students.nationality,
          classId: students.classId,
          streamId: students.streamId,
          photoUrl: students.photoUrl,
          status: students.status,
          enrollmentDate: students.enrollmentDate,
          parentNames: students.parentNames,
          parentContact: students.parentContact,
          address: students.address,
          previousSchool: students.previousSchool,
          linNumber: students.linNumber,
          schoolPayCode: students.schoolPayCode,
          email: students.email,
        })
        .from(students)
        .orderBy(students.firstName);
      return result;
    } catch (error) {
      logDebug('[Handlers] Error getting students', error);
      throw error;
    }
  });

  ipcMain.handle('get-student-by-id', async (_event: any, id: number) => {
    try {
      const [student] = await db
        .select()
        .from(students)
        .where(eq(students.id, id))
        .limit(1);
      if (student) {
        const guardian = await db
          .select()
          .from(guardians)
          .where(eq(guardians.studentId, id));
        return { ...student, guardians: guardian };
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

      // Map student table fields
      const mappedStudentData = {
        ...studentData,
        parentNames: guardianName || studentData.parentNames,
        parentContact: guardianPhone || studentData.parentContact,
      };

      const [newStudent] = await db
        .insert(students)
        .values(mappedStudentData)
        .returning();

      if (newStudent) {
        // Create guardian record in separate table
        if (guardianName || guardianPhone || guardianEmail) {
          await db.insert(guardians).values({
            studentId: newStudent.id,
            name: guardianName || 'Unknown',
            relationship: guardianRelation || 'Other',
            phone: guardianPhone,
            email: guardianEmail,
          });
        }
      }
      return newStudent;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  });

  ipcMain.handle('update-student', async (_event: any, data: any) => {
    try {
      if (data.id) {
        const {
          id,
          guardianName,
          guardianPhone,
          guardianEmail,
          guardianRelation,
          guardianRelationship,
          ...studentData
        } = data;

        // Map student table fields
        const mappedStudentData = {
          ...studentData,
          parentNames: guardianName || studentData.parentNames,
          parentContact: guardianPhone || studentData.parentContact,
        };

        let updatedStudent = null;

        if (Object.keys(mappedStudentData).length > 0) {
          const results = await db
            .update(students)
            .set(mappedStudentData)
            .where(eq(students.id, id))
            .returning();
          updatedStudent = results[0];
        } else {
          const results = await db
            .select()
            .from(students)
            .where(eq(students.id, id))
            .limit(1);
          updatedStudent = results[0];
        }

        if (updatedStudent) {
          const guardianData: any = {};
          if (guardianName) guardianData.name = guardianName;
          if (guardianPhone) guardianData.phone = guardianPhone;
          if (guardianRelation || guardianRelationship)
            guardianData.relationship = guardianRelation || guardianRelationship;
          if (guardianEmail) guardianData.email = guardianEmail;

          if (Object.keys(guardianData).length > 0) {
            const existingGuardian = await db
              .select()
              .from(guardians)
              .where(eq(guardians.studentId, id))
              .limit(1);

            if (existingGuardian.length > 0) {
              await db
                .update(guardians)
                .set(guardianData)
                .where(eq(guardians.id, existingGuardian[0].id));
            } else if (guardianData.name) {
              await db.insert(guardians).values({
                studentId: id,
                ...guardianData,
              });
            }
          }
        }

        return [updatedStudent];
      }
      throw new Error('Student ID required for update');
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-student', async (_event: any, id: number) => {
    try {
      return await db
        .update(students)
        .set({ status: 'Archived' })
        .where(eq(students.id, id))
        .returning();
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  });

  ipcMain.handle('restore-student', async (_event: any, id: number) => {
    try {
      return await db
        .update(students)
        .set({ status: 'Active' })
        .where(eq(students.id, id))
        .returning();
    } catch (error) {
      console.error('Error restoring student:', error);
      throw error;
    }
  });

  ipcMain.handle('restore-students', async (_event: any, ids: number[]) => {
    try {
      return await db
        .update(students)
        .set({ status: 'Active' })
        .where(sql`${students.id} IN ${ids}`)
        .returning();
    } catch (error) {
      console.error('Error restoring students bulk:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'permanent-delete-student',
    async (_event: any, id: number) => {
      try {
        await db.delete(guardians).where(eq(guardians.studentId, id));
        await db.delete(studentDocuments).where(eq(studentDocuments.studentId, id));
        await db.delete(marks).where(eq(marks.studentId, id));
        await db.delete(attendance).where(eq(attendance.studentId, id));
        await db.delete(feePayments).where(eq(feePayments.studentId, id));
        await db.delete(invoices).where(eq(invoices.studentId, id));
        await db.delete(feeStructures).where(eq(feeStructures.studentId, id));
        await db.delete(studentGroupMembers).where(eq(studentGroupMembers.studentId, id));

        return await db.delete(students).where(eq(students.id, id)).returning();
      } catch (error) {
        console.error('Error permanently deleting student:', error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    'permanent-delete-students',
    async (_event: any, ids: number[]) => {
      if (!ids || ids.length === 0) return [];
      try {
        await db.delete(guardians).where(inArray(guardians.studentId, ids));
        await db.delete(studentDocuments).where(inArray(studentDocuments.studentId, ids));
        await db.delete(marks).where(inArray(marks.studentId, ids));
        await db.delete(attendance).where(inArray(attendance.studentId, ids));
        await db.delete(feePayments).where(inArray(feePayments.studentId, ids));
        await db.delete(invoices).where(inArray(invoices.studentId, ids));
        await db.delete(feeStructures).where(inArray(feeStructures.studentId, ids));
        await db.delete(studentGroupMembers).where(inArray(studentGroupMembers.studentId, ids));

        return await db
          .delete(students)
          .where(inArray(students.id, ids))
          .returning();
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
      // Check settings first
      const settingsRecords = await db.select().from(settings).where(eq(settings.key, 'admission_id_prefix'));
      if (settingsRecords.length > 0 && settingsRecords[0].value) {
        return settingsRecords[0].value;
      }
      // Fallback to dynamic school initials
      return await getSchoolInitials();
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
        const { studentIds, targetStreamId, status } = data;

        if (targetStreamId) {
          // Promotion to another class
          return await db
            .update(students)
            .set({
              streamId: targetStreamId,
              status: 'Active', // Reset status to active upon promotion
            })
            .where(sql`${students.id} IN ${studentIds}`)
            .returning();
        } else if (status) {
          // Graduation or Archiving
          return await db
            .update(students)
            .set({
              status: status,
              streamId: null, // Clear stream assignment for graduated/archived students
            })
            .where(sql`${students.id} IN ${studentIds}`)
            .returning();
        }

        throw new Error('Either targetStreamId or status must be provided');
      } catch (error) {
        console.error('Error promoting students:', error);
        throw error;
      }
    }
  );

  // --- EXAMS ---

  ipcMain.handle('get-exams', async () => {
    try {
      const examsList = await db
        .select({
          id: exams.id,
          examTypeId: exams.examTypeId,
          termId: exams.termId,
          classId: exams.classId,
          duration: exams.duration,
          startDate: exams.startDate,
          endDate: exams.endDate,
          name: exams.name,
          examTypeName: examTypes.name,
          termName: terms.name,
          className: classes.name,
        })
        .from(exams)
        .innerJoin(examTypes, eq(exams.examTypeId, examTypes.id))
        .innerJoin(terms, eq(exams.termId, terms.id))
        .leftJoin(classes, eq(exams.classId, classes.id))
        .orderBy(exams.startDate);

      // Fetch subjects for each exam
      const examsWithSubjects = await Promise.all(
        examsList.map(async (exam: any) => {
          const associatedSubjects = await db
            .select({
              id: subjects.id,
              name: subjects.name,
              code: subjects.code,
            })
            .from(examSubjects)
            .innerJoin(subjects, eq(examSubjects.subjectId, subjects.id))
            .where(eq(examSubjects.examId, exam.id));

          return { ...exam, subjects: associatedSubjects };
        })
      );

      return examsWithSubjects;
    } catch (error) {
      console.error('Error getting exams:', error);
      throw error;
    }
  });

  ipcMain.handle('get-exam-types', async () => {
    try {
      return await db.select().from(examTypes).orderBy(examTypes.name);
    } catch (error) {
      console.error('Error getting exam types:', error);
      throw error;
    }
  });

  ipcMain.handle('create-exam', async (_event: any, data: any) => {
    try {
      const { subjectIds, ...examData } = data;
      
      // Derive academicYearId from termId if missing
      if (!examData.academicYearId && examData.termId) {
        const [termRecord] = await db
          .select({ academicYearId: terms.academicYearId })
          .from(terms)
          .where(eq(terms.id, examData.termId))
          .limit(1);
        if (termRecord) {
          examData.academicYearId = termRecord.academicYearId;
        }
      }

      const [newExam] = await db.insert(exams).values(examData).returning();

      if (subjectIds && subjectIds.length > 0 && newExam) {
        const examSubjectRecords = subjectIds.map((subjectId: number) => ({
          examId: newExam.id,
          subjectId,
        }));
        await db.insert(examSubjects).values(examSubjectRecords);
      }

      return newExam;
    } catch (error) {
      console.error('Error creating exam:', error);
      throw error;
    }
  });

  ipcMain.handle('update-exam', async (_event: any, data: any) => {
    try {
      const { subjectIds, ...examData } = data;

      // Derive academicYearId from termId if missing
      if (!examData.academicYearId && examData.termId) {
        const [termRecord] = await db
          .select({ academicYearId: terms.academicYearId })
          .from(terms)
          .where(eq(terms.id, examData.termId))
          .limit(1);
        if (termRecord) {
          examData.academicYearId = termRecord.academicYearId;
        }
      }

      if (examData.id) {
        const [updatedExam] = await db
          .update(exams)
          .set(examData)
          .where(eq(exams.id, examData.id))
          .returning();

        if (subjectIds && updatedExam) {
          // Update subjects: delete old ones and insert new ones
          await db
            .delete(examSubjects)
            .where(eq(examSubjects.examId, updatedExam.id));
          if (subjectIds.length > 0) {
            const examSubjectRecords = subjectIds.map((subjectId: number) => ({
              examId: updatedExam.id,
              subjectId,
            }));
            await db.insert(examSubjects).values(examSubjectRecords);
          }
        }
        return updatedExam;
      }
      return await db.insert(exams).values(examData).returning();
    } catch (error) {
      console.error('Error updating exam:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-exam', async (_event: any, id: number) => {
    try {
      // Delete associated subjects first
      await db.delete(examSubjects).where(eq(examSubjects.examId, id));
      return await db.delete(exams).where(eq(exams.id, id)).returning();
    } catch (error) {
      console.error('Error deleting exam:', error);
      throw error;
    }
  });

  ipcMain.handle('create-exam-type', async (_event: any, data: any) => {
    try {
      return await db.insert(examTypes).values(data).returning();
    } catch (error) {
      console.error('Error creating exam type:', error);
      throw error;
    }
  });

  ipcMain.handle('update-exam-type', async (_event: any, data: any) => {
    try {
      if (data.id) {
        const { id, ...updateData } = data;
        return await db
          .update(examTypes)
          .set(updateData)
          .where(eq(examTypes.id, id))
          .returning();
      }
      throw new Error('Exam Type ID required for update');
    } catch (error) {
      console.error('Error updating exam type:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-exam-type', async (_event: any, id: number) => {
    try {
      // Optional: Check if any exams are linked to this type before deleting
      const linkedExams = await db
        .select()
        .from(exams)
        .where(eq(exams.examTypeId, id))
        .limit(1);
      if (linkedExams.length > 0) {
        throw new Error(
          'Cannot delete exam type as it is linked to existing exams'
        );
      }
      return await db.delete(examTypes).where(eq(examTypes.id, id)).returning();
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
      return await db
        .select()
        .from(gradingScales)
        .orderBy(desc(gradingScales.minScore));
    } catch (error) {
      console.error('Error getting grading scales:', error);
      throw error;
    }
  });

  ipcMain.handle('create-grading-scale', async (_event: any, data: any) => {
    try {
      return await db.insert(gradingScales).values(data).returning();
    } catch (error) {
      console.error('Error creating grading scale:', error);
      throw error;
    }
  });

  ipcMain.handle('update-grading-scale', async (_event: any, data: any) => {
    try {
      return await db
        .update(gradingScales)
        .set(data)
        .where(eq(gradingScales.id, data.id))
        .returning();
    } catch (error) {
      console.error('Error updating grading scale:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-grading-scale', async (_event: any, id: number) => {
    try {
      return await db
        .delete(gradingScales)
        .where(eq(gradingScales.id, id))
        .returning();
    } catch (error) {
      console.error('Error deleting grading scale:', error);
      throw error;
    }
  });

  // --- ATTENDANCE ---

  ipcMain.handle(
    'get-attendance-by-date',
    async (
      _event: any,
      params: { date: string; streamId: number; termId: number }
    ) => {
      try {
        return await db
          .select()
          .from(attendance)
          .where(
            and(
              eq(attendance.date, params.date),
              eq(attendance.termId, params.termId)
            )
          );
      } catch (error) {
        console.error('Error getting attendance:', error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    'get-students-for-attendance',
    async (_event: any, streamId: number) => {
      try {
        return await db
          .select()
          .from(students)
          .where(
            and(eq(students.streamId, streamId), eq(students.status, 'Active'))
          )
          .orderBy(students.firstName);
      } catch (error) {
        console.error('Error getting students for attendance:', error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    'get-attendance-by-student',
    async (_event: any, studentId: number) => {
      try {
        return await db
          .select({
            id: attendance.id,
            date: attendance.date,
            status: attendance.status,
            termId: attendance.termId,
            termName: terms.name,
          })
          .from(attendance)
          .innerJoin(terms, eq(attendance.termId, terms.id))
          .where(eq(attendance.studentId, studentId))
          .orderBy(desc(attendance.date));
      } catch (error) {
        console.error('Error getting attendance by student:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('save-attendance', async (_event: any, records: any[]) => {
    try {
      // Upsert attendance records
      for (const record of records) {
        const existing = await db
          .select()
          .from(attendance)
          .where(
            and(
              eq(attendance.studentId, record.studentId),
              eq(attendance.date, record.date),
              eq(attendance.termId, record.termId)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(attendance)
            .set({ status: record.status, recordedBy: record.recordedBy })
            .where(eq(attendance.id, existing[0].id));
        } else {
          await db.insert(attendance).values(record);
        }
      }
      return { success: true, count: records.length };
    } catch (error) {
      console.error('Error saving attendance:', error);
      throw error;
    }
  });

  // --- FEES ---

  const syncInvoiceStatus = async (invoiceId: number) => {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);
    if (!invoice) return;

    const allPayments = await db
      .select()
      .from(feePayments)
      .where(eq(feePayments.invoiceId, invoiceId));
    const totalPaid = allPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    let status = 'Pending';
    if (totalPaid >= invoice.amount) {
      status = 'Paid';
    } else if (totalPaid > 0) {
      status = 'Partially Paid';
    }

    await db.update(invoices).set({ status }).where(eq(invoices.id, invoiceId));
  };

  ipcMain.handle(
    'get-student-fees',
    async (_event: any, studentId: number | string) => {
      try {
        const sId = Number(studentId);
        const student = await db
          .select()
          .from(students)
          .where(eq(students.id, sId))
          .limit(1);
        if (!student[0]) return null;

        const payments = await db
          .select()
          .from(feePayments)
          .where(eq(feePayments.studentId, sId));
        const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        // Get student's class ID via stream
        let classId = null;
        if (student[0].streamId) {
          const stream = await db
            .select()
            .from(streams)
            .where(eq(streams.id, student[0].streamId))
            .limit(1);
          if (stream[0]) classId = stream[0].classId;
        }

        // Get invoices with balance calculation
        const studentInvoices = await db
          .select()
          .from(invoices)
          .where(eq(invoices.studentId, sId))
          .orderBy(desc(invoices.createdAt));

        const totalFees = studentInvoices.reduce(
          (sum: number, inv: any) => sum + (inv.amount || 0),
          0
        );

        const invoicesWithBalance = studentInvoices.map((inv: any) => {
          const invoicePayments = payments.filter(
            (p: any) => p.invoiceId === inv.id
          );
          const paidAmount = invoicePayments.reduce(
            (sum: number, p: any) => sum + (p.amount || 0),
            0
          );
          return {
            ...inv,
            paidAmount,
            balance: inv.amount - paidAmount,
          };
        });

        // Calculate totals strictly from invoices
        const totalPaidInvoices = invoicesWithBalance.reduce(
          (sum: number, inv: any) => sum + inv.paidAmount,
          0
        );
        const totalBalanceInvoices = invoicesWithBalance.reduce(
          (sum: number, inv: any) => sum + inv.balance,
          0
        );

        return {
          student: student[0],
          totalFees,
          totalPaid: totalPaidInvoices,
          balance: totalBalanceInvoices,
          payments,
          invoices: invoicesWithBalance,
        };
      } catch (error) {
        console.error('Error getting student fees:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('get-fee-payments', async (_event: any, studentId: number) => {
    try {
      return await db
        .select()
        .from(feePayments)
        .where(eq(feePayments.studentId, studentId))
        .orderBy(feePayments.date);
    } catch (error) {
      console.error('Error getting fee payments:', error);
      throw error;
    }
  });

  ipcMain.handle('create-fee-payment', async (_event: any, data: any) => {
    try {
      if (data.invoiceId) {
        const [newPayment] = await db
          .insert(feePayments)
          .values(data)
          .returning();
        await syncInvoiceStatus(data.invoiceId);
        return newPayment;
      } else {
        // Auto-allocation logic: apply to oldest outstanding invoices
        const outstandingInvoices = await db
          .select()
          .from(invoices)
          .where(
            and(
              eq(invoices.studentId, data.studentId),
              or(
                eq(invoices.status, 'Pending'),
                eq(invoices.status, 'Partially Paid')
              )
            )
          )
          .orderBy(invoices.createdAt);

        let remainingAmount = data.amount;
        const createdPayments = [];

        if (outstandingInvoices.length > 0) {
          for (const invoice of outstandingInvoices) {
            if (remainingAmount <= 0) break;

            const paymentsForInvoice = await db
              .select()
              .from(feePayments)
              .where(eq(feePayments.invoiceId, invoice.id));
            const alreadyPaid = paymentsForInvoice.reduce(
              (sum: number, p: any) => sum + (p.amount || 0),
              0
            );
            const balance = invoice.amount - alreadyPaid;

            const amountToApply = Math.min(remainingAmount, balance);
            if (amountToApply > 0) {
              const [p] = await db
                .insert(feePayments)
                .values({
                  ...data,
                  amount: amountToApply,
                  invoiceId: invoice.id,
                  receiptNumber: `${data.receiptNumber}-${invoice.id}`,
                })
                .returning();
              createdPayments.push(p);
              await syncInvoiceStatus(invoice.id);
              remainingAmount -= amountToApply;
            }
          }
        }

        // If there's still remaining amount, or no invoices, create a general payment
        if (remainingAmount > 0 || createdPayments.length === 0) {
          const [p] = await db
            .insert(feePayments)
            .values({
              ...data,
              amount: remainingAmount,
              invoiceId: null,
            })
            .returning();
          createdPayments.push(p);
        }

        return createdPayments[0]; // Return the first one for compatibility
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
          return await db
            .select()
            .from(feeStructures)
            .where(
              and(
                eq(feeStructures.termId, params.termId),
                eq(feeStructures.classId, params.classId)
              )
            );
        }
        return await db.select().from(feeStructures);
      } catch (error) {
        console.error('Error getting fee structures:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('get-all-payments', async () => {
    try {
      return await db
        .select({
          id: feePayments.id,
          amount: feePayments.amount,
          date: feePayments.date,
          paymentMethod: feePayments.method,
          receiptNumber: feePayments.receiptNumber,
          studentId: feePayments.studentId,
          studentName: sql<string>`${students.firstName} || ' ' || ${students.lastName}`,
          studentAdmNo: students.admissionNumber,
          className: classes.name,
          streamName: streams.name,
          invoiceNumber: invoices.invoiceNumber,
          termName: terms.name,
          academicYearName: academicYears.name,
          guardianName: guardians.name,
        })
        .from(feePayments)
        .leftJoin(students, eq(feePayments.studentId, students.id))
        .leftJoin(streams, eq(students.streamId, streams.id))
        .leftJoin(classes, eq(streams.classId, classes.id))
        .leftJoin(guardians, eq(students.id, guardians.studentId))
        .leftJoin(invoices, eq(feePayments.invoiceId, invoices.id))
        .leftJoin(terms, eq(feePayments.termId, terms.id))
        .leftJoin(academicYears, eq(terms.academicYearId, academicYears.id))
        .orderBy(desc(feePayments.date));
    } catch (error) {
      console.error('Error getting all payments:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-fee-payment', async (_event: any, id: number) => {
    try {
      const [payment] = await db
        .select()
        .from(feePayments)
        .where(eq(feePayments.id, id))
        .limit(1);
      const result = await db
        .delete(feePayments)
        .where(eq(feePayments.id, id))
        .returning();

      if (payment?.invoiceId) {
        await syncInvoiceStatus(payment.invoiceId);
      }

      return result;
    } catch (error) {
      console.error('Error deleting fee payment:', error);
      throw error;
    }
  });

  ipcMain.handle('create-fee-structure', async (_event: any, data: any) => {
    try {
      return await db.insert(feeStructures).values(data).returning();
    } catch (error) {
      console.error('Error creating fee structure:', error);
      throw error;
    }
  });

  ipcMain.handle('update-fee-structure', async (_event: any, data: any) => {
    try {
      return await db
        .update(feeStructures)
        .set({
          name: data.name,
          amount: data.amount,
          termId: data.termId,
          classId: data.classId,
          studentId: data.studentId,
        })
        .where(eq(feeStructures.id, data.id))
        .returning();
    } catch (error) {
      console.error('Error updating fee structure:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-fee-structure', async (_event: any, id: number) => {
    try {
      return await db
        .delete(feeStructures)
        .where(eq(feeStructures.id, id))
        .returning();
    } catch (error) {
      console.error('Error deleting fee structure:', error);
      throw error;
    }
  });

  ipcMain.handle('get-fee-assignments', async (_event: any, filters?: {
    academicYearId?: number;
    termId?: number;
    targetType?: string;
    status?: string;
  }) => {
    try {
      let query = db
        .select({
          id: feeAssignments.id,
          feeStructureId: feeAssignments.feeStructureId,
          targetType: feeAssignments.targetType,
          targetId: feeAssignments.targetId,
          academicYearId: feeAssignments.academicYearId,
          termId: feeAssignments.termId,
          dueDate: feeAssignments.dueDate,
          amount: feeAssignments.amount,
          status: feeAssignments.status,
          notes: feeAssignments.notes,
          assignedBy: feeAssignments.assignedBy,
          createdAt: feeAssignments.createdAt,
          updatedAt: feeAssignments.updatedAt,
          feeStructure: {
            id: feeStructures.id,
            name: feeStructures.name,
            amount: feeStructures.amount,
          },
          term: {
            id: terms.id,
            name: terms.name,
          },
          academicYear: {
            id: academicYears.id,
            name: academicYears.name,
          },
        })
        .from(feeAssignments)
        .leftJoin(feeStructures, eq(feeAssignments.feeStructureId, feeStructures.id))
        .leftJoin(terms, eq(feeAssignments.termId, terms.id))
        .leftJoin(academicYears, eq(feeAssignments.academicYearId, academicYears.id));

      // Apply filters
      const conditions = [];
      if (filters?.academicYearId) {
        conditions.push(eq(feeAssignments.academicYearId, filters.academicYearId));
      }
      if (filters?.termId) {
        conditions.push(eq(feeAssignments.termId, filters.termId));
      }
      if (filters?.targetType) {
        conditions.push(eq(feeAssignments.targetType, filters.targetType));
      }
      if (filters?.status) {
        conditions.push(eq(feeAssignments.status, filters.status));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query.orderBy(feeAssignments.createdAt);

      // Enrich results with target names
      const enrichedResults = await Promise.all(results.map(async (assignment: any) => {
        let targetName = 'Unknown';
        let className = null;
        let streamName = null;
        let studentName = null;
        let groupName = null;

        if (assignment.targetType === 'class') {
          const classData = await db
            .select()
            .from(classes)
            .where(eq(classes.id, assignment.targetId))
            .limit(1);
          className = classData[0]?.name || null;
          targetName = className || 'Unknown Class';
        } else if (assignment.targetType === 'stream') {
          const streamData = await db
            .select({
              streamName: streams.name,
              className: classes.name
            })
            .from(streams)
            .leftJoin(classes, eq(streams.classId, classes.id))
            .where(eq(streams.id, assignment.targetId))
            .limit(1);
          streamName = streamData[0]?.streamName || null;
          className = streamData[0]?.className || null;
          targetName = streamName ? `${className} - ${streamName}` : 'Unknown Stream';
        } else if (assignment.targetType === 'student') {
          const studentData = await db
            .select()
            .from(students)
            .where(eq(students.id, assignment.targetId))
            .limit(1);
          studentName = studentData[0] ? `${studentData[0].firstName} ${studentData[0].lastName}` : null;
          targetName = studentName || 'Unknown Student';
        } else if (assignment.targetType === 'group') {
          const groupData = await db
            .select()
            .from(studentGroups)
            .where(eq(studentGroups.id, assignment.targetId))
            .limit(1);
          groupName = groupData[0]?.name || null;
          targetName = groupName || 'Unknown Group';
        }

        return {
          ...assignment,
          feeName: assignment.feeStructure?.name,
          className,
          streamName,
          studentName,
          groupName,
          academicYearName: assignment.academicYear?.name,
          termName: assignment.term?.name,
        };
      }));

      return enrichedResults;
    } catch (error) {
      console.error('Error getting fee assignments:', error);
      throw error;
    }
  });

  ipcMain.handle('bulk-delete-fee-assignments', async (_event: any, data: {
    targetType: string;
    targetId: number;
    academicYearId?: number;
    termId?: number;
  }) => {
    try {
      let conditions = [
        eq(feeAssignments.targetType, data.targetType),
        eq(feeAssignments.targetId, data.targetId)
      ];

      if (data.academicYearId) {
        conditions.push(eq(feeAssignments.academicYearId, data.academicYearId));
      }
      if (data.termId) {
        conditions.push(eq(feeAssignments.termId, data.termId));
      }

      const deletedAssignments = await db
        .delete(feeAssignments)
        .where(and(...conditions))
        .returning();

      return {
        success: true,
        deletedCount: deletedAssignments.length,
        assignments: deletedAssignments
      };
    } catch (error) {
      console.error('Error bulk deleting fee assignments:', error);
      throw error;
    }
  });

  ipcMain.handle('update-fee-assignment', async (_event: any, id: number, data: any) => {
    try {
      const [updatedAssignment] = await db
        .update(feeAssignments)
        .set({ ...data, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(feeAssignments.id, id))
        .returning();

      if (!updatedAssignment) {
        throw new Error('Fee assignment not found');
      }

      return { success: true, assignment: updatedAssignment };
    } catch (error) {
      console.error('Error updating fee assignment:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-fee-assignment', async (_event: any, id: number) => {
    try {
      const [deletedAssignment] = await db
        .delete(feeAssignments)
        .where(eq(feeAssignments.id, id))
        .returning();

      if (!deletedAssignment) {
        throw new Error('Fee assignment not found');
      }

      return { success: true, assignment: deletedAssignment };
    } catch (error) {
      console.error('Error deleting fee assignment:', error);
      throw error;
    }
  });

  ipcMain.handle('bulk-create-fee-assignments', async (_event: any, data: {
    feeStructureIds: number[];
    targetType: 'class' | 'stream' | 'student' | 'group';
    targetIds: number[];
    academicYearId: number;
    termId: number;
    dueDate?: string;
    notes?: string;
    assignedBy?: number;
  }) => {
    try {
      const results = [];
      const errors = [];

      // Get active academic year if not provided
      const [activeYear] = await db
        .select()
        .from(academicYears)
        .where(eq(academicYears.isActive, true))
        .limit(1);

      const academicYearId = data.academicYearId || activeYear?.id;

      if (!academicYearId) {
        throw new Error('No active academic year found');
      }

      for (const feeStructureId of data.feeStructureIds) {
        // Get fee structure
        const [feeStructure] = await db
          .select()
          .from(feeStructures)
          .where(eq(feeStructures.id, feeStructureId))
          .limit(1);

        if (!feeStructure) {
          errors.push(`Fee structure ${feeStructureId} not found`);
          continue;
        }

        for (const targetId of data.targetIds) {
          // Check for existing assignment
          const existingAssignment = await db
            .select()
            .from(feeAssignments)
            .where(
              and(
                eq(feeAssignments.feeStructureId, feeStructureId),
                eq(feeAssignments.targetType, data.targetType),
                eq(feeAssignments.targetId, targetId),
                eq(feeAssignments.termId, data.termId)
              )
            )
            .limit(1);

          if (existingAssignment.length > 0) {
            errors.push(`Assignment already exists for fee ${feeStructureId}, target ${targetId}`);
            continue;
          }

          try {
            const [assignment] = await db
              .insert(feeAssignments)
              .values({
                feeStructureId,
                targetType: data.targetType,
                targetId,
                academicYearId,
                termId: data.termId,
                amount: feeStructure.amount,
                dueDate: data.dueDate || null,
                notes: data.notes || null,
                assignedBy: data.assignedBy || null,
              })
              .returning();

            results.push(assignment);
          } catch (error) {
            errors.push(`Failed to assign fee ${feeStructureId} to target ${targetId}: ${error}`);
          }
        }
      }

      return {
        success: errors.length === 0,
        created: results.length,
        errors,
        assignments: results,
      };
    } catch (error) {
      console.error('Error bulk creating fee assignments:', error);
      throw error;
    }
  });

  ipcMain.handle('get-invoices', async (_event: any, filters?: any) => {
    try {
      let query = db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          studentId: invoices.studentId,
          studentName: sql<string>`${students.firstName} || ' ' || ${students.lastName}`,
          studentAdmNo: students.admissionNumber,
          className: classes.name,
          streamName: streams.name,
          guardianName: guardians.name,
          amount: invoices.amount,
          dueDate: invoices.dueDate,
          status: invoices.status,
          createdAt: invoices.createdAt,
          termId: invoices.termId,
          termName: terms.name,
          academicYearName: academicYears.name,
        })
        .from(invoices)
        .leftJoin(students, eq(invoices.studentId, students.id))
        .leftJoin(streams, eq(students.streamId, streams.id))
        .leftJoin(classes, eq(streams.classId, classes.id))
        .leftJoin(guardians, eq(students.id, guardians.studentId))
        .leftJoin(terms, eq(invoices.termId, terms.id))
        .leftJoin(academicYears, eq(terms.academicYearId, academicYears.id));

      const conditions = [];
      if (filters?.studentId)
        conditions.push(eq(invoices.studentId, filters.studentId));
      if (filters?.termId) conditions.push(eq(invoices.termId, filters.termId));
      if (filters?.classId)
        conditions.push(eq(streams.classId, filters.classId));
      if (filters?.status) conditions.push(eq(invoices.status, filters.status));

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const result = await query.orderBy(desc(invoices.createdAt));

      // Calculate balances
      const invoiceIds = result.map((i: any) => i.id);
      const payments =
        invoiceIds.length > 0
          ? await db
            .select()
            .from(feePayments)
            .where(inArray(feePayments.invoiceId, invoiceIds))
          : [];

      return result.map((inv: any) => {
        const invPayments = payments.filter((p: any) => p.invoiceId === inv.id);
        const paidAmount = invPayments.reduce(
          (sum: number, p: any) => sum + (p.amount || 0),
          0
        );
        return {
          ...inv,
          paidAmount,
          balance: inv.amount - paidAmount,
        };
      });
    } catch (error) {
      console.error('Error getting invoices:', error);
      throw error;
    }
  });

  ipcMain.handle('get-invoice-by-id', async (_event: any, id: number) => {
    try {
      const result = await db
        .select({
          invoice: invoices,
          term: terms,
          academicYear: academicYears,
          student: students,
          class: classes,
          stream: streams
        })
        .from(invoices)
        .leftJoin(terms, eq(invoices.termId, terms.id))
        .leftJoin(academicYears, eq(terms.academicYearId, academicYears.id))
        .leftJoin(students, eq(invoices.studentId, students.id))
        .leftJoin(streams, eq(students.streamId, streams.id))
        .leftJoin(classes, eq(streams.classId, classes.id))
        .where(eq(invoices.id, id))
        .limit(1);

      if (result.length === 0) return null;

      const { invoice, term, academicYear, student, class: studentClass, stream } = result[0];

      // Fetch guardian
      const [guardian] = await db
        .select()
        .from(guardians)
        .where(eq(guardians.studentId, student.id))
        .limit(1);

      const payments = await db
        .select()
        .from(feePayments)
        .where(eq(feePayments.invoiceId, id));

      return {
        ...invoice,
        term,
        academicYear,
        student,
        class: studentClass,
        stream,
        guardian,
        items: [],
        payments
      };
    } catch (error) {
      console.error('Error getting invoice by id:', error);
      throw error;
    }
  });

  ipcMain.handle('get-payment-by-id', async (_event: any, id: number) => {
    try {
      const result = await db
        .select({
          payment: feePayments,
          student: students,
          term: terms,
          academicYear: academicYears,
          class: classes,
          stream: streams,
          guardian: guardians
        })
        .from(feePayments)
        .leftJoin(students, eq(feePayments.studentId, students.id))
        .leftJoin(terms, eq(feePayments.termId, terms.id))
        .leftJoin(academicYears, eq(terms.academicYearId, academicYears.id))
        .leftJoin(streams, eq(students.streamId, streams.id))
        .leftJoin(classes, eq(streams.classId, classes.id))
        .leftJoin(guardians, eq(guardians.studentId, students.id))
        .where(eq(feePayments.id, id))
        .limit(1);

      if (result.length === 0) return null;

      const { payment, student, term, academicYear, class: sClass, stream, guardian } = result[0];

      // Fetch invoice balance info if linked
      let balanceInfo = {};
      if (payment.invoiceId) {
        const [invoice] = await db.select().from(invoices).where(eq(invoices.id, payment.invoiceId)).limit(1);
        if (invoice) {
          const allPayments = await db.select().from(feePayments).where(eq(feePayments.invoiceId, invoice.id));
          const totalPaid = allPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
          balanceInfo = {
            totalFees: invoice.amount,
            previousPayments: totalPaid - payment.amount,
            balance: invoice.amount - totalPaid
          };
        }
      }

      return {
        ...payment,
        paymentMethod: payment.method,
        student,
        term,
        academicYear,
        class: sClass,
        stream,
        guardian,
        ...balanceInfo
      };
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
      // Unlink payments
      await db
        .update(feePayments)
        .set({ invoiceId: null })
        .where(eq(feePayments.invoiceId, id));
      // Delete invoice
      return await db.delete(invoices).where(eq(invoices.id, id)).returning();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  });


  // --- DASHBOARD STATS ---

  ipcMain.handle('get-dashboard-stats', async () => {
    try {
      const [studentCount] = await db
        .select({ count: count() })
        .from(students)
        .where(eq(students.status, 'Active'));
      const [teacherCount] = await db.select({ count: count() }).from(teachers);
      const [classCount] = await db.select({ count: count() }).from(classes);

      // Calculate real-time financial stats
      const [totalInvoicedResult] = await db
        .select({ total: sum(invoices.amount) })
        .from(invoices);
      const [totalCollectedResult] = await db
        .select({ total: sum(feePayments.amount) })
        .from(feePayments);
      const [incomeSum] = await db.select({ total: sum(income.amount) }).from(income);

      const totalInvoiced = Number(totalInvoicedResult?.total || 0);
      const totalCollected = Number(totalCollectedResult?.total || 0);
      const otherIncome = Number(incomeSum?.total || 0);
      const pendingFees = totalInvoiced - totalCollected;

      return {
        totalStudents: studentCount?.count || 0,
        totalTeachers: teacherCount?.count || 0,
        totalClasses: classCount?.count || 0,
        totalRevenue: totalCollected + otherIncome,
        totalInvoiced,
        pendingFees,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  });

  ipcMain.handle('get-dashboard-charts-data', async () => {
    try {
      // 1. Revenue Trends (Monthly payments for current year)
      const currentYear = new Date().getFullYear().toString();
      const rawPayments = await db
        .select({
          month: sql`strftime('%m', ${feePayments.date})`,
          amount: feePayments.amount,
        })
        .from(feePayments)
        .where(sql`strftime('%Y', ${feePayments.date}) = ${currentYear}`);

      const monthlyRevenueMap: Record<string, number> = {};
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      rawPayments.forEach((p: any) => {
        const monthIdx = parseInt(p.month as string) - 1;
        const monthName = monthNames[monthIdx];
        monthlyRevenueMap[monthName] = (monthlyRevenueMap[monthName] || 0) + Number(p.amount);
      });

      const revenueTrends = monthNames.map(name => ({
        month: name,
        revenue: monthlyRevenueMap[name] || 0,
      })).filter((_, i) => i <= new Date().getMonth()); // Only show months up to current

      // 2. Student Performance (Average marks per subject for active term)
      const [activeTerm] = await db.select().from(terms).where(eq(terms.isActive, true)).limit(1);
      let performanceData: any[] = [];

      if (activeTerm) {
        const subjectAverages = await db
          .select({
            subjectName: subjects.name,
            averageScore: sql`AVG(${marks.score})`,
          })
          .from(marks)
          .innerJoin(subjects, eq(marks.subjectId, subjects.id))
          .innerJoin(exams, eq(marks.examId, exams.id))
          .where(eq(exams.termId, activeTerm.id))
          .groupBy(subjects.name);

        performanceData = subjectAverages.map((s: any) => ({
          subject: s.subjectName,
          score: Math.round(Number(s.averageScore || 0)),
        }));
      }

      // 3. Recent Activity
      const recentStudents = await db
        .select({
          id: students.id,
          name: sql`${students.firstName} || ' ' || ${students.lastName}`,
          date: students.enrollmentDate,
        })
        .from(students)
        .where(eq(students.status, 'Active'))
        .orderBy(desc(students.enrollmentDate))
        .limit(3);

      const recentPayments = await db
        .select({
          id: feePayments.id,
          studentName: sql`${students.firstName} || ' ' || ${students.lastName}`,
          amount: feePayments.amount,
          date: feePayments.date,
        })
        .from(feePayments)
        .innerJoin(students, eq(feePayments.studentId, students.id))
        .orderBy(desc(feePayments.date))
        .limit(3);

      const activities = [
        ...recentStudents.map((s: any) => ({
          action: 'New Student Registered',
          name: s.name,
          time: s.date,
          type: 'student'
        })),
        ...recentPayments.map((p: any) => ({
          action: 'Fee Payment Received',
          name: `${p.studentName} paid UGX ${Number(p.amount).toLocaleString()}`,
          time: p.date,
          type: 'payment'
        }))
      ].sort((a, b) => new Date(b.time as string).getTime() - new Date(a.time as string).getTime()).slice(0, 5);

      return {
        revenueTrends,
        performanceData,
        activities
      };
    } catch (error) {
      console.error('Error getting dashboard charts data:', error);
      throw error;
    }
  });

  ipcMain.handle('get-top-debtors', async () => {
    try {
      const allStudents = await db
        .select()
        .from(students)
        .where(eq(students.status, 'Active'));
      const debtors = [];

      for (const student of allStudents) {
        const payments = await db
          .select()
          .from(feePayments)
          .where(eq(feePayments.studentId, student.id));
        const totalPaid = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

        // Get invoices for this student
        const studentInvoices = await db
          .select()
          .from(invoices)
          .where(eq(invoices.studentId, student.id));

        let balance = 0;
        for (const inv of studentInvoices) {
          const invPayments = payments.filter((p: any) => p.invoiceId === inv.id);
          const paid = invPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
          balance += inv.amount - paid;
        }

        if (balance > 0) {
          debtors.push({
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            admissionNumber: student.admissionNumber,
            balance,
          });
        }
      }

      return debtors.sort((a, b) => b.balance - a.balance).slice(0, 5);
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
      return await db.select().from(expenses).orderBy(desc(expenses.date));
    } catch (error) {
      console.error('Error getting expenses:', error);
      throw error;
    }
  });

  ipcMain.handle('create-expense', async (_event: any, data: any) => {
    try {
      return await db.insert(expenses).values(data).returning();
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  });

  ipcMain.handle('update-expense', async (_event: any, data: any) => {
    try {
      return await db
        .update(expenses)
        .set(data)
        .where(eq(expenses.id, data.id))
        .returning();
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-expense', async (_event: any, id: number) => {
    try {
      return await db.delete(expenses).where(eq(expenses.id, id));
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  });

  ipcMain.handle('get-expense-stats', async () => {
    try {
      const allExpenses = await db.select().from(expenses);
      const total = allExpenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
      const pending = allExpenses
        .filter((e: any) => e.category === 'Pending')
        .reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

      // Group by category
      const categories: Record<string, number> = {};
      allExpenses.forEach((e: any) => {
        categories[e.category] =
          (categories[e.category] || 0) + (e.amount || 0);
      });

      const topCategory = Object.entries(categories).sort(
        (a, b) => b[1] - a[1]
      )[0];

      return {
        total,
        pending,
        topCategory: topCategory
          ? { name: topCategory[0], amount: topCategory[1] }
          : null,
        count: allExpenses.length,
      };
    } catch (error) {
      console.error('Error getting expense stats:', error);
      throw error;
    }
  });

  // --- INCOME ---

  ipcMain.handle('get-income', async () => {
    try {
      return await db.select().from(income).orderBy(desc(income.date));
    } catch (error) {
      console.error('Error getting income:', error);
      throw error;
    }
  });

  ipcMain.handle('create-income', async (_event: any, data: any) => {
    try {
      return await db.insert(income).values(data).returning();
    } catch (error) {
      console.error('Error creating income:', error);
      throw error;
    }
  });

  // --- REPORTS ---

  // Shared Grading Helpers
  const getGradeInfoHelper = (scales: any[], score: number) => {
    const scale = scales.find(s => score >= s.minScore && score <= s.maxScore);
    if (scale) return { grade: scale.grade, points: scale.points, remark: scale.remark };

    // Fallback for UNEB standard
    if (score >= 80) return { grade: 'D1', points: 1, remark: 'Excellent' };
    if (score >= 75) return { grade: 'D2', points: 2, remark: 'Very Good' };
    if (score >= 70) return { grade: 'C3', points: 3, remark: 'Good' };
    if (score >= 65) return { grade: 'C4', points: 4, remark: 'Fairly Good' };
    if (score >= 60) return { grade: 'C5', points: 5, remark: 'Fair' };
    if (score >= 55) return { grade: 'C6', points: 6, remark: 'Pass' };
    if (score >= 50) return { grade: 'P7', points: 7, remark: 'Pass' };
    if (score >= 45) return { grade: 'P8', points: 8, remark: 'Weak Pass' };
    return { grade: 'F9', points: 9, remark: 'Fail' };
  };

  const calculateAggregatesHelper = (subjectAverages: any[], calculationMethod: string) => {
    const coreSubjectsMatch = ['mathematics', 'english', 'science', 'social studies', 'physical education', 'mtc', 'eng', 'sci', 'sst'];

    if (calculationMethod === 'uneb_ple_aggregates') {
      const coreGrades = subjectAverages.filter(s => {
        const name = s.subjectName.toLowerCase();
        const code = s.subjectCode.toLowerCase();
        return coreSubjectsMatch.some(c => name.includes(c) || code.includes(c));
      });

      const sortedCore = coreGrades.sort((a, b) => (a.points || 9) - (b.points || 9));
      const top4 = sortedCore.slice(0, 4);
      let aggregates = top4.reduce((sum, s) => sum + (s.points || 9), 0);

      if (top4.length < 4) {
        aggregates += (4 - top4.length) * 9;
      }
      return aggregates;
    }

    return subjectAverages.reduce((sum, s) => sum + (s.points || 9), 0);
  };

  const determineDivisionHelper = (aggregates: number, average: number, calculationMethod: string) => {
    if (calculationMethod === 'uneb_ple_aggregates') {
      if (aggregates >= 4 && aggregates <= 12) return 'I';
      if (aggregates <= 24) return 'II';
      if (aggregates <= 29) return 'III';
      if (aggregates <= 34) return 'IV';
      return 'U';
    }

    if (average >= 80) return 'I';
    if (average >= 60) return 'II';
    if (average >= 50) return 'III';
    if (average >= 40) return 'IV';
    return 'U';
  };

  ipcMain.handle(
    'get-termly-report-data',
    async (
      _event: any,
      filters: {
        classId?: number;
        termId?: number;
        studentId?: number;
        streamId?: number;
      }
    ) => {
      try {
        const [scales, dbSettings] = await Promise.all([
          db.select().from(gradingScales).orderBy(desc(gradingScales.minScore)),
          db.select().from(settings)
        ]);

        const getSetting = (key: string, defaultValue: string) => {
          const s = dbSettings.find((s: any) => s.key === key);
          return s ? s.value : defaultValue;
        };

        const calculationMethod = getSetting('calculation_method', 'average');

        // 1. Get students based on filters
        const conditions = [eq(students.status, 'Active')];

        if (filters.streamId) {
          conditions.push(eq(students.streamId, filters.streamId));
        } else if (filters.classId) {
          const classStreams = await db
            .select()
            .from(streams)
            .where(eq(streams.classId, filters.classId));
          const streamIds = classStreams.map((s: any) => s.id);
          if (streamIds.length > 0) {
            conditions.push(inArray(students.streamId, streamIds));
          } else {
            return [];
          }
        }

        if (filters.studentId) {
          conditions.push(eq(students.id, filters.studentId));
        }

        const studentsList = await db
          .select({
            id: students.id,
            firstName: students.firstName,
            lastName: students.lastName,
            admissionNumber: students.admissionNumber,
            streamId: students.streamId,
            className: classes.name,
          })
          .from(students)
          .innerJoin(streams, eq(students.streamId, streams.id))
          .innerJoin(classes, eq(streams.classId, classes.id))
          .where(and(...conditions));

        // 2. For each student, get marks and attendance
        const reportData = await Promise.all(
          studentsList.map(async (student: any) => {
            const studentMarks = await db
              .select({
                subjectId: subjects.id,
                subjectName: subjects.name,
                subjectCode: subjects.code,
                score: marks.score,
                examId: exams.id,
                examName: exams.name,
              })
              .from(marks)
              .innerJoin(subjects, eq(marks.subjectId, subjects.id))
              .innerJoin(exams, eq(marks.examId, exams.id))
              .where(
                and(
                  eq(marks.studentId, student.id),
                  filters.termId ? eq(exams.termId, filters.termId) : undefined
                )
              );

            const attendanceRecords = await db
              .select()
              .from(attendance)
              .where(
                and(
                  eq(attendance.studentId, student.id),
                  filters.termId
                    ? eq(attendance.termId, filters.termId)
                    : undefined
                )
              );

            const present = attendanceRecords.filter((a: any) => a.status === 'Present').length;

            // Calculate Subject Averages for this student
            const subjectGroups: Record<number, any[]> = {};
            studentMarks.forEach((m: any) => {
              if (!subjectGroups[m.subjectId]) subjectGroups[m.subjectId] = [];
              subjectGroups[m.subjectId].push(m);
            });

            let totalScore = 0;
            let subjectCount = 0;
            const subjectAverages: any[] = [];

            Object.values(subjectGroups).forEach(group => {
              const avg = group.reduce((sum: number, m: any) => sum + m.score, 0) / group.length;
              totalScore += avg;
              subjectCount++;

              const gradeInfo = getGradeInfoHelper(scales, avg);
              subjectAverages.push({
                subjectId: group[0].subjectId,
                subjectName: group[0].subjectName,
                subjectCode: group[0].subjectCode,
                score: avg,
                points: gradeInfo.points,
                grade: gradeInfo.grade,
                remark: gradeInfo.remark
              });
            });

            const average = subjectCount > 0 ? totalScore / subjectCount : 0;
            const aggregates = calculateAggregatesHelper(subjectAverages, calculationMethod);
            const division = determineDivisionHelper(aggregates, average, calculationMethod);

            return {
              student,
              marks: studentMarks.map((m: any) => {
                const gi = getGradeInfoHelper(scales, m.score);
                return { ...m, grade: gi.grade, remarks: gi.remark };
              }),
              attendance: { present, total: attendanceRecords.length },
              performance: {
                total: totalScore.toFixed(0),
                average: Math.round(average * 10) / 10,
                aggregates,
                division
              },
            };
          })
        );

        const sortedData = reportData.sort(
          (a, b) => parseFloat(b.performance.average) - parseFloat(a.performance.average)
        );
        return sortedData.map((data, index) => ({
          ...data,
          performance: { ...data.performance, rank: index + 1 },
        }));
      } catch (error) {
        console.error('Error getting termly report data:', error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    'get-class-performance',
    async (
      _event: any,
      filters: {
        classId: number;
        termId: number;
        streamId?: number;
        subjectId?: number;
      }
    ) => {
      try {
        // Get streams for this class (if not filtered by stream)
        let streamIds: number[] = [];
        if (filters.streamId) {
          streamIds = [filters.streamId];
        } else {
          const classStreams = await db
            .select()
            .from(streams)
            .where(eq(streams.classId, filters.classId));
          streamIds = classStreams.map((s: any) => s.id);
        }

        if (streamIds.length === 0)
          return { averageScore: 0, passRate: 0, totalStudents: 0 };

        // Get students in these streams
        const classStudents = await db
          .select()
          .from(students)
          .where(
            and(
              inArray(students.streamId, streamIds),
              eq(students.status, 'Active')
            )
          );

        const studentIds = classStudents.map((s: any) => s.id);
        if (studentIds.length === 0)
          return { averageScore: 0, passRate: 0, totalStudents: 0 };

        // Get marks
        let conditions = and(
          inArray(marks.studentId, studentIds),
          eq(exams.termId, filters.termId)
        );

        if (filters.subjectId) {
          conditions = and(conditions, eq(marks.subjectId, filters.subjectId));
        }

        const classMarks = await db
          .select({
            score: marks.score,
          })
          .from(marks)
          .innerJoin(exams, eq(marks.examId, exams.id))
          .where(conditions);

        if (classMarks.length === 0)
          return {
            averageScore: 0,
            passRate: 0,
            totalStudents: classStudents.length,
          };

        const totalScore = classMarks.reduce((sum: number, m: any) => sum + m.score, 0);
        const averageScore = totalScore / classMarks.length;

        // Assuming pass mark is 50 for now
        const passCount = classMarks.filter((m: any) => m.score >= 50).length;
        const passRate = (passCount / classMarks.length) * 100;

        return {
          averageScore: Math.round(averageScore * 10) / 10,
          passRate: Math.round(passRate * 10) / 10,
          totalStudents: classStudents.length,
        };
      } catch (error) {
        console.error('Error getting class performance:', error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    'get-performance-analytics',
    async (
      _event: any,
      filters: { classId: number; termId: number; streamId?: number }
    ) => {
      try {
        // Get streams
        let streamIds: number[] = [];
        if (filters.streamId) {
          streamIds = [filters.streamId];
        } else {
          const classStreams = await db
            .select()
            .from(streams)
            .where(eq(streams.classId, filters.classId));
          streamIds = classStreams.map((s: any) => s.id);
        }

        if (streamIds.length === 0)
          return {
            subjectPerformance: [],
            gradeDistribution: [],
            passFailStats: [],
            termTrends: [],
          };

        // Get students
        const classStudents = await db
          .select()
          .from(students)
          .where(
            and(
              inArray(students.streamId, streamIds),
              eq(students.status, 'Active')
            )
          );

        const studentIds = classStudents.map((s: any) => s.id);
        if (studentIds.length === 0)
          return {
            subjectPerformance: [],
            gradeDistribution: [],
            passFailStats: [],
            termTrends: [],
          };

        // 1. Subject Performance
        const subjectMarks = await db
          .select({
            subjectName: subjects.name,
            score: marks.score,
            studentId: marks.studentId,
            studentName: sql`(${students.firstName} || ' ' || ${students.lastName})`,
          })
          .from(marks)
          .innerJoin(exams, eq(marks.examId, exams.id))
          .innerJoin(subjects, eq(marks.subjectId, subjects.id))
          .innerJoin(students, eq(marks.studentId, students.id))
          .where(
            and(
              inArray(marks.studentId, studentIds),
              eq(exams.termId, filters.termId)
            )
          );

        const subjectStats: Record<string, { total: number; count: number }> =
          {};
        subjectMarks.forEach((m: any) => {
          if (!subjectStats[m.subjectName]) {
            subjectStats[m.subjectName] = { total: 0, count: 0 };
          }
          subjectStats[m.subjectName].total += m.score;
          subjectStats[m.subjectName].count += 1;
        });

        const subjectPerformance = Object.entries(subjectStats)
          .map(([subject, stats]) => ({
            subject,
            average: Math.round((stats.total / stats.count) * 10) / 10,
          }))
          .sort((a, b) => b.average - a.average);

        // 2. Grade Distribution
        const scales = await db.select().from(gradingScales);
        const gradeCounts: Record<string, number> = {};

        // Initialize counts
        scales.forEach((scale: any) => (gradeCounts[scale.grade] = 0));

        subjectMarks.forEach((m: any) => {
          const grade = scales.find(
            (s: any) => m.score >= s.minScore && m.score <= s.maxScore
          );
          if (grade) {
            gradeCounts[grade.grade] = (gradeCounts[grade.grade] || 0) + 1;
          }
        });

        const gradeDistribution = Object.entries(gradeCounts)
          .map(([name, value]) => ({ name, value }))
          .filter((g) => g.value > 0);

        // 3. Pass/Fail Stats
        const passMark = 50;
        const passCount = subjectMarks.filter(
          (m: any) => m.score >= passMark
        ).length;
        const failCount = subjectMarks.length - passCount;

        const passFailStats = [
          { name: 'Pass', value: passCount, fill: '#10b981' },
          { name: 'Fail', value: failCount, fill: '#ef4444' },
        ];

        // 5. Stream Performance (if filtered by class only)
        const streamPerformance: any[] = [];
        if (!filters.streamId) {
          const classStreams = await db
            .select()
            .from(streams)
            .where(eq(streams.classId, filters.classId));
          for (const stream of classStreams) {
            const streamStudents = await db
              .select({ id: students.id })
              .from(students)
              .where(
                and(
                  eq(students.streamId, stream.id),
                  eq(students.status, 'Active')
                )
              );
            const streamStudentIds = streamStudents.map((s: any) => s.id);
            if (streamStudentIds.length > 0) {
              const streamMarks = await db
                .select({ score: marks.score })
                .from(marks)
                .innerJoin(exams, eq(marks.examId, exams.id))
                .where(
                  and(
                    inArray(marks.studentId, streamStudentIds),
                    eq(exams.termId, filters.termId)
                  )
                );
              if (streamMarks.length > 0) {
                const total = streamMarks.reduce((sum: number, m: any) => sum + m.score, 0);
                streamPerformance.push({
                  stream: stream.name,
                  average: Math.round((total / streamMarks.length) * 10) / 10,
                });
              }
            }
          }
        }

        // 6. Student Rankings (Top 5 and Bottom 5)
        const studentScores: Record<
          number,
          { id: number; name: string; total: number; count: number }
        > = {};
        subjectMarks.forEach((m: any) => {
          if (!studentScores[m.studentId]) {
            studentScores[m.studentId] = {
              id: m.studentId,
              name: m.studentName as string,
              total: 0,
              count: 0,
            };
          }
          studentScores[m.studentId].total += m.score;
          studentScores[m.studentId].count += 1;
        });

        const rankedStudents = Object.values(studentScores)
          .map((s) => ({
            ...s,
            average: Math.round((s.total / s.count) * 10) / 10,
          }))
          .sort((a, b) => b.average - a.average);

        const topStudents = rankedStudents.slice(0, 5);
        const bottomStudents = rankedStudents.slice(-5).reverse();

        // 7. Term Trends (Placeholder for now)
        const termTrends: any[] = [];

        return {
          subjectPerformance,
          gradeDistribution,
          passFailStats,
          termTrends,
          streamPerformance,
          topStudents,
          bottomStudents,
        };
      } catch (error) {
        console.error('Error getting performance analytics:', error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    'get-exam-marks-report',
    async (
      _event: any,
      filters: {
        examTypeId: number;
        classId: number;
        streamId?: number;
        termId: number;
      }
    ) => {
      try {
        // 1. Get streams
        let streamIds: number[] = [];
        if (filters.streamId) {
          streamIds = [filters.streamId];
        } else {
          const classStreams = await db
            .select()
            .from(streams)
            .where(eq(streams.classId, filters.classId));
          streamIds = classStreams.map((s: any) => s.id);
        }

        if (streamIds.length === 0) return { students: [], subjects: [] };

        // 2. Get students
        const classStudents = await db
          .select({
            id: students.id,
            admissionNumber: students.admissionNumber,
            firstName: students.firstName,
            lastName: students.lastName,
            gender: students.gender,
          })
          .from(students)
          .where(
            and(
              inArray(students.streamId, streamIds),
              eq(students.status, 'Active')
            )
          );

        const studentIds = classStudents.map((s: any) => s.id);
        if (studentIds.length === 0) return { students: [], subjects: [] };

        // 3. Get all subjects that have marks for this exam type and term
        const marksData = await db
          .select({
            studentId: marks.studentId,
            subjectId: marks.subjectId,
            subjectName: subjects.name,
            score: marks.score,
            grade: marks.grade,
          })
          .from(marks)
          .innerJoin(exams, eq(marks.examId, exams.id))
          .innerJoin(subjects, eq(marks.subjectId, subjects.id))
          .where(
            and(
              inArray(marks.studentId, studentIds),
              eq(exams.examTypeId, filters.examTypeId),
              eq(exams.termId, filters.termId)
            )
          );

        // 4. Organize marks by student
        const subjectsList = Array.from(
          new Set(marksData.map((m: any) => m.subjectName))
        ).sort();

        const studentsWithMarks = classStudents
          .map((student: any) => {
            const studentMarks: Record<string, number> = {};
            let total = 0;
            let count = 0;

            marksData
              .filter((m: any) => m.studentId === student.id)
              .forEach((m: any) => {
                studentMarks[m.subjectName] = m.score;
                total += m.score;
                count++;
              });

            return {
              ...student,
              marks: studentMarks,
              total,
              average: count > 0 ? Math.round((total / count) * 10) / 10 : 0,
            };
          })
          .sort((a: any, b: any) => b.total - a.total); // Sort by total marks for ranking

        return {
          students: studentsWithMarks,
          subjects: subjectsList,
        };
      } catch (error) {
        console.error('Error getting exam marks report:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('get-income-stats', async () => {
    try {
      const allIncome = await db.select().from(income);
      const total = allIncome.reduce((sum: number, i: any) => sum + (i.amount || 0), 0);
      const pending = allIncome
        .filter((i: any) => i.category === 'Pending')
        .reduce((sum: number, i: any) => sum + (i.amount || 0), 0);

      // Group by source
      const sources: Record<string, number> = {};
      allIncome.forEach((i: any) => {
        const src = i.source || 'Other';
        sources[src] = (sources[src] || 0) + (i.amount || 0);
      });

      const topSource = Object.entries(sources).sort((a, b) => b[1] - a[1])[0];

      return {
        total,
        pending,
        topSource: topSource
          ? { name: topSource[0], amount: topSource[1] }
          : null,
        count: allIncome.length,
      };
    } catch (error) {
      console.error('Error getting income stats:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-income', async (_event: any, id: number) => {
    try {
      return await db.delete(income).where(eq(income.id, id)).returning();
    } catch (error) {
      console.error('Error deleting income:', error);
      throw error;
    }
  });

  // --- BUDGET ---

  ipcMain.handle('get-budgets', async () => {
    try {
      return await db.select().from(budget);
    } catch (error) {
      console.error('Error getting budgets:', error);
      throw error;
    }
  });

  ipcMain.handle('create-budget', async (_event: any, data: any) => {
    try {
      return await db.insert(budget).values(data).returning();
    } catch (error) {
      console.error('Error creating budget:', error);
      throw error;
    }
  });

  ipcMain.handle('update-budget', async (_event: any, data: any) => {
    try {
      return await db
        .update(budget)
        .set(data)
        .where(eq(budget.id, data.id))
        .returning();
    } catch (error) {
      console.error('Error updating budget:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-budget', async (_event: any, id: number) => {
    try {
      await db.delete(budget).where(eq(budget.id, id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting budget:', error);
      throw error;
    }
  });

  ipcMain.handle('get-budget-stats', async () => {
    try {
      const allBudgets = await db.select().from(budget);
      const allExpenses = await db.select().from(expenses);

      const totalAllocated = allBudgets.reduce(
        (sum: number, b: any) => sum + (b.allocatedAmount || 0),
        0
      );
      const totalSpent = allExpenses.reduce(
        (sum: number, e: any) => sum + (e.amount || 0),
        0
      );
      const remaining = totalAllocated - totalSpent;
      const usage =
        totalAllocated > 0
          ? Math.round((totalSpent / totalAllocated) * 100)
          : 0;

      return {
        totalAllocated,
        totalSpent,
        remaining,
        usage,
        categoryCount: allBudgets.length,
      };
    } catch (error) {
      console.error('Error getting budget stats:', error);
      throw error;
    }
  });

  ipcMain.handle('get-budget-forecast', async (_event: any, targetYearId: number) => {
    try {
      // 1. Get the target year details
      const targetYear = (await db.select().from(academicYears).where(eq(academicYears.id, targetYearId)))[0];
      if (!targetYear) throw new Error("Target academic year not found");

      // 2. Find the most recent previous academic year
      const previousYear = (await db
        .select()
        .from(academicYears)
        .where(lt(academicYears.startDate, targetYear.startDate))
        .orderBy(desc(academicYears.startDate))
        .limit(1))[0];

      if (!previousYear) {
        // If no previous year, return current budget as a base or empty
        const currentBudgets = await db.select().from(budget).where(eq(budget.academicYearId, targetYearId));
        return currentBudgets.map((b: any) => ({
          category: b.category,
          suggestedAmount: b.allocatedAmount,
          previousAmount: 0,
          growthFactor: 1.1 // Default 10% buffer
        }));
      }

      // 3. Get total expenses by category for the previous year
      const previousExpenses = await db
        .select({
          category: expenses.category,
          totalAmount: sql`sum(${expenses.amount})`,
        })
        .from(expenses)
        .where(between(expenses.date, previousYear.startDate, previousYear.endDate))
        .groupBy(expenses.category);

      // 4. Get student count proxy for previous year (from invoices)
      const prevStudentCountData = await db
        .select({
          val: sql`count(distinct ${invoices.studentId})`
        })
        .from(invoices)
        .innerJoin(terms, eq(invoices.termId, terms.id))
        .where(eq(terms.academicYearId, previousYear.id));
      
      const prevStudentCount = Number((prevStudentCountData[0] as any).val) || 1;

      // 5. Get current active student count
      const currentStudentCountData = await db
        .select({
          val: count(students.id)
        })
        .from(students)
        .where(eq(students.status, 'Active'));
      
      const currentStudentCount = Number((currentStudentCountData[0] as any).val) || 1;

      // Student Growth Ratio
      const growthRatio = currentStudentCount / prevStudentCount;
      const safetyBuffer = 1.1; // 10% default buffer

      // 6. Map results
      const forecast = previousExpenses.map((e: any) => {
        const baseAmount = Number(e.totalAmount) || 0;
        const suggestedAmount = Math.ceil(baseAmount * growthRatio * safetyBuffer);
        return {
          category: e.category,
          suggestedAmount: suggestedAmount,
          previousAmount: baseAmount,
          growthFactor: growthRatio * safetyBuffer
        };
      });

      return forecast;
    } catch (error) {
      console.error('Error calculating budget forecast:', error);
      throw error;
    }
  });

  // --- MARKS ---

  ipcMain.handle('get-marks-by-exam', async (_event: any, examId: number) => {
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
        .where(eq(marks.examId, examId));
    } catch (error) {
      console.error('Error getting marks by exam:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'get-marks-by-student',
    async (_event: any, studentId: number) => {
      try {
        return await db
          .select({
            id: marks.id,
            score: marks.score,
            grade: marks.grade,
            remarks: marks.remarks,
            subjectId: marks.subjectId,
            subjectName: subjects.name,
            examId: marks.examId,
            examName: exams.name,
            examDate: exams.startDate,
            termId: exams.termId,
            termName: terms.name,
          })
          .from(marks)
          .innerJoin(subjects, eq(marks.subjectId, subjects.id))
          .innerJoin(exams, eq(marks.examId, exams.id))
          .innerJoin(terms, eq(exams.termId, terms.id))
          .where(eq(marks.studentId, studentId))
          .orderBy(desc(exams.startDate));
      } catch (error) {
        console.error('Error getting marks by student:', error);
        throw error;
      }
    }
  );

  // --- REPORTS ---

  ipcMain.handle(
    'get-teacher-report-data',
    async (_event: any, filters: any) => {
      try {
        let conditions = [];
        if (filters?.status) {
          conditions.push(eq(teachers.status, filters.status));
        }

        // We want to get teachers and a count of their subject allocations
        const teacherList = await db
          .select()
          .from(teachers)
          .where(conditions.length > 0 ? and(...conditions) : sql`1=1`);

        const enhancedTeachers = await Promise.all(
          teacherList.map(async (teacher: any) => {
            const allocations = await db
              .select()
              .from(subjectAllocations)
              .where(eq(subjectAllocations.teacherId, teacher.id));

            return {
              ...teacher,
              subjectCount: allocations.length,
            };
          })
        );

        return enhancedTeachers;
      } catch (error) {
        console.error('Error getting teacher report data:', error);
        throw error;
      }
    }
  );

  ipcMain.handle('get-attendance-report', async (_event: any, params: any) => {
    try {
      const records = await db.select().from(attendance);
      const total = records.length;
      const present = records.filter((r: any) => r.status === 'Present').length;
      const absent = records.filter((r: any) => r.status === 'Absent').length;
      const late = records.filter((r: any) => r.status === 'Late').length;

      return {
        total,
        present,
        absent,
        late,
        presentRate: total > 0 ? Math.round((present / total) * 100) : 0,
      };
    } catch (error) {
      console.error('Error getting attendance report:', error);
      throw error;
    }
  });

  ipcMain.handle('get-financial-report', async (_event: any, params: any) => {
    try {
      const allPayments = await db.select().from(feePayments);
      const allExpenses = await db.select().from(expenses);
      const allIncome = await db.select().from(income);

      const feeRevenue = allPayments.reduce(
        (sum: number, p: any) => sum + (p.amount || 0),
        0
      );
      const otherIncome = allIncome.reduce(
        (sum: number, i: any) => sum + (i.amount || 0),
        0
      );
      const totalExpenses = allExpenses.reduce(
        (sum: number, e: any) => sum + (e.amount || 0),
        0
      );

      return {
        feeRevenue,
        otherIncome,
        totalRevenue: feeRevenue + otherIncome,
        totalExpenses,
        netIncome: feeRevenue + otherIncome - totalExpenses,
      };
    } catch (error) {
      console.error('Error getting financial report:', error);
      throw error;
    }
  });

  // --- PAYROLL ---

  ipcMain.handle('get-all-payroll', async () => {
    try {
      return await db
        .select({
          id: payroll.id,
          teacherId: payroll.teacherId,
          teacherName: sql<string>`${teachers.firstName} || ' ' || ${teachers.lastName}`,
          baseSalary: payroll.baseSalary,
          allowances: payroll.allowances,
          deductions: payroll.deductions,
          paymentFrequency: payroll.paymentFrequency,
          status: payroll.status,
          createdAt: payroll.createdAt,
        })
        .from(payroll)
        .leftJoin(teachers, eq(payroll.teacherId, teachers.id));
    } catch (error) {
      console.error('Error getting all payroll:', error);
      throw error;
    }
  });

  ipcMain.handle('create-payroll', async (_event: any, data: any) => {
    try {
      return await db.insert(payroll).values(data).returning();
    } catch (error) {
      console.error('Error creating payroll:', error);
      throw error;
    }
  });

  ipcMain.handle('update-payroll', async (_event: any, data: any) => {
    try {
      if (data.id) {
        const { id, ...updateData } = data;
        return await db
          .update(payroll)
          .set(updateData)
          .where(eq(payroll.id, id))
          .returning();
      }
      throw new Error('Payroll ID required for update');
    } catch (error) {
      console.error('Error updating payroll:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-payroll', async (_event: any, id: number) => {
    try {
      return await db.delete(payroll).where(eq(payroll.id, id)).returning();
    } catch (error) {
      console.error('Error deleting payroll roster item:', error);
      throw error;
    }
  });

  ipcMain.handle('get-salary-payments', async (_event: any, payrollId?: number) => {
    try {
      let query = db
        .select({
          id: salaryPayments.id,
          payrollId: salaryPayments.payrollId,
          amountPaid: salaryPayments.amountPaid,
          datePaid: salaryPayments.datePaid,
          period: salaryPayments.period,
          paymentMethod: salaryPayments.paymentMethod,
          status: salaryPayments.status,
          recordedBy: salaryPayments.recordedBy,
          notes: salaryPayments.notes,
          teacherName: sql<string>`${teachers.firstName} || ' ' || ${teachers.lastName}`,
        })
        .from(salaryPayments)
        .leftJoin(payroll, eq(salaryPayments.payrollId, payroll.id))
        .leftJoin(teachers, eq(payroll.teacherId, teachers.id));

      if (payrollId) {
        query = query.where(eq(salaryPayments.payrollId, payrollId)) as any;
      }

      return await query.orderBy(desc(salaryPayments.datePaid));
    } catch (error) {
      console.error('Error getting salary payments:', error);
      throw error;
    }
  });

  ipcMain.handle('process-salary-payment', async (_event: any, data: any) => {
    try {
      return await db.insert(salaryPayments).values(data).returning();
    } catch (error) {
      console.error('Error processing salary payment:', error);
      throw error;
    }
  });

  ipcMain.handle('get-payroll-stats', async () => {
    try {
      const allPayroll = await db.select().from(payroll).where(eq(payroll.status, 'Active'));
      const [totalPaymentsResult] = await db
        .select({ total: sum(salaryPayments.amountPaid) })
        .from(salaryPayments);

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
      const groups = await db
        .select()
        .from(studentGroups)
        .orderBy(desc(studentGroups.createdAt));

      // Get member counts
      const groupsWithCounts = await Promise.all(
        groups.map(async (group: any) => {
          const [countResult] = await db
            .select({ count: count() })
            .from(studentGroupMembers)
            .where(eq(studentGroupMembers.groupId, group.id));
          return { ...group, memberCount: countResult?.count || 0 };
        })
      );

      return groupsWithCounts;
    } catch (error) {
      console.error('Error getting student groups:', error);
      throw error;
    }
  });

  ipcMain.handle('create-student-group', async (_event: any, data: any) => {
    try {
      return await db.insert(studentGroups).values(data).returning();
    } catch (error) {
      console.error('Error creating student group:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-student-group', async (_event: any, id: number) => {
    try {
      // Delete members first
      await db
        .delete(studentGroupMembers)
        .where(eq(studentGroupMembers.groupId, id));
      // Delete group
      return await db
        .delete(studentGroups)
        .where(eq(studentGroups.id, id))
        .returning();
    } catch (error) {
      console.error('Error deleting student group:', error);
      throw error;
    }
  });

  ipcMain.handle('get-group-members', async (_event: any, groupId: number) => {
    try {
      return await db
        .select({
          id: students.id,
          firstName: students.firstName,
          lastName: students.lastName,
          admissionNumber: students.admissionNumber,
          streamId: students.streamId,
          classId: students.classId,
          joinedAt: studentGroupMembers.joinedAt,
        })
        .from(studentGroupMembers)
        .innerJoin(students, eq(studentGroupMembers.studentId, students.id))
        .where(eq(studentGroupMembers.groupId, groupId));
    } catch (error) {
      console.error('Error getting group members:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'add-group-member',
    async (_event: any, data: { groupId: number; studentId: number }) => {
      try {
        // Check if already exists
        const existing = await db
          .select()
          .from(studentGroupMembers)
          .where(
            and(
              eq(studentGroupMembers.groupId, data.groupId),
              eq(studentGroupMembers.studentId, data.studentId)
            )
          );

        if (existing.length > 0) return existing[0];

        return await db.insert(studentGroupMembers).values(data).returning();
      } catch (error) {
        console.error('Error adding group member:', error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    'remove-group-member',
    async (_event: any, data: { groupId: number; studentId: number }) => {
      try {
        return await db
          .delete(studentGroupMembers)
          .where(
            and(
              eq(studentGroupMembers.groupId, data.groupId),
              eq(studentGroupMembers.studentId, data.studentId)
            )
          )
          .returning();
      } catch (error) {
        console.error('Error removing group member:', error);
        throw error;
      }
    }
  );

  // --- REPORT TEMPLATES ---

  ipcMain.handle('get-report-templates', async () => {
    try {
      const templates = await db
        .select()
        .from(reportTemplates)
        .orderBy(desc(reportTemplates.lastModified));

      // Parse content for frontend consumption
      return templates.map((template: any) => ({
        ...template,
        content: template.content ? JSON.parse(template.content) : null,
      }));
    } catch (error) {
      console.error('Error getting report templates:', error);
      throw error;
    }
  });

  ipcMain.handle('create-report-template', async (_event: any, data: any) => {
    try {
      // Ensure content is properly stringified
      const templateData = {
        name: data.name,
        type: data.type,
        description: data.description,
        status: data.status,
        content:
          typeof data.content === 'string'
            ? data.content
            : JSON.stringify(data.content),
        lastModified: new Date().toISOString(),
      };

      return await db.insert(reportTemplates).values(templateData).returning();
    } catch (error) {
      console.error('Error creating report template:', error);
      throw error;
    }
  });

  ipcMain.handle('update-report-template', async (_event: any, data: any) => {
    try {
      const { id, ...updateData } = data;

      // Ensure content is properly stringified
      const templateUpdateData = {
        name: updateData.name,
        type: updateData.type,
        description: updateData.description,
        status: updateData.status,
        content:
          typeof updateData.content === 'string'
            ? updateData.content
            : JSON.stringify(updateData.content),
        lastModified: new Date().toISOString(),
      };

      return await db
        .update(reportTemplates)
        .set(templateUpdateData)
        .where(eq(reportTemplates.id, id))
        .returning();
    } catch (error) {
      console.error('Error updating report template:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-report-template', async (_event: any, id: number) => {
    try {
      return await db
        .delete(reportTemplates)
        .where(eq(reportTemplates.id, id))
        .returning();
    } catch (error) {
      console.error('Error deleting report template:', error);
      throw error;
    }
  });
  ipcMain.handle('get-student-report-data', async (_event: any, params: any) => {
    try {
      if (!params || !params.studentId) throw new Error('studentId is required');
      const { studentId, termId } = params;
      // 1. Get Student, Stream, and Class Info
      const studentData = await db
        .select({
          student: students,
          streamName: streams.name,
          className: classes.name,
          classCode: classes.code
        })
        .from(students)
        .leftJoin(streams, eq(students.streamId, streams.id))
        .leftJoin(classes, eq(streams.classId, classes.id))
        .where(eq(students.id, studentId))
        .limit(1);

      if (!studentData.length) throw new Error('Student not found');
      const { student, streamName, className, classCode } = studentData[0];

      const [profile] = await db.select().from(schoolProfile).limit(1);

      // 2. Get Term/Year
      let term;
      if (termId) {
        [term] = await db.select().from(terms).where(eq(terms.id, termId)).limit(1);
      } else {
        [term] = await db.select().from(terms).where(eq(terms.isActive, true)).limit(1);
      }

      if (!term) throw new Error('No active term found');

      const [year] = await db.select().from(academicYears).where(eq(academicYears.id, term.academicYearId)).limit(1);

      // 3. Get Settings & Grading Scales
      const [scales, dbSettings] = await Promise.all([
        db.select().from(gradingScales).orderBy(desc(gradingScales.minScore)),
        db.select().from(settings)
      ]);

      const getSetting = (key: string, defaultValue: string) => {
        const s = dbSettings.find((s: any) => s.key === key);
        return s ? s.value : defaultValue;
      };

      const calculationMethod = getSetting('calculation_method', 'average');

      // 4. Get Marks
      const termExams = await db.select().from(exams).where(eq(exams.termId, term.id));
      const examIds = termExams.map((e: any) => e.id);

      let studentMarks: any[] = [];
      if (examIds.length > 0) {
        studentMarks = await db.select({
          subjectId: marks.subjectId,
          examId: marks.examId,
          score: marks.score,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          examName: exams.name,
          teacherFirstName: teachers.firstName,
          teacherLastName: teachers.lastName
        })
          .from(marks)
          .innerJoin(subjects, eq(marks.subjectId, subjects.id))
          .innerJoin(exams, eq(marks.examId, exams.id))
          .leftJoin(
            subjectAllocations,
            and(
              eq(subjectAllocations.subjectId, marks.subjectId),
              eq(subjectAllocations.streamId, student.streamId),
              eq(subjectAllocations.academicYearId, term.academicYearId)
            )
          )
          .leftJoin(teachers, eq(subjectAllocations.teacherId, teachers.id))
          .where(and(
            eq(marks.studentId, studentId),
            inArray(marks.examId, examIds)
          ));
      }

      // Process Marks for Display
      const processedMarks = studentMarks.map(m => {
        const initials = m.teacherFirstName && m.teacherLastName
          ? (m.teacherFirstName[0] + (m.teacherLastName[0] || '')).toUpperCase()
          : (m.teacherFirstName ? m.teacherFirstName[0].toUpperCase() : '');

        const gradeInfo = getGradeInfoHelper(scales, m.score);
        return {
          ...m,
          grade: gradeInfo.grade,
          remarks: gradeInfo.remark,
          initials
        };
      });

      // 5. Calculate Stats (Aggregates & Division)
      const subjectGroups: Record<number, any[]> = {};
      processedMarks.forEach(m => {
        if (!subjectGroups[m.subjectId]) subjectGroups[m.subjectId] = [];
        subjectGroups[m.subjectId].push(m);
      });

      let totalScore = 0;
      let subjectCount = 0;
      const subjectAverages: any[] = [];

      Object.values(subjectGroups).forEach(group => {
        const avg = group.reduce((sum, m) => sum + m.score, 0) / group.length;
        totalScore += avg;
        subjectCount++;

        const gradeInfo = getGradeInfoHelper(scales, avg);
        subjectAverages.push({
          subjectId: group[0].subjectId,
          subjectName: group[0].subjectName,
          subjectCode: group[0].subjectCode,
          grade: gradeInfo.grade,
          points: gradeInfo.points || 9,
          score: avg
        });
      });

      const averageScore = subjectCount > 0 ? totalScore / subjectCount : 0;
      const aggregates = calculateAggregatesHelper(subjectAverages, calculationMethod);
      const division = determineDivisionHelper(aggregates, averageScore, calculationMethod);

      // 6. Attendance & Final Object
      const [att] = await db.select().from(attendance).where(and(eq(attendance.studentId, studentId), eq(attendance.termId, term.id))).limit(1);

      return {
        student: {
          ...student,
          className: `${classCode} ${streamName}`,
          photo: student.photoUrl
        },
        schoolInfo: profile,
        termName: term.name,
        year: year?.name,
        marks: processedMarks,
        attendance: att || { present: 0, total: 0 },
        performance: {
          total: totalScore.toFixed(0),
          average: averageScore.toFixed(1),
          aggregates,
          division,
          rank: 'N/A'
        },
        gradingScales: scales,
        gradingSettings: dbSettings
      };

    } catch (error) {
      console.error('Error getting report data:', error);
      throw error;
    }
  });
  ipcMain.handle('save-marks', async (_event: any, marksList: any[]) => {
    try {
      if (!Array.isArray(marksList)) {
        throw new Error('Invalid data format. Expected array of marks.');
      }

      const results = [];
      for (const mark of marksList) {
        const { studentId, subjectId, examId, score } = mark;

        // Check if exists
        const existing = await db.select().from(marks).where(
          and(
            eq(marks.studentId, studentId),
            eq(marks.subjectId, subjectId),
            eq(marks.examId, examId)
          )
        ).limit(1);

        if (existing.length > 0) {
          // Update
          const updated = await db.update(marks)
            .set({ score, enteredAt: new Date().toISOString() })
            .where(eq(marks.id, existing[0].id))
            .returning();
          results.push(updated[0]);
        } else {
          // Insert
          const inserted = await db.insert(marks).values({
            studentId, subjectId, examId, score,
            enteredAt: new Date().toISOString()
          }).returning();
          results.push(inserted[0]);
        }
      }
      return results;
    } catch (error) {
      console.error('Error saving marks:', error);
      throw error;
    }
  });

  // Setup wizard handlers
  ipcMain.handle('has-completed-setup', async () => {
    try {
      // First, ensure the database is initialized by trying a simple query
      await db.select().from(settings).limit(1).catch((err: any) => {
        console.log('Database connection test failed, returning false for setup check');
        throw err;
      });

      const result = await db.select().from(settings).where(eq(settings.key, 'setup_completed')).limit(1);
      const isSetupCompleted = result.length > 0 && result[0].value === 'true';
      console.log('Setup check result:', isSetupCompleted);
      return isSetupCompleted;
    } catch (error) {
      console.error('Error checking setup status:', error);
      // Return false to show setup wizard if there are any database issues
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
      await db.insert(settings).values({
        key: 'setup_completed',
        value: 'true',
        category: 'system'
      }).onConflictDoUpdate({
        target: settings.key,
        set: { value: 'true' }
      });
      console.log('Setup marked as completed');
      return { success: true };
    } catch (error) {
      console.error('Failed to mark setup as completed:', error);
      throw error;
    }
  });

  ipcMain.handle('get-database-status', async () => {
    try {
      // Check if database is accessible
      const result = await db.select().from(settings).limit(1);

      // Check if setup is completed
      const setupResult = await db.select().from(settings).where(eq(settings.key, 'setup_completed')).limit(1);
      const isSetupCompleted = setupResult.length > 0 && setupResult[0].value === 'true';

      return {
        connected: true,
        initialized: isSetupCompleted,
        message: isSetupCompleted ? 'Database is ready' : 'Database needs initialization'
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
      const { schoolInfo, adminInfo, systemSettings } = data;

      // Save school profile
      if (schoolInfo) {
        const existing = await db.select().from(schoolProfile).limit(1);
        if (existing.length > 0) {
          await db.update(schoolProfile)
            .set({
              name: schoolInfo.name,
              email: schoolInfo.email,
              phone: schoolInfo.phone,
              address: schoolInfo.address,
              website: schoolInfo.website,
              registrationNumber: schoolInfo.registrationNumber,
              logo: schoolInfo.logo,
              currency: schoolInfo.currency,
              motto: schoolInfo.motto,
            })
            .where(eq(schoolProfile.id, existing[0].id));
        } else {
          await db.insert(schoolProfile).values({
            name: schoolInfo.name,
            email: schoolInfo.email,
            phone: schoolInfo.phone,
            address: schoolInfo.address,
            website: schoolInfo.website,
            registrationNumber: schoolInfo.registrationNumber,
            logo: schoolInfo.logo,
            currency: schoolInfo.currency,
            motto: schoolInfo.motto,
          });
        }
      }

      // Create academic year and terms
      if (systemSettings) {
        const startDate = new Date(systemSettings.academicYearStartDate);
        const endDate = new Date(systemSettings.academicYearEndDate);
        const numberOfTerms = parseInt(systemSettings.academicTerms) || 3;

        const academicYear = await db.insert(academicYears).values({
          name: systemSettings.academicYearName,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          isActive: true,
          status: 'Active',
        }).returning();

        if (academicYear.length > 0) {
          const yearDuration = endDate.getTime() - startDate.getTime();
          const termDuration = Math.floor(yearDuration / numberOfTerms);

          for (let i = 0; i < numberOfTerms; i++) {
            const termStart = new Date(startDate.getTime() + termDuration * i);
            const termEnd = new Date(startDate.getTime() + termDuration * (i + 1));

            await db.insert(terms).values({
              academicYearId: academicYear[0].id,
              name: `Term ${i + 1}`,
              startDate: termStart.toISOString().split('T')[0],
              endDate: termEnd.toISOString().split('T')[0],
              isActive: i === 0,
            });
          }
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving setup data:', error);
      throw error;
    }
  });

  // --- ROLES HANDLERS ---

  ipcMain.handle('get-roles', async () => {
    try {
      return await db.select().from(roles).orderBy(roles.id);
    } catch (error) {
      console.error('Error getting roles:', error);
      throw error;
    }
  });

  ipcMain.handle('create-role', async (_event: any, data: any) => {
    try {
      return await db.insert(roles).values({
        name: data.name,
        description: data.description,
        permissions: data.permissions || 'VIEW_ONLY',
        type: data.type || 'Custom',
        status: data.status || 'Active',
      }).returning();
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  });

  ipcMain.handle('update-role', async (_event: any, data: any) => {
    try {
      await db.update(roles)
        .set({
          name: data.name,
          description: data.description,
          permissions: data.permissions,
          status: data.status,
        })
        .where(eq(roles.id, data.id));
      return await db.select().from(roles).where(eq(roles.id, data.id));
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  });

  ipcMain.handle('delete-role', async (_event: any, id: number) => {
    try {
      await db.delete(roles).where(eq(roles.id, id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  });

  ipcMain.handle('get-users-by-role', async (_event: any, roleName: string) => {
    try {
      const usersWithRole = await db.select().from(users).where(eq(users.role, roleName));
      return usersWithRole.length;
    } catch (error) {
      console.error('Error getting users by role:', error);
      throw error;
    }
  });

  // --- BACKUP HANDLERS ---

  ipcMain.handle('get-backups', async () => {
    try {
      return await db.select().from(backups).orderBy(sql`${backups.createdAt} DESC`);
    } catch (error) {
      console.error('Error getting backups:', error);
      throw error;
    }
  });

  ipcMain.handle('create-backup', async () => {
    try {
      const dbPath = path.join(app.getPath('userData'), 'school-nexus.db');
      const backupDir = path.join(app.getPath('userData'), 'backups');

      // Ensure backup directory exists
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup-${timestamp}.db`;
      const backupPath = path.join(backupDir, backupName);

      // Copy database file
      fs.copyFileSync(dbPath, backupPath);

      // Get file size
      const stats = fs.statSync(backupPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      // Save backup record
      const result = await db.insert(backups).values({
        name: `Manual Backup - ${new Date().toLocaleDateString()}`,
        filePath: backupPath,
        size: `${sizeMB} MB`,
        type: 'Manual',
        status: 'Success',
      }).returning();

      return result[0];
    } catch (error) {
      console.error('Error creating backup:', error);
      // Save failed backup record
      await db.insert(backups).values({
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
      const backup = await db.select().from(backups).where(eq(backups.id, id)).limit(1);

      if (backup.length > 0 && backup[0].filePath && fs.existsSync(backup[0].filePath)) {
        fs.unlinkSync(backup[0].filePath);
      }

      await db.delete(backups).where(eq(backups.id, id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw error;
    }
  });
  // --- TRANSACTION CATEGORIES ---

  ipcMain.handle('get-transaction-categories', async () => {
    try {
      return await db.select().from(transactionCategories);
    } catch (error) {
      console.error('Error getting transaction categories:', error);
      throw error;
    }
  });

  ipcMain.handle(
    'create-transaction-category',
    async (_event: any, data: any) => {
      try {
        const result = await db
          .insert(transactionCategories)
          .values({
            name: data.name,
            type: data.type,
            description: data.description,
          })
          .returning();
        return result[0];
      } catch (error) {
        console.error('Error creating transaction category:', error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    'update-transaction-category',
    async (_event: any, data: any) => {
      try {
        const result = await db
          .update(transactionCategories)
          .set({
            name: data.name,
            type: data.type,
            description: data.description,
          })
          .where(eq(transactionCategories.id, data.id))
          .returning();
        return result[0];
      } catch (error) {
        console.error('Error updating transaction category:', error);
        throw error;
      }
    }
  );

  ipcMain.handle(
    'delete-transaction-category',
    async (_event: any, id: number) => {
      try {
        await db
          .delete(transactionCategories)
          .where(eq(transactionCategories.id, id));
        return { success: true };
      } catch (error) {
        console.error('Error deleting transaction category:', error);
        throw error;
      }
    }
  );


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
      return await db.select().from(settings);
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  });

  ipcMain.handle('update-setting', async (_event: any, { key, value, category }: any) => {
    try {
      return await db.insert(settings).values({
        key,
        value,
        category: category || 'general'
      }).onConflictDoUpdate({
        target: settings.key,
        set: { value }
      }).returning();
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  });


  logDebug('[Handlers] IPC handler registration complete.');
};
