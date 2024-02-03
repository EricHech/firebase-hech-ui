import React, { useState, useEffect, useMemo, ReactNode, createContext, useCallback } from "react";
import type { FirebaseOptions } from "firebase/app";
import type { EmulatorOptions, User } from "firebase-soil";
import { parseDbKey, generateDbKey, PATHS } from "firebase-soil/paths";
import {
  initializeFirebase,
  createData,
  get,
  getAdminValue,
  onUserValue,
  updateData,
  updateUser,
} from "firebase-soil/client";
import { useUserData } from "../hooks";
import { useGetSafeContext } from "./useGetSafeContext";

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

type TProps = {
  children: ReactNode;
  firebaseOptions: FirebaseOptions;
  requireEmailVerification?: boolean;
  anonymousSignIn?: boolean;
  isNativePlatform?: boolean;
  emulatorOptions?: EmulatorOptions;
};

export const SoilContextProviderComponent = ({
  children,
  firebaseOptions,
  requireEmailVerification = false,
  anonymousSignIn = false,
  isNativePlatform = false,
  emulatorOptions,
}: TProps) => {
  const [user, setUser] = useState<Nullable<Mandate<User, "uid">>>();
  const [asUser, setAsUser] = useState<Nullable<Mandate<User, "uid">>>();
  const [isAdmin, setIsAdmin] = useState<Nullable<boolean>>(false);
  const [initiallyLoading, setInitiallyLoading] = useState(true);

  useEffect(() => {
    let offUser: Maybe<VoidFunction>;

    initializeFirebase(
      firebaseOptions,
      async (u) => {
        if (u) {
          offUser?.();

          // Always keep the Soil user synced with Firebase (which could be getting updates via their Google account, verification status, etc.)
          await updateUser(u.uid, {
            email: u.email as unknown as undefined,
            phoneNumber: u.phoneNumber as unknown as undefined,
            emailVerified: u.emailVerified as unknown as undefined,
            photoURL: u.photoURL as unknown as undefined,
          });

          offUser = onUserValue(u.uid, async (usr) => {
            if (!requireEmailVerification || user?.emailVerified) {
              setUser(usr);
              getAdminValue(u.uid)
                .then(setIsAdmin)
                .catch(() => setIsAdmin(false))
                .finally(() => setInitiallyLoading(false));
            }
          });
        } else {
          offUser?.();
          setUser(null);
          setIsAdmin(false);
          setInitiallyLoading(false);
        }
      },
      { anonymousSignIn, isNativePlatform, emulatorOptions }
    );

    return () => {
      offUser?.();
      setUser(null);
      setIsAdmin(false);
    };
  }, [firebaseOptions, requireEmailVerification, anonymousSignIn, isNativePlatform]);

  const { data: settingsData, fetched: didFetchSettings } = useUserData({
    uid: user?.uid,
    dataType: "soilUserSettings",
    fetchData: true,
  });
  const settings = useMemo(
    () =>
      Object.entries(settingsData).reduce((prev, [key, setting]) => {
        const parsedKey = parseDbKey(key)[1];
        if (setting && parsedKey) prev[parsedKey] = setting.value;

        return prev;
      }, {} as Record<string, string>),
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
