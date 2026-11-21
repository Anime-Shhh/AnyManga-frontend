"use client";
/* eslint-disable @next/next/no-img-element -- Direct source images use the browser cache. */
import { useState, type ImgHTMLAttributes } from "react";
import { fallbackImage, resolvedImage } from "@/lib/images";

type Props = ImgHTMLAttributes<HTMLImageElement> & { src: string; fallbackSrc?: string };
function ImageForSource({ src, fallbackSrc, onError, alt = "", ...props }: Props) {
  const [current, setCurrent] = useState(() => resolvedImage(src));
  return <img {...props} alt={alt} src={current} referrerPolicy="no-referrer" onError={(event) => {
    const fallback = fallbackImage(src, fallbackSrc);
    if (fallback && current !== fallback) setCurrent(fallback);
    else if (fallbackSrc && current !== fallbackSrc && resolvedImage(src) === fallbackSrc) setCurrent(fallbackSrc);
    else onError?.(event);
  }} />;
}
export default function MangaImage(props: Props) { return <ImageForSource key={props.src} {...props} />; }
