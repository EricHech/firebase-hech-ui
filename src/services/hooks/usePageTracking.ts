import { useEffect } from "react";
import type { TrackingData } from "firebase-hech";
import { PATHS } from "firebase-hech/paths";
import { getCurrentUser, onDisconnect, pushKey, trackEvent } from "firebase-hech/client";
import { useFirebaseHechContext } from "../context/firebaseHechContext";

export const usePageTracking = (asPath: string, query: Record<string, string>) => {
  const { loggedIn, user } = useFirebaseHechContext();

  useEffect(() => {
    if (loggedIn) trackEvent("pageView", { path: asPath });
  }, [asPath, loggedIn]);

  useEffect(() => {
    if (user) {
      if (query.source) trackEvent(`source__${query.source}__ad__${query.ad}`);

      trackEvent("onConnect");
      onDisconnect<TrackingData>(`${PATHS.trackingKey("onDisconnect")}/${pushKey(PATHS.TRACKING)}`, {
        uid: getCurrentUser()?.uid ?? "unknown",
        createdAt: Date.now(),
        metadata: null,
      });
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
};
