import { useCallback, useEffect, useMemo, useState } from "react";
import { getDataKeyValue } from "firebase-soil/client";
import type { SoilDatabase, StatefulData, Data } from "firebase-soil";
import { onUserDataTypeListChildChanged } from "../helpers/onUserDataTypeListChildChanged";

export type DataListHookProps<T2> = {
  uid: Maybe<string>;
  dataType: T2;
  /** Set this to true if you want to keep all the data up to date at all times. */
  fetchData?: boolean;
  /** Set this to true if you want the data in array form using `dataArray` (`data` will still be populated). */
  includeArray?: boolean;
  /** Set this to true if you want the keys in array form using `keysArray`. */
  includeKeysArray?: boolean;
  /** Turn the realtime data fetching on and off. */
  enabled?: boolean;
  /** Pass this in if you want to fetch the data before listening to be able to have certainty as to when hydration is complete */
  poke?: boolean;
  /** If you pass in a `keyValidator` function, it will only fetch data for keys that return true. */
  keyValidator?: (key: string) => boolean;
};

// TODO: Add tracking for all data loading and total load times so we can monitor the efficiancy of the Soil data model
export const useUserData = <T2 extends keyof SoilDatabase>({
  uid,
  dataType,
  fetchData = false,
  includeArray = false,
  includeKeysArray = false,
  enabled = true,
  keyValidator,
}: Omit<DataListHookProps<T2>, "poke">) => {
  const [data, setDataState] = useState<Record<string, StatefulData<T2>>>({});
  const [fetched, setFetched] = useState(false);

  const setData = useCallback<typeof setDataState>(
    (d) => {
      setFetched(true);
      return setDataState(d);
    },
    [setDataState]
  );

  const getData = useCallback(
    (key: string) => {
      getDataKeyValue({ dataType, dataKey: key }).then((val) => setData((prev) => ({ ...prev, [key]: val })));
    },
    [dataType, setData]
  );

  const getDataOrCache = useCallback(async (key: string) => data[key] || getData(key), [data, getData]);

  const childChanged = useCallback(
    (_: number, key: string) => {
      if (!fetchData || (keyValidator && !keyValidator(key))) {
        setData((prev) => ({ ...prev, [key]: null }));
      } else {
        getData(key);
      }
    },
    [fetchData, keyValidator, getData, setData]
  );

  const childRemoved = useCallback(
    (key: string) =>
      setData((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      }),
    [setData]
  );

  useEffect(() => {
    let off: Maybe<VoidFunction>;
    if (uid && enabled) {
      off = onUserDataTypeListChildChanged(uid, dataType, childChanged, childRemoved);
    }

    return () => {
      off?.();
      setFetched(false);
      setDataState({});
    };
  }, [uid, childChanged, childRemoved, dataType, enabled, setData]);

  /** Array form of data. This is only populated if `includeArray` is set to true. */
  const dataArray = useMemo(
    () =>
      includeArray
        ? (Object.entries(data)
            .filter(([_, d]) => Boolean(d))
            .map(([key, d]) => ({
              ...d,
              key,
            })) as Mandate<Data<T2>, "key">[])
        : [],
    [data, includeArray]
  );

  /** Array of keys. This is only populated if `includeKeysArray` is set to true. */
  const keysArray = useMemo(() => (includeKeysArray ? Object.keys(data) : []), [data, includeKeysArray]);

  return { fetched, data, dataArray, keysArray, getData, getDataOrCache };
};
