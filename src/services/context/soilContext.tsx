import React, { useState, useEffect, useMemo, ReactNode, createContext, useCallback } from "react";
import type { FirebaseOptions } from "firebase/app";

import { User as FirebaseUser, Persistence } from "firebase/auth";
import { PATHS } from "firebase-soil/paths";
import {
  initializeFirebase,
  getAdminValue,
  onUserValue,
  updateUser,
  getUnverifiedUser,
  createUser,
  remove,
} from "firebase-soil/client";
import type { EmulatorOptions, User } from "firebase-soil";

import { useGetSafeContext } from "./useGetSafeContext";

const getFirebaseUserSyncUpdate = (
  firebaseUser: Pick<FirebaseUser, "uid" | "email" | "emailVerified" | "phoneNumber" | "photoURL">,
  user: User
) => {
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
  awaitingVerification: Maybe<boolean>;
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
  emulatorOptions?: EmulatorOptions;
} & (
  | {
      isNativePlatform?: true;
      webPersistance?: undefined;
    }
  | {
      isNativePlatform?: undefined;
      webPersistance?: Persistence;
    }
);

export function SoilContextProviderComponent({
  children,
  firebaseOptions,
  requireEmailVerification = false,
  anonymousSignIn = false,
  emulatorOptions,
  ...props
}: TProps) {
  const [firebaseUserState, setFirebaseUserState] = useState<Nullable<FirebaseUser>>();
  const {
    uid: fbUserStateUid,
    email: fbUserStateEmail,
    emailVerified: fbUserStateEmailVerified,
    phoneNumber: fbUserStatePhoneNumber,
    photoURL: fbUserStatePhotoURL,
  } = firebaseUserState || {};
  const fbUserIsNull = firebaseUserState === null;

  const [awaitingVerification, setAwaitingVerification] = useState<boolean>();

  const [soilUserState, setSoilUserState] = useState<Nullable<Mandate<User, "uid">>>();
  const soilUserIsNull = soilUserState === null;

  const [isAdmin, setIsAdmin] = useState<Nullable<boolean>>(false);
  const [initiallyLoading, setInitiallyLoading] = useState(true);

  useEffect(() => {
    let reloadCancelToken: NodeJS.Timeout;

    if (requireEmailVerification && firebaseUserState && !firebaseUserState.emailVerified) {
      // This is needed because Firebase caches the user's info. We need to continually reload to listen for `emailVerified === true`.
      reloadCancelToken = setInterval(() => firebaseUserState?.reload(), 1_000);
    }

    return () => clearInterval(reloadCancelToken);
  }, [requireEmailVerification, firebaseUserState?.emailVerified]);

  useEffect(() => {
    initializeFirebase(
      firebaseOptions,
      async (firebaseUser) => {
        setFirebaseUserState(firebaseUser);
        if (firebaseUser) setAwaitingVerification(!firebaseUser.emailVerified);
      },
      { anonymousSignIn, emulatorOptions, ...props }
    );
  }, [firebaseOptions, anonymousSignIn, emulatorOptions, props.isNativePlatform, props.webPersistance]);

  useEffect(() => {
    let offUser: Maybe<VoidFunction>;

    if (fbUserStateUid) {
      offUser = onUserValue(fbUserStateUid, async (soilUser) => {
        if (soilUser === null) {
          setSoilUserState(null);
          // If the `soilUser` is not null, then the following should be true:
        } else if (!requireEmailVerification || fbUserStateEmailVerified) {
          // Always keep the Soil user synced with Firebase (which could be getting updates via their Google account, verification status, etc.)
          const { userUpdate, updateNeeded } = getFirebaseUserSyncUpdate(
            {
              uid: fbUserStateUid,
              email: fbUserStateEmail || null,
              emailVerified: fbUserStateEmailVerified || false,
              phoneNumber: fbUserStatePhoneNumber || null,
              photoURL: fbUserStatePhotoURL || null,
            },
            soilUser
          );
          if (updateNeeded) await updateUser(fbUserStateUid, userUpdate);

          setSoilUserState(soilUser);
          await getAdminValue(fbUserStateUid)
            .then(setIsAdmin)
            .catch(() => setIsAdmin(false));
        }

        setInitiallyLoading(false);
      });
    } else if (fbUserIsNull) {
      setSoilUserState(null);
      setIsAdmin(false);
      setInitiallyLoading(false);
    }

    return () => offUser?.();
  }, [
    fbUserIsNull,
    fbUserStateUid,
    fbUserStateEmail,
    fbUserStateEmailVerified,
    fbUserStatePhoneNumber,
    fbUserStatePhotoURL,
  ]);

  useEffect(() => {
    if (fbUserStateUid && fbUserStateEmailVerified && soilUserIsNull) {
      getUnverifiedUser(fbUserStateUid).then(async (unverifiedUser) => {
        if (unverifiedUser) {
          await createUser({ ...unverifiedUser, createUnverifiedUser: false });
          await remove(PATHS.unverifiedUsers(fbUserStateUid));
        }
      });
    }
  }, [fbUserStateEmailVerified, fbUserStateUid, soilUserIsNull]);

  const ctx = useMemo(
    () => ({
      initiallyLoading,
      loggedIn: Boolean(soilUserState),
      isAdmin,
      awaitingVerification,
      user: soilUserState,
    }),
    [initiallyLoading, soilUserState, isAdmin, awaitingVerification]
  );

  return <SoilContext.Provider value={ctx}>{children}</SoilContext.Provider>;
}
