import { useState, useCallback, useEffect, useMemo } from "react";
import type { ConnectionDataListDatabase, FirebaseHechDatabase } from "firebase-hech";
import { onConnectionsDataListChildChanged } from "../helpers/onConnectionsDataListChildChanged";
import { OnDataListHookProps } from "./types";
import { genericHydrateAndSetStateFirebaseLists, setStateFirebaseLists } from "../helpers/utils";
import { getConnectionTypeKeys } from "firebase-hech/client";

export const useOnConnectionsTypeCustomData = <
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK],
  T extends unknown,
  Poke extends boolean
>({
  parentType,
  parentKey,
  dataType,
  poke,
  includeArray = false,
  enabled = true,
  maintainWhenDisabled = false,
  deps = [],
  memoizedCustomGet,
}: OnDataListHookProps<ChildT, Poke> & {
  parentType: ParentT;
  parentKey: Maybe<ParentK>;
  /** Make sure that this function is memoed or otherwised saved to avoid infinite re-renders */
  memoizedCustomGet: (key: string) => Promise<T>;
}) => {
  const [data, setData] = useState<Maybe<Nullable<Record<string, T>>>>(poke ? undefined : {});

  const childChanged = useCallback(
    async (
      _: ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK],
      key: ChildK | string,
      previousOrderingKey: Maybe<Nullable<string>>
    ) => genericHydrateAndSetStateFirebaseLists(memoizedCustomGet, setData, key as string, previousOrderingKey),
    [dataType]
  );

  const childRemoved = useCallback(
    (key: ChildK | string) => setStateFirebaseLists(setData, null, key as string, undefined),
    []
  );

  useEffect(() => {
    if (parentKey && enabled) {
      const turnOn = () =>
        onConnectionsDataListChildChanged<ParentT, ParentK, ChildT, ChildK, Val>(
          parentType,
          parentKey,
          dataType,
          childChanged,
          childRemoved
        );
      let off: Maybe<VoidFunction> = undefined;

      if (poke) {
        getConnectionTypeKeys({
          parentType,
          parentKey,
          dataType,
        }).then(async (d) => {
          if (!d) return setData(null);

          const next: Record<string, T> = {};
          await Promise.all(
            Object.keys(d).map(async (k) => {
              next[k] = await memoizedCustomGet(k);
            })
          );
          setData(next);

          off = turnOn();
        });
      } else {
        off = turnOn();
      }

      return () => {
        off?.();
        if (!maintainWhenDisabled) setData(poke ? undefined : {});
      };
    }

    return undefined;
  }, [parentType, parentKey, dataType, childChanged, childRemoved, enabled, maintainWhenDisabled, poke, ...deps]);

  const dataArray = useMemo(
    () => (includeArray ? Object.entries(data || {}).map(([key, value]) => ({ key, value })) : []),
    [includeArray, data]
  );

  return {
    data: data as Poke extends true ? Maybe<Nullable<Record<string, T>>> : Record<string, T>,
    dataArray,
  };
};
