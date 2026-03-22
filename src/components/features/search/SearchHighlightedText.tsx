"use client";

import { Fragment } from "react";
import { getMatchRanges } from "@/components/features/search/search-intelligence";

type SearchHighlightedTextProps = {
  text: string;
  query: string;
  className?: string;
};

export function SearchHighlightedText({ text, query }: SearchHighlightedTextProps) {
  const ranges = getMatchRanges(text, query);
  if (!ranges.length) return <>{text}</>;

  let pointer = 0;
  const chunks: Array<{ value: string; highlighted: boolean }> = [];

  for (const range of ranges) {
    if (range.start > pointer) {
      chunks.push({ value: text.slice(pointer, range.start), highlighted: false });
    }
    chunks.push({ value: text.slice(range.start, range.end), highlighted: true });
    pointer = range.end;
  }

  if (pointer < text.length) {
    chunks.push({ value: text.slice(pointer), highlighted: false });
  }

  return (
    <>
      {chunks.map((chunk, index) => (
        <Fragment key={`${chunk.value}-${index}`}>
          {chunk.highlighted ? (
            <mark className="rounded-sm bg-white/18 px-0.5 text-white">{chunk.value}</mark>
          ) : (
            chunk.value
          )}
        </Fragment>
      ))}
    </>
  );
}


