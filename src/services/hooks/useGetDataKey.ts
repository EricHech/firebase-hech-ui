import { useState, useEffect } from "react";
import type { SoilDatabase, StatefulData } from "firebase-soil";
import { getDataKeyValue } from "firebase-soil/client";

export const useGetDataKey = <T2 extends keyof SoilDatabase>(dataType: T2, dataKey: Maybe<Nullable<string>>) => {
  const [data, setData] = useState<StatefulData<T2>>();

  useEffect(() => {
    if (dataKey) {
      getDataKeyValue<T2>({ dataType, dataKey }).then(setData);
    } else {
      setData(undefined);
    }
  }, [dataType, dataKey]);

  return data;
};
