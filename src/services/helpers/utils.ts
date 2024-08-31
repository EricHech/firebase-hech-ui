import type { Dispatch, SetStateAction } from "react";

// FirebaseHech
import { getDataKeyValue } from "firebase-hech/client";
import type { Data, FirebaseHechDatabase } from "firebase-hech";

export const handleOrderingFirebaseList = <T extends unknown>(
  data: Maybe<Nullable<Record<string, T>>>,
  val: T,
  key: string,
  previousOrderingKey: Nullable<string>,
  direction: "limitToLast" | "limitToFirst"
) => {
  // * If it is a new value being added to the beginning, add it to the beginning...
  if (previousOrderingKey === null) return { [key]: val, ...data };

  // * ...otherwise add it to the correct location:
  const next = { ...data };
  delete next[key];
  const entries = Object.entries(next || {});
  const insertionPrevIndex = entries.findIndex(([k]) => k === previousOrderingKey);
  entries.splice(insertionPrevIndex + 1, 0, [key, val]);

  return Object.fromEntries(entries);
};

export const setStateFirebaseLists = <T extends unknown>(
  setData: Dispatch<SetStateAction<Maybe<Nullable<Record<string, T>>>>>,
  val: Nullable<T>,
  key: string,
  previousOrderingKey: Maybe<Nullable<string>>
) =>
  setData((prev) => {
    // * If it is a value being removed, remove it...
    if (val === null) {
      const next = { ...prev };
      delete next[key];
      return next;
    }

    // * ...otherwise, if it is an existing value being changed, change it...
    if (prev?.[key] !== undefined) {
      const next: Record<string, T> = { ...prev };
      next[key] = val;
      return next;
    }

    // * ...otherwise handle adding it
    // Firebase makes the `previousOrderingKey` optional, but it will only ever be string or null
    return handleOrderingFirebaseList(prev, val, key, previousOrderingKey!, "limitToFirst");
  });

export const genericHydrateAndSetStateFirebaseLists = async <T extends unknown>(
  get: (key: string) => Promise<Nullable<T>>,
  setData: Dispatch<SetStateAction<Maybe<Nullable<Record<string, T>>>>>,
  _: Nullable<number>,
  key: string,
  previousOrderingKey: Maybe<Nullable<string>>
) => {
  const val: Nullable<T> = await get(key);

  return setStateFirebaseLists(setData, val, key, previousOrderingKey);
};

export const firebaseHechHydrateAndSetStateFirebaseLists = async <T2 extends keyof FirebaseHechDatabase>(
  dataType: T2,
  setData: Dispatch<SetStateAction<Maybe<Nullable<Record<string, Data<T2>>>>>>,
  _: Nullable<number>,
  key: string,
  previousOrderingKey: Maybe<Nullable<string>>
) => {
  const get = (k: string) => getDataKeyValue({ dataType, dataKey: k });

  return genericHydrateAndSetStateFirebaseLists(get, setData, _, key, previousOrderingKey);
};
