"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Baseline,
  Bold,
  ChevronDown,
  Columns2,
  Columns3,
  Eraser,
  FileCode,
  FileDown,
  FileUp,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListChecks,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Redo2,
  Search,
  Sparkles,
  Strikethrough,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Table as TableIcon,
  Underline,
  Undo2,
  Unlink,
  Upload,
  X,
} from "lucide-react";

import { useCloudinaryUpload } from "@/lib/use-cloudinary-upload";
import {
  calloutContent,
  cardGridContent,
  studyNoteNodes,
  type CalloutVariant,
} from "@/lib/study-note-nodes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const TEXT_COLORS = [
  { name: "default", value: "" },
  { name: "gray", value: "#6b7280" },
  { name: "red", value: "#dc2626" },
  { name: "orange", value: "#ea580c" },
  { name: "amber", value: "#d97706" },
  { name: "green", value: "#16a34a" },
  { name: "teal", value: "#0d9488" },
  { name: "blue", value: "#2563eb" },
  { name: "purple", value: "#9333ea" },
  { name: "pink", value: "#db2777" },
];

const HIGHLIGHT_COLORS = [
  { name: "yellow", value: "#fef08a" },
  { name: "green", value: "#bbf7d0" },
  { name: "blue", value: "#bfdbfe" },
  { name: "pink", value: "#fbcfe8" },
  { name: "orange", value: "#fed7aa" },
];

const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28", "32"];

const FONT_FAMILIES = [
  { name: "Arial", value: "Arial, Helvetica, sans-serif" },
  { name: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { name: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { name: "Courier New", value: "'Courier New', Courier, monospace" },
  { name: "Cairo", value: "Cairo, 'Segoe UI', Tahoma, sans-serif" },
];

const LINE_HEIGHTS = ["1", "1.15", "1.5", "1.65", "2"];

/**
 * Styles shared by the PDF export and the standalone HTML export, so a note
 * looks the same on screen, on paper, and after an HTML round-trip.
 */
const PRINT_CSS = `
  @page { size: A4; margin: 18mm; }
  * { box-sizing: border-box; }
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif;
    color: #111827; line-height: 1.65; font-size: 11.5pt; margin: 0;
    counter-reset: whymed-section;
  }
  h1 { font-size: 22pt; margin: 0.6em 0 0.3em; line-height: 1.25; }
  h2 {
    font-size: 16pt; margin: 0.9em 0 0.4em; line-height: 1.3;
    counter-increment: whymed-section; display: flex; align-items: center; gap: 0.5em;
    page-break-after: avoid;
  }
  h2::before {
    content: counter(whymed-section, decimal-leading-zero);
    background: #d0102e; color: #fff; font-size: 0.62em; font-weight: 700;
    line-height: 1; padding: 0.38em 0.5em; border-radius: 6px; flex-shrink: 0;
  }
  h2:nth-of-type(even)::before { background: #7a2fb0; }
  h3 { font-size: 13pt; margin: 0.6em 0 0.3em; line-height: 1.35; }
  p { margin: 0.45em 0; }
  ul, ol { padding-inline-start: 1.5em; margin: 0.45em 0; }
  blockquote {
    border-inline-start: 3px solid #d0102e; margin: 0.8em 0;
    padding: 0.2em 1em; color: #374151; background: #f8fafc;
  }
  hr { border: none; border-top: 1.5px solid #d1d5db; margin: 1.2em 0; }
  img { max-width: 100%; height: auto; border-radius: 6px; }
  a { color: #d0102e; }
  table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
  th, td { border: 1px solid #9ca3af; padding: 6px 10px; vertical-align: top; }
  th { background: #f1f5f9; font-weight: 600; }
  code { background: #f1f5f9; border-radius: 4px; padding: 1px 5px; font-size: 0.9em; }
  pre { background: #f1f5f9; border-radius: 8px; padding: 12px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  mark { border-radius: 2px; padding: 0 2px; }
  ul[data-type="taskList"] { list-style: none; padding-inline-start: 0.2em; }
  ul[data-type="taskList"] li { display: flex; gap: 0.55em; align-items: flex-start; }
  ul[data-type="taskList"] li[data-checked="true"] > div { text-decoration: line-through; color: #9ca3af; }
  sub { vertical-align: sub; font-size: smaller; }
  sup { vertical-align: super; font-size: smaller; }

  /* Study-note blocks */
  [data-callout] {
    border-inline-start: 4px solid; border-radius: 10px;
    padding: 0.85em 1.05em; margin: 1em 0; page-break-inside: avoid;
  }
  [data-callout]::before {
    display: block; font-size: 0.7em; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; margin-bottom: 0.3em;
  }
  [data-callout] > *:last-child { margin-bottom: 0; }
  [data-callout][data-variant="doctorsNote"] { background: #fdf2f5; border-color: #d0102e; }
  [data-callout][data-variant="doctorsNote"]::before { content: "✚ Doctor's Note"; color: #d0102e; }
  [data-callout][data-variant="highYield"] { background: #fef8ec; border-color: #e0a020; }
  [data-callout][data-variant="highYield"]::before { content: "! High Yield"; color: #b8791a; }
  [data-callout][data-variant="remember"] { background: #eef2fb; border-color: #2f5fb0; }
  [data-callout][data-variant="remember"]::before { content: "★ Remember"; color: #2f5fb0; }
  [data-callout][data-variant="keyConcept"] { background: #f6effb; border-color: #7a2fb0; }
  [data-callout][data-variant="keyConcept"]::before { content: "◆ Key Concept"; color: #7a2fb0; }
  [data-card-grid] {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75em; margin: 1em 0; page-break-inside: avoid;
  }
  [data-card] {
    border: 1px solid #e2e0da; border-radius: 10px; padding: 0.85em 1em; background: #fff;
  }
  [data-card] > *:first-child { margin-top: 0; }
  [data-card] > *:last-child { margin-bottom: 0; }
  figcaption {
    text-align: center; font-size: 0.8em; font-style: italic;
    color: #6b7280; margin: 0.4em 0 1em;
  }
`;

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={cn("h-8 w-8 p-0", active && "bg-accent text-accent-foreground")}
    >
      {children}
    </Button>
  );
}

export interface DocumentData {
  id: string;
  title: string;
  content: object | null;
  dir: string;
}

export function DocumentEditor({ doc }: { doc: DocumentData }) {
  const t = useTranslations("docs");
  const [title, setTitle] = useState(doc.title);
  const [dir, setDir] = useState<"ltr" | "rtl">(doc.dir === "rtl" ? "rtl" : "ltr");
  const [status, setStatus] = useState<"saved" | "saving" | "dirty">("saved");
  // Re-render the toolbar on selection/content changes so active states track.
  const [, setTick] = useState(0);

  // Find & replace
  const [findOpen, setFindOpen] = useState(false);
  const [findTerm, setFindTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [matchInfo, setMatchInfo] = useState<string | null>(null);

  // Image upload straight into the document (public Cloudinary asset)
  const imageInputRef = useRef<HTMLInputElement>(null);
  const { upload: uploadAsset, uploading: uploadingImage } =
    useCloudinaryUpload();

  // Document import
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [importingPdf, setImportingPdf] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
      TextStyleKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Image,
      TableKit.configure({
        table: { resizable: true },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Subscript,
      Superscript,
      ...studyNoteNodes,
      CharacterCount,
      Placeholder.configure({ placeholder: t("placeholder") }),
    ],
    content: doc.content ?? "",
    editorProps: {
      attributes: {
        class: "whymed-doc focus:outline-none",
      },
    },
    onUpdate: () => {
      setStatus("dirty");
      scheduleSave();
    },
    onSelectionUpdate: () => setTick((n) => n + 1),
    onTransaction: () => setTick((n) => n + 1),
  });

  const save = useCallback(
    async (overrides?: { title?: string; dir?: "ltr" | "rtl" }) => {
      if (!editor) return;
      setStatus("saving");
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: overrides?.title ?? title,
          dir: overrides?.dir ?? dir,
          content: editor.getJSON(),
        }),
      });
      if (res.ok) {
        setStatus("saved");
      } else {
        setStatus("dirty");
        toast.error(t("saveFailed"));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, doc.id, title, dir],
  );

  const saveRef = useRef(save);
  saveRef.current = save;

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveRef.current(), 2500);
  }, []);

  // Ctrl/Cmd+S saves immediately
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Flush pending autosave timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(t("linkPrompt"), prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }

  function addImage() {
    if (!editor) return;
    const url = window.prompt(t("imagePrompt"));
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  }

  /**
   * Import a study-note HTML file. HTML is the lossless path: every block in
   * the design system has a parseHTML rule, so callouts, cards, figures and
   * tables come back as real editable nodes and export identically.
   */
  async function importHtmlFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (htmlInputRef.current) htmlInputRef.current.value = "";
    if (!file || !editor) return;
    try {
      const text = await file.text();
      // Keep only the body — a full page's <head>/<style> would be dropped by
      // the schema anyway and can confuse the parser.
      const bodyMatch = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      editor.commands.setContent(bodyMatch ? bodyMatch[1] : text);
      setStatus("dirty");
      scheduleSave();
      toast.success(t("importDone"));
    } catch {
      toast.error(t("importFailed"));
    }
  }

  /**
   * Import a PDF. A PDF stores positioned glyphs, not structure, so this
   * recovers the text (grouped into lines and paragraphs, with larger type
   * promoted to headings) — the layout and colours cannot come across, and
   * the instructor restyles with the study-note blocks.
   */
  async function importPdfFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (pdfInputRef.current) pdfInputRef.current.value = "";
    if (!file || !editor) return;

    setImportingPdf(true);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      const buf = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: buf }).promise;

      const blocks: { type: string; text: string }[] = [];
      let bodySize = 0;

      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();

        // Group text items into lines by their y position.
        const lines = new Map<number, { text: string; size: number }>();
        for (const item of content.items) {
          const it = item as { str: string; transform: number[] };
          if (!it.str?.trim()) continue;
          const y = Math.round(it.transform[5]);
          const size = Math.abs(it.transform[0]) || 10;
          const prev = lines.get(y);
          if (prev) {
            prev.text += (prev.text.endsWith(" ") ? "" : " ") + it.str;
            prev.size = Math.max(prev.size, size);
          } else {
            lines.set(y, { text: it.str, size });
          }
        }

        const ordered = [...lines.entries()]
          .sort((a, b) => b[0] - a[0]) // PDF y grows upward
          .map(([, v]) => ({ text: v.text.replace(/\s+/g, " ").trim(), size: v.size }))
          .filter((l) => l.text.length > 0);

        // Body size = the most common font size on the page.
        if (!bodySize && ordered.length) {
          const counts = new Map<number, number>();
          for (const l of ordered) {
            const k = Math.round(l.size);
            counts.set(k, (counts.get(k) ?? 0) + 1);
          }
          bodySize = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
        }

        for (const line of ordered) {
          const heading =
            bodySize > 0 && line.size >= bodySize * 1.25 && line.text.length < 90;
          blocks.push({
            type: heading ? "heading" : "paragraph",
            text: line.text,
          });
        }
      }

      if (blocks.length === 0) {
        toast.error(t("importNoText"));
        return;
      }

      // Merge consecutive body lines into paragraphs.
      const content: object[] = [];
      let buffer: string[] = [];
      const flush = () => {
        if (buffer.length === 0) return;
        content.push({
          type: "paragraph",
          content: [{ type: "text", text: buffer.join(" ") }],
        });
        buffer = [];
      };
      for (const b of blocks) {
        if (b.type === "heading") {
          flush();
          content.push({
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: b.text }],
          });
        } else {
          buffer.push(b.text);
          // A line ending in sentence punctuation closes the paragraph.
          if (/[.:;!?]$/.test(b.text)) flush();
        }
      }
      flush();

      editor.commands.setContent({ type: "doc", content });
      setStatus("dirty");
      scheduleSave();
      toast.success(t("importPdfDone"));
    } catch {
      toast.error(t("importFailed"));
    } finally {
      setImportingPdf(false);
    }
  }

  function insertCallout(variant: CalloutVariant) {
    editor
      ?.chain()
      .focus()
      .insertContent(calloutContent(variant, ""))
      .run();
  }

  async function uploadImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (!file || !editor) return;
    try {
      toast.info(t("uploadingImage"));
      const res = await uploadAsset(file, "image");
      editor.chain().focus().setImage({ src: res.url }).run();
    } catch {
      toast.error(t("saveFailed"));
    }
  }

  // ---- Find & replace (case-insensitive, per text node) ----
  function findMatches(term: string): { from: number; to: number }[] {
    if (!editor || !term) return [];
    const q = term.toLowerCase();
    const matches: { from: number; to: number }[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (!node.isText || !node.text) return;
      const text = node.text.toLowerCase();
      let i = text.indexOf(q);
      while (i !== -1) {
        matches.push({ from: pos + i, to: pos + i + term.length });
        i = text.indexOf(q, i + Math.max(q.length, 1));
      }
    });
    return matches;
  }

  function findNext() {
    if (!editor) return;
    const matches = findMatches(findTerm);
    if (matches.length === 0) {
      setMatchInfo(t("noMatches"));
      return;
    }
    const after = editor.state.selection.from;
    const idx = matches.findIndex((m) => m.from > after);
    const target = matches[idx === -1 ? 0 : idx];
    const shown = (idx === -1 ? 0 : idx) + 1;
    setMatchInfo(`${shown} / ${matches.length}`);
    editor
      .chain()
      .focus()
      .setTextSelection(target)
      .scrollIntoView()
      .run();
  }

  function replaceOne() {
    if (!editor || !findTerm) return;
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to);
    if (selected.toLowerCase() === findTerm.toLowerCase()) {
      editor
        .chain()
        .focus()
        .insertContentAt({ from, to }, replaceTerm)
        .run();
    }
    findNext();
  }

  function replaceAll() {
    if (!editor || !findTerm) return;
    const matches = findMatches(findTerm);
    if (matches.length === 0) {
      setMatchInfo(t("noMatches"));
      return;
    }
    let chain = editor.chain().focus();
    // Back to front so earlier positions stay valid.
    for (const m of [...matches].reverse()) {
      chain = chain.insertContentAt(m, replaceTerm);
    }
    chain.run();
    setMatchInfo(`0 / 0`);
  }

  function toggleDir() {
    const next = dir === "ltr" ? "rtl" : "ltr";
    setDir(next);
    save({ dir: next });
  }

  /**
   * The document, as a standalone HTML file with its styles inlined. This is
   * the file to re-import later: every block round-trips back into the editor
   * unchanged, so a note can be edited again and again without drift.
   */
  function documentHtml(): string {
    const html = editor?.getHTML() ?? "";
    return `<!doctype html>
<html dir="${dir}">
<head>
<meta charset="utf-8" />
<title>${title.replace(/</g, "&lt;")}</title>
<style>${PRINT_CSS}</style>
</head>
<body>${html}</body>
</html>`;
  }

  function exportHtml() {
    const blob = new Blob([documentHtml()], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "document"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    if (!editor) return;
    const html = editor.getHTML();
    const win = window.open("", "_blank");
    if (!win) {
      toast.error(t("popupBlocked"));
      return;
    }
    win.document.write(`<!doctype html>
<html dir="${dir}">
<head>
<meta charset="utf-8" />
<title>${title.replace(/</g, "&lt;")}</title>
<style>${PRINT_CSS}</style>
</head>
<body>${html}</body>
</html>`);
    win.document.close();
    win.focus();
    // Give the new window a moment to render (and load images) before printing.
    setTimeout(() => {
      win.print();
    }, 400);
  }

  if (!editor) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        {t("loadingEditor")}
      </div>
    );
  }

  const currentBlock = editor.isActive("heading", { level: 1 })
    ? "h1"
    : editor.isActive("heading", { level: 2 })
      ? "h2"
      : editor.isActive("heading", { level: 3 })
        ? "h3"
        : "p";

  const currentSize =
    (editor.getAttributes("textStyle").fontSize as string | undefined)?.replace(
      "px",
      "",
    ) ?? "16";

  const currentFont =
    (editor.getAttributes("textStyle").fontFamily as string | undefined) ??
    "default";
  const currentLineHeight =
    (editor.getAttributes("textStyle").lineHeight as string | undefined) ??
    "default";

  const words = editor.storage.characterCount.words();
  const chars = editor.storage.characterCount.characters();

  // Document outline (headings) for the side panel, click to jump.
  const outline: { level: number; text: string; pos: number }[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "heading") {
      outline.push({
        level: node.attrs.level as number,
        text: node.textContent || "…",
        pos,
      });
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/instructor">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("backToDocs")}
          </Link>
        </Button>
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setStatus("dirty");
            scheduleSave();
          }}
          onBlur={() => {
            if (statusRef.current === "dirty") save();
          }}
          className="h-9 w-64 font-semibold sm:w-80"
          placeholder={t("untitled")}
        />
        <span
          className={cn(
            "text-xs",
            status === "saved" ? "text-muted-foreground" : "text-amber-600",
          )}
        >
          {status === "saved"
            ? t("saved")
            : status === "saving"
              ? t("saving")
              : t("unsaved")}
        </span>
        <div className="ms-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={importingPdf}
              >
                {importingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileUp className="h-4 w-4" />
                )}
                {t("import")}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuItem onClick={() => htmlInputRef.current?.click()}>
                <div>
                  <p className="font-medium">{t("importHtml")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("importHtmlHint")}
                  </p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => pdfInputRef.current?.click()}>
                <div>
                  <p className="font-medium">{t("importPdf")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("importPdfHint")}
                  </p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="button" variant="outline" size="sm" onClick={toggleDir}>
            {dir === "ltr" ? t("dirLtr") : t("dirRtl")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={exportHtml}>
            <FileCode className="h-4 w-4" />
            {t("exportHtml")}
          </Button>
          <Button type="button" size="sm" onClick={exportPdf}>
            <FileDown className="h-4 w-4" />
            {t("downloadPdf")}
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-16 z-30 flex flex-wrap items-center gap-1 rounded-xl border bg-card p-2 shadow-sm">
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          label={t("undo")}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          label={t("redo")}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Block type */}
        <Select
          value={currentBlock}
          onValueChange={(v) => {
            const chain = editor.chain().focus();
            if (v === "p") chain.setParagraph().run();
            else
              chain
                .toggleHeading({ level: Number(v[1]) as 1 | 2 | 3 })
                .run();
          }}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            {currentBlock === "p"
              ? t("paragraph")
              : t(`heading${currentBlock[1]}` as "heading1")}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="p">{t("paragraph")}</SelectItem>
            <SelectItem value="h1">{t("heading1")}</SelectItem>
            <SelectItem value="h2">{t("heading2")}</SelectItem>
            <SelectItem value="h3">{t("heading3")}</SelectItem>
          </SelectContent>
        </Select>

        {/* Font family */}
        <Select
          value={currentFont}
          onValueChange={(v) =>
            v === "default"
              ? editor.chain().focus().unsetFontFamily().run()
              : editor.chain().focus().setFontFamily(v).run()
          }
        >
          <SelectTrigger className="h-8 w-28 text-xs" title={t("font")}>
            <span className="truncate">
              {FONT_FAMILIES.find((f) => f.value === currentFont)?.name ??
                t("fontDefault")}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">{t("fontDefault")}</SelectItem>
            {FONT_FAMILIES.map((f) => (
              <SelectItem key={f.name} value={f.value}>
                <span style={{ fontFamily: f.value }}>{f.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Font size */}
        <Select
          value={FONT_SIZES.includes(currentSize) ? currentSize : "16"}
          onValueChange={(v) =>
            editor.chain().focus().setFontSize(`${v}px`).run()
          }
        >
          <SelectTrigger className="h-8 w-16 text-xs">
            {currentSize}
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Line spacing */}
        <Select
          value={currentLineHeight}
          onValueChange={(v) =>
            v === "default"
              ? editor.chain().focus().unsetLineHeight().run()
              : editor.chain().focus().setLineHeight(v).run()
          }
        >
          <SelectTrigger className="h-8 w-16 text-xs" title={t("lineHeight")}>
            {currentLineHeight === "default" ? "1.65" : currentLineHeight}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">{t("fontDefault")}</SelectItem>
            {LINE_HEIGHTS.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          label={t("bold")}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          label={t("italic")}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          label={t("underline")}
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          label={t("strikethrough")}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSubscript().run()}
          active={editor.isActive("subscript")}
          label={t("subscript")}
        >
          <SubscriptIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleSuperscript().run()}
          active={editor.isActive("superscript")}
          label={t("superscript")}
        >
          <SuperscriptIcon className="h-4 w-4" />
        </ToolbarButton>

        {/* Text color */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-0.5 px-1.5"
              title={t("textColor")}
            >
              <Baseline
                className="h-4 w-4"
                style={{
                  color:
                    (editor.getAttributes("textStyle").color as string) ||
                    undefined,
                }}
              />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="grid grid-cols-5 gap-1 p-2">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                title={c.name}
                onClick={() =>
                  c.value
                    ? editor.chain().focus().setColor(c.value).run()
                    : editor.chain().focus().unsetColor().run()
                }
                className="flex h-7 w-7 items-center justify-center rounded-md border text-sm font-bold hover:bg-accent"
                style={{ color: c.value || "inherit" }}
              >
                A
              </button>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Highlight */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-0.5 px-1.5"
              title={t("highlight")}
            >
              <Highlighter className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="flex gap-1 p-2">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                title={c.name}
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .toggleHighlight({ color: c.value })
                    .run()
                }
                className="h-7 w-7 rounded-md border"
                style={{ backgroundColor: c.value }}
              />
            ))}
            <button
              type="button"
              title={t("clearFormatting")}
              onClick={() => editor.chain().focus().unsetHighlight().run()}
              className="flex h-7 w-7 items-center justify-center rounded-md border hover:bg-accent"
            >
              <Eraser className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          label={t("alignLeft")}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          label={t("alignCenter")}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          active={editor.isActive({ textAlign: "right" })}
          label={t("alignRight")}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
          active={editor.isActive({ textAlign: "justify" })}
          label={t("alignJustify")}
        >
          <AlignJustify className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          label={t("bulletList")}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          label={t("numberedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          active={editor.isActive("taskList")}
          label={t("taskList")}
        >
          <ListChecks className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          label={t("quote")}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          label={t("horizontalRule")}
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Table menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive("table") ? "secondary" : "ghost"}
              size="sm"
              className="h-8 gap-0.5 px-1.5"
              title={t("table")}
            >
              <TableIcon className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
            >
              {t("insertTable")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!editor.isActive("table")}
              onClick={() => editor.chain().focus().addRowAfter().run()}
            >
              {t("addRow")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!editor.isActive("table")}
              onClick={() => editor.chain().focus().addColumnAfter().run()}
            >
              {t("addColumn")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!editor.isActive("table")}
              onClick={() => editor.chain().focus().deleteRow().run()}
            >
              {t("deleteRow")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!editor.isActive("table")}
              onClick={() => editor.chain().focus().deleteColumn().run()}
            >
              {t("deleteColumn")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!editor.isActive("table")}
              className="text-destructive"
              onClick={() => editor.chain().focus().deleteTable().run()}
            >
              {t("deleteTable")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Image: upload to Cloudinary or paste a URL */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-0.5 px-1.5"
              title={t("insertImage")}
              disabled={uploadingImage}
            >
              <ImageIcon className="h-4 w-4" />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
              <Upload className="me-2 h-4 w-4" />
              {t("uploadImage")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={addImage}>
              <LinkIcon className="me-2 h-4 w-4" />
              {t("imageFromUrl")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <ToolbarButton
          onClick={setLink}
          active={editor.isActive("link")}
          label={t("insertLink")}
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={!editor.isActive("link")}
          label={t("removeLink")}
        >
          <Unlink className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().unsetAllMarks().clearNodes().run()
          }
          label={t("clearFormatting")}
        >
          <Eraser className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => setFindOpen((v) => !v)}
          active={findOpen}
          label={t("findReplace")}
        >
          <Search className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Study-note blocks */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1 px-2 text-xs"
              title={t("insertBlock")}
            >
              <Sparkles className="h-4 w-4" />
              {t("insertBlock")}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem onClick={() => insertCallout("doctorsNote")}>
              <span className="me-2 text-[#d0102e]">✚</span>
              {t("calloutDoctor")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertCallout("highYield")}>
              <span className="me-2 text-[#b8791a]">!</span>
              {t("calloutHighYield")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertCallout("remember")}>
              <span className="me-2 text-[#2f5fb0]">★</span>
              {t("calloutRemember")}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertCallout("keyConcept")}>
              <span className="me-2 text-[#7a2fb0]">◆</span>
              {t("calloutKeyConcept")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertContent(cardGridContent(2, t("cardTitle")))
                  .run()
              }
            >
              <Columns2 className="me-2 h-4 w-4" />
              {t("cards2")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertContent(cardGridContent(3, t("cardTitle")))
                  .run()
              }
            >
              <Columns3 className="me-2 h-4 w-4" />
              {t("cards3")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertContent({
                    type: "figCaption",
                    content: [{ type: "text", text: t("figPlaceholder") }],
                  })
                  .run()
              }
            >
              <ImageIcon className="me-2 h-4 w-4" />
              {t("figCaption")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Find & replace panel */}
      {findOpen && (
        <div className="sticky top-[7.5rem] z-30 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-2 shadow-sm">
          <Input
            value={findTerm}
            onChange={(e) => {
              setFindTerm(e.target.value);
              setMatchInfo(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                findNext();
              }
            }}
            placeholder={t("findPlaceholder")}
            className="h-8 w-44 text-sm"
          />
          <Input
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            placeholder={t("replacePlaceholder")}
            className="h-8 w-44 text-sm"
          />
          <Button type="button" variant="outline" size="sm" onClick={findNext}>
            {t("findNext")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={replaceOne}>
            {t("replaceOne")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={replaceAll}>
            {t("replaceAll")}
          </Button>
          {matchInfo && (
            <span className="text-xs text-muted-foreground">{matchInfo}</span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ms-auto h-8 w-8"
            onClick={() => setFindOpen(false)}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={uploadImageFile}
      />
      <input
        ref={htmlInputRef}
        type="file"
        accept=".html,text/html"
        className="hidden"
        onChange={importHtmlFile}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={importPdfFile}
      />

      {/* Outline + page canvas */}
      <div className="flex gap-4">
        <aside className="sticky top-32 hidden max-h-[70vh] w-52 shrink-0 self-start overflow-y-auto rounded-xl border bg-card p-3 xl:block">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground rtl:tracking-normal">
            {t("outline")}
          </p>
          {outline.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("outlineEmpty")}</p>
          ) : (
            <div className="space-y-0.5">
              {outline.map((h, i) => (
                <button
                  key={`${h.pos}-${i}`}
                  type="button"
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .setTextSelection(h.pos + 1)
                      .scrollIntoView()
                      .run()
                  }
                  className={cn(
                    "block w-full truncate rounded px-2 py-1 text-start text-xs transition-colors hover:bg-accent",
                    h.level === 1 && "font-semibold",
                    h.level === 2 && "ps-4",
                    h.level >= 3 && "ps-6 text-muted-foreground",
                  )}
                >
                  {h.text}
                </button>
              ))}
            </div>
          )}
        </aside>

        <div className="min-w-0 flex-1 rounded-xl bg-muted/50 p-4 sm:p-8">
          <div
            dir={dir}
            className="mx-auto min-h-[29.7cm] w-full max-w-[21cm] rounded-md border bg-white p-[1.5cm] text-neutral-900 shadow-md sm:p-[2cm] dark:border-neutral-300"
            onClick={() => editor.chain().focus().run()}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      <p className="text-end text-xs text-muted-foreground">
        {t("wordCount", { words, chars })}
      </p>
    </div>
  );
}
