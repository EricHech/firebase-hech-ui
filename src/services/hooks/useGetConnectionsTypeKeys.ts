import { useState, useEffect, useMemo } from "react";
import type { FirebaseHechDatabase, DataList, ConnectionDataListDatabase } from "firebase-hech";
import { GetDataListHookProps } from "./types";
import { getConnectionTypeKeys } from "firebase-hech/client";

export const useGetConnectionsTypeKeys = <
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK]
>({
  parentType,
  parentKey,
  dataType,
  includeArray = false,
  enabled = true,
  maintainWhenDisabled = false,
  deps = [],
}: GetDataListHookProps<ChildT> & {
  parentType: ParentT;
  parentKey: Maybe<ParentK>;
}) => {
  const [data, setData] = useState<Maybe<Nullable<ConnectionDataListDatabase[ParentT][ParentK][ChildT]>>>();

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
