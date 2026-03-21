import { db } from './client';
import { users, schoolProfile, academicYears, terms, classes, subjects } from './schema';
import { hashPassword } from './utils/auth';

export async function seed() {
    console.log('Seeding database...');
    
    // Check if admin user exists
    const existingAdmin = await db.select().from(users).limit(1);
    if (existingAdmin.length === 0) {
        const hashedPassword = await hashPassword('admin123');
        await db.insert(users).values({
            username: 'admin',
            passwordHash: hashedPassword,
            fullName: 'System Administrator',
            role: 'admin',
            email: 'admin@schoolnexus.com',
            isActive: true
        });
        console.log('Admin user created');
    }

    // Check if school profile exists
    const existingProfile = await db.select().from(schoolProfile).limit(1);
    if (existingProfile.length === 0) {
        await db.insert(schoolProfile).values({
            name: 'Demo School',
            address: '123 Education Street',
            phone: '+256 XXX XXX XXX',
            email: 'info@demoschool.com',
            currency: 'UGX'
        });
        console.log('School profile created');
    }

    // Check if academic year exists
    const existingYear = await db.select().from(academicYears).limit(1);
    if (existingYear.length === 0) {
        const [year] = await db.insert(academicYears).values({
            name: '2024',
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            isActive: true,
            status: 'Active'
        }).returning();
        
        // Create terms
        await db.insert(terms).values([
            {
                academicYearId: year.id,
                name: 'Term 1',
                startDate: '2024-01-01',
                endDate: '2024-04-30',
                isActive: true
            },
            {
                academicYearId: year.id,
                name: 'Term 2',
                startDate: '2024-05-01',
                endDate: '2024-08-31',
                isActive: false
            },
            {
                academicYearId: year.id,
                name: 'Term 3',
                startDate: '2024-09-01',
                endDate: '2024-12-31',
                isActive: false
            }
        ]);
        console.log('Academic year and terms created');
    }

    // Check if classes exist
    const existingClasses = await db.select().from(classes).limit(1);
    if (existingClasses.length === 0) {
        await db.insert(classes).values([
            { name: 'Primary One', code: 'P.1' },
            { name: 'Primary Two', code: 'P.2' },
            { name: 'Primary Three', code: 'P.3' },
            { name: 'Primary Four', code: 'P.4' },
            { name: 'Primary Five', code: 'P.5' },
            { name: 'Primary Six', code: 'P.6' },
            { name: 'Primary Seven', code: 'P.7' }
        ]);
        console.log('Classes created');
    }

    // Check if subjects exist
    const existingSubjects = await db.select().from(subjects).limit(1);
    if (existingSubjects.length === 0) {
        await db.insert(subjects).values([
            { name: 'Mathematics', code: 'MTC', category: 'Core' },
            { name: 'English', code: 'ENG', category: 'Core' },
            { name: 'Science', code: 'SCI', category: 'Core' },
            { name: 'Social Studies', code: 'SST', category: 'Core' },
            { name: 'Religious Education', code: 'RE', category: 'Core' }
        ]);
        console.log('Subjects created');
    }

    console.log('Database seeding completed!');
}