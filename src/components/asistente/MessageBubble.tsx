"use client";
import React from "react";
import { cn } from "@/lib/utils";

/** Convierte **negritas** en <strong> sin librerías. */
function inline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-bold">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={`${keyPrefix}-${i}`}>{p}</React.Fragment>;
  });
}

/** Markdown ligero: párrafos, negritas y listas con "- ". */
export function renderMarkdownLite(content: string): React.ReactNode {
  const blocks: React.ReactNode[] = [];
  const lines = content.split(/\r?\n/);
  let list: string[] = [];
  let para: string[] = [];

  const flushList = () => {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul-${blocks.length}`} className="my-1 flex list-disc flex-col gap-0.5 pl-5">
        {list.map((item, i) => (
          <li key={i}>{inline(item, `li-${blocks.length}-${i}`)}</li>
        ))}
      </ul>
    );
    list = [];
  };
  const flushPara = () => {
    if (!para.length) return;
    blocks.push(<p key={`p-${blocks.length}`} className="my-1">{inline(para.join(" "), `p-${blocks.length}`)}</p>);
    para = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const li = line.match(/^\s*[-•*]\s+(.*)$/);
    if (li) {
      flushPara();
      list.push(li[1]);
      continue;
    }
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  flushPara();
  flushList();
  return blocks;
}

export function MessageBubble({ role, content, children }: { role: "user" | "assistant"; content: string; children?: React.ReactNode }) {
  const mine = role === "user";
  return (
    <div className={cn("flex w-full flex-col", mine ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[86%] rounded-card-lg px-4 py-2.5 text-[15px] leading-relaxed",
          mine ? "rounded-br-[6px] bg-primary text-on-primary" : "rounded-bl-[6px] border border-outline-variant bg-surface text-on"
        )}
      >
        {mine ? <p className="whitespace-pre-wrap">{content}</p> : renderMarkdownLite(content)}
      </div>
      {children}
    </div>
  );
}
