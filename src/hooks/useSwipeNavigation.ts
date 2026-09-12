import { useRef, useCallback, useEffect } from 'react';
import { TabType } from '../types';

const TAB_ORDER: TabType[] = ['companies', 'wallets', 'ai-sports', 'unlucky-wall', 'transfers'];

export function useSwipeNavigation(activeTab: TabType, onTabChange: (tab: TabType) => void) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);
  const isSwiping = useRef(false);

  const minSwipeDistance = 60;

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
    isSwiping.current = false;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return;
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;

    const dx = touchEnd.current.x - touchStart.current.x;
    const dy = touchEnd.current.y - touchStart.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Only horizontal swipes (ignore vertical)
    if (absDx > absDy && absDx > minSwipeDistance) {
      const currentIndex = TAB_ORDER.indexOf(activeTab);
      if (currentIndex === -1) return;

      if (dx < 0) {
        // Swipe left -> next tab
        const nextIndex = Math.min(currentIndex + 1, TAB_ORDER.length - 1);
        onTabChange(TAB_ORDER[nextIndex]);
      } else {
        // Swipe right -> prev tab
        const prevIndex = Math.max(currentIndex - 1, 0);
        onTabChange(TAB_ORDER[prevIndex]);
      }
      isSwiping.current = true;
    }

    touchStart.current = null;
    touchEnd.current = null;
  }, [activeTab, onTabChange]);

  useEffect(() => {
    const el = document.getElementById('swipe-container') || document.getElementById('root');
    if (!el) return;

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  return isSwiping;
}

export function useAndroidBackButton(activeTab: TabType, onTabChange: (tab: TabType) => void, onCloseModal: () => void) {
  useEffect(() => {
    const handleBackButton = (e: Event) => {
      e.preventDefault();
      // If any modal is open, close it
      onCloseModal();
    };

    // Capacitor back button
    const setupCapacitor = async () => {
      try {
        const { App } = await import('@capacitor/app');
        const backHandler = await App.addListener('backButton', handleBackButton);
        return () => backHandler.remove();
      } catch {
        // Not in Capacitor, use popstate
      }
    };

    let cleanup: (() => void) | undefined;
    setupCapacitor().then((c) => { cleanup = c; });

    // Fallback for browser
    window.addEventListener('popstate', handleBackButton);

    return () => {
      cleanup?.();
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [activeTab, onTabChange, onCloseModal]);
}
