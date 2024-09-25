import { useState, useCallback, useEffect, useMemo } from "react";
import type { FirebaseHechDatabase, ConnectionDataListDatabase } from "firebase-hech";
import { getConnectionTypeKeys } from "firebase-hech/client";
import { onConnectionsDataListChildChanged } from "../helpers/onConnectionsDataListChildChanged";
import { setStateFirebaseLists } from "../helpers/utils";
import { OnDataListHookProps } from "./types";

export const useOnConnectionsTypeKeys = <
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  QueryData extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK],
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
}: OnDataListHookProps<ChildT, Poke> & {
  parentType: ParentT;
  parentKey: Maybe<ParentK>;
}) => {
  const [data, setData] = useState<Maybe<Nullable<Record<string, QueryData>>>>(poke ? undefined : {});

  const childChanged = useCallback(
    (val: QueryData, key: ChildK | string, previousOrderingKey: Maybe<Nullable<string>>) =>
      setStateFirebaseLists(setData, val, key as string, previousOrderingKey),
    []
  );

  const childRemoved = useCallback(
    (key: ChildK | string) => setStateFirebaseLists(setData, null, key as string, undefined),
    []
  );

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
          setData(d as Record<string, QueryData>);
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
    data: data as Poke extends true ? Maybe<Nullable<Record<string, QueryData>>> : Record<string, QueryData>,
    dataArray,
  };
};
