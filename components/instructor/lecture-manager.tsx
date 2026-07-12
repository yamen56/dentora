"use client";

import { useEffect, useState } from "react";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  FileText,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Video,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MediaUpload } from "@/components/instructor/media-upload";
import {
  examPeriods,
  lectureFormSchema,
  type LectureFormValues,
} from "@/lib/validations";
import { formatDuration } from "@/lib/utils";

export interface LectureRow {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  videoPublicId: string | null;
  pdfUrl: string | null;
  pdfPublicId: string | null;
  duration: number;
  isPreview: boolean;
  examPeriod: (typeof examPeriods)[number] | null;
  order: number;
}

function SortableLecture({
  lecture,
  index,
  onEdit,
  onDelete,
}: {
  lecture: LectureRow;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const tp = useTranslations("examPeriod");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lecture.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-lg border bg-card p-3 ${
        isDragging ? "opacity-60 shadow-lg" : ""
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <span className="w-6 text-center text-sm font-medium text-muted-foreground">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{lecture.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {lecture.videoUrl && (
            <span className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              {lecture.duration ? formatDuration(lecture.duration) : "video"}
            </span>
          )}
          {lecture.pdfUrl && (
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              PDF
            </span>
          )}
          {lecture.isPreview && <Badge variant="outline">preview</Badge>}
          {lecture.examPeriod && (
            <Badge variant="secondary">{tp(lecture.examPeriod)}</Badge>
          )}
        </div>
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-destructive"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function LectureManager({
  courseId,
  initialLectures,
}: {
  courseId: string;
  initialLectures: LectureRow[];
}) {
  const t = useTranslations("instructor");
  const tp = useTranslations("examPeriod");
  const [lectures, setLectures] = useState<LectureRow[]>(initialLectures);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LectureRow | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<LectureFormValues>({
    resolver: zodResolver(lectureFormSchema),
    defaultValues: {
      title: "",
      description: "",
      videoUrl: "",
      videoPublicId: "",
      pdfUrl: "",
      pdfPublicId: "",
      duration: 0,
      isPreview: false,
      examPeriod: "NONE",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: editing?.title ?? "",
        description: editing?.description ?? "",
        videoUrl: editing?.videoUrl ?? "",
        videoPublicId: editing?.videoPublicId ?? "",
        pdfUrl: editing?.pdfUrl ?? "",
        pdfPublicId: editing?.pdfPublicId ?? "",
        duration: editing?.duration ?? 0,
        isPreview: editing?.isPreview ?? false,
        examPeriod: editing?.examPeriod ?? "NONE",
      });
    }
  }, [open, editing, reset]);

  async function persistOrder(items: LectureRow[]) {
    await fetch(`/api/courses/${courseId}/lectures/reorder`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ order: items.map((i) => i.id) }),
    }).catch(() => {});
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLectures((prev) => {
        const oldIndex = prev.findIndex((l) => l.id === active.id);
        const newIndex = prev.findIndex((l) => l.id === over.id);
        const next = arrayMove(prev, oldIndex, newIndex);
        persistOrder(next);
        return next;
      });
    }
  }

  async function onSubmit(values: LectureFormValues) {
    const url = editing
      ? `/api/lectures/${editing.id}`
      : `/api/courses/${courseId}/lectures`;
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...values,
        examPeriod: values.examPeriod === "NONE" ? null : values.examPeriod,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error("Could not save lecture. A title and a video are recommended.");
      return;
    }
    const saved: LectureRow = data.lecture;
    setLectures((prev) =>
      editing ? prev.map((l) => (l.id === saved.id ? saved : l)) : [...prev, saved],
    );
    toast.success(t("lectureSaved"));
    setOpen(false);
    setEditing(null);
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this lecture?")) return;
    const res = await fetch(`/api/lectures/${id}`, { method: "DELETE" });
    if (res.ok) {
      setLectures((prev) => prev.filter((l) => l.id !== id));
      toast.success(t("lectureDeleted"));
    }
  }

  const videoUrl = watch("videoUrl") ?? "";
  const pdfUrl = watch("pdfUrl") ?? "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("dragToReorder")}</p>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          {t("addLecture")}
        </Button>
      </div>

      {lectures.length === 0 ? (
        <p className="rounded-lg border border-dashed py-12 text-center text-muted-foreground">
          {t("noLectures")}
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={lectures.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {lectures.map((lecture, index) => (
                <SortableLecture
                  key={lecture.id}
                  lecture={lecture}
                  index={index}
                  onEdit={() => {
                    setEditing(lecture);
                    setOpen(true);
                  }}
                  onDelete={() => remove(lecture.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit lecture" : t("addLecture")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="l-title">{t("lectureTitle")}</Label>
              <Input id="l-title" {...register("title")} />
            </div>
            <div className="space-y-2">
              <Label>{t("uploadVideo")}</Label>
              <MediaUpload
                resourceType="video"
                accept="video/*"
                value={videoUrl}
                onChange={(v) => {
                  setValue("videoUrl", v.url);
                  setValue("videoPublicId", v.publicId);
                  if (v.duration) setValue("duration", v.duration);
                }}
                label={t("uploadVideo")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("uploadPdf")}</Label>
              <MediaUpload
                resourceType="raw"
                accept="application/pdf"
                value={pdfUrl}
                onChange={(v) => {
                  setValue("pdfUrl", v.url);
                  setValue("pdfPublicId", v.publicId);
                }}
                label={t("uploadPdf")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="l-duration">Duration (sec)</Label>
                <Input
                  id="l-duration"
                  type="number"
                  min={0}
                  {...register("duration", { valueAsNumber: true })}
                />
              </div>
              <div className="space-y-2">
                <Label>{tp("label")}</Label>
                <Select
                  value={watch("examPeriod")}
                  onValueChange={(v) =>
                    setValue("examPeriod", v as LectureFormValues["examPeriod"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">{tp("none")}</SelectItem>
                    {examPeriods.map((p) => (
                      <SelectItem key={p} value={p}>
                        {tp(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="l-preview"
                checked={watch("isPreview")}
                onCheckedChange={(v) => setValue("isPreview", v)}
              />
              <Label htmlFor="l-preview">Free preview</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="l-desc">Description</Label>
              <Textarea id="l-desc" rows={3} {...register("description")} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              Save lecture
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
