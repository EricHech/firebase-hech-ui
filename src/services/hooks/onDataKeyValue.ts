import { useEffect, useState } from "react";
import { SoilDatabase, StatefulData } from "firebase-soil";
import { onDataKeyValue } from "firebase-soil/client";

export const useOnDataKeyValue = <T2 extends keyof SoilDatabase>(dataType: T2, dataKey: string) => {
  const [requestData, setRequestData] = useState<Nullable<StatefulData<T2>>>();

  useEffect(() => {
    const off = onDataKeyValue({ dataKey, dataType, cb: setRequestData });

    return off;
  }, [dataKey, dataType]);

  return requestData;
};
