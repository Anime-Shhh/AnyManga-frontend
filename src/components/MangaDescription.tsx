"use client";
import { useState } from "react";
import Markdown from "react-markdown";

export function descriptionSections(source: string) {
  let text = source.trim();
  let attribution = "";
  const from = text.match(/^From ([^\n:]{1,80}):\s*\n/i);
  if (from) { attribution = `From ${from[1]}`; text = text.slice(from[0].length); }
  const chunks = text.split(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/m).filter((s) => s.trim());
  const synopsis: string[] = [], sections: { title: string; content: string }[] = [];
  chunks.forEach((chunk, index) => {
    const note = chunk.match(/^\s*(?:\*\*)?(Notes?|Notice|Warning):?(?:\*\*)?:?\s*/i);
    if (note) { sections.push({ title: "Publisher notes", content: chunk.slice(note[0].length).trim() }); return; }
    if (index > 0) { sections.push({ title: /award|prize|best.selling/i.test(chunk) ? "Facts & awards" : "Additional details", content: chunk.trim() }); return; }
    for (const paragraph of chunk.split(/\n\s*\n/)) {
      if (/best.selling|won the .*award|received .*prize/i.test(paragraph)) sections.push({ title: "Facts & awards", content: paragraph.trim() });
      else synopsis.push(paragraph.trim());
    }
  });
  const grouped = new Map<string, string[]>();
  for (const section of sections) grouped.set(section.title, [...grouped.get(section.title) ?? [], section.content]);
  const ordered = ["Publisher notes", "Facts & awards", "Additional details"].filter((title) => grouped.has(title)).map((title) => ({ title, content: grouped.get(title)!.join("\n\n") }));
  return { attribution, synopsis: synopsis.join("\n\n"), sections: ordered };
}
function Prose({ text }: { text: string }) {
  return <div className="break-words text-sm leading-7 text-zinc-200/90 [&_p+p]:mt-3 [&_strong]:font-semibold [&_strong]:text-white [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_h1]:mt-4 [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-white/20 [&_blockquote]:pl-4">
    <Markdown skipHtml urlTransform={(url) => /^https?:\/\//i.test(url) ? url : ""} components={{ img: () => null, a: ({ children, href }) => href ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-200 underline decoration-violet-300/40 underline-offset-4 hover:text-white">{children}</a> : <span>{children}</span> }}>{text}</Markdown>
  </div>;
}
export default function MangaDescription({ description }: { description: string }) {
  const { attribution, synopsis, sections } = descriptionSections(description);
  const [expanded, setExpanded] = useState(false);
  return <div className="mt-6">
    <h2 className="text-xs font-semibold uppercase tracking-[.2em] text-white/55">Synopsis</h2>
    {attribution && <p className="mb-2 mt-2 text-xs text-white/45">{attribution}</p>}
    <div className={`mt-2 ${!expanded && synopsis.length > 700 ? "line-clamp-6" : ""}`}><Prose text={synopsis} /></div>
    {synopsis.length > 700 && <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="mt-2 text-xs font-medium text-violet-200 underline">{expanded ? "Show less" : "Read full synopsis"}</button>}
    {sections.length > 0 && <div className="mt-5 space-y-2">{sections.map((section, i) => <details key={i} className="rounded-xl border border-white/10 bg-black/15 px-4 py-3 open:bg-black/25"><summary className="cursor-pointer text-sm font-medium text-white/80 focus-visible:outline-2 focus-visible:outline-violet-300">{section.title}</summary><div className="mt-3"><Prose text={section.content} /></div></details>)}</div>}
  </div>;
}
