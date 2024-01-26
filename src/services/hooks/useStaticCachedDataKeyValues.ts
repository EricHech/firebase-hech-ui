import { useCallback, useState } from "react";

// Soil
import { getDataKeyValue } from "firebase-soil/client";
import type { SoilDatabase, StatefulData } from "firebase-soil";

type StaticCache = Partial<Record<keyof SoilDatabase, Partial<Record<string, StatefulData<keyof SoilDatabase>>>>>;

export type SetCache = ReturnType<typeof useStaticCachedDataKeyValues>["setCache"];
export type GetCache = ReturnType<typeof useStaticCachedDataKeyValues>["getCache"];

export const useStaticCachedDataKeyValues = () => {
  const [staticCache, setStaticCache] = useState<StaticCache>({});

  const setCache = useCallback(
    <T extends keyof SoilDatabase>(dataType: T, dataKey: string, data: StatefulData<T>) =>
      setStaticCache((prev) => ({
        ...prev,
        [dataType]: {
          ...prev[dataType],
          [dataKey]: data,
        },
      })),
    []
  );

  const getCache = useCallback(
    async <T extends keyof SoilDatabase>(dataType: T, dataKey: string, { fetchIfNull }: { fetchIfNull: boolean }) => {
      const data = staticCache[dataType]?.[dataKey] as StatefulData<T>;
      if (fetchIfNull ? data != undefined : data !== undefined) return data;

      const fetchedData = await getDataKeyValue({ dataType, dataKey });
      setCache(dataType, dataKey, fetchedData);

      return fetchedData;
    },
    [setCache, staticCache]
  );

  return { setCache, getCache };
};
