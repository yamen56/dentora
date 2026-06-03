import { z } from "zod";

const phoneRegex = /^[+]?[\d\s()-]{7,20}$/;

export const studentRegisterSchema = z.object({
  name: z.string().min(2, "nameTooShort").max(100),
  email: z.string().email("invalidEmail"),
  phone: z.string().regex(phoneRegex, "invalidPhone"),
  password: z.string().min(8, "passwordTooShort").max(100),
  university: z.string().max(150).optional().or(z.literal("")),
});

export const instructorRegisterSchema = z.object({
  name: z.string().min(2, "nameTooShort").max(100),
  email: z.string().email("invalidEmail"),
  phone: z.string().regex(phoneRegex, "invalidPhone").optional().or(z.literal("")),
  password: z.string().min(8, "passwordTooShort").max(100),
  bio: z.string().min(10, "bioTooShort").max(2000),
});

export const loginSchema = z.object({
  email: z.string().email("invalidEmail"),
  password: z.string().min(1, "passwordRequired"),
  remember: z.boolean().optional(),
});

export const courseSchema = z.object({
  titleEn: z.string().min(3).max(150),
  titleAr: z.string().min(3).max(150),
  descriptionEn: z.string().min(10).max(5000),
  descriptionAr: z.string().min(10).max(5000),
  categoryId: z.string().min(1),
  language: z.enum(["EN", "AR"]),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  thumbnail: z.string().url().optional().or(z.literal("")),
});

export const lectureSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  videoUrl: z.string().url().optional().or(z.literal("")),
  videoPublicId: z.string().optional().or(z.literal("")),
  pdfUrl: z.string().url().optional().or(z.literal("")),
  pdfPublicId: z.string().optional().or(z.literal("")),
  duration: z.coerce.number().min(0).default(0),
  isPreview: z.boolean().optional().default(false),
});

export const questionSchema = z
  .object({
    type: z.enum(["MCQ", "SHORT"]),
    questionText: z.string().min(3).max(2000),
    options: z.array(z.string().min(1)).optional(),
    correctAnswer: z.string().min(1),
    points: z.coerce.number().int().min(1).max(100).default(1),
    lectureId: z.string().nullable().optional(),
  })
  .refine(
    (data) =>
      data.type !== "MCQ" ||
      (Array.isArray(data.options) && data.options.length >= 2),
    { message: "mcqNeedsOptions", path: ["options"] },
  )
  .refine(
    (data) =>
      data.type !== "MCQ" ||
      !data.options ||
      data.options.includes(data.correctAnswer),
    { message: "correctMustBeOption", path: ["correctAnswer"] },
  );

export const quizSubmitSchema = z.object({
  courseId: z.string().min(1),
  lectureId: z.string().nullable().optional(),
  answers: z.record(z.string(), z.string()),
});

// A student applying for access to a course (optional message).
export const applicationSchema = z.object({
  note: z.string().max(1000).optional().or(z.literal("")),
});

// Reviewing an application (admin or the course's instructor).
export const applicationReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
});

// Admin directly enrolling a student into a course by email.
export const adminEnrollSchema = z.object({
  courseId: z.string().min(1),
  email: z.string().email("invalidEmail"),
});

export const categorySchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "slugFormat"),
  nameEn: z.string().min(2).max(80),
  nameAr: z.string().min(2).max(80),
});

// ── Client form schemas (no coerce/default → input type == output type, which
//    keeps react-hook-form's zodResolver typing happy) ──────────────────────
export const courseFormSchema = z.object({
  titleEn: z.string().min(3).max(150),
  titleAr: z.string().min(3).max(150),
  descriptionEn: z.string().min(10).max(5000),
  descriptionAr: z.string().min(10).max(5000),
  categoryId: z.string().min(1),
  language: z.enum(["EN", "AR"]),
  difficulty: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  thumbnail: z.string().url().optional().or(z.literal("")),
});
export type CourseFormValues = z.infer<typeof courseFormSchema>;

export const lectureFormSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  videoUrl: z.string().url().optional().or(z.literal("")),
  videoPublicId: z.string().optional().or(z.literal("")),
  pdfUrl: z.string().url().optional().or(z.literal("")),
  pdfPublicId: z.string().optional().or(z.literal("")),
  duration: z.number().min(0),
  isPreview: z.boolean(),
});
export type LectureFormValues = z.infer<typeof lectureFormSchema>;

export type StudentRegisterInput = z.infer<typeof studentRegisterSchema>;
export type InstructorRegisterInput = z.infer<typeof instructorRegisterSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type LectureInput = z.infer<typeof lectureSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
