import React, { useState, useEffect, useMemo, ReactNode, createContext } from "react";
import type { FirebaseOptions } from "firebase/app";
import type { User as FirebaseUser, Persistence } from "firebase/auth";

import { generateDbKey, PATHS } from "firebase-hech/paths";
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
  firebase: Maybe<Nullable<FirebaseUser>>;
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
  enableOfflineCaching?: {
    setCachedUser: (_cacheKey: string, _d: Mandate<User, "uid">) => Promise<void>;
    getCachedUser: (_cacheKey: string) => Promise<Nullable<Mandate<User, "uid">>>;
  };
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
  enableOfflineCaching,
  ...props
}: TProps) {
  const [userStates, setUserStates] = useState<{
    firebase: Maybe<Nullable<FirebaseUser>>;
    hech: Maybe<Nullable<Mandate<User, "uid">>>;
    awaitingVerification: Maybe<boolean>;
  }>({ firebase: undefined, hech: undefined, awaitingVerification: undefined });

  const {
    uid: fbUserStateUid,
    email: fbUserStateEmail,
    emailVerified: fbUserStateEmailVerified,
    phoneNumber: fbUserStatePhoneNumber,
    photoURL: fbUserStatePhotoURL,
  } = userStates.firebase || {};
  const fbUserIsNull = userStates.firebase === null;
  const firebaseHechUserIsNull = userStates.hech === null;

  const [isAdmin, setIsAdmin] = useState<Nullable<boolean>>(false);
  const [initiallyLoading, setInitiallyLoading] = useState(true);

  useEffect(() => {
    let reloadCancelToken: NodeJS.Timeout;

    if (requireEmailVerification && userStates.firebase && !userStates.firebase.emailVerified) {
      // This is needed because Firebase caches the user's info. We need to continually reload to listen for `emailVerified === true`.
      reloadCancelToken = setInterval(() => userStates.firebase?.reload(), 1_000);
    }

    return () => clearInterval(reloadCancelToken);
  }, [requireEmailVerification, userStates.firebase?.emailVerified]);

  useEffect(() => {
    initializeFirebase(
      firebaseOptions,
      async (firebaseUser) => {
        const nextAwaitingVerificationValue = firebaseUser ? !firebaseUser.emailVerified : undefined;
        let cachedUser: Maybe<Nullable<Mandate<User, "uid">>> | void;

        // If opening the app while offline and the user is verified, try to load them from the cache if that feature is enabled
        if (firebaseUser?.emailVerified) {
          cachedUser = await enableOfflineCaching
            ?.getCachedUser(generateDbKey("user", firebaseUser.uid))
            .catch((e) => console.error(`Error fetching firebaseHechContext user cache: ${e?.message || ""}`));

          // This could be awaiting the cache for awhile, and in the meantime, data could
          // have hydrated from the server, so always prefer any data other than the cache
          setUserStates((prev) => ({
            hech: prev.hech || cachedUser || null,
            firebase: firebaseUser,
            awaitingVerification: nextAwaitingVerificationValue,
          }));
        } else {
          setUserStates((prev) => ({
            hech: firebaseUser ? prev.hech : undefined,
            firebase: firebaseUser,
            awaitingVerification: nextAwaitingVerificationValue,
          }));
        }

        // If there's no user, you're logged out and done loading...
        if (!firebaseUser) {
          setUserStates((prev) => ({
            ...prev,
            hech: null,
          }));
          setIsAdmin(false);
          setInitiallyLoading(false);
          // ...but if there is a user that isn't verified, flip loading off because there's no other data to fetch...
        } else if (firebaseUser.emailVerified === false) {
          setInitiallyLoading(false);
          // ...but if there is a verified user, the `onUserValue` will flip the state, unless it's from the cache
        } else if (cachedUser) {
          setInitiallyLoading(false);
        }
      },
      { anonymousSignIn, emulatorOptions, ...props }
    );
  }, [
    enableOfflineCaching,
    firebaseOptions,
    anonymousSignIn,
    emulatorOptions,
    props.isNativePlatform,
    props.webPersistance,
  ]);

  useEffect(() => {
    let offUser: Maybe<VoidFunction>;

    if (fbUserStateUid) {
      offUser = onUserValue(fbUserStateUid, async (firebaseHechUser) => {
        if (firebaseHechUser === null) {
          setUserStates((prev) => ({
            ...prev,
            hech: null,
          }));
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

          setUserStates((prev) => ({
            ...prev,
            hech: firebaseHechUser,
          }));

          enableOfflineCaching
            ?.setCachedUser(generateDbKey("user", fbUserStateUid), firebaseHechUser)
            .catch((e) => console.error(`Error setting firebaseHechContext user cache: ${e?.message || ""}`));
        }

        await getAdminValue(fbUserStateUid)
          .then(setIsAdmin)
          .catch(() => setIsAdmin(false));

        setInitiallyLoading(false);
      });
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
      loggedIn: Boolean(userStates.hech || userStates.firebase),
      isAdmin,
      awaitingVerification: userStates.awaitingVerification,
      user: userStates.hech,
      firebase: userStates.firebase,
    }),
    [initiallyLoading, userStates.hech, isAdmin, userStates.awaitingVerification]
  );

  return <FirebaseHechContext.Provider value={ctx}>{children}</FirebaseHechContext.Provider>;
}
