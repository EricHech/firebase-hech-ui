import { useState, useCallback, useEffect } from "react";
import type { SoilDatabase } from "firebase-soil";
import { onConnectionsDataListChildChanged } from "../helpers/onConnectionsDataListChildChanged";
import { DataListHookProps } from "./useUserData";

export const useConnectionsTypeCustomData = <
  T2 extends keyof SoilDatabase,
  T3 extends keyof SoilDatabase,
  T extends unknown
>({
  parentType,
  parentKey,
  dataType,
  includeArray = false,
  enabled = true,
  customGet,
}: Pick<DataListHookProps<T2>, "dataType" | "includeArray" | "enabled"> & {
  parentType: T3;
  parentKey: Maybe<string>;
  customGet: (key: string) => Promise<T>;
}) => {
  const [data, setData] = useState<Record<string, T>>({});

  const getData = useCallback(
    async (key: string) => {
      const val = await customGet(key);
      if (val) setData((prev) => ({ ...prev, [key]: val }));
    },
    [dataType]
  );

  const childChanged = useCallback((_: number, key: string) => getData(key), [getData]);

  const childRemoved = useCallback(
    (key: string) =>
      setData((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      }),
    []
  );

  useEffect(() => {
    if (parentKey && enabled) {
      const offs = onConnectionsDataListChildChanged(parentType, parentKey, dataType, childChanged, childRemoved);

      return () => {
        offs();
        setData({});
      };
    }

    return undefined;
  }, [parentType, parentKey, dataType, childChanged, childRemoved, enabled]);

  return data;
};
