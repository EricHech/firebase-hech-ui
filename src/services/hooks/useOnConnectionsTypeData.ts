import { useState, useCallback, useEffect, useMemo } from "react";
import type { FirebaseHechDatabase, Data, ConnectionDataListDatabase } from "firebase-hech";
import { onConnectionsDataListChildChanged } from "../helpers/onConnectionsDataListChildChanged";
import { firebaseHechHydrateAndSetStateFirebaseLists, setStateFirebaseLists } from "../helpers/utils";
import { OnDataListHookProps } from "./types";
import { getConnectionTypeData } from "firebase-hech/client";

export const useOnConnectionsTypeData = <
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
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
  const [data, setData] = useState<Maybe<Nullable<Record<string, Data<ChildT>>>>>(poke ? undefined : {});

  const childChanged = useCallback(
    async (
      _: ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK],
      key: ChildK | string,
      previousOrderingKey: Maybe<Nullable<string>>
    ) => firebaseHechHydrateAndSetStateFirebaseLists(dataType, setData, key as string, previousOrderingKey),
    [dataType]
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
                }, {} as Record<string, Data<ChildT>>)
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
        ? Object.entries(data || {}).map(([key, val]) => ({ ...val, key } as unknown as Mandate<Data<ChildT>, "key">))
        : [],
    [includeArray, data]
  );

  return {
    data: data as Poke extends true ? Maybe<Nullable<Record<string, Data<ChildT>>>> : Record<string, Data<ChildT>>,
    dataArray,
  };
};
