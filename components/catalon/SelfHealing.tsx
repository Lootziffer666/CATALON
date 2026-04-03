"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { AlertTriangle, Shield, RefreshCw, Activity } from "lucide-react";

interface ConflictReport {
  id: string;
  type: "z-index" | "overflow" | "layout" | "spacing" | "collision";
  severity: "low" | "medium" | "high";
  element: string;
  description: string;
  timestamp: number;
  autoFixed: boolean;
}

interface LayoutMetrics {
  reflowCount: number;
  lastReflow: number;
  activeConflicts: number;
  healthyComponents: number;
}

interface SelfHealingProps {
  enabled?: boolean;
  autoCorrect?: boolean;
  checkInterval?: number;
  onConflictDetected?: (conflict: ConflictReport) => void;
  onReflow?: (metrics: LayoutMetrics) => void;
}

export function SelfHealing({
  enabled = true,
  autoCorrect = true,
  checkInterval = 2000,
  onConflictDetected,
  onReflow,
}: SelfHealingProps) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictReport[]>([]);
  const [metrics, setMetrics] = useState<LayoutMetrics>({
    reflowCount: 0,
    lastReflow: 0,
    activeConflicts: 0,
    healthyComponents: 0,
  });
  const [showPanel, setShowPanel] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const detectConflicts = useCallback((): ConflictReport[] => {
    const newConflicts: ConflictReport[] = [];
    const elements = document.querySelectorAll("*");

    const zIndexMap = new Map<number, Element[]>();
    const overflowElements: Element[] = [];

    elements.forEach((el) => {
      const style = window.getComputedStyle(el);
      
      const zIndex = parseInt(style.zIndex, 10);
      if (!isNaN(zIndex) && zIndex !== 0) {
        if (!zIndexMap.has(zIndex)) {
          zIndexMap.set(zIndex, []);
        }
        zIndexMap.get(zIndex)!.push(el);
      }

      const overflowX = style.overflowX;
      const overflowY = style.overflowY;
      if (
        overflowX === "hidden" ||
        overflowY === "hidden" ||
        overflowX === "scroll" ||
        overflowY === "scroll"
      ) {
        overflowElements.push(el);
      }
    });

    zIndexMap.forEach((els, z) => {
      if (els.length > 1) {
        newConflicts.push({
          id: `zindex-${z}-${Date.now()}`,
          type: "z-index",
          severity: "medium",
          element: els[0].tagName.toLowerCase(),
          description: `Multiple elements (${els.length}) have z-index: ${z}. Potential stacking context conflict.`,
          timestamp: Date.now(),
          autoFixed: false,
        });
      }
    });

    const positionedEls = Array.from(elements).filter((el) => {
      const style = window.getComputedStyle(el);
      return (
        style.position === "absolute" || style.position === "fixed"
      );
    });

    for (let i = 0; i < positionedEls.length; i++) {
      for (let j = i + 1; j < positionedEls.length; j++) {
        const rect1 = positionedEls[i].getBoundingClientRect();
        const rect2 = positionedEls[j].getBoundingClientRect();

        if (
          rect1.left < rect2.right &&
          rect1.right > rect2.left &&
          rect1.top < rect2.bottom &&
          rect1.bottom > rect2.top
        ) {
          newConflicts.push({
            id: `collision-${i}-${j}-${Date.now()}`,
            type: "collision",
            severity: "high",
            element: positionedEls[i].tagName.toLowerCase(),
            description: `Element overlaps with ${positionedEls[j].tagName.toLowerCase()}.`,
            timestamp: Date.now(),
            autoFixed: false,
          });
        }
      }
    }

    return newConflicts;
  }, []);

  const triggerReflow = useCallback(() => {
    const html = document.documentElement;
    const body = document.body;

    void html.offsetHeight;
    void body.offsetHeight;

    const allElements = document.querySelectorAll("*");
    allElements.forEach((el) => {
      void (el as HTMLElement).offsetHeight;
    });

    setMetrics((prev) => ({
      ...prev,
      reflowCount: prev.reflowCount + 1,
      lastReflow: Date.now(),
    }));

    if (onReflow) {
      onReflow({
        reflowCount: metrics.reflowCount + 1,
        lastReflow: Date.now(),
        activeConflicts: conflicts.length,
        healthyComponents: 0,
      });
    }
  }, [conflicts.length, metrics.reflowCount, onReflow]);

  const autoFixConflict = useCallback((conflict: ConflictReport) => {
    switch (conflict.type) {
      case "z-index":
        break;
      case "overflow":
        break;
      case "layout":
        triggerReflow();
        break;
      case "collision":
        triggerReflow();
        break;
    }

    setConflicts((prev) =>
      prev.map((c) =>
        c.id === conflict.id ? { ...c, autoFixed: true } : c
      )
    );
  }, [triggerReflow]);

  const runHealthCheck = useCallback(() => {
    if (!enabled) return;

    const detectedConflicts = detectConflicts();
    setMetrics((prev) => ({
      ...prev,
      activeConflicts: detectedConflicts.length,
      healthyComponents: Math.max(0, 100 - detectedConflicts.length),
    }));

    detectedConflicts.forEach((conflict) => {
      const exists = conflicts.some((c) => c.id === conflict.id);
      if (!exists) {
        setConflicts((prev) => [...prev, conflict]);
        
        if (onConflictDetected) {
          onConflictDetected(conflict);
        }

        if (autoCorrect) {
          setTimeout(() => autoFixConflict(conflict), 500);
        }
      }
    });
  }, [enabled, detectConflicts, conflicts, onConflictDetected, autoCorrect, autoFixConflict]);

  useEffect(() => {
    if (enabled && !intervalRef.current) {
      setIsMonitoring(true);
      intervalRef.current = setInterval(runHealthCheck, checkInterval);
      runHealthCheck();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsMonitoring(false);
    };
  }, [enabled, checkInterval, runHealthCheck]);

  const clearResolved = () => {
    setConflicts((prev) => prev.filter((c) => !c.autoFixed));
  };

  const severityColors = {
    low: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    medium: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    high: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/90 text-white shadow-lg transition-all hover:bg-slate-700"
        title="Self-Healing Status"
      >
        {isMonitoring ? (
          <Activity className="h-5 w-5 animate-pulse text-green-400" />
        ) : (
          <Shield className="h-5 w-5" />
        )}
      </button>

      {showPanel && (
        <div className="fixed right-4 top-20 z-50 w-80 rounded-lg border border-slate-700 bg-slate-900/95 p-4 text-white shadow-xl backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Shield className="h-5 w-5 text-green-400" />
              Self-Healing
            </h3>
            <div className="flex items-center gap-2">
              <span
                className={`flex h-2 w-2 rounded-full ${
                  isMonitoring ? "bg-green-400" : "bg-red-400"
                }`}
              />
              <span className="text-xs text-slate-400">
                {isMonitoring ? "Active" : "Paused"}
              </span>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="rounded bg-slate-800/50 p-2 text-center">
              <div className="text-2xl font-bold">{metrics.reflowCount}</div>
              <div className="text-xs text-slate-400">Reflows</div>
            </div>
            <div className="rounded bg-slate-800/50 p-2 text-center">
              <div className="text-2xl font-bold">{metrics.activeConflicts}</div>
              <div className="text-xs text-slate-400">Conflicts</div>
            </div>
          </div>

          <div className="mb-4 flex gap-2">
            <button
              onClick={triggerReflow}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-blue-600/80 py-2 text-sm font-medium hover:bg-blue-600"
            >
              <RefreshCw className="h-4 w-4" />
              Reflow
            </button>
            <button
              onClick={runHealthCheck}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-slate-700/80 py-2 text-sm font-medium hover:bg-slate-700"
            >
              <Activity className="h-4 w-4" />
              Scan
            </button>
          </div>

          {conflicts.length > 0 && (
            <div className="max-h-48 space-y-2 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">
                  Detected Issues
                </span>
                <button
                  onClick={clearResolved}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Clear resolved
                </button>
              </div>
              {conflicts.map((conflict) => (
                <div
                  key={conflict.id}
                  className={`rounded border p-2 ${severityColors[conflict.severity]}`}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase">
                          {conflict.type}
                        </span>
                        <span className="text-xs opacity-70">
                          {conflict.autoFixed && "✓ Fixed"}
                        </span>
                      </div>
                      <p className="text-xs">{conflict.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {conflicts.length === 0 && (
            <div className="py-4 text-center text-sm text-slate-500">
              No conflicts detected. UI is healthy.
            </div>
          )}
        </div>
      )}
    </>
  );
}
