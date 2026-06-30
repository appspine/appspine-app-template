"use client";

import * as React from "react";
import { useSidebar } from "@/components/ui/sidebar";

export function SidebarResizer() {
  const { state, isMobile } = useSidebar();
  const [isDragging, setIsDragging] = React.useState(false);
  const [width, setWidth] = React.useState(240);

  // Load initial width from localStorage on mount
  React.useEffect(() => {
    const savedWidth = localStorage.getItem("sidebar_width");
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      if (!isNaN(parsed) && parsed >= 160 && parsed <= 480) {
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
      let newWidth = e.clientX;
      
      // Enforce drag limits
      if (newWidth < 160) newWidth = 160;
      if (newWidth > 480) newWidth = 480;
      
      setWidth(newWidth);
      localStorage.setItem("sidebar_width", newWidth.toString());
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
  }, [isDragging]);

  // Don't render resizer on mobile or when collapsed
  if (isMobile || state === "collapsed") {
    return null;
  }

  return (
    <div
      onMouseDown={startResize}
      className="absolute top-0 bottom-0 -right-1 w-2 cursor-col-resize z-50 select-none group/resizer"
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
