import { Node, mergeAttributes } from "@tiptap/core";

/**
 * The Why Medicine study-note design system, as real editor nodes.
 *
 * These mirror the components in the branded study-note PDFs (callout boxes,
 * card grids, figure captions). Because they are schema nodes — not styling
 * sprinkled on text — a document keeps its structure through save, reload,
 * HTML round-trip and PDF export, and every block stays editable like normal
 * text. The parseHTML rules also let a study-note HTML file be imported back
 * into the editor without losing its layout.
 */

export type CalloutVariant =
  | "doctorsNote"
  | "highYield"
  | "remember"
  | "keyConcept";

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "highYield" as CalloutVariant,
        parseHTML: (el) => el.getAttribute("data-variant") ?? "highYield",
        renderHTML: (attrs) => ({ "data-variant": attrs.variant }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-callout": "" }),
      0,
    ];
  },
});

/** A row of 2–3 definition cards (the white bordered boxes in the notes). */
export const CardGrid = Node.create({
  name: "cardGrid",
  group: "block",
  content: "noteCard+",

  parseHTML() {
    return [{ tag: "div[data-card-grid]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-card-grid": "" }),
      0,
    ];
  },
});

export const NoteCard = Node.create({
  name: "noteCard",
  content: "block+",
  defining: true,

  parseHTML() {
    return [{ tag: "div[data-card]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-card": "" }), 0];
  },
});

/** "Fig 1 — caption" line under a diagram or card row. */
export const FigCaption = Node.create({
  name: "figCaption",
  group: "block",
  content: "inline*",

  parseHTML() {
    return [{ tag: "figcaption" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["figcaption", mergeAttributes(HTMLAttributes), 0];
  },
});

export const studyNoteNodes = [Callout, CardGrid, NoteCard, FigCaption];

/** Content templates used by the "Insert block" menu. */
export function calloutContent(variant: CalloutVariant, text: string) {
  return {
    type: "callout",
    attrs: { variant },
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  };
}

export function cardGridContent(count: number, cardTitle: string) {
  return {
    type: "cardGrid",
    content: Array.from({ length: count }, (_, i) => ({
      type: "noteCard",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              marks: [{ type: "bold" }],
              text: `${cardTitle} ${i + 1}`,
            },
          ],
        },
        { type: "paragraph" },
      ],
    })),
  };
}
