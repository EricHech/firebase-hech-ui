import { useState, useCallback, useEffect, useMemo } from "react";
import type { FirebaseHechDatabase, DataList } from "firebase-hech";
import { getConnectionTypeKeys } from "firebase-hech/client";
import { onConnectionsDataListChildChanged } from "../helpers/onConnectionsDataListChildChanged";
import { setStateFirebaseLists } from "../helpers/utils";
import { OnDataListHookProps } from "./types";

export const useOnConnectionsTypeKeys = <
  T2 extends keyof FirebaseHechDatabase,
  T3 extends keyof FirebaseHechDatabase,
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
  const [data, setData] = useState<Maybe<Nullable<Record<string, number>>>>(poke ? undefined : {});

  const childChanged = useCallback(
    (val: number, key: string, previousOrderingKey: Maybe<Nullable<string>>) =>
      setStateFirebaseLists(setData, val, key, previousOrderingKey),
    []
  );

  const childRemoved = useCallback((key: string) => setStateFirebaseLists(setData, null, key, undefined), []);

  useEffect(() => {
    if (parentKey && enabled) {
      const turnOn = () =>
        onConnectionsDataListChildChanged(parentType, parentKey, dataType, childChanged, childRemoved);
      let off: Maybe<VoidFunction> = undefined;

      if (poke) {
        getConnectionTypeKeys({
          parentType,
          parentKey,
          dataType,
        }).then((d) => {
          setData(d);
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

  const dataArray = useMemo(() => (includeArray ? Object.keys(data || {}) : []), [includeArray, data]);

  return {
    data: data as Poke extends true ? Maybe<Nullable<DataList[T2]>> : DataList[T2],
    dataArray,
  };
};
