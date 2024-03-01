import { useCallback, useEffect, useMemo, useState } from "react";
import type { SoilDatabase, Data } from "firebase-soil";
import { onPublicDataTypeListChildChanged } from "../helpers/onPublicDataTypeListChildChanged";
import { DataListHookProps } from "./types";
import { setStateFirebaseLists, soilHydrateAndSetStateFirebaseLists } from "../helpers/utils";

export const useOnPublicTypeData = <T2 extends keyof SoilDatabase, Poke extends boolean>({
  dataType,
  poke,
  includeArray = false,
  enabled = true,
  maintainWhenDisabled = false,
}: DataListHookProps<T2, Poke>) => {
  const [data, setData] = useState<Maybe<Nullable<Record<string, Data<T2>>>>>(poke ? undefined : {});

  const childChanged = useCallback(
    async (_: number, key: string, previousOrderingKey: Maybe<Nullable<string>>) =>
      soilHydrateAndSetStateFirebaseLists(dataType, setData, _, key, previousOrderingKey),
    [dataType]
  );

  const childRemoved = useCallback((key: string) => setStateFirebaseLists(setData, null, key, undefined), []);

  useEffect(() => {
    let off: Maybe<VoidFunction>;
    if (enabled) {
      off = onPublicDataTypeListChildChanged(dataType, childChanged, childRemoved);
    }

    return () => {
      off?.();
      if (!maintainWhenDisabled) setData(poke ? undefined : {});
    };
  }, [dataType, childChanged, childRemoved, enabled, maintainWhenDisabled, poke]);

  const dataArray = useMemo(
    () =>
      includeArray
        ? Object.entries(data || {}).map(([key, val]) => ({ ...val, key } as unknown as Mandate<Data<T2>, "key">))
        : [],
    [data, includeArray]
  );

  return {
    data: data as Poke extends true ? Maybe<Nullable<Record<string, Data<T2>>>> : Record<string, Data<T2>>,
    dataArray,
  };
};
