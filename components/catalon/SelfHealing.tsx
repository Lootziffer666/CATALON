'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, RefreshCw, Shield, Activity } from 'lucide-react';

interface Conflict {
  id: string;
  type: 'css' | 'layout' | 'z-index' | 'overflow';
  severity: 'low' | 'medium' | 'high';
  description: string;
  element?: string;
  suggestedFix?: string;
  autoFixed?: boolean;
}

interface UIHealthMetrics {
  layoutConflicts: number;
  cssConflicts: number;
  zIndexIssues: number;
  overflowIssues: number;
  lastScanAt: Date | null;
}

interface SelfHealingProps {
  className?: string;
  autoScanInterval?: number;
  enabled?: boolean;
}

export function SelfHealing({
  className,
  autoScanInterval = 5000,
  enabled = true,
}: SelfHealingProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<UIHealthMetrics>({
    layoutConflicts: 0,
    cssConflicts: 0,
    zIndexIssues: 0,
    overflowIssues: 0,
    lastScanAt: null,
  });
  const [isHealthy, setIsHealthy] = useState(true);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const detectConflicts = useCallback((): Conflict[] => {
    const detectedConflicts: Conflict[] = [];
    const elements = document.querySelectorAll('*');
    
    const elementArray = Array.from(elements);
    
    elementArray.forEach((el, index) => {
      const computedStyle = window.getComputedStyle(el);
      
      if (computedStyle.overflow === 'hidden' && 
          el.scrollHeight > el.clientHeight) {
        detectedConflicts.push({
          id: `overflow-${index}`,
          type: 'overflow',
          severity: 'medium',
          description: 'Content overflows hidden overflow setting',
          element: el.tagName.toLowerCase(),
          suggestedFix: 'Change overflow to auto or visible',
        });
      }
      
      if (computedStyle.position === 'absolute' || computedStyle.position === 'fixed') {
        const zIndex = parseInt(computedStyle.zIndex);
        if (!isNaN(zIndex) && zIndex < 0) {
          detectedConflicts.push({
            id: `zindex-${index}`,
            type: 'z-index',
            severity: 'low',
            description: 'Negative z-index on positioned element',
            element: el.tagName.toLowerCase(),
            suggestedFix: 'Increase z-index to positive value',
          });
        }
      }
      
      const parent = el.parentElement;
      if (parent) {
        const parentStyle = window.getComputedStyle(parent);
        if (parentStyle.position === 'relative' && computedStyle.position === 'absolute') {
          const rect = el.getBoundingClientRect();
          const parentRect = parent.getBoundingClientRect();
          
          if (rect.left < parentRect.left || rect.top < parentRect.top) {
            detectedConflicts.push({
              id: `layout-${index}`,
              type: 'layout',
              severity: 'high',
              description: 'Positioned element extends beyond parent bounds',
              element: el.tagName.toLowerCase(),
              suggestedFix: 'Adjust position or add proper parent constraints',
            });
          }
        }
      }
    });
    
    return detectedConflicts;
  }, []);

  const autoFixConflict = useCallback((conflict: Conflict): boolean => {
    const elements = document.querySelectorAll('*');
    
    for (const el of elements) {
      if (conflict.type === 'overflow' && el.scrollHeight > el.clientHeight) {
        (el as HTMLElement).style.overflow = 'auto';
        return true;
      }
      
      if (conflict.type === 'z-index' && conflict.severity === 'low') {
        const computedStyle = window.getComputedStyle(el);
        const zIndex = parseInt(computedStyle.zIndex);
        if (!isNaN(zIndex) && zIndex < 0) {
          (el as HTMLElement).style.zIndex = '1';
          return true;
        }
      }
    }
    
    return false;
  }, []);

  const runScan = useCallback(async () => {
    if (!enabled) return;
    
    setIsScanning(true);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const detected = detectConflicts();
    
    const newConflicts = conflicts.filter(c => !c.autoFixed);
    const allConflicts = [...newConflicts, ...detected];
    
    setConflicts(allConflicts);
    
    setHealthMetrics({
      layoutConflicts: allConflicts.filter(c => c.type === 'layout').length,
      cssConflicts: allConflicts.filter(c => c.type === 'css').length,
      zIndexIssues: allConflicts.filter(c => c.type === 'z-index').length,
      overflowIssues: allConflicts.filter(c => c.type === 'overflow').length,
      lastScanAt: new Date(),
    });
    
    setIsHealthy(allConflicts.length === 0);
    setIsScanning(false);
  }, [enabled, detectConflicts, conflicts]);

  const runAutoFix = useCallback(async () => {
    const unfixedConflicts = conflicts.filter(c => !c.autoFixed);
    
    for (const conflict of unfixedConflicts) {
      if (conflict.severity !== 'high') {
        const fixed = autoFixConflict(conflict);
        if (fixed) {
          setConflicts(prev => prev.map(c => 
            c.id === conflict.id ? { ...c, autoFixed: true } : c
          ));
        }
      }
    }
    
    await runScan();
  }, [conflicts, autoFixConflict, runScan]);

  const handleFixConflict = useCallback((conflictId: string) => {
    const conflict = conflicts.find(c => c.id === conflictId);
    if (conflict) {
      const fixed = autoFixConflict(conflict);
      if (fixed) {
        setConflicts(prev => prev.map(c => 
          c.id === conflictId ? { ...c, autoFixed: true } : c
        ));
      }
    }
  }, [conflicts, autoFixConflict]);

  useEffect(() => {
    if (enabled) {
      runScan();
      
      scanIntervalRef.current = setInterval(runScan, autoScanInterval);
      
      return () => {
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
        }
      };
    }
  }, [enabled, autoScanInterval, runScan]);

  useEffect(() => {
    if (!isHealthy && conflicts.filter(c => !c.autoFixed).length > 0) {
      const unfixedConflicts = conflicts.filter(c => !c.autoFixed);
      const autoFixable = unfixedConflicts.filter(c => c.severity !== 'high');
      
      if (autoFixable.length > 0) {
        const timer = setTimeout(runAutoFix, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isHealthy, conflicts, runAutoFix]);

  return (
    <div className={cn('rounded-lg border border-neutral-800 bg-neutral-900 p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className={cn('w-5 h-5', isHealthy ? 'text-green-500' : 'text-yellow-500')} />
          <h3 className="text-sm font-medium text-neutral-100">Self-Healing</h3>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-neutral-400" />
          <span className={cn('text-xs font-medium', isHealthy ? 'text-green-500' : 'text-yellow-500')}>
            {isHealthy ? 'Healthy' : 'Issues Detected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 rounded bg-neutral-800">
          <div className="text-lg font-bold text-neutral-100">{healthMetrics.layoutConflicts}</div>
          <div className="text-xs text-neutral-400">Layout</div>
        </div>
        <div className="text-center p-2 rounded bg-neutral-800">
          <div className="text-lg font-bold text-neutral-100">{healthMetrics.cssConflicts}</div>
          <div className="text-xs text-neutral-400">CSS</div>
        </div>
        <div className="text-center p-2 rounded bg-neutral-800">
          <div className="text-lg font-bold text-neutral-100">{healthMetrics.zIndexIssues}</div>
          <div className="text-xs text-neutral-400">Z-Index</div>
        </div>
        <div className="text-center p-2 rounded bg-neutral-800">
          <div className="text-lg font-bold text-neutral-100">{healthMetrics.overflowIssues}</div>
          <div className="text-xs text-neutral-400">Overflow</div>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {conflicts.filter(c => !c.autoFixed).map((conflict) => (
            <div
              key={conflict.id}
              className={cn(
                'flex items-start gap-2 p-2 rounded text-sm',
                conflict.severity === 'high' ? 'bg-red-900/30' :
                conflict.severity === 'medium' ? 'bg-yellow-900/30' :
                'bg-neutral-800'
              )}
            >
              <AlertTriangle className={cn(
                'w-4 h-4 mt-0.5 flex-shrink-0',
                conflict.severity === 'high' ? 'text-red-500' :
                conflict.severity === 'medium' ? 'text-yellow-500' :
                'text-blue-500'
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-neutral-200 text-xs">{conflict.description}</p>
                <p className="text-neutral-400 text-xs mt-1">{conflict.suggestedFix}</p>
              </div>
              <button
                onClick={() => handleFixConflict(conflict.id)}
                className="flex-shrink-0 p-1 rounded hover:bg-neutral-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4 text-green-500" />
              </button>
            </div>
          ))}
          {conflicts.filter(c => c.autoFixed).length > 0 && (
            <div className="flex items-center gap-2 p-2 rounded bg-green-900/20 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-400 text-xs">
                {conflicts.filter(c => c.autoFixed).length} issue(s) auto-fixed
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={runScan}
          disabled={isScanning}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors text-sm text-neutral-200 disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', isScanning && 'animate-spin')} />
          {isScanning ? 'Scanning...' : 'Scan Now'}
        </button>
        <button
          onClick={runAutoFix}
          disabled={isScanning || conflicts.filter(c => !c.autoFixed).length === 0}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded bg-green-900/50 hover:bg-green-900/70 transition-colors text-sm text-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Shield className="w-4 h-4" />
          Auto-Fix
        </button>
      </div>

      {healthMetrics.lastScanAt && (
        <p className="text-xs text-neutral-500 mt-2 text-center">
          Last scan: {healthMetrics.lastScanAt.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
