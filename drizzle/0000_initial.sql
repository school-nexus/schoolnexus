CREATE TABLE `school_profile` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`phone` text,
	`email` text,
	`website` text,
	`registration_number` text,
	`motto` text,
	`logo` text,
	`currency` text DEFAULT 'UGX'
);
--> statement-breakpoint
CREATE TABLE `academic_years` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`is_active` integer DEFAULT 0,
	`status` text DEFAULT 'Active'
);
--> statement-breakpoint
CREATE TABLE `terms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`academic_year_id` integer NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`is_active` integer DEFAULT 0,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`full_name` text NOT NULL,
	`role` text DEFAULT 'teacher' NOT NULL,
	`email` text,
	`is_active` integer DEFAULT 1,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`permissions` text,
	`type` text DEFAULT 'Custom',
	`status` text DEFAULT 'Active',
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `backups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`file_path` text,
	`size` text,
	`type` text DEFAULT 'Manual',
	`status` text DEFAULT 'Success',
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `classes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `streams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`class_id` integer NOT NULL,
	`name` text NOT NULL,
	`room_number` text,
	`teacher_id` integer,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`category` text DEFAULT 'Core',
	`is_optional` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `teachers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`email` text,
	`phone` text,
	`gender` text,
	`qualification` text,
	`address` text,
	`subjects` text,
	`status` text DEFAULT 'Active',
	`joined_date` text,
	`experience` integer,
	`photo_url` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teacher_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`teacher_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`size` text NOT NULL,
	`date` text DEFAULT CURRENT_TIMESTAMP,
	`path` text,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`admission_number` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`gender` text NOT NULL,
	`dob` text,
	`nationality` text,
	`class_id` integer,
	`stream_id` integer,
	`photo_url` text,
	`status` text DEFAULT 'Active',
	`enrollment_date` text DEFAULT CURRENT_TIMESTAMP,
	`parent_names` text,
	`parent_contact` text,
	`address` text,
	`previous_school` text,
	`lin_number` text,
	`school_pay_code` text,
	`email` text,
	`medical_conditions` text,
	`special_needs` text,
	`notes` text,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stream_id`) REFERENCES `streams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `students_admission_number_unique` ON `students` (`admission_number`);
--> statement-breakpoint
CREATE TABLE `guardians` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`name` text NOT NULL,
	`relationship` text,
	`phone` text,
	`email` text,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `student_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`size` text NOT NULL,
	`date` text DEFAULT CURRENT_TIMESTAMP,
	`path` text,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `subject_allocations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`teacher_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	`stream_id` integer NOT NULL,
	`academic_year_id` integer NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stream_id`) REFERENCES `streams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `exam_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`short_code` text NOT NULL,
	`weightage` real DEFAULT 100
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`exam_type_id` integer NOT NULL,
	`term_id` integer NOT NULL,
	`class_id` integer,
	`name` text,
	`duration` integer,
	`start_date` text,
	`end_date` text,
	FOREIGN KEY (`exam_type_id`) REFERENCES `exam_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `grading_scales` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`grade` text NOT NULL,
	`min_score` integer NOT NULL,
	`max_score` integer NOT NULL,
	`points` integer NOT NULL,
	`remark` text
);
--> statement-breakpoint
CREATE TABLE `marks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	`exam_id` integer NOT NULL,
	`score` real NOT NULL,
	`grade` text,
	`remarks` text,
	`entered_by` integer,
	`entered_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`entered_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `exam_subjects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`exam_id` integer NOT NULL,
	`subject_id` integer NOT NULL,
	FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `attendance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`date` text NOT NULL,
	`status` text NOT NULL,
	`term_id` integer NOT NULL,
	`recorded_by` integer,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fee_structures` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`amount` real NOT NULL,
	`term_id` integer NOT NULL,
	`class_id` integer,
	`student_id` integer,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`term_id` integer NOT NULL,
	`invoice_number` text,
	`amount` real NOT NULL,
	`due_date` text,
	`status` text DEFAULT 'Pending',
	`notes` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_invoice_number_unique` ON `invoices` (`invoice_number`);
--> statement-breakpoint
CREATE TABLE `fee_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fee_structure_id` integer NOT NULL,
	`target_type` text NOT NULL,
	`target_id` integer NOT NULL,
	`academic_year_id` integer NOT NULL,
	`term_id` integer NOT NULL,
	`amount` real NOT NULL,
	`due_date` text,
	`status` text DEFAULT 'Active',
	`notes` text,
	`assigned_by` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`fee_structure_id`) REFERENCES `fee_structures`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fee_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`student_id` integer NOT NULL,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`method` text DEFAULT 'Cash',
	`receipt_number` text,
	`term_id` integer NOT NULL,
	`invoice_id` integer,
	`recorded_by` integer,
	`notes` text,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fee_payments_receipt_number_unique` ON `fee_payments` (`receipt_number`);
--> statement-breakpoint
CREATE TABLE `transaction_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`category_id` integer,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`description` text,
	`recorded_by` integer,
	FOREIGN KEY (`category_id`) REFERENCES `transaction_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `income` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`category_id` integer,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`description` text,
	`source` text,
	`recorded_by` integer,
	FOREIGN KEY (`category_id`) REFERENCES `transaction_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `budget` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category` text NOT NULL,
	`allocated_amount` real NOT NULL,
	`academic_year_id` integer NOT NULL,
	`notes` text,
	FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `payroll` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`teacher_id` integer NOT NULL,
	`base_salary` real NOT NULL,
	`allowances` real DEFAULT 0,
	`deductions` real DEFAULT 0,
	`payment_frequency` text DEFAULT 'Monthly',
	`status` text DEFAULT 'Active',
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `salary_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`payroll_id` integer NOT NULL,
	`amount_paid` real NOT NULL,
	`date_paid` text NOT NULL,
	`period` text NOT NULL,
	`payment_method` text DEFAULT 'Cash',
	`status` text DEFAULT 'Paid',
	`recorded_by` integer,
	`notes` text,
	FOREIGN KEY (`payroll_id`) REFERENCES `payroll`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`category` text DEFAULT 'general'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);
--> statement-breakpoint
CREATE TABLE `student_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `student_group_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`student_id` integer NOT NULL,
	`joined_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`group_id`) REFERENCES `student_groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `report_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`description` text,
	`content` text,
	`status` text DEFAULT 'Active',
	`last_modified` text DEFAULT CURRENT_TIMESTAMP
);
