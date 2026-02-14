// ============================================================================
// VECTRYS — Screenshot Detection Hook
// Detects PrintScreen, Cmd+Shift+3/4, visibility changes, devtools
// Captures page content via html2canvas and sends alert to backend
// ============================================================================

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { employeeApi } from '@/api/employeeApi';

// Page labels for context summary
const PAGE_LABELS: Record<string, string> = {
  '/employee/dashboard': 'Tableau de bord',
  '/employee/calls': 'Call Assistant',
  '/employee/crm': 'CRM Prospects',
  '/employee/notes': 'Notes',
  '/employee/gantt': 'Gantt',
  '/employee/planning': 'Planning',
};

function getPageTitle(pathname: string): string {
  return PAGE_LABELS[pathname] || 'Page employee';
}

function buildContextSummary(pathname: string, method: string): string {
  const page = getPageTitle(pathname);
  const methodLabel: Record<string, string> = {
    keydown: 'Raccourci clavier (PrintScreen / Cmd+Shift)',
    visibility_change: "Changement de visibilite (alt-tab rapide apres capture probable)",
    devtools: 'Ouverture des outils developpeur (inspection de donnees)',
  };
  const now = new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'medium' });
  return `Tentative de capture d'ecran detectee sur la page "${page}" le ${now}. Methode de detection : ${methodLabel[method] || method}.`;
}

async function captureScreenshot(): Promise<string> {
  try {
    // Dynamic import to avoid bundling html2canvas if not needed
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(document.body, {
      scale: 0.5, // Lower resolution to reduce payload size
      useCORS: true,
      logging: false,
      backgroundColor: '#05080d',
    });
    return canvas.toDataURL('image/jpeg', 0.5);
  } catch {
    // Fallback: return a 1x1 pixel placeholder if capture fails
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }
}

async function sendAlert(pathname: string, method: string, screenshot: string): Promise<void> {
  try {
    await employeeApi.reportScreenshot({
      screenshot,
      page_url: pathname,
      page_title: getPageTitle(pathname),
      context_summary: buildContextSummary(pathname, method),
      detection_method: method,
    });
  } catch (err) {
    console.error('[ScreenshotDetection] Failed to send alert:', err);
  }
}

export function useScreenshotDetection() {
  const location = useLocation();
  const cooldownRef = useRef(false);
  const devtoolsOpenRef = useRef(false);

  useEffect(() => {
    // Debounce: avoid flooding alerts for rapid keystrokes
    const triggerAlert = async (method: string) => {
      if (cooldownRef.current) return;
      cooldownRef.current = true;
      setTimeout(() => { cooldownRef.current = false; }, 5000); // 5s cooldown

      const screenshot = await captureScreenshot();
      await sendAlert(location.pathname, method, screenshot);
    };

    // ─── 1. Keyboard Detection ───
    const handleKeydown = (e: KeyboardEvent) => {
      // PrintScreen key
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        triggerAlert('keydown');
        return;
      }

      // macOS: Cmd+Shift+3 (full screen) or Cmd+Shift+4 (selection)
      if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
        triggerAlert('keydown');
        return;
      }

      // Windows: Win+Shift+S (Snipping Tool)
      if (e.metaKey && e.shiftKey && e.key === 's') {
        triggerAlert('keydown');
        return;
      }

      // Ctrl+Shift+I or F12 (DevTools)
      if ((e.ctrlKey && e.shiftKey && e.key === 'I') || e.key === 'F12') {
        triggerAlert('devtools');
        return;
      }
    };

    // ─── 2. Visibility Change Detection ───
    // Rapid hide+show can indicate screenshot taken via OS tool
    let hiddenAt: number | null = null;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = Date.now();
      } else if (hiddenAt && Date.now() - hiddenAt < 1500) {
        // Came back within 1.5s — suspicious (likely screenshot tool)
        triggerAlert('visibility_change');
        hiddenAt = null;
      } else {
        hiddenAt = null;
      }
    };

    // ─── 3. DevTools Detection (resize-based heuristic) ───
    const checkDevtools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      const isOpen = widthThreshold || heightThreshold;

      if (isOpen && !devtoolsOpenRef.current) {
        devtoolsOpenRef.current = true;
        triggerAlert('devtools');
      } else if (!isOpen) {
        devtoolsOpenRef.current = false;
      }
    };

    // ─── 4. Right-click context menu (can lead to "Inspect") ───
    const handleContextMenu = (e: MouseEvent) => {
      // Don't prevent, just log if devtools detection follows
    };

    // Attach listeners
    window.addEventListener('keydown', handleKeydown, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const devtoolsInterval = setInterval(checkDevtools, 2000);

    return () => {
      window.removeEventListener('keydown', handleKeydown, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(devtoolsInterval);
    };
  }, [location.pathname]);
}
