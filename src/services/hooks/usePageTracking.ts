import { useEffect } from "react";
import type { TrackingData } from "firebase-hech";
import { generateDbKey, PATHS } from "firebase-hech/paths";
import { getCurrentUser, onDisconnect, pushKey, trackEvent } from "firebase-hech/client";
import { useFirebaseHechContext } from "../context/firebaseHechContext";

export const usePageTracking = (asPath: string, query: Record<string, string>) => {
  const { loggedIn, user } = useFirebaseHechContext();
  const userUid = user?.uid;

  useEffect(() => {
    if (loggedIn) trackEvent("pageView", userUid, { path: asPath });
  }, [asPath, loggedIn]);

  useEffect(() => {
    if (user) {
      if (query.source) trackEvent(generateDbKey("source", query.source, "ad", query.ad), userUid);

      trackEvent("onConnect", userUid);
      onDisconnect<TrackingData>(`${PATHS.trackingKey("onDisconnect")}/${pushKey(PATHS.TRACKING)}`, {
        uid: getCurrentUser()?.uid ?? "unknown",
        createdAt: Date.now(),
        metadata: null,
      });
    }
  }, [user]);
};
