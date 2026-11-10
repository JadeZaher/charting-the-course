import type { Paragraph } from "@/lib/public-documents";

/** Render a public sentence, including a follow link when the copy names one. */
export function InlineText({ value }: { value: Paragraph }) {
  if (typeof value === "string") return value;
  return value.map((part, index) =>
    typeof part === "string" ? (
      part
    ) : (
      <a key={`${part.href}-${index}`} href={part.href} className="text-link underline">
        {part.text}
      </a>
    ),
  );
}
