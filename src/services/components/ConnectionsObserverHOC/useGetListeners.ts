import { Dispatch, SetStateAction, useCallback } from "react";

// Helpers
import { handleOrderingFirebaseList } from "../../helpers/utils";

// Types
import type { ConnectionDataListDatabase, DataList, FirebaseHechDatabase } from "firebase-hech";

export const useGetListeners = <
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK]
>(
  setData: Dispatch<SetStateAction<Record<string, Val | number>[]>>
) => {
  const getChildAddedOrChanged = useCallback(
    (pageIdx: number) => (val: Val | number, key: ChildK | string, previousOrderingKey: Maybe<Nullable<string>>) =>
      setData((prev) => {
        // Firebase makes the `previousOrderingKey` optional, but it will only ever be string or null
        const updatedPage = handleOrderingFirebaseList(prev[pageIdx], val, key as string, previousOrderingKey!);

        // This part is a little confusing to me, but it seems that maybe when something moves between pages,
        // we need to make sure it is cleaned in case there is an overlap between listeners due to edge listening
        if (prev.length) {
          return prev.map((page, i) => {
            const cleaned = { ...page };
            delete cleaned[key as string];

            return i === pageIdx ? updatedPage : cleaned;
          });
        }

        return [updatedPage];
      }),
    [setData]
  );

  const getChildRemoved = useCallback(
    (pageIdx: number) => (key: ChildK | string) => {
      setData((prev) => {
        const updatedPage = { ...prev[pageIdx] };
        delete updatedPage[key as string];
        return prev.map((page, i) => (i === pageIdx ? updatedPage : page));
      });
    },
    [setData]
  );

  return { getChildAddedOrChanged, getChildRemoved };
};
