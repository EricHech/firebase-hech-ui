import { useState, useEffect } from "react";
import { SoilDatabase, Data } from "firebase-soil";
import { onDataKeyValue } from "firebase-soil/dist/client";

export const useDataKeyValue = <T2 extends keyof SoilDatabase>(
  dataType: T2,
  dataKey: Maybe<Nullable<string>>,
  initialized: boolean
) => {
  const [data, setData] = useState<Nullable<Data<T2>>>();

  useEffect(() => {
    let off: Maybe<VoidFunction>;
    if (initialized && dataKey) {
      off = onDataKeyValue({ dataType, dataKey, cb: setData });
    }

    return () => {
      off?.();
      setData(undefined);
    };
  }, [initialized, dataType, dataKey]);

  return data;
};
