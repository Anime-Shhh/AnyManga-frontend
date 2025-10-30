"use client";

import { useState, useEffect } from "react";
import StaggeredMenu from "@/components/StaggeredMenu";
import SearchBar from "@/components/Searchbar";

export default function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

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

  // Hide navbar on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      if (current > lastScrollY && current > 100) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      setLastScrollY(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full flex items-center justify-between px-6 py-4 bg-transparent backdrop-blur-md text-white z-[100] transition-transform duration-300 ${hidden ? "-translate-y-full" : "translate-y-0"
          }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
          <span className="text-lg font-semibold">My App</span>
        </div>

        {/* Centered SearchBar (keeps your SearchBar implementation) */}
        <div className="flex-1 flex justify-center px-6">
          <SearchBar />
        </div>

        {/* NOTE: no manual menu button here — StaggeredMenu includes its own button */}
        <div className="w-10" /> {/* spacer so layout stays balanced */}
      </nav>


      <StaggeredMenu
        position="right"
        items={menuItems}
        socialItems={socialItems}
        displaySocials={true}
        displayItemNumbering={true}
        menuButtonColor="#fff"
        openMenuButtonColor="#fff"
        changeMenuColorOnOpen={true}
        colors={["#B19EEF", "#5227FF"]}
        logoUrl="/logo.svg"
        accentColor="#5227FF"
        onMenuOpen={() => console.log("Menu opened")}
        onMenuClose={() => console.log("Menu closed")}
        isFixed={true}
      />
    </>

  );
}
