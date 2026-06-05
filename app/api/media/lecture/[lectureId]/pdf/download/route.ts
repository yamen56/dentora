import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

import { getApiUser, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { isEnrolled } from "@/lib/enroll";
import { cloudinaryConfigured, signedDeliveryUrl } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // pdf-lib needs the Node runtime

// Returns the lecture PDF with a tiled diagonal identity watermark stamped onto
// every page, as a download. The watermark pins the file to the specific
// student, so a leaked copy is traceable to them.
export async function GET(
  _req: Request,
  { params }: { params: { lectureId: string } },
) {
  const user = await getApiUser();
  if (!user) return json({ error: "unauthorized" }, 401);

  const lecture = await prisma.lecture.findUnique({
    where: { id: params.lectureId },
    include: { course: { select: { instructorId: true } } },
  });
  if (!lecture) return json({ error: "notFound" }, 404);

  const isOwner =
    lecture.course.instructorId === user.id || user.role === "ADMIN";
  const allowed =
    isOwner || lecture.isPreview || (await isEnrolled(user.id, lecture.courseId));
  if (!allowed) return json({ error: "forbidden" }, 403);

  let source: string | null = null;
  if (lecture.pdfPublicId && cloudinaryConfigured) {
    source = signedDeliveryUrl(lecture.pdfPublicId, "raw", 60 * 60);
  } else if (lecture.pdfUrl) {
    source = lecture.pdfUrl;
  }
  if (!source) return json({ error: "noPdf" }, 404);

  const upstream = await fetch(source);
  if (!upstream.ok) return json({ error: "fetchFailed" }, 502);
  const bytes = await upstream.arrayBuffer();

  // Build the watermark from the authenticated student's own identity (never
  // from the client, so it can't be spoofed). Standard PDF fonts only encode
  // Latin text, so we fall back to the email for non-Latin (e.g. Arabic) names.
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, phone: true },
  });
  const ascii = (s: string | null | undefined) =>
    (s ?? "").replace(/[^\x20-\x7E]/g, "").trim();
  const primary = ascii(dbUser?.name) || ascii(dbUser?.email);
  const text =
    [primary, ascii(dbUser?.phone)].filter(Boolean).join("   -   ") ||
    "Dentora";

  let out: Uint8Array;
  try {
    out = await watermarkPdf(bytes, text);
  } catch {
    return json({ error: "watermarkFailed" }, 500);
  }

  const filename =
    `${lecture.title || "lecture"}.pdf`.replace(/[^\w.\- ]+/g, "_");

  return new Response(out as BodyInit, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "private, no-store",
    },
  });
}

async function watermarkPdf(
  bytes: ArrayBuffer,
  text: string,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    const size = Math.max(10, Math.round(width * 0.018));
    const stepX = Math.max(200, width / 2.2);
    const stepY = Math.max(130, height / 5);
    for (let y = -stepY; y < height + stepY; y += stepY) {
      for (let x = -stepX; x < width + stepX; x += stepX) {
        page.drawText(text, {
          x,
          y,
          size,
          font,
          color: rgb(0.06, 0.09, 0.16),
          opacity: 0.12,
          rotate: degrees(30),
        });
      }
    }
  }

  return pdf.save();
}
