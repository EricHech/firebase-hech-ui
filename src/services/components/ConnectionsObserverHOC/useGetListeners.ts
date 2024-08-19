import { Dispatch, SetStateAction, useCallback } from "react";

// Helpers
import { handleOrderingFirebaseList } from "../../helpers/utils";

// Types
import type { DataList, FirebaseHechDatabase } from "firebase-hech";

export const useGetListeners = (setData: Dispatch<SetStateAction<DataList[keyof FirebaseHechDatabase]>>) => {
  const childAddedOrChanged = useCallback(
    (val: number, key: string, previousOrderingKey: Maybe<Nullable<string>>) =>
      setData((prev) => {
        // * If it is an existing value being changed, change it...
        if (prev[key] !== undefined) {
          const next = { ...prev };
          next[key] = val;
          return next;
        }

        // * ...otherwise handle adding it
        // Firebase makes the `previousOrderingKey` optional, but it will only ever be string or null
        return handleOrderingFirebaseList(prev, val, key, previousOrderingKey!);
      }),
    [setData]
  );

  const childRemoved = useCallback(
    (key: string) =>
      setData((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      }),
    [setData]
  );

  return { childAddedOrChanged, childRemoved };
};
