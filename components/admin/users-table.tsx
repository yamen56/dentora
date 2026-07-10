"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserActions } from "@/components/admin/user-actions";
import { ContactPhone } from "@/components/contact-phone";

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "STUDENT" | "INSTRUCTOR" | "ADMIN";
  isActive: boolean;
  joined: string; // pre-formatted for the current locale
}

export function UsersTable({ users }: { users: AdminUserRow[] }) {
  const t = useTranslations("admin");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string>("ALL");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (role !== "ALL" && u.role !== role) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? "").replace(/\D/g, "").includes(q.replace(/\D/g, "") || q)
      );
    });
  }, [users, query, role]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchUsers")}
            className="ps-9"
          />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("allRoles")}</SelectItem>
            <SelectItem value="STUDENT">STUDENT</SelectItem>
            <SelectItem value="INSTRUCTOR">INSTRUCTOR</SelectItem>
            <SelectItem value="ADMIN">ADMIN</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-muted-foreground">
          {t("noUsersFound")}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("phone")}</TableHead>
              <TableHead>{t("role")}</TableHead>
              <TableHead>{t("joined")}</TableHead>
              <TableHead className="text-end">{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </TableCell>
                <TableCell>
                  <ContactPhone phone={u.phone} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{u.role}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {u.joined}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    {!u.isActive && (
                      <Badge variant="destructive">{t("inactive")}</Badge>
                    )}
                    {u.role !== "ADMIN" && (
                      <UserActions
                        id={u.id}
                        name={u.name}
                        role={u.role}
                        isActive={u.isActive}
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
