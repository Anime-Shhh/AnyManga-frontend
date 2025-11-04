"use client";
import React, { useState } from "react";
import Stepper, { Step } from "@/components/Stepper";
import AnimatedList from "@/components/AnimatedList";

export default function DownloadPage() {
  const [mangaName, setMangaName] = useState<string>("");
  const [chapters, setChapters] = useState<string[]>([]);
  const [startChapter, setStartChapter] = useState<string | "">("");
  const [startChapterIndex, setStartChapterIndex] = useState<number>(-1);
  const [endChapter, setEndChapter] = useState<string | "">("");
  const [endChapterIndex, setEndChapterIndex] = useState<number>(-1);
  const [mangaCover, setMangaCover] = useState<string>("");

  const getMangaInfo = async (name: string) => {
    const res = await fetch(
      `http://localhost:8080/info?title=${encodeURIComponent(name)}`
    );
    const data = await res.json();
    setMangaName(name);
    setMangaCover(data.cover);
    setChapters(data.chapters);
  };

  const downloadPDF = async () => {
    if (
      !mangaName ||
      startChapterIndex < 0 ||
      endChapterIndex < 0 ||
      endChapterIndex < startChapterIndex
    )
      return;

    const selectedChapters = chapters.slice(startChapterIndex, endChapterIndex + 1);

    const res = await fetch("http://localhost:8080/chapters", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: mangaName,
        chapters: selectedChapters,
      }),
    });

    if (!res.ok) {
      console.error("Failed to generate PDF");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mangaName}_${selectedChapters[0]}-${selectedChapters[selectedChapters.length - 1]}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Helper: find and click the "Next" button rendered by the Stepper
  // Uses text matching so it still works if Stepper renders controls elsewhere.
  const clickNext = () => {
    // small timeout so DOM updates from React finish first
    setTimeout(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const nextBtn = buttons.find((b) => {
        const txt = (b.textContent || "").trim().toLowerCase();
        return txt === "next" || txt === "next ›" || txt === "› next";
      });
      (nextBtn as HTMLButtonElement | undefined)?.click();
    }, 0);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-4">
      <Stepper
        initialStep={1}
        onStepChange={async (step) => {
          if (step === 2 && mangaName) {
            await getMangaInfo(mangaName);
          }
        }}
        onFinalStepCompleted={downloadPDF}
        backButtonText="Previous"
        nextButtonText="Next"
      >
        {/* Step 1: Manga name input */}
        <Step>
          <div className="flex flex-col items-center justify-center w-full text-center">
            <h2 className="text-xl font-semibold mb-4">Enter Manga Name</h2>
            <input
              value={mangaName}
              onChange={(e) => setMangaName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && mangaName.trim() !== "") {
                  e.preventDefault();
                  clickNext();
                }
              }}
              placeholder="Manga name"
              className="p-2 rounded bg-gray-700 text-white placeholder-white w-full max-w-md mt-4"
            />
          </div>
        </Step>

        {/* Step 2: Select Start Chapter */}
        <Step>
          <div className="flex flex-col items-center justify-center w-full text-center">
            <h2 className="text-xl font-semibold mb-4">Select Start Chapter</h2>
            <div className="flex items-center justify-center gap-6 w-full max-w-4xl">
              {mangaCover && (
                <img
                  src={mangaCover}
                  alt="Manga cover"
                  className="w-48 h-auto rounded shadow-lg object-cover"
                />
              )}
              <div className="flex-1">
                <AnimatedList
                  items={chapters}
                  onItemSelect={(item, index) => {
                    setStartChapter(item);
                    setStartChapterIndex(index);
                    clickNext();
                  }}
                  showGradients={true}
                  enableArrowNavigation={true}
                  displayScrollbar={true}
                />
              </div>
            </div>
          </div>
        </Step>

        {/* Step 3: Select End Chapter */}
        <Step>
          <div className="flex flex-col items-center justify-center w-full text-center">
            <h2 className="text-xl font-semibold mb-4">Select End Chapter</h2>
            <div className="flex items-center justify-center gap-6 w-full max-w-4xl">
              {mangaCover && (
                <img
                  src={mangaCover}
                  alt="Manga cover"
                  className="w-48 h-auto rounded shadow-lg object-cover"
                />
              )}
              <div className="flex-1">
                <AnimatedList
                  items={chapters.slice(startChapterIndex)}
                  onItemSelect={(item, index) => {
                    setEndChapter(item);
                    setEndChapterIndex(startChapterIndex + index);
                    clickNext();
                  }}
                  showGradients={true}
                  enableArrowNavigation={true}
                  displayScrollbar={true}
                />
              </div>
            </div>

            {startChapter !== "" &&
              endChapter !== "" &&
              startChapterIndex > endChapterIndex && (
                <p className="text-red-500 mt-4 text-center">
                  Start chapter cannot be greater than end chapter.
                </p>
              )}
          </div>
        </Step>

        {/* Step 4: Confirmation */}
        <Step>
          <div className="flex flex-col items-center justify-center w-full text-center">
            <h2 className="text-xl font-semibold mb-4">Confirm and Download</h2>
            {mangaCover && (
              <img
                src={mangaCover}
                alt="Manga cover"
                className="w-48 h-auto rounded shadow-lg mb-4"
              />
            )}
            <p>
              Manga: <strong>{mangaName}</strong>
            </p>
            <p>
              Chapters:{" "}
              <strong>
                {startChapter} - {endChapter}
              </strong>
            </p>
          </div>
        </Step>
      </Stepper>
    </div>
  );
}
