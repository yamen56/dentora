import { getLocale, getTranslations } from "next-intl/server";
import { BookOpen, ClipboardList, GraduationCap, Users } from "lucide-react";

import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { InstructorActions } from "@/components/admin/instructor-actions";
import { UsersTable } from "@/components/admin/users-table";
import { AdminCourseActions } from "@/components/admin/admin-course-actions";
import { CategoryManager } from "@/components/admin/category-manager";
import { EnrollStudentForm } from "@/components/admin/enroll-student-form";
import { ApplicationActions } from "@/components/application-actions";
import { pick } from "@/lib/i18n-helpers";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const [
      userCount,
      courseCount,
      enrollCount,
      pendingAppCount,
      instructors,
      courses,
      users,
      categories,
      applications,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.courseApplication.count({ where: { status: "PENDING" } }),
      prisma.user.findMany({
        where: { role: "INSTRUCTOR" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.course.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          instructor: { select: { name: true } },
          category: true,
          _count: { select: { enrollments: true, lectures: true } },
        },
      }),
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.category.findMany({ orderBy: { nameEn: "asc" } }),
      prisma.courseApplication.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          user: { select: { name: true, email: true } },
          course: { select: { titleEn: true, titleAr: true } },
        },
      }),
    ]);
    return {
      userCount,
      courseCount,
      enrollCount,
      pendingAppCount,
      instructors,
      courses,
      users,
      categories,
      applications,
    };
  } catch {
    return {
      userCount: 0,
      courseCount: 0,
      enrollCount: 0,
      pendingAppCount: 0,
      instructors: [],
      courses: [],
      users: [],
      categories: [],
      applications: [],
    };
  }
}

export default async function AdminPage() {
  await requireRole("ADMIN");
  const t = await getTranslations("admin");
  const ta = await getTranslations("applications");
  const locale = await getLocale();
  const data = await getData();

  const fmtDate = new Intl.DateTimeFormat(
    locale === "ar" ? "ar-EG" : "en-US",
    { dateStyle: "medium" },
  );

  const stats = [
    { icon: Users, label: t("totalUsers"), value: data.userCount },
    { icon: BookOpen, label: t("totalCourses"), value: data.courseCount },
    {
      icon: GraduationCap,
      label: t("totalEnrollments"),
      value: data.enrollCount,
    },
    {
      icon: ClipboardList,
      label: ta("pendingApplications"),
      value: data.pendingAppCount,
    },
  ];

  const pending = data.instructors.filter(
    (i) => i.instructorStatus === "PENDING",
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t("title")}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="instructors">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="instructors">
            {t("instructors")}
            {pending.length > 0 && (
              <Badge variant="warning" className="ms-2">
                {pending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="applications">
            {ta("title")}
            {data.pendingAppCount > 0 && (
              <Badge variant="warning" className="ms-2">
                {data.pendingAppCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="courses">{t("courses")}</TabsTrigger>
          <TabsTrigger value="users">{t("users")}</TabsTrigger>
          <TabsTrigger value="categories">{t("categories")}</TabsTrigger>
        </TabsList>

        {/* Instructors */}
        <TabsContent value="instructors" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              {data.instructors.length === 0 ? (
                <p className="text-muted-foreground">{t("noPending")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("email")}</TableHead>
                      <TableHead>{t("joined")}</TableHead>
                      <TableHead className="text-end">{t("status")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.instructors.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{fmtDate.format(u.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <InstructorActions
                              id={u.id}
                              status={u.instructorStatus}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications */}
        <TabsContent value="applications" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{ta("addStudent")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                {ta("addStudentDesc")}
              </p>
              <EnrollStudentForm
                courses={data.courses.map((c) => ({
                  id: c.id,
                  titleEn: c.titleEn,
                  titleAr: c.titleAr,
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {ta("pendingApplications")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.applications.length === 0 ? (
                <p className="text-muted-foreground">{ta("noApplications")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{ta("applicant")}</TableHead>
                      <TableHead>{ta("courseLabel")}</TableHead>
                      <TableHead>{ta("note")}</TableHead>
                      <TableHead>{t("joined")}</TableHead>
                      <TableHead className="text-end">
                        {t("status")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.applications.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="font-medium">{a.user.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {a.user.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          {pick(locale, a.course.titleEn, a.course.titleAr)}
                        </TableCell>
                        <TableCell className="max-w-[16rem] truncate text-sm text-muted-foreground">
                          {a.note || "—"}
                        </TableCell>
                        <TableCell>{fmtDate.format(a.createdAt)}</TableCell>
                        <TableCell>
                          <ApplicationActions id={a.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Courses */}
        <TabsContent value="courses" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              {data.courses.length === 0 ? (
                <p className="text-muted-foreground">{t("courses")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("instructors")}</TableHead>
                      <TableHead>{t("lecturesCol")}</TableHead>
                      <TableHead>{t("enrollmentsCol")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead className="text-end">{t("courses")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.courses.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          {pick(locale, c.titleEn, c.titleAr)}
                        </TableCell>
                        <TableCell>{c.instructor.name}</TableCell>
                        <TableCell>{c._count.lectures}</TableCell>
                        <TableCell>{c._count.enrollments}</TableCell>
                        <TableCell>
                          <Badge
                            variant={c.isPublished ? "success" : "secondary"}
                          >
                            {c.isPublished ? t("approved") : t("pending")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <AdminCourseActions
                            id={c.id}
                            isPublished={c.isPublished}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              <UsersTable
                users={data.users.map((u) => ({
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  role: u.role,
                  isActive: u.isActive,
                  joined: fmtDate.format(u.createdAt),
                }))}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("manageCategories")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryManager initial={data.categories} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
