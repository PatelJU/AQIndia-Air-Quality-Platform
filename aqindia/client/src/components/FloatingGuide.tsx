import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useDragControls } from "framer-motion";
import { X, ChevronLeft, ChevronRight, BookOpen, Lightbulb, Info, GripHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HelpSection {
  heading: string;
  icon?: string;
  content: string;
  tips?: string[];
  example?: string;
  color?: string;
}

interface HelpContent {
  title: string;
  sections: HelpSection[];
}

interface FloatingGuideProps {
  content: HelpContent;
}

export default function FloatingGuide({ content }: FloatingGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [size, setSize] = useState({ width: 420, height: 520 });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const dragControls = useDragControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeStartPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const totalSections = content.sections.length;
  const currentSectionData = content.sections[currentSection];

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextSection();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        prevSection();
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentSection]);

  const nextSection = useCallback(() => {
    setCurrentSection((prev) => Math.min(prev + 1, totalSections - 1));
  }, [totalSections]);

  const prevSection = useCallback(() => {
    setCurrentSection((prev) => Math.max(prev - 1, 0));
  }, []);

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - resizeStartPos.current.x;
      const dy = ev.clientY - resizeStartPos.current.y;

      let newWidth = resizeStartPos.current.width;
      let newHeight = resizeStartPos.current.height;

      if (direction.includes("right")) {
        newWidth = Math.max(320, Math.min(800, resizeStartPos.current.width + dx));
      }
      if (direction.includes("left")) {
        newWidth = Math.max(320, Math.min(800, resizeStartPos.current.width - dx));
      }
      if (direction.includes("bottom")) {
        newHeight = Math.max(400, Math.min(900, resizeStartPos.current.height + dy));
      }
      if (direction.includes("top")) {
        newHeight = Math.max(400, Math.min(900, resizeStartPos.current.height - dy));
      }

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Responsive text size
  const textSize = size.width < 380 ? "xs" : size.width < 500 ? "sm" : "base";
  const headingSize = size.width < 380 ? "sm" : size.width < 500 ? "base" : "lg";

  return (
    <>
      {/* Trigger Button - Minimal Professional Border Circle */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full border-2 border-white/40 bg-transparent flex items-center justify-center group hover:border-white/70 hover:bg-white/5 transition-all duration-300"
        aria-label="Show interactive guide"
        title="Interactive Guide"
      >
        <Info className="w-4 h-4 text-white/60 group-hover:text-white transition-colors duration-300" />
        {!isOpen && (
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full border border-gray-950"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </motion.button>

      {/* Floating Guide Card */}
      {isOpen && (
        <motion.div
          ref={containerRef}
          drag
          dragControls={dragControls}
          dragMomentum={false}
          dragElastic={0}
          onDragEnd={(_, info) => {
            setPosition(prev => ({
              x: prev.x + info.offset.x,
              y: prev.y + info.offset.y
            }));
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1, width: size.width, height: size.height }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed z-50 rounded-2xl shadow-2xl shadow-black/60 flex flex-col select-none"
          style={{
            right: "24px",
            bottom: "24px",
            x: position.x,
            y: position.y,
            minWidth: "320px",
            minHeight: "400px",
            maxWidth: "800px",
            maxHeight: "900px",
            cursor: isResizing ? "auto" : "grab",
          }}
          onMouseDown={(e) => {
            const target = e.target as HTMLElement;
            if (!target.closest("button, [role='button'], input, textarea, select") && !target.closest("[data-resize-handle]")) {
              dragControls.start(e as any);
            }
          }}
        >
          {/* Solid Background - BLACK like your theme */}
          <div className="absolute inset-0 rounded-2xl bg-gray-950 border border-white/10 overflow-hidden" />

          {/* Subtle Blue Glow - NO PURPLE */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 via-transparent to-blue-600/5 pointer-events-none" />

          {/* Resize Handles - Windows Style */}
          {/* Right Edge */}
          <div
            data-resize-handle="true"
            onMouseDown={(e) => handleResizeStart(e, "right")}
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-blue-500/30 transition-colors z-10"
          />
          {/* Bottom Edge */}
          <div
            data-resize-handle="true"
            onMouseDown={(e) => handleResizeStart(e, "bottom")}
            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-500/30 transition-colors z-10"
          />
          {/* Bottom-Right Corner */}
          <div
            data-resize-handle="true"
            onMouseDown={(e) => handleResizeStart(e, "right-bottom")}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize hover:bg-blue-500/40 transition-colors z-10"
          />

          {/* Drag Handle */}
          <div 
            className="relative flex items-center justify-center py-2 border-b border-white/10 bg-blue-600/5 cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
              const target = e.target as HTMLElement;
              if (!target.closest("button")) {
                dragControls.start(e as any);
              }
            }}
          >
            <GripHorizontal className="w-4 h-4 text-gray-400" />
          </div>

          {/* Header */}
          <div className="relative flex items-center justify-between px-3 py-2 border-b border-white/10">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-7 h-7 rounded bg-blue-600/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={`font-bold text-white truncate font-['Exo'] ${headingSize === 'lg' ? 'text-lg' : headingSize === 'base' ? 'text-base' : 'text-sm'}`}>
                  {content.title}
                </h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge variant="outline" className="text-[10px] border-blue-500/40 text-blue-400 px-1.5 py-0 h-4">
                    {currentSection + 1}/{totalSections}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-green-500/40 text-green-400 px-1.5 py-0 h-4">
                    {Math.round(size.width)}×{Math.round(size.height)}
                  </Badge>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all flex-shrink-0 ml-2"
              aria-label="Close guide"
              title="Close (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Section Navigation Tabs */}
          <div className="relative flex items-center gap-1.5 px-3 py-2 border-b-2 border-white/10 bg-black/30 overflow-x-auto scrollbar-hide">
            {content.sections.map((section, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSection(idx);
                }}
                className={cn(
                  "flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
                  idx === currentSection
                    ? "bg-blue-600/30 text-blue-300 border-blue-500/50 shadow-lg shadow-blue-500/20"
                    : "bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20"
                )}
              >
                {section.icon && <span className="mr-1">{section.icon}</span>}
                {section.heading.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>

          {/* Content Area - Fully Contained */}
          <div className="relative flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide p-4">
            <div className="space-y-4">
              {/* Section Header Card - BLUE ONLY, NO PURPLE */}
              <div className="bg-blue-600/5 border border-blue-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                    <Info className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-blue-300 mb-1 font-['Exo'] ${headingSize === 'lg' ? 'text-sm' : headingSize === 'base' ? 'text-xs' : 'text-xs'}`}>
                      {currentSectionData.heading}
                    </h3>
                    <p className={`text-gray-400 leading-relaxed ${textSize === 'sm' ? 'text-[11px]' : 'text-[10px]'}`}>
                      {currentSectionData.content}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tips Card - BLUE ONLY */}
              {currentSectionData.tips && (
                <div className="bg-blue-500/5 border border-blue-400/20 rounded-lg p-3">
                  <h4 className={`font-semibold text-blue-300 mb-1.5 flex items-center gap-1.5 font-['Exo'] ${headingSize === 'lg' ? 'text-xs' : 'text-[11px]'}`}>
                    <span className="text-base">💡</span>
                    Key Points
                  </h4>
                  <div className="space-y-1">
                    {currentSectionData.tips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                        <p className={`text-gray-300 leading-relaxed ${textSize === 'sm' ? 'text-[11px]' : 'text-[10px]'}`}>{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Example Card - GREEN ONLY */}
              {currentSectionData.example && (
                <div className="bg-green-500/5 border border-green-400/20 rounded-lg p-3">
                  <h4 className={`font-semibold text-green-300 mb-1.5 flex items-center gap-1.5 font-['Exo'] ${headingSize === 'lg' ? 'text-xs' : 'text-[11px]'}`}>
                    <span className="text-base">📊</span>
                    Real Example
                  </h4>
                  <p className={`text-gray-300 leading-relaxed italic ${textSize === 'sm' ? 'text-[11px]' : 'text-[10px]'}`}>
                    {currentSectionData.example}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Navigation - Inside Card */}
          <div className="relative px-3 py-2 border-t border-white/10 bg-black/20">
            <div className="flex items-center justify-between gap-2">
              <Button
                onClick={prevSection}
                disabled={currentSection === 0}
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </Button>

              {/* Progress Dots */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalSections }).map((_, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      idx === currentSection
                        ? "w-6 bg-gradient-to-r from-blue-400 to-purple-400"
                        : "w-1.5 bg-gray-600"
                    )}
                  />
                ))}
              </div>

              <Button
                onClick={nextSection}
                disabled={currentSection === totalSections - 1}
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-xs bg-white/5 border-white/20 hover:bg-white/10 hover:border-white/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p className="text-[10px] text-gray-500 text-center mt-2">
              💡 Drag title to move • Drag edges to resize • Arrow keys to navigate
            </p>
          </div>
        </motion.div>
      )}

      {/* Global Styles for Hidden Scrollbar */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
}
