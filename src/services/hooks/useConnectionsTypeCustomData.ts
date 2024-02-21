import { useState, useCallback, useEffect } from "react";
import type { SoilDatabase } from "firebase-soil";
import { onConnectionsDataListChildChanged } from "../helpers/onConnectionsDataListChildChanged";
import { DataListHookProps } from "./types";
import { genericHydrateAndSetStateFirebaseLists, setStateFirebaseLists } from "../helpers/utils";

export const useConnectionsTypeCustomData = <
  T2 extends keyof SoilDatabase,
  T3 extends keyof SoilDatabase,
  T extends unknown
>({
  parentType,
  parentKey,
  dataType,
  poke,
  includeArray = false,
  enabled = true,
  memoizedCustomGet,
}: DataListHookProps<T2, boolean> & {
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
      const offs = onConnectionsDataListChildChanged(parentType, parentKey, dataType, childChanged, childRemoved);

      return () => {
        offs();
        setData(poke ? undefined : {});
      };
    }

    return undefined;
  }, [parentType, parentKey, dataType, childChanged, childRemoved, enabled, poke]);

  return data;
};
