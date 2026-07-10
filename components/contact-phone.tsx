import { MessageCircle } from "lucide-react";

import { waPhoneHref } from "@/lib/utils";

/**
 * Primary contact rendering for admin surfaces: the phone number as a
 * WhatsApp deep link (opens a chat directly). Falls back to a muted dash
 * when the user has no phone on file (possible for instructors/admins).
 */
export function ContactPhone({ phone }: { phone: string | null | undefined }) {
  if (!phone) return <span className="text-muted-foreground">—</span>;
  return (
    <a
      href={waPhoneHref(phone)}
      target="_blank"
      rel="noopener noreferrer"
      dir="ltr"
      className="inline-flex items-center gap-1.5 font-medium text-emerald-700 hover:underline dark:text-emerald-400"
      title="WhatsApp"
    >
      <MessageCircle className="h-3.5 w-3.5 shrink-0" />
      {phone}
    </a>
  );
}
