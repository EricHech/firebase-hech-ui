import React, { useState, useEffect, useMemo, ReactNode, createContext, useCallback } from "react";
import type { FirebaseOptions } from "firebase/app";
import type { User } from "firebase-soil";
import { parseDbKey, generateDbKey, PATHS } from "firebase-soil/paths";
import { initializeFirebase, createData, get, getAdminValue, onUserValue, updateData } from "firebase-soil/client";
import { useUserData } from "../hooks";
import { useGetSafeContext } from "./getSafeContext";

/*
 ██████╗ ██████╗ ███╗   ██╗████████╗███████╗██╗  ██╗████████╗
██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██╔════╝╚██╗██╔╝╚══██╔══╝
██║     ██║   ██║██╔██╗ ██║   ██║   █████╗   ╚███╔╝    ██║
██║     ██║   ██║██║╚██╗██║   ██║   ██╔══╝   ██╔██╗    ██║
╚██████╗╚██████╔╝██║ ╚████║   ██║   ███████╗██╔╝ ██╗   ██║
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝   ╚═╝
*/
type BaseSoilContext = {
  initiallyLoading: boolean;
  loggedIn: boolean;
  usingAsUser: boolean;
  isAdmin: Nullable<boolean>;
  user: Maybe<Nullable<Mandate<User, "uid">>>;
  didFetchSettings: boolean;
  settings: Record<string, string>;
  setSetting: (dataKey: string, value: string) => void;
  setUseAsUser: (uid: string) => void;
};

const SoilContext = createContext<Maybe<BaseSoilContext>>(undefined);

export const useSoilContext = () => {
  const useContextResult = useGetSafeContext(SoilContext);

  if (!useContextResult) throw new Error("You must wrap your component in an instance of SoilContext");

  return useContextResult;
};

type TProps = { children: ReactNode; firebaseOptions: FirebaseOptions; anonymousSignIn?: boolean };

export const SoilContextProviderComponent = ({ children, firebaseOptions, anonymousSignIn = false }: TProps) => {
  const [user, setUser] = useState<Nullable<Mandate<User, "uid">>>();
  const [asUser, setAsUser] = useState<Nullable<Mandate<User, "uid">>>();
  const [isAdmin, setIsAdmin] = useState<Nullable<boolean>>(false);
  const [initiallyLoading, setInitiallyLoading] = useState(true);

  useEffect(() => {
    let offs: Function[] = [];

    initializeFirebase(
      firebaseOptions,
      (u) => {
        if (u) {
          const offUser = onUserValue(u.uid, (usr) => {
            setUser(usr);
            getAdminValue(u.uid)
              .then(setIsAdmin)
              .catch(() => setIsAdmin(false))
              .finally(() => setInitiallyLoading(false));
          });

          offs = [offUser];
        } else {
          offs.forEach((f) => f());
          setInitiallyLoading(false);
          setUser(null);
        }
      },
      anonymousSignIn
    );

    return () => {
      offs.forEach((f) => f());
      setUser(null);
      setIsAdmin(false);
    };
  }, [firebaseOptions, anonymousSignIn]);

  const { data: settingsData, fetched: didFetchSettings } = useUserData({
    uid: user?.uid,
    dataType: "soilUserSettings",
    fetchData: true,
  });
  const settings = useMemo(
    () =>
      Object.entries(settingsData).reduce(
        (prev, [key, setting]) =>
          setting && parseDbKey(key)[1] ? { ...prev, [parseDbKey(key)[1]]: setting.value } : prev,
        {} as Record<string, string>
      ),
    [settingsData]
  );
  const setSetting = useCallback(
    async (settingsKey: string, value: string) => {
      if (user?.uid) {
        const dataKey = generateDbKey(user.uid, settingsKey);
        if (settingsData[dataKey]) {
          return updateData({
            dataType: "soilUserSettings",
            dataKey,
            data: { value },
            owners: [user.uid],
            publicAccess: false,
            makeGetRequests: true,
          });
        }

        return createData({
          dataType: "soilUserSettings",
          dataKey,
          data: { value },
          owners: [user.uid],
          publicAccess: false,
        });
      }

      return undefined;
    },
    [settingsData, user?.uid]
  );

  const setUseAsUser = useCallback(
    async (uid?: string) => {
      if (isAdmin) {
        if (uid) {
          const u = await get<User>(PATHS.user(uid));

          if (u) {
            setAsUser(u);
          }
        } else {
          setAsUser(undefined);
        }
      }
    },
    [isAdmin]
  );

  const ctx = useMemo(
    () => ({
      initiallyLoading,
      loggedIn: Boolean(user),
      user: asUser || user,
      usingAsUser: Boolean(asUser),
      isAdmin,
      didFetchSettings,
      settings,
      setSetting,
      setUseAsUser,
    }),
    [initiallyLoading, user, asUser, isAdmin, didFetchSettings, settings, setSetting, setUseAsUser]
  );

  return <SoilContext.Provider value={ctx}>{children}</SoilContext.Provider>;
};
