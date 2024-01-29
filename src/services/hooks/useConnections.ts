import { useState, useCallback, useEffect, useMemo } from "react";
import type { SoilDatabase, DataList } from "firebase-soil";
import { onConnectionsDataListChildChanged } from "../helpers/onConnectionsDataListChildChanged";
import { DataListHookProps } from "./useUserData";
import { getConnectionType } from "firebase-soil/client";

export const useConnections = <T2 extends keyof SoilDatabase, T3 extends keyof SoilDatabase>({
  parentType,
  parentKey,
  dataType,
  includeArray = false,
  enabled = true,
  poke = false,
}: Pick<DataListHookProps<T2>, "dataType" | "includeArray" | "enabled" | "poke"> & {
  parentType: T3;
  parentKey: Maybe<string>;
}) => {
  const [data, setData] = useState<Nullable<DataList[T2]>>();

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
      const turnOn = () =>
        onConnectionsDataListChildChanged(parentType, parentKey, dataType, childChanged, childRemoved);
      let offs: () => void;

      if (poke) {
        getConnectionType({
          dataType: parentType,
          dataKey: parentKey,
          connectionType: dataType,
        }).then((d) => {
          setData(d);
          offs = turnOn();
        });
      } else {
        offs = turnOn();
      }

      return () => {
        offs();
        setData(undefined);
      };
    }

    return undefined;
  }, [parentType, parentKey, dataType, childChanged, childRemoved, enabled]);

  const dataArray = useMemo(() => (includeArray ? Object.keys(data || {}) : []), [includeArray, data]);

  return { data, dataArray };
};
