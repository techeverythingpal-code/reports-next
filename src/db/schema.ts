// Mirrors the tables created by the Laravel migrations in Reports/database/migrations.
// Column names are kept exactly as they are in the database (including the
// mixed casing like "Directorate_id"), so this app can run on the SAME
// database the Laravel app uses today, with no data migration.
import {
  bigint,
  boolean,
  date,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
};

// Admin accounts (Laravel "admin" guard). Log in with email.
export const users = mysqlTable("users", {
  id: bigint("id", { mode: "number", unsigned: true }).primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerifiedAt: timestamp("email_verified_at"),
  password: varchar("password", { length: 255 }).notNull(),
  rememberToken: varchar("remember_token", { length: 100 }),
  ...timestamps,
});

export const directorates = mysqlTable("directorates", {
  id: int("Directorate_id").primaryKey(),
  name: varchar("Directorate_Name", { length: 255 }),
  ...timestamps,
});

export const schools = mysqlTable("schools", {
  id: int("School_ID").primaryKey(),
  name: varchar("SchoolName", { length: 255 }),
  directorateId: int("directorate_id")
    .notNull()
    .references(() => directorates.id),
  ...timestamps,
});

// Supervisor accounts (Laravel "web" guard). Log in with SuperVisor_Name.
// IDs are entered manually (auto-increment was removed).
export const supervisors = mysqlTable("super_visors", {
  id: bigint("SuperVisor_id", { mode: "number", unsigned: true }).primaryKey(),
  name: varchar("SuperVisor_Name", { length: 255 }),
  major: varchar("SuperVisor_Major", { length: 255 }),
  directorateId: int("directorate_id")
    .notNull()
    .references(() => directorates.id),
  role: mysqlEnum("role", ["admin", "user"]).notNull().default("user"),
  password: varchar("password", { length: 255 }).notNull(),
  rememberToken: varchar("remember_token", { length: 100 }),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  ...timestamps,
});

export const teachers = mysqlTable("teacher_infos", {
  id: int("id", { unsigned: true }).primaryKey().autoincrement(),
  supervisorId: bigint("supervisor_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => supervisors.id, { onUpdate: "cascade" }),
  name: varchar("Teacher_Name", { length: 255 }).notNull(),
  teacherId: int("Teacher_id").notNull().unique(),
  schoolId: int("school_id")
    .notNull()
    .references(() => schools.id),
  hireDate: date("date", { mode: "string" }).notNull(), // تاريخ التعيين
  qualification: varchar("teacher_qualify", { length: 255 }).notNull(), // المؤهل
  major: varchar("teacher_major", { length: 255 }).notNull(), // التخصص
  supervisorNote: varchar("supervisor_note", { length: 255 }),
  academicYear: varchar("academic_year", { length: 255 }),
  ...timestamps,
});

// One row per teacher; teacher_id is the primary key and points at
// teacher_infos.Teacher_id (not teacher_infos.id).
export const teacherGrades = mysqlTable("teacher_grades", {
  teacherId: int("teacher_id")
    .primaryKey()
    .references(() => teachers.teacherId),
  score1: int("score1").notNull(),
  score2: int("score2").notNull(),
  score3: int("score3").notNull(),
  score4: int("score4").notNull(),
  score5: int("score5").notNull(),
  score6: int("score6").notNull(),
  score7: int("score7").notNull(),
  score8: int("score8").notNull(),
  score9: int("score9").notNull(),
  score10: int("score10").notNull(),
  score11: int("score11").notNull(),
  score12: int("score12").notNull(),
  score13: int("score13").notNull(),
  score14: int("score14").notNull(),
  score15: int("score15").notNull(),
  score16: int("score16").notNull(),
  score17: int("score17").notNull(),
  score18: int("score18").notNull(),
  score19: int("score19").notNull(),
  score20: int("score20").notNull(),
  score21: int("score21").notNull(),
  score22: int("score22").notNull(),
  total: int("total").notNull(),
  ...timestamps,
});

export const teacherJustifications = mysqlTable("teacher_justifications", {
  teacherId: int("teacher_id")
    .primaryKey()
    .references(() => teachers.teacherId),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  recommendations: text("recommendations"),
  preparerOpinion: text("preparer_opinion"),
  approverNotes: text("approver_notes"),
  ...timestamps,
});

export const directoratesRelations = relations(directorates, ({ many }) => ({
  schools: many(schools),
  supervisors: many(supervisors),
}));

export const schoolsRelations = relations(schools, ({ one, many }) => ({
  directorate: one(directorates, {
    fields: [schools.directorateId],
    references: [directorates.id],
  }),
  teachers: many(teachers),
}));

export const supervisorsRelations = relations(supervisors, ({ one, many }) => ({
  directorate: one(directorates, {
    fields: [supervisors.directorateId],
    references: [directorates.id],
  }),
  teachers: many(teachers),
}));

export const teachersRelations = relations(teachers, ({ one }) => ({
  supervisor: one(supervisors, {
    fields: [teachers.supervisorId],
    references: [supervisors.id],
  }),
  school: one(schools, {
    fields: [teachers.schoolId],
    references: [schools.id],
  }),
  grades: one(teacherGrades, {
    fields: [teachers.teacherId],
    references: [teacherGrades.teacherId],
  }),
  justification: one(teacherJustifications, {
    fields: [teachers.teacherId],
    references: [teacherJustifications.teacherId],
  }),
}));
