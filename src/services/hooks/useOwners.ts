import { useState, useCallback, useEffect, useMemo } from "react";
import type { SoilDatabase } from "firebase-soil";
import { onOwnersChildChanged } from "../helpers/onOwnersChildChanged";
import { DataListHookProps } from "./useUserData";

export const useOwners = <T2 extends keyof SoilDatabase, T3 extends keyof SoilDatabase>({
  dataType,
  dataKey,
  includeArray = false,
  enabled = true,
}: Pick<DataListHookProps<T2, boolean>, "dataType" | "includeArray" | "enabled"> & {
  dataKey: Maybe<string>;
}) => {
  const [data, setData] = useState<Record<string, number>>({});

  const childChanged = useCallback(
    (timestamp: number, key: string) => setData((prev) => ({ ...prev, [key]: timestamp })),
    []
  );

  const childRemoved = useCallback(
    (key: string) =>
      setData((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      }),
    []
  );

  useEffect(() => {
    if (dataKey && enabled) {
      const offs = onOwnersChildChanged(dataType, dataKey, childChanged, childRemoved);

      return () => {
        offs();
        setData({});
      };
    }

    return undefined;
  }, [dataType, dataKey, dataType, childChanged, childRemoved, enabled]);

  const dataArray = useMemo(() => (includeArray ? Object.keys(data) : []), [includeArray, data]);

  return { data, dataArray };
};
