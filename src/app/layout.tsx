"use client";

import "./globals.css";
import { useEffect, useState } from "react";
import StaggeredMenu from "@/components/StaggeredMenu";
import Searchbar from "@/components/Searchbar";

const menuItems = [
  { label: "Home", ariaLabel: "Go to home page", link: "/" },
  { label: "Read", ariaLabel: "View our services", link: "/read" },
  { label: "Offline", ariaLabel: "Download Manga", link: "/download" },
];

const socialItems = [
  { label: "Twitter", link: "https://twitter.com" },
  { label: "GitHub", link: "https://github.com/Anime-Shhh" },
  { label: "LinkedIn", link: "https://linkedin.com" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      if (current > lastScrollY && current > 100) setHidden(true);
      else setHidden(false);
      setLastScrollY(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen flex">
        {/* Main content first so it doesn't block clicks */}
        <main className="flex-1 overflow-y-auto relative z-[0]">{children}</main>

        {/* Scroll-hide wrapper AFTER main */}
        <div
          className={`fixed top-0 left-0 right-0 z-[150] transition-all duration-500 ${hidden ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
            }`}
        >
          <Searchbar />
          <StaggeredMenu
            position="right"
            isFixed={true}
            items={menuItems}
            socialItems={socialItems}
            displaySocials={true}
            displayItemNumbering={true}
            menuButtonColor="#fff"
            openMenuButtonColor="#000000ff"
            changeMenuColorOnOpen={true}
            colors={["#B19EEF", "#5227FF"]}
            logoUrl="/logo.svg"
            accentColor="#5227FF"
          />
        </div>
      </body>
    </html>
  );
}
