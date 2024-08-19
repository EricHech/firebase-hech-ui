import { useState, useEffect, useMemo } from "react";
import type { FirebaseHechDatabase, Data } from "firebase-hech";
import { GetDataListHookProps } from "./types";
import { getUserTypeData } from "firebase-hech/client";

export const useGetUserTypeData = <T2 extends keyof FirebaseHechDatabase, T3 extends keyof FirebaseHechDatabase>({
  parentType,
  uid,
  dataType,
  includeArray = false,
  enabled = true,
  maintainWhenDisabled = false,
  deps = [],
}: GetDataListHookProps<T2> & {
  parentType: T3;
  uid: Maybe<string>;
}) => {
  const [data, setData] = useState<Maybe<Nullable<Record<string, Data<T2>>>>>();

  useEffect(() => {
    if (uid && enabled) {
      getUserTypeData({
        dataType,
        uid,
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
      });

      return () => {
        if (!maintainWhenDisabled) setData(undefined);
      };
    }

    return undefined;
  }, [parentType, uid, dataType, enabled, maintainWhenDisabled, ...deps]);

  const dataArray = useMemo(
    () =>
      includeArray
        ? Object.entries(data || {}).map(([key, val]) => ({ ...val, key } as unknown as Mandate<Data<T2>, "key">))
        : [],
    [includeArray, data]
  );

  return {
    data,
    dataArray,
  };
};
