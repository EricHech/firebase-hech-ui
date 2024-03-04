import { useState, useCallback, useEffect, useMemo } from "react";
import type { SoilDatabase } from "firebase-soil";
import { onConnectionsDataListChildChanged } from "../helpers/onConnectionsDataListChildChanged";
import { OnDataListHookProps } from "./types";
import { genericHydrateAndSetStateFirebaseLists, setStateFirebaseLists } from "../helpers/utils";
import { getConnectionTypeKeys } from "firebase-soil/client";

export const useOnConnectionsTypeCustomData = <
  T2 extends keyof SoilDatabase,
  T3 extends keyof SoilDatabase,
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
  memoizedCustomGet,
}: OnDataListHookProps<T2, Poke> & {
  parentType: T3;
  parentKey: Maybe<string>;
  /** Make sure that this function is memoed or otherwised saved to avoid infinite re-renders */
  memoizedCustomGet: (key: string) => Promise<T>;
}) => {
  const [data, setData] = useState<Maybe<Nullable<Record<string, T>>>>(poke ? undefined : {});

  const childChanged = useCallback(
    async (_: number, key: string, previousOrderingKey: Maybe<Nullable<string>>) =>
      genericHydrateAndSetStateFirebaseLists(memoizedCustomGet, setData, _, key, previousOrderingKey),
    [dataType]
  );

  const childRemoved = useCallback((key: string) => setStateFirebaseLists(setData, null, key, undefined), []);

  useEffect(() => {
    if (parentKey && enabled) {
      const turnOn = () =>
        onConnectionsDataListChildChanged(parentType, parentKey, dataType, childChanged, childRemoved);
      let off: () => void;

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
        off();
        if (!maintainWhenDisabled) setData(poke ? undefined : {});
      };
    }

    return undefined;
  }, [parentType, parentKey, dataType, childChanged, childRemoved, enabled, maintainWhenDisabled, poke]);

  const dataArray = useMemo(
    () => (includeArray ? Object.entries(data || {}).map(([key, value]) => ({ key, value })) : []),
    [includeArray, data]
  );

  return {
    data: data as Poke extends true ? Maybe<Nullable<Record<string, T>>> : Record<string, T>,
    dataArray,
  };
};
