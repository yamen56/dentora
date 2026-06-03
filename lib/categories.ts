// Predefined dental-college categories. Admins can add more at runtime;
// these are the defaults inserted by `prisma db seed`.
export const DEFAULT_CATEGORIES: {
  slug: string;
  nameEn: string;
  nameAr: string;
}[] = [
  { slug: "anatomy", nameEn: "Anatomy", nameAr: "التشريح" },
  { slug: "oral-pathology", nameEn: "Oral Pathology", nameAr: "علم أمراض الفم" },
  { slug: "prosthodontics", nameEn: "Prosthodontics", nameAr: "التعويضات السنية" },
  { slug: "orthodontics", nameEn: "Orthodontics", nameAr: "تقويم الأسنان" },
  { slug: "endodontics", nameEn: "Endodontics", nameAr: "علاج جذور الأسنان" },
  { slug: "periodontics", nameEn: "Periodontics", nameAr: "أمراض اللثة" },
  { slug: "oral-surgery", nameEn: "Oral Surgery", nameAr: "جراحة الفم" },
  { slug: "dental-materials", nameEn: "Dental Materials", nameAr: "المواد السنية" },
  {
    slug: "pediatric-dentistry",
    nameEn: "Pediatric Dentistry",
    nameAr: "طب أسنان الأطفال",
  },
  { slug: "radiology", nameEn: "Radiology", nameAr: "الأشعة السنية" },
  { slug: "clinical-skills", nameEn: "Clinical Skills", nameAr: "المهارات السريرية" },
  { slug: "other", nameEn: "Other", nameAr: "أخرى" },
];
