import { useState, useCallback, useEffect, useMemo } from "react";
import type { DataList, SoilDatabase } from "firebase-soil";
import { onOwnersChildChanged } from "../helpers/onOwnersChildChanged";
import { OnDataListHookProps } from "./types";
import { setStateFirebaseLists } from "../helpers/utils";

export const useOnOwners = <T2 extends keyof SoilDatabase, Poke extends boolean>({
  dataType,
  dataKey,
  poke,
  includeArray = false,
  enabled = true,
  maintainWhenDisabled = false,
  deps = [],
}: OnDataListHookProps<T2, Poke> & {
  dataKey: Maybe<string>;
}) => {
  const [data, setData] = useState<Maybe<Nullable<Record<string, number>>>>(poke ? undefined : {});

  const childChanged = useCallback(
    (val: number, key: string, previousOrderingKey: Maybe<Nullable<string>>) =>
      setStateFirebaseLists(setData, val, key, previousOrderingKey),
    []
  );

  const childRemoved = useCallback((key: string) => setStateFirebaseLists(setData, null, key, undefined), []);

  useEffect(() => {
    if (dataKey && enabled) {
      const offs = onOwnersChildChanged(dataType, dataKey, childChanged, childRemoved);

      return () => {
        offs();
        if (!maintainWhenDisabled) setData(poke ? undefined : {});
      };
    }

    return undefined;
  }, [dataType, dataKey, childChanged, childRemoved, enabled, maintainWhenDisabled, poke, ...deps]);

  const dataArray = useMemo(() => (includeArray ? Object.keys(data || {}) : []), [includeArray, data]);

  return {
    data: data as Poke extends true ? Maybe<Nullable<DataList[T2]>> : DataList[T2],
    dataArray,
  };
};
