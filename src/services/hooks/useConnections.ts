import { useState, useCallback, useEffect, useMemo } from "react";
import type { SoilDatabase, DataList } from "firebase-soil";
import { onConnectionsDataListChildChanged } from "../helpers/onConnectionsDataListChildChanged";
import { DataListHookProps } from "./useUserData";
import { getConnectionType } from "firebase-soil/client";

export const useConnections = <T2 extends keyof SoilDatabase, T3 extends keyof SoilDatabase, Poke extends boolean>({
  parentType,
  parentKey,
  dataType,
  poke,
  enabled = true,
  includeArray = false,
}: Pick<DataListHookProps<T2, Poke>, "dataType" | "includeArray" | "enabled" | "poke"> & {
  parentType: T3;
  parentKey: Maybe<string>;
}) => {
  const [data, setData] = useState<Maybe<Nullable<DataList[T2]>>>(poke ? undefined : {});

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
  }, [parentType, parentKey, dataType, childChanged, childRemoved, enabled, poke]);

  const dataArray = useMemo(() => (includeArray ? Object.keys(data || {}) : []), [includeArray, data]);

  return {
    data: data as Poke extends true ? Maybe<Nullable<DataList[T2]>> : DataList[T2],
    dataArray,
  };
};
