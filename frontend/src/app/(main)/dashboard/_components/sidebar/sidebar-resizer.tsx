"use client";

import * as React from "react";

import { useSidebar } from "@/components/ui/sidebar";

const MIN_WIDTH = 160;
const MAX_WIDTH = 480;
const KEYBOARD_STEP = 10;

function clampWidth(width: number) {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));
}

export function SidebarResizer() {
  const { state, isMobile } = useSidebar();
  const [isDragging, setIsDragging] = React.useState(false);
  const [width, setWidth] = React.useState(240);

  const setPersistedWidth = React.useCallback((next: number) => {
    const clamped = clampWidth(next);
    setWidth(clamped);
    localStorage.setItem("sidebar_width", clamped.toString());
  }, []);

  // Load initial width from localStorage on mount
  React.useEffect(() => {
    const savedWidth = localStorage.getItem("sidebar_width");
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      if (!isNaN(parsed) && parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
        setWidth(parsed);
      }
    }
  }, []);

  // Sync width to CSS variable on the wrapper element
  React.useEffect(() => {
    if (isMobile || state === "collapsed") return;

    const wrapper = document.querySelector('[data-slot="sidebar-wrapper"]') as HTMLElement;
    if (wrapper) {
      wrapper.style.setProperty("--sidebar-width", `${width}px`);
    }
  }, [width, state, isMobile]);

  const startResize = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      // The sidebar is on the left, so width is the cursor X coordinate
      setPersistedWidth(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, setPersistedWidth]);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPersistedWidth(width - KEYBOARD_STEP);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPersistedWidth(width + KEYBOARD_STEP);
      }
    },
    [width, setPersistedWidth],
  );

  // Don't render resizer on mobile or when collapsed
  if (isMobile || state === "collapsed") {
    return null;
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: focusable/draggable WAI-ARIA "window splitter" — <hr> can't be interactive or contain the drag-indicator child
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize sidebar"
      aria-valuenow={width}
      aria-valuemin={MIN_WIDTH}
      aria-valuemax={MAX_WIDTH}
      tabIndex={0}
      onMouseDown={startResize}
      onKeyDown={handleKeyDown}
      className="absolute top-0 bottom-0 -right-1 w-2 cursor-col-resize z-50 select-none group/resizer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
      style={{ touchAction: "none" }}
    >
      {/* Visual drag indicator */}
      <div
        className={`w-[2px] h-full mx-auto transition-colors duration-200 ${
          isDragging ? "bg-primary" : "bg-transparent group-hover/resizer:bg-primary/40"
        }`}
      />
    </div>
  );
}
