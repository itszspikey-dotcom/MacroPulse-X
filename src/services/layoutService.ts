export type LayoutMode =
  | 'command-dock'
  | 'top-nav-grid'
  | 'focus-dial'
  | 'split-workspace'
  | 'dense-hud';

export interface LayoutConfig {
  id: LayoutMode;
  name: string;
  subtitle: string;
  tagline: string;
  icon: string;
  highlights: string[];
  recommendedFor: string;
  previewWireframe: 'dock' | 'topbar' | 'dial' | 'split' | 'dense';
}

export const APP_LAYOUTS: LayoutConfig[] = [
  {
    id: 'command-dock',
    name: 'Command Dock',
    subtitle: 'Opera GX Inspired Cockpit',
    tagline: 'Collapsible icon-only left dock, top macro telemetry ribbon, and 2-column split main area.',
    icon: '⚡',
    highlights: [
      'Collapsible icon-only left dock with instant tooltips',
      'Top horizontal telemetry ribbon for Protein, Carbs & Fats',
      '2-column split: Meal logger timeline on left, Caloric Balance & Hydration on right',
      'Optimized for fast keyboard/mouse workflows',
    ],
    recommendedFor: 'Power users & multi-tasking desktop setups',
    previewWireframe: 'dock',
  },
  {
    id: 'top-nav-grid',
    name: 'Top Nav & Modular Grid',
    subtitle: 'Full-Width Workspace',
    tagline: 'No sidebar! Full-width top navigation bar with a uniform 3-column metric grid and timeline.',
    icon: '📐',
    highlights: [
      'Comprehensive horizontal top bar navigation (No side rail)',
      'Uniform 3-column modular card grid for Calories, Macros & Hydration',
      'Wide-canvas full-width meal activity timeline below',
      'Balanced, spacious dashboard layout',
    ],
    recommendedFor: 'Laptops, widescreen monitors & clean grid lovers',
    previewWireframe: 'topbar',
  },
  {
    id: 'focus-dial',
    name: 'Focus Dial',
    subtitle: 'Single-Column Hero Ring',
    tagline: 'Giant central Calorie hero ring, mini tabbed macro pill card, and sticky floating bottom action dock.',
    icon: '🎯',
    highlights: [
      'Single-column centered layout (max-w-2xl)',
      'High-impact giant central Calorie hero dial',
      'Tabbed mini-card for macros breakdown and water stats',
      'Sticky bottom floating pill dock with fast add & scan shortcuts',
    ],
    recommendedFor: 'Mobile-first, tablets & high-focus single-metric tracking',
    previewWireframe: 'dial',
  },
  {
    id: 'split-workspace',
    name: 'Split Workspace',
    subtitle: 'Fixed 50/50 Dual Studio',
    tagline: 'Fixed split-screen: Left side holds target gauges and hydration; Right side is the scrollable meal timeline.',
    icon: '⚖️',
    highlights: [
      'Fixed 50/50 split workspace on desktop and tablet',
      'Left sticky panel: Caloric dial, macro targets, hydration & deficit',
      'Right scrollable panel: Meal categories, food logs & quick add',
      'Zero jumping between summary and meal logging',
    ],
    recommendedFor: 'Simultaneous planning and intensive meal logging',
    previewWireframe: 'split',
  },
  {
    id: 'dense-hud',
    name: 'Dense HUD',
    subtitle: 'Zero-Scroll Compact Cockpit',
    tagline: 'Compact horizontal macro progress rows across the top, and meal logs display as a compact table view below.',
    icon: '📊',
    highlights: [
      'Zero-scroll dense telemetry cockpit view',
      'All macro cards condensed into compact horizontal progress rows',
      'Itemized compact table view for all logged meals with inline actions',
      'Maximum data density and instant biometric readouts',
    ],
    recommendedFor: 'High-density tracking, athletes & spreadsheet fans',
    previewWireframe: 'dense',
  },
];

const LAYOUT_STORAGE_KEY = 'macropulse_ui_layout_mode_v1';
const DEFAULT_LAYOUT: LayoutMode = 'command-dock';

export class LayoutService {
  private currentLayout: LayoutMode = DEFAULT_LAYOUT;
  private listeners: Array<(layout: LayoutMode) => void> = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const stored = localStorage.getItem(LAYOUT_STORAGE_KEY) as LayoutMode;
      if (stored && APP_LAYOUTS.some((l) => l.id === stored)) {
        this.currentLayout = stored;
      } else {
        this.currentLayout = DEFAULT_LAYOUT;
      }
    } catch {
      this.currentLayout = DEFAULT_LAYOUT;
    }
  }

  public getLayouts(): LayoutConfig[] {
    return APP_LAYOUTS;
  }

  public getLayout(): LayoutMode {
    return this.currentLayout;
  }

  public getLayoutConfig(layoutId?: LayoutMode): LayoutConfig {
    const id = layoutId || this.currentLayout;
    return APP_LAYOUTS.find((l) => l.id === id) || APP_LAYOUTS[0];
  }

  public setLayout(layout: LayoutMode) {
    if (!APP_LAYOUTS.some((l) => l.id === layout)) return;
    this.currentLayout = layout;
    try {
      localStorage.setItem(LAYOUT_STORAGE_KEY, layout);
    } catch (e) {
      console.warn('Could not persist layout mode', e);
    }
    this.notify();
  }

  public subscribe(callback: (layout: LayoutMode) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentLayout);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb(this.currentLayout);
      } catch (err) {
        console.error('Error in layout subscriber', err);
      }
    });
  }
}

export const layoutService = new LayoutService();
