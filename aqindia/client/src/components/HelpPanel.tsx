import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, BookOpen, Lightbulb, Info, GripVertical, Maximize2, Minimize2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface HelpPanelProps {
  content: HelpContent;
}

export default function HelpPanel({ content }: HelpPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [panelSize, setPanelSize] = useState<'medium' | 'large'>('medium');
  const panelRef = useRef<HTMLDivElement>(null);

  const totalSections = content.sections.length;
  const currentSectionData = content.sections[currentSection];

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const nextSection = () => {
    setCurrentSection((prev) => Math.min(prev + 1, totalSections - 1));
  };

  const prevSection = () => {
    setCurrentSection((prev) => Math.max(prev - 1, 0));
  };

  const toggleSize = () => {
    setPanelSize(prev => prev === 'medium' ? 'large' : 'medium');
  };

  const panelWidth = panelSize === 'medium' ? 'max-w-xl' : 'max-w-3xl';

  return (
    <>
      {/* Help Button - Matches your theme */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center w-9 h-9 rounded-lg glass-card hover:scale-105 transition-all duration-200 group"
        aria-label="Show help and information"
        title="Learn about this page"
      >
        <BookOpen className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
      </button>

      {/* Slide-out Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              ref={panelRef}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={cn(
                "fixed right-0 top-0 bottom-0 z-50 glass-card border-l border-white/10 flex flex-col",
                panelWidth,
                "w-full"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg glass-card flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-white" style={{ fontFamily: "Exo, sans-serif" }}>
                      {content.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-400">
                        Section {currentSection + 1} of {totalSections}
                      </Badge>
                      <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                        Scroll for more ↓
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSize}
                    className="w-8 h-8 rounded-lg glass-card hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                    aria-label="Toggle panel size"
                    title={panelSize === 'medium' ? 'Expand' : 'Compress'}
                  >
                    {panelSize === 'medium' ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-lg glass-card hover:bg-red-500/20 flex items-center justify-center text-gray-400 hover:text-red-400 transition-all"
                    aria-label="Close help panel"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Section Navigation */}
              <div className="flex items-center gap-2 p-4 border-b border-white/10 bg-black/20 overflow-x-auto">
                {content.sections.map((section, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSection(idx)}
                    className={cn(
                      "flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                      idx === currentSection
                        ? "bg-blue-600/30 text-blue-300 border border-blue-500/50"
                        : "glass-card text-gray-400 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {section.icon && <span className="mr-1">{section.icon}</span>}
                    {section.heading.split(' ').slice(0, 3).join(' ')}
                  </button>
                ))}
              </div>

              {/* Content */}
              <ScrollArea className="flex-1 p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Section Header */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl glass-card flex items-center justify-center flex-shrink-0">
                        <Info className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-blue-300 mb-2" style={{ fontFamily: "Exo, sans-serif" }}>
                          {currentSectionData.heading}
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          {currentSectionData.content}
                        </p>
                      </div>
                    </div>

                    {/* Tips Card */}
                    {currentSectionData.tips && (
                      <div className="glass-card rounded-xl p-5 border-l-4 border-l-blue-500">
                        <h4 className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
                          <span className="text-lg">💡</span>
                          Key Points to Remember
                        </h4>
                        <div className="space-y-2">
                          {currentSectionData.tips.map((tip, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                              <p className="text-sm text-gray-300 leading-relaxed">{tip}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Example Card */}
                    {currentSectionData.example && (
                      <div className="glass-card rounded-xl p-5 border-l-4 border-l-green-500 bg-green-500/5">
                        <h4 className="text-sm font-semibold text-green-300 mb-3 flex items-center gap-2">
                          <span className="text-lg">📊</span>
                          Real Example
                        </h4>
                        <p className="text-sm text-gray-300 leading-relaxed italic">
                          {currentSectionData.example}
                        </p>
                      </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <Button
                        onClick={prevSection}
                        disabled={currentSection === 0}
                        variant="outline"
                        size="sm"
                        className="gap-2 glass-card border-white/20 disabled:opacity-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalSections }).map((_, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "h-1.5 rounded-full transition-all duration-300",
                              idx === currentSection
                                ? "w-8 bg-blue-400"
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
                        className="gap-2 glass-card border-white/20 disabled:opacity-50"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </ScrollArea>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-black/20">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Press <kbd className="px-2 py-1 rounded bg-white/10 text-gray-400">Esc</kbd> to close</span>
                  <span>Click anywhere outside to dismiss</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
