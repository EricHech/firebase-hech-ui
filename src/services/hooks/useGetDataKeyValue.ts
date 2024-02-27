import { useState, useEffect } from "react";
import type { SoilDatabase, StatefulData } from "firebase-soil";
import { getDataKeyValue } from "firebase-soil/client";

export const useGetDataKeyValue = <T2 extends keyof SoilDatabase>({
  dataType,
  dataKey,
  initialized,
}: {
  dataType: T2;
  dataKey: Maybe<Nullable<string>>;
  initialized: boolean;
}) => {
  const [data, setData] = useState<StatefulData<T2>>();

  useEffect(() => {
    if (initialized && dataKey) getDataKeyValue({ dataType, dataKey }).then(setData);
  }, [initialized, dataType, dataKey]);

  return data;
};
