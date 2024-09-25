import { useState, useEffect, useMemo } from "react";
import type { FirebaseHechDatabase, Data, ConnectionDataListDatabase } from "firebase-hech";
import { GetDataListHookProps } from "./types";
import { getConnectionTypeData } from "firebase-hech/client";

export const useGetConnectionsTypeData = <
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase
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
  const [data, setData] = useState<Maybe<Nullable<Record<string, Data<ChildT>>>>>();

  useEffect(() => {
    if (parentKey && enabled) {
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
      });

      return () => {
        if (!maintainWhenDisabled) setData(undefined);
      };
    }

    return undefined;
  }, [parentType, parentKey, dataType, enabled, maintainWhenDisabled, ...deps]);

  const dataArray = useMemo(
    () =>
      includeArray
        ? Object.entries(data || {}).map(([key, val]) => ({ ...val, key } as unknown as Mandate<Data<ChildT>, "key">))
        : [],
    [includeArray, data]
  );

  return {
    data,
    dataArray,
  };
};
