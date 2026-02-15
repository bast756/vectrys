/**
 * VECTRYS — Custom Service Category Icons
 * Monochrome gold SVG mini-illustrations replacing generic emojis.
 * Design language: 1.5px stroke, rounded caps, 135° diagonal accents.
 */

interface IconProps {
  size?: number;
  className?: string;
}

const defaults = { size: 24, className: '' };

/** Croissant + coffee cup — Petit-dejeuner */
export function BreakfastIcon({ size = defaults.size, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      {/* Coffee cup */}
      <path d="M5 12h10v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-5z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15 14h1a2 2 0 0 1 0 4h-1" stroke="currentColor" strokeWidth="1.5" />
      {/* Steam — signature curves */}
      <path d="M8 9c0-1 .5-1.5 1-2s1-1.5 1-2.5" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <path d="M12 9c0-1 .5-1.5 1-2s1-1.5 1-2.5" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      {/* 135° accent */}
      <circle cx="19" cy="5" r="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/** Spray bottle + sparkle — Menage */
export function CleaningIcon({ size = defaults.size, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      {/* Bottle body */}
      <path d="M8 10h6v10a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V10z" stroke="currentColor" strokeWidth="1.5" />
      {/* Bottle neck */}
      <path d="M9 10V7h4v3" stroke="currentColor" strokeWidth="1.5" />
      {/* Trigger */}
      <path d="M13 7h3v2h-3" stroke="currentColor" strokeWidth="1.5" />
      {/* Sparkle */}
      <path d="M17 3l.5 1.5L19 5l-1.5.5L17 7l-.5-1.5L15 5l1.5-.5L17 3z" stroke="currentColor" strokeWidth="1.2" fill="currentColor" opacity="0.5" />
      {/* Accent */}
      <circle cx="4" cy="14" r="0.8" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/** Shopping bag with V — Courses */
export function GroceryIcon({ size = defaults.size, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      {/* Bag */}
      <path d="M5 8h14l-1.5 12a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2L5 8z" stroke="currentColor" strokeWidth="1.5" />
      {/* Handles */}
      <path d="M8 8V6a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="1.5" />
      {/* V signature inside bag */}
      <path d="M10 13l2 3 2-3" stroke="currentColor" strokeWidth="1.3" opacity="0.5" />
    </svg>
  );
}

/** Car with speed lines — Transport */
export function TransportIcon({ size = defaults.size, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      {/* Car body */}
      <path d="M5 15h14a1 1 0 0 0 1-1v-3a1 1 0 0 0-.4-.8l-2.6-2a2 2 0 0 0-1.2-.4H10a2 2 0 0 0-1.5.7L6 11.2a1 1 0 0 0-.3.5L5 14v0a1 1 0 0 0 0 1z" stroke="currentColor" strokeWidth="1.5" />
      {/* Wheels */}
      <circle cx="8" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      {/* Speed lines */}
      <path d="M2 12h2M1 14h2" stroke="currentColor" strokeWidth="1.2" opacity="0.35" />
      {/* Ground line */}
      <path d="M5 18.5h14" stroke="currentColor" strokeWidth="1" opacity="0.2" />
    </svg>
  );
}

/** Compass rose — Experiences */
export function ExperienceIcon({ size = defaults.size, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      {/* Outer circle */}
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      {/* Compass diamond */}
      <path d="M12 5l2.5 5.5L12 12l-2.5-1.5L12 5z" fill="currentColor" opacity="0.25" stroke="currentColor" strokeWidth="1" />
      <path d="M12 19l-2.5-5.5L12 12l2.5 1.5L12 19z" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      {/* Cardinal dots */}
      <circle cx="12" cy="3" r="0.7" fill="currentColor" opacity="0.5" />
      <circle cx="21" cy="12" r="0.7" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/** Wrench with diagonal accent — Equipement */
export function EquipmentIcon({ size = defaults.size, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      {/* Wrench */}
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3-3A5 5 0 0 1 14 13l-6.3 6.3a2 2 0 0 1-2.8-2.8L11 10.2a5 5 0 0 1 6.7-7l-3 3.1z" stroke="currentColor" strokeWidth="1.5" />
      {/* 135° accent line */}
      <path d="M18 2l2 2" stroke="currentColor" strokeWidth="1.3" opacity="0.3" />
    </svg>
  );
}

/** Wine glass — Minibar */
export function MinibarIcon({ size = defaults.size, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      {/* Glass bowl */}
      <path d="M8 3h8l-2 8a2 2 0 0 1-2 1.5A2 2 0 0 1 10 11L8 3z" stroke="currentColor" strokeWidth="1.5" />
      {/* Stem */}
      <path d="M12 12.5V18" stroke="currentColor" strokeWidth="1.5" />
      {/* Base */}
      <path d="M9 18h6" stroke="currentColor" strokeWidth="1.5" />
      {/* Liquid fill */}
      <path d="M9.2 7h5.6" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      {/* Bubble */}
      <circle cx="11" cy="5.5" r="0.5" fill="currentColor" opacity="0.3" />
      {/* Accent */}
      <circle cx="17" cy="5" r="0.8" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

/** Gift box with V ribbon — Autres */
export function OtherIcon({ size = defaults.size, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} strokeLinecap="round" strokeLinejoin="round">
      {/* Box bottom */}
      <rect x="4" y="11" width="16" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      {/* Box lid */}
      <rect x="3" y="8" width="18" height="3" rx="1" stroke="currentColor" strokeWidth="1.5" />
      {/* V-shaped ribbon */}
      <path d="M12 8v12" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" />
      {/* Accent */}
      <circle cx="18" cy="5" r="0.7" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/** Map of all category keys to icon components */
export const SERVICE_ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  breakfast: BreakfastIcon,
  cleaning: CleaningIcon,
  grocery: GroceryIcon,
  transport: TransportIcon,
  experience: ExperienceIcon,
  equipment: EquipmentIcon,
  minibar: MinibarIcon,
  other: OtherIcon,
};
