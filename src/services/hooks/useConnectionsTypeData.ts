import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { SoilDatabase, Data, PATHS } from "firebase-soil";
import { GetChildrenEqualTo, getChildrenEqualTo, getDataKeyValue } from "firebase-soil/client";
import { onConnectionsDataListChildChanged } from "../helpers/onConnectionsDataListChildChanged";
import { DataListHookProps } from "./useUserData";

export const useConnectionsTypeData = <T2 extends keyof SoilDatabase, T3 extends keyof SoilDatabase>({
  parentType,
  parentKey,
  dataType,
  includeArray = false,
  enabled = true,
  initialChildEqualToQuery,
}: Pick<DataListHookProps<T2>, "dataType" | "includeArray" | "enabled"> & {
  parentType: T3;
  parentKey: Maybe<string>;
  initialChildEqualToQuery?: GetChildrenEqualTo;
}) => {
  type ConnectionsData = Record<string, Data<T2>>;

  const [data, setData] = useState<Nullable<ConnectionsData>>({});
  const initiallyRequested = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (initialChildEqualToQuery?.path) {
      getChildrenEqualTo<ConnectionsData, GetChildrenEqualTo["val"]>(
        PATHS.dataType(dataType),
        initialChildEqualToQuery.path,
        initialChildEqualToQuery.val
      ).then((d) => {
        initiallyRequested.current = Object.keys(d || {}).reduce((prev, key) => {
          prev[key] = true; // eslint-disable-line no-param-reassign
          return prev;
        }, initiallyRequested.current);

        setData(d);
      });
    }
  }, [dataType, initialChildEqualToQuery?.path, initialChildEqualToQuery?.val]);

  const getData = useCallback(
    (key: string) => {
      if (!initialChildEqualToQuery?.path || !initiallyRequested.current[key]) {
        getDataKeyValue({ dataType, dataKey: key }).then(
          (val) => val && setData((prev) => ({ ...prev, [key]: { ...val, key } }))
        );
      } else {
        delete initiallyRequested.current[key];
      }
    },
    [dataType, initialChildEqualToQuery?.path]
  );

  const childChanged = useCallback((_: number, key: string) => getData(key), [getData]);

  const childRemoved = useCallback(
    (key: string) =>
      setData((prev) =>
        Object.entries(prev || {}).reduce((prv, [dKey, dVal]) => (dKey !== key ? { ...prv, [dKey]: dVal } : prv), {})
      ),
    []
  );

  const shouldTurnOn = initialChildEqualToQuery ? Boolean(data === null || Object.keys(data).length) : true;

  useEffect(() => {
    if (parentKey && enabled && shouldTurnOn) {
      const offs = onConnectionsDataListChildChanged(parentType, parentKey, dataType, childChanged, childRemoved);

      return () => {
        offs();
        setData({});
      };
    }

    return undefined;
  }, [parentType, parentKey, dataType, childChanged, childRemoved, enabled, shouldTurnOn]);

  const dataArray = useMemo(
    () =>
      includeArray
        ? Object.entries(data || {})
            .filter(([_, d]) => Boolean(d))
            .map(([key, val]) => ({ ...val, key } as unknown as Mandate<Data<T2>, "key">))
        : [],
    [includeArray, data]
  );

  return { data, dataArray };
};
