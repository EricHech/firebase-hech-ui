import { useState, useCallback, useEffect, useMemo } from "react";
import type { SoilDatabase, Data } from "firebase-soil";
import { onConnectionsDataListChildChanged } from "../helpers/onConnectionsDataListChildChanged";
import { soilHydrateAndSetStateFirebaseLists, setStateFirebaseLists } from "../helpers/utils";
import { OnDataListHookProps } from "./types";
import { getConnectionTypeData } from "firebase-soil/client";

export const useOnConnectionsTypeData = <
  T2 extends keyof SoilDatabase,
  T3 extends keyof SoilDatabase,
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
}: OnDataListHookProps<T2, Poke> & {
  parentType: T3;
  parentKey: Maybe<string>;
}) => {
  const [data, setData] = useState<Maybe<Nullable<Record<string, Data<T2>>>>>(poke ? undefined : {});

  const childChanged = useCallback(
    async (_: number, key: string, previousOrderingKey: Maybe<Nullable<string>>) =>
      soilHydrateAndSetStateFirebaseLists(dataType, setData, _, key, previousOrderingKey),
    [dataType]
  );

  const childRemoved = useCallback((key: string) => setStateFirebaseLists(setData, null, key, undefined), []);

  useEffect(() => {
    if (parentKey && enabled) {
      const turnOn = () =>
        onConnectionsDataListChildChanged(parentType, parentKey, dataType, childChanged, childRemoved);
      let off: Maybe<VoidFunction> = undefined;

      if (poke) {
        getConnectionTypeData({
          parentType,
          parentKey,
          dataType,
        }).then((d) => {
          setData(
            d.length === 0
              ? null
              : d.reduce((p, curr) => {
                  if (!curr) return p;
                  curr;
                  p[curr.key] = curr;
                  return p;
                }, {} as Record<string, Data<T2>>)
          );

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
    () =>
      includeArray
        ? Object.entries(data || {}).map(([key, val]) => ({ ...val, key } as unknown as Mandate<Data<T2>, "key">))
        : [],
    [includeArray, data]
  );

  return {
    data: data as Poke extends true ? Maybe<Nullable<Record<string, Data<T2>>>> : Record<string, Data<T2>>,
    dataArray,
  };
};
