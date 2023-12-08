import { useState, useCallback, useEffect, useMemo } from "react";
import type { SoilDatabase, DataList } from "firebase-soil";
import { onConnectionsDataListChildChanged } from "../helpers/onConnectionsDataListChildChanged";
import { DataListHookProps } from "./useUserData";

export const useConnections = <T2 extends keyof SoilDatabase, T3 extends keyof SoilDatabase>({
  parentType,
  parentKey,
  dataType,
  includeArray = false,
  enabled = true,
}: Pick<DataListHookProps<T2>, "dataType" | "includeArray" | "enabled"> & {
  parentType: T3;
  parentKey: Maybe<string>;
}) => {
  type Connections = DataList[T2];

  const [data, setData] = useState<Connections>({});

  const childChanged = useCallback(
    (timestamp: number, key: string) => setData((prev) => ({ ...prev, [key]: timestamp })),
    []
  );

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

  const dataArray = useMemo(() => (includeArray ? Object.keys(data) : []), [includeArray, data]);

  return { data, dataArray };
};
