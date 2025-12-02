const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random()}`;

const normalizeBlocks = (blocks: any[] = [], sectionIdx: number) =>
  blocks.map((b: any, bIdx: number) => ({
    id: b?.id || `block-${sectionIdx}-${bIdx}-${createId()}`,
    type: b?.type === "video" ? "video" : "text",
    content: typeof b?.content === "string" ? b.content : "",
    url: b?.url ?? null,
  }));

const normalizeSections = (sections: any[], fallbackTitle: string) =>
  sections.map((section: any, idx: number) => ({
    id: section?.id || `section-${idx}-${createId()}`,
    title: section?.title || fallbackTitle || `Section ${idx + 1}`,
    number: typeof section?.number === "number" ? section.number : idx + 1,
    blocks: Array.isArray(section?.blocks)
      ? normalizeBlocks(section.blocks, idx)
      : [],
  }));

/**
 * Normalize any legacy/current content shape into { sections: [...] }.
 */
export const normalizeContent = (
  body: any,
  fallbackTitle = "Lesson"
): { sections: Array<{
  id: string;
  title: string;
  number: number;
  blocks: Array<{
    id: string;
    type: "text" | "video";
    content: string;
    url: string | null;
  }>;
}> } => {
  if (!body) {
    return { sections: [] };
  }

  // Already in modern shape { sections: [...] }
  if (Array.isArray(body.sections)) {
    return { sections: normalizeSections(body.sections, fallbackTitle) };
  }

  // Legacy array of sections or array of blocks
  if (Array.isArray(body)) {
    if (body.length > 0 && (body[0]?.blocks || body[0]?.title)) {
      return { sections: normalizeSections(body, fallbackTitle) };
    }

    // Legacy flat blocks array -> wrap into single section
    return {
      sections: normalizeSections(
        [
          {
            id: createId(),
            title: fallbackTitle || "Lesson",
            number: 1,
            blocks: body,
          },
        ],
        fallbackTitle
      ),
    };
  }

  // Single section object -> wrap
  if (body && typeof body === "object") {
    return {
      sections: normalizeSections([body], fallbackTitle),
    };
  }

  return { sections: [] };
};
