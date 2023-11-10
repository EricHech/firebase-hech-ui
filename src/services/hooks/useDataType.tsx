import { useState, useCallback, useEffect } from "react";
import { Data, SoilDatabase } from "firebase-soil";
import { onDataTypeChildChanged } from "../helpers/onDataTypeChildChanged";

// TODO: Add tracking for all data loading and total load times so we can monitor the efficiancy of the Soil data model
export const useDataType = <T2 extends keyof SoilDatabase>(dataType: T2, enabled = true) => {
  const [data, setData] = useState<Record<string, Data<T2>>>({});

  const childChanged = useCallback((val: Data<T2>, key: string) => setData((prev) => ({ ...prev, [key]: val })), []);

  const childRemoved = useCallback(
    (key: string) =>
      setData((prev) =>
        Object.entries(prev).reduce(
          (prv, [dataKey, dataVal]) => (dataKey !== key ? { ...prv, [dataKey]: dataVal } : prv),
          {}
        )
      ),
    []
  );

  useEffect(() => {
    let off: Maybe<VoidFunction>;
    if (enabled) {
      off = onDataTypeChildChanged<T2>(dataType, childChanged, childRemoved);
    }

    return () => {
      off?.();
      setData({});
    };
  }, [childChanged, childRemoved, dataType, enabled]);

  return data;
};
