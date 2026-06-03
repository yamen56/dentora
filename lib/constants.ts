export const ROLES = ["STUDENT", "INSTRUCTOR", "ADMIN"] as const;
export type AppRole = (typeof ROLES)[number];

export const LANGUAGES = [
  { value: "EN", labelEn: "English", labelAr: "الإنجليزية" },
  { value: "AR", labelEn: "Arabic", labelAr: "العربية" },
] as const;

export const DIFFICULTIES = [
  { value: "BEGINNER", labelEn: "Beginner", labelAr: "مبتدئ" },
  { value: "INTERMEDIATE", labelEn: "Intermediate", labelAr: "متوسط" },
  { value: "ADVANCED", labelEn: "Advanced", labelAr: "متقدم" },
] as const;

export const QUESTION_TYPES = [
  { value: "MCQ", labelEn: "Multiple choice", labelAr: "اختيار من متعدد" },
  { value: "SHORT", labelEn: "Short answer", labelAr: "إجابة قصيرة" },
] as const;

export const APP_NAME = "Dentora";

/** Map a role to the home route for that role. Pure — safe to import on the client. */
export function roleHome(role: string): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "INSTRUCTOR":
      return "/instructor";
    default:
      return "/dashboard";
  }
}
