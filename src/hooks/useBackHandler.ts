import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Custom hook to handle Android hardware back button (and Android gesture back in native shells).
 *
 * NOTE: This listens to the Capacitor/Cordova `backbutton` event.
 * - In the browser preview, this event does not fire.
 * - In an Android build, this event fires for both hardware and gesture back.
 *
 * @param onBack - Optional custom back handler. Return true when you've handled the back action.
 * @param enabled - When false, the listener is not attached.
 */
export function useBackHandler(onBack?: () => boolean | void, enabled: boolean = true) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = useCallback(() => {
    // If custom handler exists and returns true, don't navigate
    if (onBack && onBack() === true) {
      return;
    }

    // If on home page, let the app handle exit
    if (location.pathname === '/') {
      // On home, let browser/Capacitor handle back (exit app)
      return;
    }

    // Otherwise, navigate back (fallback to Home if there's no history)
    if (window.history.length <= 1) {
      navigate('/');
      return;
    }

    navigate(-1);
  }, [navigate, location.pathname, onBack]);

  useEffect(() => {
    if (!enabled) return;

    // For Capacitor/Cordova - handle hardware + gesture back
    const handleHardwareBack = (event: Event) => {
      // Try to prevent other listeners from also running
      // (works on Android; harmless elsewhere)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (event as any).stopImmediatePropagation?.();
      event.preventDefault?.();
      handleBack();
    };

    document.addEventListener('backbutton', handleHardwareBack, true);

    return () => {
      document.removeEventListener('backbutton', handleHardwareBack, true);
    };
  }, [enabled, handleBack]);

  return handleBack;
}

/**
 * Hook to navigate back with proper handling
 */
export function useGoBack() {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    if (location.pathname === '/') {
      // On home page, don't navigate back (would exit app)
      return;
    }
    if (window.history.length <= 1) {
      navigate('/');
      return;
    }
    navigate(-1);
  }, [navigate, location.pathname]);
}

