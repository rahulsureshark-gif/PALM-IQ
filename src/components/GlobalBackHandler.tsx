import { useBackHandler } from "@/hooks/useBackHandler";

/**
 * Attaches a global Android back/gesture handler (Capacitor/Cordova `backbutton`).
 *
 * - Home ("/"): does nothing so the native shell can exit
 * - Other routes: navigates back (or to "/" if no history)
 */
export function GlobalBackHandler() {
  useBackHandler();
  return null;
}
