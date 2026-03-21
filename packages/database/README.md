# @school-nexus/database

Shared database logic and schema for School Nexus Academy using Drizzle ORM with SQLite.

## 📦 Features

- **Drizzle ORM**: Type-safe database operations
- **SQLite**: Lightweight, embedded database
- **Repository Pattern**: Clean data access layer
- **Schema Management**: Automated migrations and types
- **Seeding**: Pre-populated demo data

## 🏗️ Architecture

### Core Components

1. **Schema**: Database table definitions using Drizzle schema
2. **Repositories**: Data access layer with business logic
3. **Client**: Database connection and Drizzle instance
4. **Utilities**: Helper functions for authentication and data manipulation

### Schema Structure

The database includes comprehensive tables for:
- **School Management**: School profile, academic years, terms
- **People**: Users, students, teachers
- **Academic**: Classes, subjects, exams, marks
- **Finance**: Fee structures, payments, invoices, expenses
- **System**: Settings, roles, backups

## 🚀 Usage

### Installation
```bash
# Install dependencies
pnpm install

# Generate types and migrations
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed initial data
pnpm db:seed

# Open database studio
pnpm db:studio
```

### Using Repositories

```typescript
import { StudentRepository } from '@school-nexus/database';

const studentRepo = new StudentRepository();

// Find student by ID
const student = await studentRepo.findById(1);

// Create new student
const newStudent = await studentRepo.create({
  admissionNumber: 'STU001',
  firstName: 'John',
  lastName: 'Doe',
  gender: 'Male'
});

// Get students with pagination
const { students, total } = await studentRepo.findBySchool(
  { classId: 1 },
  1, // page
  20 // limit
);
```

### Direct Database Access

```typescript
import { db } from '@school-nexus/database/client';
import { students, classes } from '@school-nexus/database/schema';
import { eq } from 'drizzle-orm';

// Direct query
const result = await db
  .select()
  .from(students)
  .leftJoin(classes, eq(students.classId, classes.id))
  .where(eq(students.id, 1));
```

## 📁 Project Structure

```
packages/database/
├── src/
│   ├── repositories/     # Data access layer
│   │   ├── student.repository.ts
│   │   ├── teacher.repository.ts
│   │   └── ...
│   ├── utils/           # Helper functions
│   │   └── auth.ts
│   ├── client.ts        # Database connection
│   ├── schema.ts        # Database schema
│   ├── seed.ts          # Database seeding
│   └── index.ts         # Package exports
├── drizzle/             # Generated migrations
├── drizzle.config.ts    # Drizzle configuration
└── package.json         # Package configuration
```

## 🔧 Configuration

### Drizzle Config
```typescript
// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/schema.ts',
    out: './drizzle',
    dialect: 'sqlite',
    dbCredentials: {
        url: 'school-nexus.db',
    },
});
```

### Environment Variables
```env
DATABASE_URL="file:./school-nexus.db"
```

## 🧪 Testing

```bash
# Run database tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## 📚 API Reference

### StudentRepository
- `findById(id: number)` - Find student by ID
- `findByAdmissionNumber(number: string)` - Find by admission number
- `findByClass(classId: number)` - Get students by class
- `findBySchool(filters, page, limit)` - Paginated school search
- `create(data: CreateStudentDto)` - Create new student
- `update(id: number, data: UpdateStudentDto)` - Update student
- `softDelete(id: number)` - Soft delete student
- `restore(id: number)` - Restore student
- `bulkCreate(students: CreateStudentDto[])` - Bulk create
- `getStats()` - Get student statistics

### Available Repositories
- StudentRepository
- TeacherRepository
- ClassRepository
- SubjectRepository
- ExamRepository
- PaymentRepository
- ExpenseRepository
- UserRepository

## 🛡️ Security

- Passwords hashed with bcrypt
- Role-based access control
- Input validation with Zod
- SQL injection protection via Drizzle ORM

## 🚀 Performance

- SQLite for fast local operations
- Connection pooling
- Efficient queries with indexes
- Caching strategies for frequently accessed data

## 📖 Documentation

For detailed API documentation, see the main project README and inline code comments.

## 🤝 Contributing

See the main project contributing guidelines.

## 📄 License

MIT License - see main project LICENSE file.