import React, { useState, useEffect, useMemo, ReactNode, createContext, useCallback } from "react";
import type { FirebaseOptions } from "firebase/app";

import { User as FirebaseUser, Persistence } from "firebase/auth";
import { PATHS } from "firebase-hech/paths";
import {
  initializeFirebase,
  getAdminValue,
  onUserValue,
  updateUser,
  getUnverifiedUser,
  createUser,
  remove,
} from "firebase-hech/client";
import type { EmulatorOptions, User } from "firebase-hech";

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
type BaseFirebaseHechContext = {
  initiallyLoading: boolean;
  loggedIn: boolean;
  isAdmin: Nullable<boolean>;
  awaitingVerification: Maybe<boolean>;
  user: Maybe<Nullable<Mandate<User, "uid">>>;
};

const FirebaseHechContext = createContext<Maybe<BaseFirebaseHechContext>>(undefined);

export const useFirebaseHechContext = () => {
  const useContextResult = useGetSafeContext(FirebaseHechContext);

  if (!useContextResult) throw new Error("You must wrap your component in an instance of FirebaseHechContext");

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

export function FirebaseHechContextProviderComponent({
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

  const [firebaseHechUserState, setFirebaseHechUserState] = useState<Nullable<Mandate<User, "uid">>>();
  const firebaseHechUserIsNull = firebaseHechUserState === null;

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
      offUser = onUserValue(fbUserStateUid, async (firebaseHechUser) => {
        if (firebaseHechUser === null) {
          setFirebaseHechUserState(null);
          // If the `firebaseHechUser` is not null, then the following should be true:
        } else if (!requireEmailVerification || fbUserStateEmailVerified) {
          // Always keep the FirebaseHech user synced with Firebase (which could be getting updates via their Google account, verification status, etc.)
          const { userUpdate, updateNeeded } = getFirebaseUserSyncUpdate(
            {
              uid: fbUserStateUid,
              email: fbUserStateEmail || null,
              emailVerified: fbUserStateEmailVerified || false,
              phoneNumber: fbUserStatePhoneNumber || null,
              photoURL: fbUserStatePhotoURL || null,
            },
            firebaseHechUser
          );
          if (updateNeeded) await updateUser(fbUserStateUid, userUpdate);

          setFirebaseHechUserState(firebaseHechUser);
          await getAdminValue(fbUserStateUid)
            .then(setIsAdmin)
            .catch(() => setIsAdmin(false));
        }

        setInitiallyLoading(false);
      });
    } else if (fbUserIsNull) {
      setFirebaseHechUserState(null);
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
    if (fbUserStateUid && fbUserStateEmailVerified && firebaseHechUserIsNull) {
      getUnverifiedUser(fbUserStateUid).then(async (unverifiedUser) => {
        if (unverifiedUser) {
          await createUser({ ...unverifiedUser, createUnverifiedUser: false });
          await remove(PATHS.unverifiedUsers(fbUserStateUid));
        }
      });
    }
  }, [fbUserStateEmailVerified, fbUserStateUid, firebaseHechUserIsNull]);

  const ctx = useMemo(
    () => ({
      initiallyLoading,
      loggedIn: Boolean(firebaseHechUserState),
      isAdmin,
      awaitingVerification,
      user: firebaseHechUserState,
    }),
    [initiallyLoading, firebaseHechUserState, isAdmin, awaitingVerification]
  );

  return <FirebaseHechContext.Provider value={ctx}>{children}</FirebaseHechContext.Provider>;
}
