import { useState, useEffect, useMemo } from "react";
import type { FirebaseHechDatabase, DataList } from "firebase-hech";
import { GetDataListHookProps } from "./types";
import { getConnectionTypeKeys } from "firebase-hech/client";

export const useGetConnectionsTypeKeys = <
  T2 extends keyof FirebaseHechDatabase,
  T3 extends keyof FirebaseHechDatabase
>({
  parentType,
  parentKey,
  dataType,
  includeArray = false,
  enabled = true,
  maintainWhenDisabled = false,
  deps = [],
}: GetDataListHookProps<T2> & {
  parentType: T3;
  parentKey: Maybe<string>;
}) => {
  const [data, setData] = useState<Maybe<Nullable<DataList[T2]>>>();

  useEffect(() => {
    if (parentKey && enabled) {
      getConnectionTypeKeys({
        parentType,
        parentKey,
        dataType,
      }).then(setData);

      return () => {
        if (!maintainWhenDisabled) setData(undefined);
      };
    }

    return undefined;
  }, [parentType, parentKey, dataType, enabled, maintainWhenDisabled, ...deps]);

  const dataArray = useMemo(() => (includeArray ? Object.keys(data || {}) : []), [includeArray, data]);

  return {
    data,
    dataArray,
  };
};
