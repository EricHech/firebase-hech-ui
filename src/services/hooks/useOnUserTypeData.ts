import { useCallback, useEffect, useMemo, useState } from "react";
import { getUserTypeData } from "firebase-hech/client";
import type { FirebaseHechDatabase, Data } from "firebase-hech";
import { onUserDataTypeListChildChanged } from "../helpers/onUserDataTypeListChildChanged";
import { setStateFirebaseLists, firebaseHechHydrateAndSetStateFirebaseLists } from "../helpers/utils";
import { OnDataListHookProps } from "./types";

export const useOnUserTypeData = <T2 extends keyof FirebaseHechDatabase, Poke extends boolean>({
  uid,
  dataType,
  poke,
  includeArray = false,
  enabled = true,
  maintainWhenDisabled = false,
  deps = [],
}: OnDataListHookProps<T2, Poke> & {
  uid: Maybe<string>;
}) => {
  const [data, setData] = useState<Maybe<Nullable<Record<string, Data<T2>>>>>(poke ? undefined : {});

  const childChanged = useCallback(
    async (_: number, key: string, previousOrderingKey: Maybe<Nullable<string>>) =>
      firebaseHechHydrateAndSetStateFirebaseLists(dataType, setData, _, key, previousOrderingKey),
    [dataType]
  );

  const childRemoved = useCallback((key: string) => setStateFirebaseLists(setData, null, key, undefined), []);

  useEffect(() => {
    let off: Maybe<VoidFunction> = undefined;

    if (uid && enabled) {
      const turnOn = () => onUserDataTypeListChildChanged(uid, dataType, childChanged, childRemoved);

      if (poke) {
        getUserTypeData({
          uid,
          dataType,
        }).then((d) => {
          setData(
            d.length === 0
              ? null
              : d.reduce((p, curr) => {
                  if (!curr) return p;
                  p[curr.key] = curr;
                  return p;
                }, {} as Record<string, Data<T2>>)
          );

          off = turnOn();
        });
      } else {
        off = turnOn();
      }
    }

    return () => {
      off?.();
      if (!maintainWhenDisabled) setData(poke ? undefined : {});
    };
  }, [uid, dataType, childChanged, childRemoved, enabled, maintainWhenDisabled, poke, ...deps]);

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
