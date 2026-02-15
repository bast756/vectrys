// ============================================================
// VECTRYS — Framer Motion Presets
// Premium animation system for guest portal
// ============================================================

import type { Variants, Transition } from 'framer-motion';

// ─── SPRING CONFIGS ────────────────────────────────────────

export const spring = {
  gentle: { type: 'spring', stiffness: 120, damping: 14 } as Transition,
  snappy: { type: 'spring', stiffness: 300, damping: 20 } as Transition,
  bouncy: { type: 'spring', stiffness: 400, damping: 10 } as Transition,
  smooth: { type: 'spring', stiffness: 200, damping: 26 } as Transition,
};

// ─── PAGE TRANSITIONS ──────────────────────────────────────

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, filter: 'blur(4px)' },
};

export const pageTransition: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 25,
};

// ─── FADE IN UP (for cards, sections) ──────────────────────

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
};

// ─── STAGGER CONTAINER ─────────────────────────────────────

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 260, damping: 24 },
  },
};

// ─── TAP / HOVER INTERACTIONS ──────────────────────────────

export const tapScale = {
  whileTap: { scale: 0.97 },
  transition: spring.snappy,
};

export const hoverGlow = {
  whileHover: { scale: 1.015, y: -1 },
  whileTap: { scale: 0.98 },
  transition: spring.gentle,
};

export const cardHover = {
  whileHover: {
    scale: 1.02,
    y: -2,
    transition: { type: 'spring', stiffness: 400, damping: 20 },
  },
  whileTap: { scale: 0.98 },
};

// ─── DOCK NAV ──────────────────────────────────────────────

export const dockOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const dockMenu: Variants = {
  initial: { opacity: 0, y: 30, scale: 0.9 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 350, damping: 25 },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

export const dockItem: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.05, type: 'spring', stiffness: 400, damping: 20 },
  }),
};

// ─── CHAT BUBBLES ──────────────────────────────────────────

export const chatBubble: Variants = {
  initial: { opacity: 0, y: 10, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 22 },
  },
};

export const typingDots: Variants = {
  initial: { opacity: 0.4 },
  animate: {
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: 'reverse',
      duration: 0.5,
    },
  },
};

// ─── PROGRESS / CHECKMARK ──────────────────────────────────

export const checkmark: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

export const progressBar: Variants = {
  initial: { width: 0 },
  animate: (width: number) => ({
    width: `${width}%`,
    transition: { type: 'spring', stiffness: 100, damping: 20 },
  }),
};

// ─── SUCCESS CELEBRATION ───────────────────────────────────

export const celebration: Variants = {
  initial: { scale: 0, rotate: -180 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: { type: 'spring', stiffness: 200, damping: 15 },
  },
};

export const confettiPop: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: {
    scale: [0, 1.3, 1],
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};
