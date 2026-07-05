// Predefined medical-school categories. Admins can add more at runtime;
// these are the defaults inserted by `prisma db seed`.
export const DEFAULT_CATEGORIES: {
  slug: string;
  nameEn: string;
  nameAr: string;
}[] = [
  { slug: "anatomy", nameEn: "Anatomy", nameAr: "التشريح" },
  { slug: "physiology", nameEn: "Physiology", nameAr: "علم وظائف الأعضاء" },
  { slug: "biochemistry", nameEn: "Biochemistry", nameAr: "الكيمياء الحيوية" },
  { slug: "pathology", nameEn: "Pathology", nameAr: "علم الأمراض" },
  { slug: "pharmacology", nameEn: "Pharmacology", nameAr: "علم الأدوية" },
  { slug: "microbiology", nameEn: "Microbiology", nameAr: "علم الأحياء الدقيقة" },
  {
    slug: "internal-medicine",
    nameEn: "Internal Medicine",
    nameAr: "الطب الباطني",
  },
  { slug: "surgery", nameEn: "Surgery", nameAr: "الجراحة" },
  { slug: "pediatrics", nameEn: "Pediatrics", nameAr: "طب الأطفال" },
  {
    slug: "obstetrics-gynecology",
    nameEn: "Obstetrics & Gynecology",
    nameAr: "النساء والتوليد",
  },
  { slug: "radiology", nameEn: "Radiology", nameAr: "الأشعة" },
  { slug: "clinical-skills", nameEn: "Clinical Skills", nameAr: "المهارات السريرية" },
  { slug: "other", nameEn: "Other", nameAr: "أخرى" },
];
