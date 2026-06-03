import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  instructorRegisterSchema,
  studentRegisterSchema,
} from "@/lib/validations";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit registrations per IP
  const ip = getClientIp(req);
  const rl = rateLimit(`register:${ip}`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "rateLimited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "validation" }, { status: 400 });
  }

  const role =
    (body as { role?: string })?.role === "INSTRUCTOR"
      ? "INSTRUCTOR"
      : "STUDENT";

  let createData: Prisma.UserCreateInput;

  if (role === "INSTRUCTOR") {
    const parsed = instructorRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const passwordHash = await bcrypt.hash(d.password, 12);
    createData = {
      name: d.name.trim(),
      email: d.email.toLowerCase().trim(),
      passwordHash,
      role: "INSTRUCTOR",
      phone: d.phone ? d.phone : null,
      bio: d.bio,
      instructorStatus: "PENDING",
      isActive: true,
    };
  } else {
    const parsed = studentRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const passwordHash = await bcrypt.hash(d.password, 12);
    createData = {
      name: d.name.trim(),
      email: d.email.toLowerCase().trim(),
      passwordHash,
      role: "STUDENT",
      phone: d.phone,
      university: d.university ? d.university : null,
      isActive: true,
    };
  }

  try {
    await prisma.user.create({ data: createData });
  } catch (e) {
    // Unique constraint (email already exists)
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return NextResponse.json({ error: "emailTaken" }, { status: 409 });
    }
    console.error("register error", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, role }, { status: 201 });
}
