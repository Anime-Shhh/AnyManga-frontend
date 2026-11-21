"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "next/navigation";

const mobileQuery = "(max-width: 767px), (hover: none) and (pointer: coarse)";
function subscribeMobile(update: () => void) {
  const media = window.matchMedia(mobileQuery);
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}
function mobileSnapshot() { return window.matchMedia(mobileQuery).matches; }

type ChromeState = { path: string; visible: boolean; menuOpen: boolean };
type NavigationState = { visible: boolean; mobile: boolean; menuOpen: boolean; show: () => void; closeMenu: () => void; toggleMenu: () => void; syncScroll: () => void };
const NavigationContext = createContext<NavigationState | null>(null);

export function NavigationVisibilityProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mobile = useSyncExternalStore(subscribeMobile, mobileSnapshot, () => false);
  const reader = /^\/read\/[^/]+\/[^/]+\/?$/.test(pathname);
  const [chrome, setChrome] = useState<ChromeState>({ path: "", visible: true, menuOpen: false });
  const lastScroll = useRef(0);
  const syncScroll = useCallback(() => { lastScroll.current = window.scrollY; }, []);
  const visible = chrome.path !== pathname || chrome.visible;
  const menuOpen = chrome.path === pathname && chrome.menuOpen;

  const show = useCallback(() => setChrome((current) => current.path === pathname && current.visible ? current : { path: pathname, visible: true, menuOpen: current.path === pathname && current.menuOpen }), [pathname]);
  const closeMenu = useCallback(() => setChrome((current) => current.path === pathname && current.menuOpen ? { ...current, menuOpen: false } : current), [pathname]);
  const toggleMenu = useCallback(() => setChrome((current) => ({ path: pathname, visible: true, menuOpen: !(current.path === pathname && current.menuOpen) })), [pathname]);

  useEffect(() => {
    lastScroll.current = window.scrollY;
    let wheelIntent: { direction: number; time: number } | undefined;
    let gesture: { id: number; x: number; y: number; scroll: number } | undefined;
    function hide() { setChrome((current) => current.path === pathname && !current.visible ? current : { path: pathname, visible: false, menuOpen: false }); }
    function scroll() {
      const current = window.scrollY;
      if (current === lastScroll.current) return;
      const editingNavigation = document.activeElement?.closest("[data-navigation-chrome] input, [data-navigation-chrome] textarea");
      if (editingNavigation || current <= 100) show();
      else if (mobile && reader) hide();
      else if (wheelIntent && performance.now() - wheelIntent.time < 300) { if (wheelIntent.direction > 0) hide(); else show(); }
      else if (current > lastScroll.current) hide();
      else show();
      lastScroll.current = current;
    }
    function wheel(event: WheelEvent) {
      if (!event.deltaY || document.activeElement?.closest("[data-navigation-chrome] input, [data-navigation-chrome] textarea")) return;
      wheelIntent = { direction: event.deltaY, time: performance.now() };
      if (window.scrollY + event.deltaY <= 100) show();
      else if (mobile && reader || event.deltaY > 0) hide();
      else show();
    }
    function pointerDown(event: PointerEvent) {
      if (!mobile || !reader || !event.isPrimary) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, scroll: window.scrollY };
    }
    function pointerMove(event: PointerEvent) {
      if (!gesture || gesture.id !== event.pointerId) return;
      if (Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 10) { gesture = undefined; hide(); }
    }
    function pointerUp(event: PointerEvent) {
      const start = gesture; gesture = undefined;
      if (!start || start.id !== event.pointerId || !(event.target instanceof Element)) return;
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10 || Math.abs(window.scrollY - start.scroll) > 10) return;
      if (!event.target.closest("[data-reader-surface]") || event.target.closest("a,button,input,textarea,select,[role='button'],[contenteditable],[data-navigation-chrome]")) return;
      if (window.getSelection()?.toString()) return;
      setChrome((current) => ({ path: pathname, visible: !(current.path !== pathname || current.visible), menuOpen: false }));
    }
    function cancel() { gesture = undefined; }
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Tab") show();
      if (event.key === "Escape") closeMenu();
    }
    const media = window.matchMedia(mobileQuery);
    media.addEventListener("change", closeMenu);
    window.addEventListener("wheel", wheel, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    document.addEventListener("pointerdown", pointerDown, { passive: true });
    document.addEventListener("pointermove", pointerMove, { passive: true });
    document.addEventListener("pointerup", pointerUp, { passive: true });
    document.addEventListener("pointercancel", cancel, { passive: true });
    document.addEventListener("keydown", keyboard);
    return () => {
      media.removeEventListener("change", closeMenu);
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("scroll", scroll);
      document.removeEventListener("pointerdown", pointerDown);
      document.removeEventListener("pointermove", pointerMove);
      document.removeEventListener("pointerup", pointerUp);
      document.removeEventListener("pointercancel", cancel);
      document.removeEventListener("keydown", keyboard);
    };
  }, [pathname, mobile, reader, show, closeMenu]);

  const value = useMemo(() => ({ visible, mobile, menuOpen, show, closeMenu, toggleMenu, syncScroll }), [visible, mobile, menuOpen, show, closeMenu, toggleMenu, syncScroll]);
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigationVisibility() {
  const value = useContext(NavigationContext);
  if (!value) throw new Error("Navigation visibility provider is missing.");
  return value;
}
