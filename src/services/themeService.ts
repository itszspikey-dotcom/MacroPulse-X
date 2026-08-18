export type StructuralStyleId = 
  | 'athletic-dark'
  | 'cyberpunk-hud'
  | 'neo-brutalism'
  | 'glassmorphism'
  | 'swiss-editorial'
  | 'retro-terminal';

export type ThemeCategory = 'all' | 'structural' | 'dark' | 'vibrant' | 'minimal' | 'light' | 'performance';

export interface StructuralStyleConfig {
  id: StructuralStyleId;
  name: string;
  subtitle: string;
  description: string;
  fontDisplay: string;
  fontMono: string;
  fontBody: string;
  cardRadius: string;
  cardClipPath?: string;
  btnRadius: string;
  btnClipPath?: string;
  cardBorderWidth: string;
  cardBorderStyle: 'solid' | 'dashed' | 'dotted' | 'none';
  cardShadow: string;
  cardBackdropBlur: string;
  letterSpacingDisplay: string;
  badgeStyle: 'solid' | 'glow' | 'brutal' | 'glass' | 'editorial' | 'crt';
}

export interface AppTheme {
  id: string;
  name: string;
  tagline: string;
  category: ThemeCategory;
  structuralStyle: StructuralStyleId;
  icon: string;
  isLight?: boolean;
  
  // Palette definition
  colors: {
    accent: string;            // Primary signature accent hex (e.g. #facc15, #06b6d4)
    accentHover: string;       // Hover state
    accentText: string;        // Text on accent button (#0b0b0c or #ffffff)
    accentGlow: string;        // Glow rgba
    secondary: string;         // Secondary accent color (e.g. #10b981)
    
    bg: string;                // Main app background
    cardBg: string;            // Card surface background
    cardBgElevated: string;    // Elevated modals & dropdowns
    sidebarBg: string;         // Sidebar rail background
    headerBg: string;          // Header background
    
    border: string;            // Standard card/divider border
    borderAccent: string;      // Accent-tinted border
    borderHover: string;       // Border on hover
    
    text: string;              // Primary text color
    textSecondary: string;     // Secondary text color
    textMuted: string;         // Muted metadata / labels
    
    ambient1: string;          // Ambient radial top-right
    ambient2: string;          // Ambient radial bottom-left
  };
  
  // UI preview swatches (4 colors for UI picker badges)
  previewPalette: [string, string, string, string];
  
  // UI styling cues
  fontAtmosphere: string;
  badgeLabel: string;
  structuralDetails?: string[];
}

export const STRUCTURAL_STYLES: Record<StructuralStyleId, StructuralStyleConfig> = {
  'athletic-dark': {
    id: 'athletic-dark',
    name: 'Athletic Dark',
    subtitle: 'Default High-Performance',
    description: 'Condensed bold display headers, dark slate panels, electric gold tags, and subtle metallic borders.',
    fontDisplay: "'Oswald', sans-serif",
    fontMono: "'Geist Mono', monospace",
    fontBody: "'Geist', sans-serif",
    cardRadius: '16px',
    cardClipPath: 'none',
    btnRadius: '10px',
    btnClipPath: 'none',
    cardBorderWidth: '1px',
    cardBorderStyle: 'solid',
    cardShadow: '0 10px 30px -10px rgba(0,0,0,0.6)',
    cardBackdropBlur: 'none',
    letterSpacingDisplay: '0.04em',
    badgeStyle: 'solid',
  },
  'cyberpunk-hud': {
    id: 'cyberpunk-hud',
    name: 'Cyberpunk HUD',
    subtitle: 'Angled Chamfers & Neon Glow',
    description: 'Clipped angled corners on cards, subtle scanline/grid overlay, glowing neon cyan borders, and monospace telemetry.',
    fontDisplay: "'Orbitron', 'Geist Mono', monospace",
    fontMono: "'Share Tech Mono', 'Geist Mono', monospace",
    fontBody: "'Share Tech Mono', sans-serif",
    cardRadius: '0px',
    cardClipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
    btnRadius: '0px',
    btnClipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
    cardBorderWidth: '1px',
    cardBorderStyle: 'solid',
    cardShadow: '0 0 20px rgba(6, 182, 212, 0.25), inset 0 0 15px rgba(6, 182, 212, 0.05)',
    cardBackdropBlur: 'blur(8px)',
    letterSpacingDisplay: '0.08em',
    badgeStyle: 'glow',
  },
  'neo-brutalism': {
    id: 'neo-brutalism',
    name: 'Neo-Brutalism',
    subtitle: 'Zero-Radius & Hard Drop-Shadows',
    description: 'Solid thick outlines (2px solid), sharp zero-radius corners, hard 4px offset solid drop-shadows, and high-voltage flat accents.',
    fontDisplay: "'Space Grotesk', 'Oswald', sans-serif",
    fontMono: "'Space Grotesk', monospace",
    fontBody: "'Space Grotesk', sans-serif",
    cardRadius: '0px',
    cardClipPath: 'none',
    btnRadius: '0px',
    btnClipPath: 'none',
    cardBorderWidth: '2px',
    cardBorderStyle: 'solid',
    cardShadow: '4px 4px 0px 0px #000000, 5px 5px 0px 0px var(--accent)',
    cardBackdropBlur: 'none',
    letterSpacingDisplay: '-0.02em',
    badgeStyle: 'brutal',
  },
  'glassmorphism': {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    subtitle: 'Translucent Glass & Soft Lighting',
    description: 'Translucent frosted glass with backdrop-blur-xl, smooth rounded-2xl curves, 1px soft translucent border lines, and subtle specular glow.',
    fontDisplay: "'Geist', -apple-system, BlinkMacSystemFont, sans-serif",
    fontMono: "'Geist Mono', monospace",
    fontBody: "'Geist', sans-serif",
    cardRadius: '24px',
    cardClipPath: 'none',
    btnRadius: '16px',
    btnClipPath: 'none',
    cardBorderWidth: '1px',
    cardBorderStyle: 'solid',
    cardShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.45), inset 0 1px 1px 0 rgba(255, 255, 255, 0.18)',
    cardBackdropBlur: 'blur(24px)',
    letterSpacingDisplay: '-0.01em',
    badgeStyle: 'glass',
  },
  'swiss-editorial': {
    id: 'swiss-editorial',
    name: 'Swiss Editorial',
    subtitle: 'Minimalist Monochrome Typography',
    description: 'Minimalist monochrome layout, hairline divider lines instead of heavy card containers, large editorial serif headers, and generous white space.',
    fontDisplay: "'Playfair Display', Georgia, serif",
    fontMono: "'Geist Mono', monospace",
    fontBody: "'Geist', sans-serif",
    cardRadius: '2px',
    cardClipPath: 'none',
    btnRadius: '0px',
    btnClipPath: 'none',
    cardBorderWidth: '1px',
    cardBorderStyle: 'solid',
    cardShadow: 'none',
    cardBackdropBlur: 'none',
    letterSpacingDisplay: '0.01em',
    badgeStyle: 'editorial',
  },
  'retro-terminal': {
    id: 'retro-terminal',
    name: 'Retro Terminal',
    subtitle: 'Phosphor CRT & Dotted Pixel Grid',
    description: 'True pitch-black base, CRT-green or amber phosphor text glow, segmented pixel font for big numbers, and dashed/dotted card borders.',
    fontDisplay: "'VT323', monospace",
    fontMono: "'VT323', monospace",
    fontBody: "'Share Tech Mono', monospace",
    cardRadius: '0px',
    cardClipPath: 'none',
    btnRadius: '0px',
    btnClipPath: 'none',
    cardBorderWidth: '1.5px',
    cardBorderStyle: 'dashed',
    cardShadow: '0 0 12px rgba(0, 255, 102, 0.18), inset 0 0 8px rgba(0, 255, 102, 0.08)',
    cardBackdropBlur: 'none',
    letterSpacingDisplay: '0.08em',
    badgeStyle: 'crt',
  },
};

export const APP_THEMES: AppTheme[] = [
  // 1. ATHLETIC DARK (DEFAULT)
  {
    id: 'athletic-dark',
    name: 'Athletic Dark',
    tagline: 'Condensed bold display headers, dark slate panels, and electric gold performance tags',
    category: 'structural',
    structuralStyle: 'athletic-dark',
    icon: '⚡',
    isLight: false,
    colors: {
      accent: '#facc15',
      accentHover: '#fde047',
      accentText: '#0b0b0c',
      accentGlow: 'rgba(250, 204, 21, 0.25)',
      secondary: '#10b981',
      bg: '#0b0b0c',
      cardBg: '#141416',
      cardBgElevated: '#1a1a1e',
      sidebarBg: '#0b0b0c',
      headerBg: 'rgba(11, 11, 12, 0.92)',
      border: 'rgba(255, 255, 255, 0.10)',
      borderAccent: 'rgba(250, 204, 21, 0.35)',
      borderHover: 'rgba(250, 204, 21, 0.50)',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.70)',
      textMuted: 'rgba(255, 255, 255, 0.40)',
      ambient1: 'rgba(250, 204, 21, 0.045)',
      ambient2: 'rgba(16, 185, 129, 0.040)',
    },
    previewPalette: ['#0b0b0c', '#141416', '#facc15', '#10b981'],
    fontAtmosphere: 'Oswald Bold • Slate 900',
    badgeLabel: 'DEFAULT STYLE',
    structuralDetails: [
      'Condensed bold Oswald headers',
      'Solid 16px rounded slate panels',
      'Electric Gold & Emerald metrics',
      'Subtle metallic border transitions',
    ],
  },

  // 2. CYBERPUNK HUD
  {
    id: 'cyberpunk-hud',
    name: 'Cyberpunk HUD',
    tagline: 'Clipped angled corners, glowing neon cyan/magenta borders & telemetry scanline grid',
    category: 'structural',
    structuralStyle: 'cyberpunk-hud',
    icon: '🌌',
    isLight: false,
    colors: {
      accent: '#06b6d4',
      accentHover: '#22d3ee',
      accentText: '#041019',
      accentGlow: 'rgba(6, 182, 212, 0.40)',
      secondary: '#ec4899',
      bg: '#05070e',
      cardBg: '#0b101c',
      cardBgElevated: '#11182c',
      sidebarBg: '#04060b',
      headerBg: 'rgba(5, 7, 14, 0.92)',
      border: 'rgba(6, 182, 212, 0.25)',
      borderAccent: 'rgba(6, 182, 212, 0.65)',
      borderHover: 'rgba(236, 72, 153, 0.75)',
      text: '#e0f2fe',
      textSecondary: 'rgba(224, 242, 254, 0.75)',
      textMuted: 'rgba(125, 211, 252, 0.45)',
      ambient1: 'rgba(6, 182, 212, 0.09)',
      ambient2: 'rgba(236, 72, 153, 0.08)',
    },
    previewPalette: ['#05070e', '#0b101c', '#06b6d4', '#ec4899'],
    fontAtmosphere: 'Orbitron • Share Tech Mono',
    badgeLabel: 'HUD CHIP',
    structuralDetails: [
      'Angled polygon-clipped card corners',
      'Subtle scanline and telemetry grid',
      'Laser neon cyan & hot pink glow',
      'Monospace biometric readouts',
    ],
  },

  // 3. NEO-BRUTALISM
  {
    id: 'neo-brutalism',
    name: 'Neo-Brutalism',
    tagline: 'Thick 2px solid outlines, sharp zero-radius corners & hard 4px offset drop-shadows',
    category: 'structural',
    structuralStyle: 'neo-brutalism',
    icon: '⬛',
    isLight: false,
    colors: {
      accent: '#facc15',
      accentHover: '#fde047',
      accentText: '#000000',
      accentGlow: 'rgba(250, 204, 21, 0.15)',
      secondary: '#10b981',
      bg: '#121212',
      cardBg: '#1e1e1e',
      cardBgElevated: '#282828',
      sidebarBg: '#121212',
      headerBg: 'rgba(18, 18, 18, 0.95)',
      border: '#ffffff',
      borderAccent: '#facc15',
      borderHover: '#10b981',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.85)',
      textMuted: 'rgba(255, 255, 255, 0.60)',
      ambient1: 'rgba(250, 204, 21, 0.03)',
      ambient2: 'rgba(255, 255, 255, 0.02)',
    },
    previewPalette: ['#121212', '#1e1e1e', '#facc15', '#ffffff'],
    fontAtmosphere: 'Space Grotesk Solid',
    badgeLabel: 'HIGH CONTRAST',
    structuralDetails: [
      '2px solid high-contrast borders',
      'Zero-radius sharp corners (0px)',
      '4px hard solid drop-shadows',
      'Bold flat color blocks & badges',
    ],
  },

  // 4. GLASSMORPHISM
  {
    id: 'glassmorphism',
    name: 'Glassmorphism',
    tagline: 'Translucent frosted glass with backdrop-blur-xl, soft rounded-2xl curves & specular glow',
    category: 'structural',
    structuralStyle: 'glassmorphism',
    icon: '🔮',
    isLight: false,
    colors: {
      accent: '#818cf8',
      accentHover: '#a5b4fc',
      accentText: '#050714',
      accentGlow: 'rgba(129, 140, 248, 0.35)',
      secondary: '#38bdf8',
      bg: '#070a16',
      cardBg: 'rgba(255, 255, 255, 0.05)',
      cardBgElevated: 'rgba(255, 255, 255, 0.08)',
      sidebarBg: 'rgba(7, 10, 22, 0.75)',
      headerBg: 'rgba(7, 10, 22, 0.75)',
      border: 'rgba(255, 255, 255, 0.14)',
      borderAccent: 'rgba(129, 140, 248, 0.45)',
      borderHover: 'rgba(255, 255, 255, 0.30)',
      text: '#f8fafc',
      textSecondary: 'rgba(248, 250, 252, 0.75)',
      textMuted: 'rgba(203, 213, 225, 0.45)',
      ambient1: 'rgba(129, 140, 248, 0.12)',
      ambient2: 'rgba(56, 189, 248, 0.09)',
    },
    previewPalette: ['#070a16', 'rgba(255,255,255,0.08)', '#818cf8', '#38bdf8'],
    fontAtmosphere: 'Geist Sleek • Frosted Glass',
    badgeLabel: 'TRANSLUCENT',
    structuralDetails: [
      'Backdrop blur (24px) frosted acrylic',
      'Smooth 24px rounded-2xl corners',
      '1px translucent specular highlight borders',
      'Deep atmospheric floating shadows',
    ],
  },

  // 5. SWISS EDITORIAL
  {
    id: 'swiss-editorial',
    name: 'Swiss Editorial',
    tagline: 'Minimalist monochrome layout, hairline dividers, editorial serif typography & white space',
    category: 'structural',
    structuralStyle: 'swiss-editorial',
    icon: '📰',
    isLight: false,
    colors: {
      accent: '#e2e8f0',
      accentHover: '#ffffff',
      accentText: '#09090b',
      accentGlow: 'rgba(255, 255, 255, 0.15)',
      secondary: '#94a3b8',
      bg: '#09090b',
      cardBg: '#09090b',
      cardBgElevated: '#121215',
      sidebarBg: '#09090b',
      headerBg: 'rgba(9, 9, 11, 0.94)',
      border: 'rgba(255, 255, 255, 0.16)',
      borderAccent: 'rgba(255, 255, 255, 0.40)',
      borderHover: 'rgba(255, 255, 255, 0.60)',
      text: '#ffffff',
      textSecondary: 'rgba(255, 255, 255, 0.75)',
      textMuted: 'rgba(255, 255, 255, 0.45)',
      ambient1: 'rgba(255, 255, 255, 0.02)',
      ambient2: 'rgba(255, 255, 255, 0.015)',
    },
    previewPalette: ['#09090b', '#121215', '#ffffff', '#94a3b8'],
    fontAtmosphere: 'Playfair Serif • Hairline Grid',
    badgeLabel: 'EDITORIAL',
    structuralDetails: [
      'Large editorial serif display typography',
      'Hairline divider lines (1px minimal)',
      'Flat flush surfaces with zero clutter',
      'Refined monochrome balance & elegance',
    ],
  },

  // 6. RETRO TERMINAL
  {
    id: 'retro-terminal',
    name: 'Retro Terminal',
    tagline: 'Pitch-black base, CRT-green phosphor glow, segmented VT323 pixel font & dotted borders',
    category: 'structural',
    structuralStyle: 'retro-terminal',
    icon: '📟',
    isLight: false,
    colors: {
      accent: '#00ff66',
      accentHover: '#33ff88',
      accentText: '#000000',
      accentGlow: 'rgba(0, 255, 102, 0.45)',
      secondary: '#ffb000',
      bg: '#000000',
      cardBg: '#040805',
      cardBgElevated: '#08100a',
      sidebarBg: '#000000',
      headerBg: 'rgba(0, 0, 0, 0.95)',
      border: 'rgba(0, 255, 102, 0.35)',
      borderAccent: 'rgba(0, 255, 102, 0.70)',
      borderHover: 'rgba(255, 176, 0, 0.80)',
      text: '#00ff66',
      textSecondary: 'rgba(0, 255, 102, 0.80)',
      textMuted: 'rgba(0, 255, 102, 0.45)',
      ambient1: 'rgba(0, 255, 102, 0.08)',
      ambient2: 'rgba(255, 176, 0, 0.04)',
    },
    previewPalette: ['#000000', '#040805', '#00ff66', '#ffb000'],
    fontAtmosphere: 'VT323 Pixel • Phosphor CRT',
    badgeLabel: 'TERMINAL',
    structuralDetails: [
      'Phosphor CRT-green / Amber text glow',
      'VT323 pixel font for telemetry digits',
      'Dashed & dotted matrix borders',
      'Pure pitch-black OLED background',
    ],
  },

  // ADDITIONAL COLORWAYS
  {
    id: 'crimson-forge',
    name: 'Crimson Forge',
    tagline: 'High-intensity charcoal basalt & scarlet flame engineered for power athletes',
    category: 'performance',
    structuralStyle: 'athletic-dark',
    icon: '🔥',
    isLight: false,
    colors: {
      accent: '#f43f5e',
      accentHover: '#fb7185',
      accentText: '#ffffff',
      accentGlow: 'rgba(244, 63, 94, 0.35)',
      secondary: '#f97316',
      bg: '#110709',
      cardBg: '#1b0d11',
      cardBgElevated: '#261318',
      sidebarBg: '#0d0507',
      headerBg: 'rgba(17, 7, 9, 0.88)',
      border: 'rgba(244, 63, 94, 0.18)',
      borderAccent: 'rgba(244, 63, 94, 0.45)',
      borderHover: 'rgba(249, 115, 22, 0.60)',
      text: '#fff1f2',
      textSecondary: 'rgba(255, 241, 242, 0.75)',
      textMuted: 'rgba(253, 164, 175, 0.45)',
      ambient1: 'rgba(244, 63, 94, 0.08)',
      ambient2: 'rgba(249, 115, 22, 0.06)',
    },
    previewPalette: ['#110709', '#1b0d11', '#f43f5e', '#f97316'],
    fontAtmosphere: 'Power & Drive',
    badgeLabel: 'HIGH INTENSITY',
  },
  {
    id: 'nordic-emerald',
    name: 'Nordic Forest',
    tagline: 'Deep botanical moss & calming sage emerald for clean holistic wellness',
    category: 'minimal',
    structuralStyle: 'athletic-dark',
    icon: '🌿',
    isLight: false,
    colors: {
      accent: '#10b981',
      accentHover: '#34d399',
      accentText: '#061712',
      accentGlow: 'rgba(16, 185, 129, 0.30)',
      secondary: '#6ee7b7',
      bg: '#08110e',
      cardBg: '#0f1f1a',
      cardBgElevated: '#152c25',
      sidebarBg: '#060d0b',
      headerBg: 'rgba(8, 17, 14, 0.88)',
      border: 'rgba(16, 185, 129, 0.16)',
      borderAccent: 'rgba(16, 185, 129, 0.40)',
      borderHover: 'rgba(52, 211, 153, 0.55)',
      text: '#f2fbf7',
      textSecondary: 'rgba(242, 251, 247, 0.75)',
      textMuted: 'rgba(167, 243, 208, 0.45)',
      ambient1: 'rgba(16, 185, 129, 0.07)',
      ambient2: 'rgba(45, 212, 191, 0.05)',
    },
    previewPalette: ['#08110e', '#0f1f1a', '#10b981', '#34d399'],
    fontAtmosphere: 'Organic Zen',
    badgeLabel: 'MINIMAL',
  },
  {
    id: 'arctic-cobalt',
    name: 'Arctic Cobalt',
    tagline: 'Abyssal deep navy with ice-blue laser biometric telemetry precision',
    category: 'vibrant',
    structuralStyle: 'athletic-dark',
    icon: '🌊',
    isLight: false,
    colors: {
      accent: '#38bdf8',
      accentHover: '#7dd3fc',
      accentText: '#041019',
      accentGlow: 'rgba(56, 189, 248, 0.35)',
      secondary: '#818cf8',
      bg: '#060d17',
      cardBg: '#0d1828',
      cardBgElevated: '#13233b',
      sidebarBg: '#040910',
      headerBg: 'rgba(6, 13, 23, 0.88)',
      border: 'rgba(56, 189, 248, 0.16)',
      borderAccent: 'rgba(56, 189, 248, 0.40)',
      borderHover: 'rgba(129, 140, 248, 0.55)',
      text: '#f0f9ff',
      textSecondary: 'rgba(240, 249, 255, 0.75)',
      textMuted: 'rgba(186, 230, 253, 0.45)',
      ambient1: 'rgba(56, 189, 248, 0.08)',
      ambient2: 'rgba(99, 102, 241, 0.06)',
    },
    previewPalette: ['#060d17', '#0d1828', '#38bdf8', '#818cf8'],
    fontAtmosphere: 'Biometric Tech',
    badgeLabel: 'PRECISION',
  },
  {
    id: 'hyper-light',
    name: 'Clean Day (Light)',
    tagline: 'Porcelain alabaster surface, royal cobalt sapphire & maximum daylight legibility',
    category: 'light',
    structuralStyle: 'athletic-dark',
    icon: '☀️',
    isLight: true,
    colors: {
      accent: '#2563eb',
      accentHover: '#1d4ed8',
      accentText: '#ffffff',
      accentGlow: 'rgba(37, 99, 235, 0.25)',
      secondary: '#059669',
      bg: '#f8fafc',
      cardBg: '#ffffff',
      cardBgElevated: '#f1f5f9',
      sidebarBg: '#f1f5f9',
      headerBg: 'rgba(248, 250, 252, 0.90)',
      border: 'rgba(15, 23, 42, 0.12)',
      borderAccent: 'rgba(37, 99, 235, 0.40)',
      borderHover: 'rgba(37, 99, 235, 0.60)',
      text: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#64748b',
      ambient1: 'rgba(37, 99, 235, 0.04)',
      ambient2: 'rgba(5, 150, 105, 0.03)',
    },
    previewPalette: ['#f8fafc', '#ffffff', '#2563eb', '#059669'],
    fontAtmosphere: 'Daylight High-Contrast',
    badgeLabel: 'LIGHT MODE',
  },
];

const THEME_STORAGE_KEY = 'macropulse_active_theme_id_v3';
const DEFAULT_THEME_ID = 'athletic-dark';

export class ThemeService {
  private currentThemeId: string = DEFAULT_THEME_ID;
  private listeners: Array<(theme: AppTheme) => void> = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && APP_THEMES.some((t) => t.id === stored)) {
        this.currentThemeId = stored;
      } else if (stored === 'onyx-gold') {
        // legacy map to athletic-dark
        this.currentThemeId = 'athletic-dark';
      }
    } catch {
      this.currentThemeId = DEFAULT_THEME_ID;
    }
    this.applyThemeToDOM(this.getActiveTheme());
  }

  public getThemes(): AppTheme[] {
    return APP_THEMES;
  }

  public getStructuralStyles(): StructuralStyleConfig[] {
    return Object.values(STRUCTURAL_STYLES);
  }

  public getThemeById(id?: string): AppTheme {
    if (id === 'onyx-gold') return APP_THEMES[0];
    return APP_THEMES.find((t) => t.id === id) || APP_THEMES[0];
  }

  public getActiveTheme(): AppTheme {
    return this.getThemeById(this.currentThemeId);
  }

  public setTheme(themeId: string): AppTheme {
    const theme = this.getThemeById(themeId);
    this.currentThemeId = theme.id;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme.id);
    } catch (e) {
      console.warn('Could not save theme to localStorage', e);
    }
    this.applyThemeToDOM(theme);
    this.notify(theme);
    return theme;
  }

  public subscribe(callback: (theme: AppTheme) => void): () => void {
    this.listeners.push(callback);
    callback(this.getActiveTheme());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify(theme: AppTheme) {
    this.listeners.forEach((cb) => {
      try {
        cb(theme);
      } catch (err) {
        console.error('Error in theme listener', err);
      }
    });
  }

  public applyThemeToDOM(theme: AppTheme) {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const struct = STRUCTURAL_STYLES[theme.structuralStyle] || STRUCTURAL_STYLES['athletic-dark'];

    root.setAttribute('data-theme', theme.id);
    root.setAttribute('data-style', theme.structuralStyle);
    root.setAttribute('data-color-scheme', theme.isLight ? 'light' : 'dark');

    // Structural CSS Variables
    root.style.setProperty('--font-display', struct.fontDisplay);
    root.style.setProperty('--font-mono', struct.fontMono);
    root.style.setProperty('--font-body', struct.fontBody);
    
    root.style.setProperty('--card-radius', struct.cardRadius);
    root.style.setProperty('--card-clip-path', struct.cardClipPath || 'none');
    root.style.setProperty('--btn-radius', struct.btnRadius);
    root.style.setProperty('--btn-clip-path', struct.btnClipPath || 'none');
    
    root.style.setProperty('--card-border-width', struct.cardBorderWidth);
    root.style.setProperty('--card-border-style', struct.cardBorderStyle);
    root.style.setProperty('--card-shadow', struct.cardShadow);
    root.style.setProperty('--card-backdrop-blur', struct.cardBackdropBlur);
    root.style.setProperty('--letter-spacing-display', struct.letterSpacingDisplay);

    // Color palette CSS custom properties
    const c = theme.colors;
    root.style.setProperty('--bg', c.bg);
    root.style.setProperty('--card-bg', c.cardBg);
    root.style.setProperty('--card-bg-elevated', c.cardBgElevated);
    root.style.setProperty('--sidebar-bg', c.sidebarBg);
    root.style.setProperty('--header-bg', c.headerBg);
    
    root.style.setProperty('--accent', c.accent);
    root.style.setProperty('--accent-hover', c.accentHover);
    root.style.setProperty('--accent-text', c.accentText);
    root.style.setProperty('--accent-glow', c.accentGlow);
    root.style.setProperty('--secondary-accent', c.secondary);
    
    root.style.setProperty('--border', c.border);
    root.style.setProperty('--border-accent', c.borderAccent);
    root.style.setProperty('--border-hover', c.borderHover);
    
    root.style.setProperty('--text-primary', c.text);
    root.style.setProperty('--text-secondary', c.textSecondary);
    root.style.setProperty('--text-muted', c.textMuted);
    
    root.style.setProperty('--ambient-1', c.ambient1);
    root.style.setProperty('--ambient-2', c.ambient2);

    // Apply classes on body for background & text
    document.body.style.backgroundColor = c.bg;
    document.body.style.color = c.text;
    document.body.style.fontFamily = struct.fontBody;
  }
}

export const themeService = new ThemeService();
