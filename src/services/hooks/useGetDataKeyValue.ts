import { useState, useEffect } from "react";
import type { FirebaseHechDatabase, StatefulData } from "firebase-hech";
import { getDataKeyValue } from "firebase-hech/client";

export const useGetDataKeyValue = <T2 extends keyof FirebaseHechDatabase>({
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
