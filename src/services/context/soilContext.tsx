import React, { useState, useEffect, useMemo, ReactNode, createContext, useCallback } from "react";
import type { FirebaseOptions } from "firebase/app";
import type { EmulatorOptions, User } from "firebase-soil";
import {
  initializeFirebase,
  getAdminValue,
  onUserValue,
  updateUser,
  getUnverifiedUser,
  createUser,
  remove,
} from "firebase-soil/client";
import { useGetSafeContext } from "./useGetSafeContext";
import { User as FirebaseUser } from "firebase/auth";
import { PATHS } from "firebase-soil/paths";

const getFirebaseUserSyncUpdate = (firebaseUser: FirebaseUser, user: User) => {
  let updateNeeded = false;
  const userUpdate: Partial<Mutable<User>> = {};
  if (firebaseUser.email && firebaseUser.email !== user.email) {
    updateNeeded = true;
    userUpdate.email = firebaseUser.email;
  }
  if (firebaseUser.emailVerified && firebaseUser.emailVerified !== user.emailVerified) {
    updateNeeded = true;
    userUpdate.emailVerified = firebaseUser.emailVerified;
  }
  if (firebaseUser.phoneNumber && firebaseUser.phoneNumber !== user.phoneNumber) {
    updateNeeded = true;
    userUpdate.phoneNumber = firebaseUser.phoneNumber;
  }
  if (firebaseUser.photoURL && firebaseUser.photoURL !== user.photoURL) {
    updateNeeded = true;
    userUpdate.photoURL = firebaseUser.photoURL;
  }

  return { userUpdate, updateNeeded };
};

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
  isAdmin: Nullable<boolean>;
  user: Maybe<Nullable<Mandate<User, "uid">>>;
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
  /**
   * This creates a temporary user that gets confirmed when `applyVerificationCode` is called from the client.
   * If using this feature, you should create a cron job that queries `unverifiedUsers/{uid}/createdAt`
   * to clear auth accounts and unverified users older than a certain time period (ie. 24 hours).
   */
  requireEmailVerification?: boolean;
  anonymousSignIn?: boolean;
  isNativePlatform?: boolean;
  emulatorOptions?: EmulatorOptions;
};

export function SoilContextProviderComponent({
  children,
  firebaseOptions,
  requireEmailVerification = false,
  anonymousSignIn = false,
  isNativePlatform = false,
  emulatorOptions,
}: TProps) {
  const [firebaseUserState, setFirebaseUserState] = useState<Nullable<FirebaseUser>>();

  const [soilUserState, setSoilUserState] = useState<Nullable<Mandate<User, "uid">>>();
  const [isAdmin, setIsAdmin] = useState<Nullable<boolean>>(false);
  const [initiallyLoading, setInitiallyLoading] = useState(true);

  useEffect(() => {
    let offUser: Maybe<VoidFunction>;

    initializeFirebase(
      firebaseOptions,
      async (firebaseUser) => {
        setFirebaseUserState(firebaseUser);

        if (firebaseUser) {
          offUser?.();

          offUser = onUserValue(firebaseUser.uid, async (soilUser) => {
            if (soilUser === null) {
              setSoilUserState(null);
            } else if (!requireEmailVerification || soilUser?.emailVerified) {
              // Always keep the Soil user synced with Firebase (which could be getting updates via their Google account, verification status, etc.)
              const { userUpdate, updateNeeded } = getFirebaseUserSyncUpdate(firebaseUser, soilUser);
              if (updateNeeded) await updateUser(firebaseUser.uid, userUpdate);

              setSoilUserState(soilUser);
              await getAdminValue(firebaseUser.uid)
                .then(setIsAdmin)
                .catch(() => setIsAdmin(false))
                .finally(() => setInitiallyLoading(false));
            }
          });
        } else {
          offUser?.();
          setSoilUserState(null);
          setIsAdmin(false);
          setInitiallyLoading(false);
        }
      },
      { anonymousSignIn, isNativePlatform, emulatorOptions }
    );

    return () => {
      offUser?.();
      setSoilUserState(null);
      setIsAdmin(false);
    };
  }, [firebaseOptions, requireEmailVerification, anonymousSignIn, isNativePlatform, emulatorOptions]);

  const userIsNull = soilUserState === null;
  useEffect(() => {
    if (firebaseUserState?.emailVerified && userIsNull) {
      getUnverifiedUser(firebaseUserState.uid).then(async (unverifiedUser) => {
        if (unverifiedUser) {
          await createUser({ ...unverifiedUser, createUnverifiedUser: false });
          await remove(PATHS.unverifiedUsers(firebaseUserState.uid));
        }
      });
    }
  }, [firebaseUserState?.emailVerified, firebaseUserState?.uid, userIsNull]);

  const ctx = useMemo(
    () => ({
      initiallyLoading,
      loggedIn: Boolean(soilUserState),
      user: soilUserState,
      isAdmin,
    }),
    [initiallyLoading, soilUserState, isAdmin]
  );

  return <SoilContext.Provider value={ctx}>{children}</SoilContext.Provider>;
}
