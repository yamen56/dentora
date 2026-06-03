"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  instructorRegisterSchema,
  studentRegisterSchema,
  type InstructorRegisterInput,
  type StudentRegisterInput,
} from "@/lib/validations";

const KNOWN_ERRORS = ["emailTaken"];

type SubmitPayload =
  | (StudentRegisterInput & { role: "STUDENT" })
  | (InstructorRegisterInput & { role: "INSTRUCTOR" });

export function RegisterForm() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const router = useRouter();
  const [tab, setTab] = useState<"STUDENT" | "INSTRUCTOR">("STUDENT");
  const [loading, setLoading] = useState(false);

  const studentForm = useForm<StudentRegisterInput>({
    resolver: zodResolver(studentRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      university: "",
    },
  });
  const instructorForm = useForm<InstructorRegisterInput>({
    resolver: zodResolver(instructorRegisterSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", bio: "" },
  });

  function fieldError(message?: string) {
    if (!message) return null;
    // zod messages are translation keys under auth.errors
    const key = `errors.${message}`;
    return <p className="text-xs text-destructive">{t(key as never)}</p>;
  }

  async function submit(payload: SubmitPayload) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const code = KNOWN_ERRORS.includes(data?.error) ? data.error : "generic";
        toast.error(t(`errors.${code}` as never));
        return;
      }

      if (payload.role === "INSTRUCTOR") {
        toast.success(t("instructorRegisterSuccess"));
        router.push("/login");
        return;
      }

      // Auto sign-in newly registered students
      const signRes = await signIn("credentials", {
        redirect: false,
        email: payload.email,
        password: payload.password,
      });
      toast.success(t("registerSuccess"));
      if (signRes?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>{t("registerTitle")}</CardTitle>
        <CardDescription>{t("registerSubtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "STUDENT" | "INSTRUCTOR")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="STUDENT">{t("student")}</TabsTrigger>
            <TabsTrigger value="INSTRUCTOR">{t("instructor")}</TabsTrigger>
          </TabsList>

          {/* Student registration */}
          <TabsContent value="STUDENT">
            <form
              onSubmit={studentForm.handleSubmit((v) =>
                submit({ ...v, role: "STUDENT" }),
              )}
              className="space-y-4 pt-2"
            >
              <div className="space-y-2">
                <Label htmlFor="s-name">{t("fullName")}</Label>
                <Input id="s-name" {...studentForm.register("name")} />
                {fieldError(studentForm.formState.errors.name?.message)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-email">{t("email")}</Label>
                <Input
                  id="s-email"
                  type="email"
                  {...studentForm.register("email")}
                />
                {fieldError(studentForm.formState.errors.email?.message)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-phone">{t("phone")}</Label>
                <Input id="s-phone" {...studentForm.register("phone")} />
                {fieldError(studentForm.formState.errors.phone?.message)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-password">{t("password")}</Label>
                <Input
                  id="s-password"
                  type="password"
                  {...studentForm.register("password")}
                />
                {fieldError(studentForm.formState.errors.password?.message)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-university">
                  {t("university")}{" "}
                  <span className="text-muted-foreground">({tc("optional")})</span>
                </Label>
                <Input id="s-university" {...studentForm.register("university")} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {loading ? t("registering") : t("signUp")}
              </Button>
            </form>
          </TabsContent>

          {/* Instructor registration */}
          <TabsContent value="INSTRUCTOR">
            <form
              onSubmit={instructorForm.handleSubmit((v) =>
                submit({ ...v, role: "INSTRUCTOR" }),
              )}
              className="space-y-4 pt-2"
            >
              <div className="space-y-2">
                <Label htmlFor="i-name">{t("fullName")}</Label>
                <Input id="i-name" {...instructorForm.register("name")} />
                {fieldError(instructorForm.formState.errors.name?.message)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="i-email">{t("email")}</Label>
                <Input
                  id="i-email"
                  type="email"
                  {...instructorForm.register("email")}
                />
                {fieldError(instructorForm.formState.errors.email?.message)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="i-phone">{t("phone")}</Label>
                <Input id="i-phone" {...instructorForm.register("phone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="i-password">{t("password")}</Label>
                <Input
                  id="i-password"
                  type="password"
                  {...instructorForm.register("password")}
                />
                {fieldError(instructorForm.formState.errors.password?.message)}
              </div>
              <div className="space-y-2">
                <Label htmlFor="i-bio">{t("bio")}</Label>
                <Textarea
                  id="i-bio"
                  rows={4}
                  placeholder={t("bioPlaceholder")}
                  {...instructorForm.register("bio")}
                />
                {fieldError(instructorForm.formState.errors.bio?.message)}
              </div>
              <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                {t("instructorNote")}
              </p>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {loading ? t("registering") : t("signUp")}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="pt-4 text-center text-sm text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {t("signIn")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
