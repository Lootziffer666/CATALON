export interface IntegrityCheck {
  passed: boolean;
  issues: IntegrityIssue[];
}

export interface IntegrityIssue {
  type: 'layout' | 'style' | 'accessibility' | 'performance';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  element?: string;
  fixAvailable: boolean;
}

export interface CSSConflict {
  selector: string;
  property: string;
  conflictingValues: string[];
  source: 'inline' | 'external' | 'user-agent' | 'computed';
}

export interface LayoutReflowResult {
  success: boolean;
  changes: LayoutChange[];
  timestamp: number;
}

export interface LayoutChange {
  element: string;
  property: string;
  oldValue: string;
  newValue: string;
}

export interface MonitorConfig {
  checkInterval: number;
  enableCSSConflictDetection: boolean;
  enableLayoutReflow: boolean;
  maxRetries: number;
}

export type IntegrityCallback = (issues: IntegrityIssue[]) => void;

const DEFAULT_CONFIG: MonitorConfig = {
  checkInterval: 5000,
  enableCSSConflictDetection: true,
  enableLayoutReflow: true,
  maxRetries: 3,
};

export function createIntegrityCheck(elements: HTMLElement[]): IntegrityCheck {
  const issues: IntegrityIssue[] = [];

  elements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      issues.push({
        type: 'layout',
        severity: 'critical',
        message: 'Element has zero dimensions',
        element: el.id || el.className,
        fixAvailable: true,
      });
    }

    const overflowX = window.getComputedStyle(el).overflowX;
    const overflowY = window.getComputedStyle(el).overflowY;
    if ((overflowX === 'hidden' && el.scrollWidth > el.clientWidth) ||
        (overflowY === 'hidden' && el.scrollHeight > el.clientHeight)) {
      issues.push({
        type: 'layout',
        severity: 'warning',
        message: 'Hidden overflow with scrollable content',
        element: el.id || el.className,
        fixAvailable: true,
      });
    }

    const contrast = getContrastRatio(el);
    if (contrast < 4.5) {
      issues.push({
        type: 'accessibility',
        severity: 'warning',
        message: 'Low contrast ratio detected',
        element: el.id || el.className,
        fixAvailable: false,
      });
    }
  });

  return {
    passed: issues.filter(i => i.severity === 'critical').length === 0,
    issues,
  };
}

function getContrastRatio(element: HTMLElement): number {
  const style = window.getComputedStyle(element);
  const bgColor = style.backgroundColor;
  const textColor = style.color;

  const bgLuminance = getLuminance(bgColor);
  const textLuminance = getLuminance(textColor);

  const lighter = Math.max(bgLuminance, textLuminance);
  const darker = Math.min(bgLuminance, textLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

function getLuminance(color: string): number {
  const rgb = parseRGB(color);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function parseRGB(color: string): number[] | null {
  const match = color.match(/\d+/g);
  if (!match || match.length < 3) return null;
  return match.slice(0, 3).map(Number);
}

export function detectCSSConflicts(element: HTMLElement): CSSConflict[] {
  const conflicts: CSSConflict[] = [];
  const computedStyle = window.getComputedStyle(element);
  const inlineStyle = element.style;

  const propertiesToCheck = ['display', 'position', 'overflow', 'zIndex', 'flex', 'grid'];

  propertiesToCheck.forEach((prop) => {
    const computedValue = computedStyle.getPropertyValue(prop).trim();
    const inlineValue = inlineStyle.getPropertyValue(prop).trim();

    if (inlineValue && computedValue && inlineValue !== computedValue) {
      conflicts.push({
        selector: element.id ? `#${element.id}` : element.className.split(' ')[0],
        property: prop,
        conflictingValues: [inlineValue, computedValue],
        source: inlineValue ? 'inline' : 'external',
      });
    }
  });

  return conflicts;
}

export function resolveCSSConflict(conflict: CSSConflict, element: HTMLElement): boolean {
  try {
    if (conflict.property === 'overflow') {
      element.style.overflow = 'auto';
      return true;
    }
    if (conflict.property === 'position') {
      element.style.position = 'relative';
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function performLayoutReflow(element: HTMLElement): LayoutReflowResult {
  const changes: LayoutChange[] = [];
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  if (style.overflow === 'hidden' && (element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight)) {
    const oldValue = style.overflow;
    element.style.overflow = 'auto';
    changes.push({
      element: element.id || element.className,
      property: 'overflow',
      oldValue,
      newValue: 'auto',
    });
  }

  if (style.position === 'fixed' && rect.top < 0) {
    const oldValue = style.position;
    element.style.position = 'absolute';
    changes.push({
      element: element.id || element.className,
      property: 'position',
      oldValue,
      newValue: 'absolute',
    });
  }

  if (style.display === 'flex' && style.flexDirection === 'row' && element.children.length > 0) {
    const containerWidth = element.clientWidth;
    let totalWidth = 0;
    Array.from(element.children).forEach(child => {
      totalWidth += (child as HTMLElement).offsetWidth;
    });

    if (totalWidth > containerWidth) {
      element.style.flexWrap = 'wrap';
      changes.push({
        element: element.id || element.className,
        property: 'flex-wrap',
        oldValue: 'nowrap',
        newValue: 'wrap',
      });
    }
  }

  return {
    success: changes.length > 0,
    changes,
    timestamp: Date.now(),
  };
}

export class SelfHealingMonitor {
  private config: MonitorConfig;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private callback: IntegrityCallback | null = null;
  private targetElements: HTMLElement[] = [];

  constructor(config: Partial<MonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  start(elements: HTMLElement[], callback: IntegrityCallback): void {
    this.targetElements = elements;
    this.callback = callback;

    this.intervalId = setInterval(() => {
      this.check();
    }, this.config.checkInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private check(): void {
    if (!this.callback || this.targetElements.length === 0) return;

    const validElements = this.targetElements.filter(el => {
      if (!document.body.contains(el)) {
        this.targetElements = this.targetElements.filter(e => e !== el);
        return false;
      }
      return true;
    });

    const integrity = createIntegrityCheck(validElements);

    if (!integrity.passed) {
      this.callback(integrity.issues);

      if (this.config.enableLayoutReflow) {
        validElements.forEach(el => {
          const result = performLayoutReflow(el);
          if (!result.success && this.config.enableCSSConflictDetection) {
            const conflicts = detectCSSConflicts(el);
            conflicts.forEach(conflict => resolveCSSConflict(conflict, el));
          }
        });
      }
    }
  }

  checkNow(): IntegrityCheck {
    return createIntegrityCheck(this.targetElements);
  }

  reflowNow(): LayoutReflowResult[] {
    return this.targetElements.map(el => performLayoutReflow(el));
  }
}

export function createSelfHealingMonitor(config?: Partial<MonitorConfig>): SelfHealingMonitor {
  return new SelfHealingMonitor(config);
}

export function fixLayoutIssue(element: HTMLElement, issue: IntegrityIssue): boolean {
  if (!issue.fixAvailable) return false;

  if (issue.message.includes('zero dimensions')) {
    element.style.minWidth = '1px';
    element.style.minHeight = '1px';
    return true;
  }

  if (issue.message.includes('Hidden overflow')) {
    element.style.overflow = 'auto';
    return true;
  }

  return false;
}
