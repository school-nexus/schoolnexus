import { eq, and, sql, desc, or, inArray } from 'drizzle-orm';
import { 
    feeStructures, feeAssignments, terms, academicYears, classes, 
    streams, students, studentGroups, feePayments, invoices, 
    guardians, transactionCategories, income, expenses, budget, 
    payroll, salaryPayments 
} from '../schema';
import type { DrizzleDB } from '../repository';

export const feeStructuresRepository = {
    getAll: async (db: DrizzleDB, schoolId: number) => {
        return await db.select().from(feeStructures).where(eq(feeStructures.schoolId, schoolId));
    },
    getByTermAndClass: async (db: DrizzleDB, schoolId: number, termId: number, classId: number) => {
        return await db.select().from(feeStructures).where(and(eq(feeStructures.termId, termId), eq(feeStructures.classId, classId), eq(feeStructures.schoolId, schoolId)));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        if (data.id) {
            return await db.update(feeStructures).set(data).where(and(eq(feeStructures.id, data.id), eq(feeStructures.schoolId, schoolId))).returning();
        }
        return await db.insert(feeStructures).values({ ...data, schoolId }).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.delete(feeStructures).where(and(eq(feeStructures.id, id), eq(feeStructures.schoolId, schoolId))).returning();
    }
};

export const feeAssignmentsRepository = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        if (data.id) {
            return await db.update(feeAssignments).set({ ...data, updatedAt: sql`CURRENT_TIMESTAMP` }).where(and(eq(feeAssignments.id, data.id), eq(feeAssignments.schoolId, schoolId))).returning();
        }
        return await db.insert(feeAssignments).values({ ...data, schoolId }).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.delete(feeAssignments).where(and(eq(feeAssignments.id, id), eq(feeAssignments.schoolId, schoolId))).returning();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bulkDelete: async (db: DrizzleDB, schoolId: number, data: { targetType: string; targetId: number; academicYearId?: number; termId?: number; }) => {
        const conditions = [
            eq(feeAssignments.targetType, data.targetType),
            eq(feeAssignments.targetId, data.targetId),
            eq(feeAssignments.schoolId, schoolId)
        ];
        if (data.academicYearId) conditions.push(eq(feeAssignments.academicYearId, data.academicYearId));
        if (data.termId) conditions.push(eq(feeAssignments.termId, data.termId));
        const deleted = await db.delete(feeAssignments).where(and(...conditions)).returning();
        return { success: true, deletedCount: deleted.length, assignments: deleted };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bulkCreate: async (db: DrizzleDB, schoolId: number, data: any) => {
        const results = [];
        const errors = [];
        const academicYearId = data.academicYearId;
        if (!academicYearId) throw new Error('Academic year ID required');

        for (const feeStructureId of data.feeStructureIds) {
            const [feeStructure] = await db.select().from(feeStructures).where(and(eq(feeStructures.id, feeStructureId), eq(feeStructures.schoolId, schoolId))).limit(1);
            if (!feeStructure) {
                errors.push(`Fee structure ${feeStructureId} not found`);
                continue;
            }

            for (const targetId of data.targetIds) {
                const existing = await db.select().from(feeAssignments).where(and(
                    eq(feeAssignments.feeStructureId, feeStructureId),
                    eq(feeAssignments.targetType, data.targetType),
                    eq(feeAssignments.targetId, targetId),
                    eq(feeAssignments.termId, data.termId),
                    eq(feeAssignments.schoolId, schoolId)
                )).limit(1);

                if (existing.length > 0) {
                    errors.push(`Assignment already exists for fee ${feeStructureId}, target ${targetId}`);
                    continue;
                }

                try {
                    const [assignment] = await db.insert(feeAssignments).values({
                        feeStructureId,
                        targetType: data.targetType,
                        targetId,
                        academicYearId,
                        termId: data.termId,
                        amount: feeStructure.amount,
                        dueDate: data.dueDate || null,
                        notes: data.notes || null,
                        assignedBy: data.assignedBy || null,
                        schoolId
                    }).returning();
                    results.push(assignment);
                } catch (error: any) {
                    errors.push(`Failed to assign fee ${feeStructureId} to target ${targetId}: ${error.message}`);
                }
            }
        }
        return { success: errors.length === 0, created: results.length, errors, assignments: results };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getDetailedReport: async (db: DrizzleDB, schoolId: number, filters?: any) => {
        const query = db
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
            .leftJoin(feeStructures, and(eq(feeAssignments.feeStructureId, feeStructures.id), eq(feeStructures.schoolId, schoolId)))
            .leftJoin(terms, and(eq(feeAssignments.termId, terms.id), eq(terms.schoolId, schoolId)))
            .leftJoin(academicYears, and(eq(feeAssignments.academicYearId, academicYears.id), eq(academicYears.schoolId, schoolId)));

        const conditions = [eq(feeAssignments.schoolId, schoolId)];
        if (filters?.academicYearId) conditions.push(eq(feeAssignments.academicYearId, filters.academicYearId));
        if (filters?.termId) conditions.push(eq(feeAssignments.termId, filters.termId));
        if (filters?.targetType) conditions.push(eq(feeAssignments.targetType, filters.targetType));
        if (filters?.status) conditions.push(eq(feeAssignments.status, filters.status));

        const results = await query.where(and(...conditions)).orderBy(feeAssignments.createdAt);

        return await Promise.all(results.map(async (assignment: any) => {
            let targetName = 'Unknown';
            let className = null;
            let streamName = null;
            let studentName = null;
            let groupName = null;

            if (assignment.targetType === 'class') {
                const classData = await db.select().from(classes).where(and(eq(classes.id, assignment.targetId), eq(classes.schoolId, schoolId))).limit(1);
                className = classData[0]?.name || null;
                targetName = className || 'Unknown Class';
            } else if (assignment.targetType === 'stream') {
                const streamData = await db.select({ streamName: streams.name, className: classes.name }).from(streams).leftJoin(classes, eq(streams.classId, classes.id)).where(and(eq(streams.id, assignment.targetId), eq(streams.schoolId, schoolId))).limit(1);
                streamName = streamData[0]?.streamName || null;
                className = streamData[0]?.className || null;
                targetName = streamName ? `${className} - ${streamName}` : 'Unknown Stream';
            } else if (assignment.targetType === 'student') {
                const studentData = await db.select().from(students).where(and(eq(students.id, assignment.targetId), eq(students.schoolId, schoolId))).limit(1);
                studentName = studentData[0] ? `${studentData[0].firstName} ${studentData[0].lastName}` : null;
                targetName = studentName || 'Unknown Student';
            } else if (assignment.targetType === 'group') {
                const groupData = await db.select().from(studentGroups).where(and(eq(studentGroups.id, assignment.targetId), eq(studentGroups.schoolId, schoolId))).limit(1);
                groupName = groupData[0]?.name || null;
                targetName = groupName || 'Unknown Group';
            }

            return { ...assignment, targetName, className, streamName, studentName, groupName };
        }));
    }
};

export const feePaymentsRepository = {
    getAll: async (db: DrizzleDB, schoolId: number) => {
        return await db.select().from(feePayments).where(eq(feePayments.schoolId, schoolId)).orderBy(desc(feePayments.date));
    },
    getReport: async (db: DrizzleDB, schoolId: number) => {
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
            .leftJoin(students, and(eq(feePayments.studentId, students.id), eq(students.schoolId, schoolId)))
            .leftJoin(streams, and(eq(students.streamId, streams.id), eq(streams.schoolId, schoolId)))
            .leftJoin(classes, and(eq(streams.classId, classes.id), eq(classes.schoolId, schoolId)))
            .leftJoin(guardians, and(eq(students.id, guardians.studentId), eq(guardians.schoolId, schoolId)))
            .leftJoin(invoices, and(eq(feePayments.invoiceId, invoices.id), eq(invoices.schoolId, schoolId)))
            .leftJoin(terms, and(eq(feePayments.termId, terms.id), eq(terms.schoolId, schoolId)))
            .leftJoin(academicYears, and(eq(terms.academicYearId, academicYears.id), eq(academicYears.schoolId, schoolId)))
            .where(eq(feePayments.schoolId, schoolId))
            .orderBy(desc(feePayments.date));
    },
    getByStudent: async (db: DrizzleDB, schoolId: number, studentId: number) => {
        return await db.select().from(feePayments).where(and(eq(feePayments.studentId, studentId), eq(feePayments.schoolId, schoolId))).orderBy(desc(feePayments.date));
    },
    getById: async (db: DrizzleDB, schoolId: number, id: number) => {
        const result = await db.select().from(feePayments).where(and(eq(feePayments.id, id), eq(feePayments.schoolId, schoolId))).limit(1);
        return result[0] || null;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: async (db: DrizzleDB, schoolId: number, data: any) => {
        const [newPayment] = await db.insert(feePayments).values({ ...data, schoolId }).returning();
        if (data.invoiceId) {
            const inv = await db.select().from(invoices).where(and(eq(invoices.id, data.invoiceId), eq(invoices.schoolId, schoolId))).limit(1);
            if (inv[0]) {
                const allPayments = await db.select().from(feePayments).where(and(eq(feePayments.invoiceId, data.invoiceId), eq(feePayments.schoolId, schoolId)));
                const totalPaid = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                let status = 'Pending';
                if (totalPaid >= inv[0].amount) status = 'Paid';
                else if (totalPaid > 0) status = 'Partially Paid';
                await db.update(invoices).set({ status }).where(and(eq(invoices.id, data.invoiceId), eq(invoices.schoolId, schoolId)));
            }
        }
        return newPayment;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    autoAllocate: async (db: DrizzleDB, schoolId: number, data: any) => {
        const outstandingInvoices = await db.select().from(invoices).where(and(
            eq(invoices.studentId, data.studentId),
            eq(invoices.schoolId, schoolId),
            or(eq(invoices.status, 'Pending'), eq(invoices.status, 'Partially Paid'))
        )).orderBy(invoices.createdAt);

        let remainingAmount = data.amount;
        const createdPayments = [];

        for (const invoice of outstandingInvoices) {
            if (remainingAmount <= 0) break;
            const payments = await db.select().from(feePayments).where(and(eq(feePayments.invoiceId, invoice.id), eq(feePayments.schoolId, schoolId)));
            const alreadyPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const balance = invoice.amount - alreadyPaid;
            const amountToApply = Math.min(remainingAmount, balance);

            if (amountToApply > 0) {
                const [p] = await db.insert(feePayments).values({
                    ...data,
                    schoolId,
                    amount: amountToApply,
                    invoiceId: invoice.id,
                    receiptNumber: `${data.receiptNumber}-${invoice.id}`
                }).returning();
                createdPayments.push(p);

                const totalPaidNow = alreadyPaid + amountToApply;
                let status = 'Partially Paid';
                if (totalPaidNow >= invoice.amount) status = 'Paid';
                await db.update(invoices).set({ status }).where(and(eq(invoices.id, invoice.id), eq(invoices.schoolId, schoolId)));

                remainingAmount -= amountToApply;
            }
        }

        if (remainingAmount > 0 || createdPayments.length === 0) {
            const [p] = await db.insert(feePayments).values({ ...data, schoolId, amount: remainingAmount, invoiceId: null }).returning();
            createdPayments.push(p);
        }
        return createdPayments;
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        const [p] = await db.select().from(feePayments).where(and(eq(feePayments.id, id), eq(feePayments.schoolId, schoolId))).limit(1);
        const result = await db.delete(feePayments).where(and(eq(feePayments.id, id), eq(feePayments.schoolId, schoolId))).returning();
        if (p?.invoiceId) {
            const inv = await db.select().from(invoices).where(and(eq(invoices.id, p.invoiceId), eq(invoices.schoolId, schoolId))).limit(1);
            if (inv[0]) {
                const allPayments = await db.select().from(feePayments).where(and(eq(feePayments.invoiceId, p.invoiceId), eq(feePayments.schoolId, schoolId)));
                const totalPaid = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                let status = 'Pending';
                if (totalPaid >= inv[0].amount) status = 'Paid';
                else if (totalPaid > 0) status = 'Partially Paid';
                await db.update(invoices).set({ status }).where(and(eq(invoices.id, p.invoiceId), eq(invoices.schoolId, schoolId)));
            }
        }
        return result;
    },
    getDetailed: async (db: DrizzleDB, schoolId: number, id: number) => {
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
            .leftJoin(students, and(eq(feePayments.studentId, students.id), eq(students.schoolId, schoolId)))
            .leftJoin(terms, and(eq(feePayments.termId, terms.id), eq(terms.schoolId, schoolId)))
            .leftJoin(academicYears, and(eq(terms.academicYearId, academicYears.id), eq(academicYears.schoolId, schoolId)))
            .leftJoin(streams, and(eq(students.streamId, streams.id), eq(streams.schoolId, schoolId)))
            .leftJoin(classes, and(eq(streams.classId, classes.id), eq(classes.schoolId, schoolId)))
            .leftJoin(guardians, and(eq(guardians.studentId, students.id), eq(guardians.schoolId, schoolId)))
            .where(and(eq(feePayments.id, id), eq(feePayments.schoolId, schoolId)))
            .limit(1);

        if (result.length === 0) return null;
        const { payment, student, term, academicYear, class: sClass, stream } = result[0];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let balanceInfo: any = {};
        if (payment?.invoiceId) {
            const [invoice] = await db.select().from(invoices).where(and(eq(invoices.id, payment.invoiceId), eq(invoices.schoolId, schoolId))).limit(1);
            if (invoice) {
                const allPayments = await db.select().from(feePayments).where(and(eq(feePayments.invoiceId, invoice.id), eq(feePayments.schoolId, schoolId)));
                const totalPaid = allPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
                balanceInfo = {
                    totalFees: invoice.amount,
                    previousPayments: totalPaid - (payment?.amount || 0),
                    balance: invoice.amount - totalPaid
                };
            }
        }

        let guardian = null;
        if (student) {
            const guardianResult = await db.select().from(guardians).where(and(eq(guardians.studentId, student.id), eq(guardians.schoolId, schoolId))).limit(1);
            guardian = guardianResult[0] || null;
        }

        return { ...payment, paymentMethod: payment?.method, student, term, academicYear, class: sClass, stream, guardian, ...balanceInfo };
    }
};

export const invoicesRepository = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getAll: async (db: DrizzleDB, schoolId: number, filters?: any) => {
        const query = db
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
            .leftJoin(students, and(eq(invoices.studentId, students.id), eq(students.schoolId, schoolId)))
            .leftJoin(streams, and(eq(students.streamId, streams.id), eq(streams.schoolId, schoolId)))
            .leftJoin(classes, and(eq(streams.classId, classes.id), eq(classes.schoolId, schoolId)))
            .leftJoin(guardians, and(eq(students.id, guardians.studentId), eq(guardians.schoolId, schoolId)))
            .leftJoin(terms, and(eq(invoices.termId, terms.id), eq(terms.schoolId, schoolId)))
            .leftJoin(academicYears, and(eq(terms.academicYearId, academicYears.id), eq(academicYears.schoolId, schoolId)));

        const conditions = [eq(invoices.schoolId, schoolId)];
        if (filters?.studentId) conditions.push(eq(invoices.studentId, filters.studentId));
        if (filters?.termId) conditions.push(eq(invoices.termId, filters.termId));
        if (filters?.classId) conditions.push(eq(streams.classId, filters.classId));
        if (filters?.status) conditions.push(eq(invoices.status, filters.status));

        const result = await query.where(and(...conditions)).orderBy(desc(invoices.createdAt));

        const invoiceIds = result.map((i: any) => i.id);
        const payments = invoiceIds.length > 0
            ? await db.select().from(feePayments).where(and(inArray(feePayments.invoiceId, invoiceIds), eq(feePayments.schoolId, schoolId)))
            : [];

        return result.map((inv: any) => {
            const invPayments = payments.filter((p: any) => p.invoiceId === inv.id);
            const paidAmount = invPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
            return { ...inv, paidAmount, balance: (inv.amount || 0) - paidAmount };
        });
    },
    getByStudent: async (db: DrizzleDB, schoolId: number, studentId: number) => {
        return await db.select().from(invoices).where(and(eq(invoices.schoolId, schoolId), eq(invoices.studentId, studentId)));
    },
    getById: async (db: DrizzleDB, schoolId: number, id: number) => {
        const result = await db.select().from(invoices).where(and(eq(invoices.id, id), eq(invoices.schoolId, schoolId))).limit(1);
        return result[0] || null;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        if (data.id) {
            return await db.update(invoices).set(data).where(and(eq(invoices.id, data.id), eq(invoices.schoolId, schoolId))).returning();
        }
        return await db.insert(invoices).values({ ...data, schoolId }).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        await db.update(feePayments).set({ invoiceId: null }).where(and(eq(feePayments.invoiceId, id), eq(feePayments.schoolId, schoolId)));
        return await db.delete(invoices).where(and(eq(invoices.id, id), eq(invoices.schoolId, schoolId))).returning();
    },
    updateStatus: async (db: DrizzleDB, schoolId: number, id: number) => {
        const invoice = await db.select().from(invoices).where(and(eq(invoices.id, id), eq(invoices.schoolId, schoolId))).limit(1);
        if (!invoice[0]) return;
        const payments = await db.select().from(feePayments).where(and(eq(feePayments.invoiceId, id), eq(feePayments.schoolId, schoolId)));
        const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
        let status = 'Pending';
        if (totalPaid >= invoice[0].amount) status = 'Paid';
        else if (totalPaid > 0) status = 'Partially Paid';
        return await db.update(invoices).set({ status }).where(and(eq(invoices.id, id), eq(invoices.schoolId, schoolId))).returning();
    },
    getDetailed: async (db: DrizzleDB, schoolId: number, id: number) => {
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
            .leftJoin(terms, and(eq(invoices.termId, terms.id), eq(terms.schoolId, schoolId)))
            .leftJoin(academicYears, and(eq(terms.academicYearId, academicYears.id), eq(academicYears.schoolId, schoolId)))
            .leftJoin(students, and(eq(invoices.studentId, students.id), eq(students.schoolId, schoolId)))
            .leftJoin(streams, and(eq(students.streamId, streams.id), eq(streams.schoolId, schoolId)))
            .leftJoin(classes, and(eq(streams.classId, classes.id), eq(classes.schoolId, schoolId)))
            .where(and(eq(invoices.id, id), eq(invoices.schoolId, schoolId)))
            .limit(1);

        if (result.length === 0) return null;
        const { invoice, term, academicYear, student, class: studentClass, stream } = result[0];

        let guardian = null;
        if (student) {
            const guardianResult = await db.select().from(guardians).where(and(eq(guardians.studentId, student.id), eq(guardians.schoolId, schoolId))).limit(1);
            guardian = guardianResult[0] || null;
        }
        const payments = await db.select().from(feePayments).where(and(eq(feePayments.invoiceId, id), eq(feePayments.schoolId, schoolId)));

        return { ...invoice, term, academicYear, student, class: studentClass, stream, guardian, payments };
    }
};

export const transactionCategoriesRepository = {
    getAll: async (db: DrizzleDB, schoolId: number) => {
        return await db.select().from(transactionCategories).where(eq(transactionCategories.schoolId, schoolId));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        if (data.id) {
            return await db.update(transactionCategories).set(data).where(and(eq(transactionCategories.id, data.id), eq(transactionCategories.schoolId, schoolId))).returning();
        }
        return await db.insert(transactionCategories).values({ ...data, schoolId }).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.delete(transactionCategories).where(and(eq(transactionCategories.id, id), eq(transactionCategories.schoolId, schoolId))).returning();
    }
};

export const incomeRepository = {
    getAll: async (db: DrizzleDB, schoolId: number) => {
        return await db.select().from(income).where(eq(income.schoolId, schoolId)).orderBy(desc(income.date));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    record: async (db: DrizzleDB, schoolId: number, data: any) => {
        return await db.insert(income).values({ ...data, schoolId }).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.delete(income).where(and(eq(income.id, id), eq(income.schoolId, schoolId))).returning();
    }
};

export const expensesRepository = {
    getAll: async (db: DrizzleDB, schoolId: number) => {
        return await db.select().from(expenses).where(eq(expenses.schoolId, schoolId)).orderBy(desc(expenses.date));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    record: async (db: DrizzleDB, schoolId: number, data: any) => {
        return await db.insert(expenses).values({ ...data, schoolId }).returning();
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        const { id, ...updateData } = data;
        return await db.update(expenses).set(updateData).where(and(eq(expenses.id, id), eq(expenses.schoolId, schoolId))).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.schoolId, schoolId))).returning();
    }
};

export const budgetRepository = {
    getByYear: async (db: DrizzleDB, schoolId: number, yearId: number) => {
        return await db.select().from(budget).where(and(eq(budget.schoolId, schoolId), eq(budget.academicYearId, yearId)));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        if (data.id) {
            return await db.update(budget).set(data).where(and(eq(budget.id, data.id), eq(budget.schoolId, schoolId))).returning();
        }
        return await db.insert(budget).values({ ...data, schoolId }).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.delete(budget).where(and(eq(budget.id, id), eq(budget.schoolId, schoolId))).returning();
    }
};

export const payrollRepository = {
    getAll: async (db: DrizzleDB, schoolId: number) => {
        return await db.select().from(payroll).where(eq(payroll.schoolId, schoolId));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: async (db: DrizzleDB, schoolId: number, data: any) => {
        if (data.id) {
            return await db.update(payroll).set(data).where(and(eq(payroll.id, data.id), eq(payroll.schoolId, schoolId))).returning();
        }
        return await db.insert(payroll).values({ ...data, schoolId }).returning();
    },
    delete: async (db: DrizzleDB, schoolId: number, id: number) => {
        return await db.delete(payroll).where(and(eq(payroll.id, id), eq(payroll.schoolId, schoolId))).returning();
    }
};

export const salaryPaymentsRepository = {
    getByPayroll: async (db: DrizzleDB, schoolId: number, payrollId: number) => {
        return await db.select().from(salaryPayments).where(and(eq(salaryPayments.schoolId, schoolId), eq(salaryPayments.payrollId, payrollId)));
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    record: async (db: DrizzleDB, schoolId: number, data: any) => {
        return await db.insert(salaryPayments).values({ ...data, schoolId }).returning();
    }
};
