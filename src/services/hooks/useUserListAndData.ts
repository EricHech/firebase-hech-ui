import { useCallback, useEffect, useMemo, useState } from "react";
import { getDataKeyValue } from "firebase-soil/client";
import type { SoilDatabase, StatefulData, DataList } from "firebase-soil";
import { onConnectionDataListChildChanged } from "../helpers/onConnectionDataListChildChanged";
import { onUserDataListChildChanged } from "../helpers/onUserDataListChildChanged";

type Props<T2 extends keyof SoilDatabase> = {
  uid: Maybe<string>;
  dataType: Maybe<T2>;
  dataKey: Maybe<string>;
};

type DataState<T2 extends keyof SoilDatabase> = Record<string, Record<string, StatefulData<T2>>>;

// TODO: Add tracking for all data loading and total load times so we can monitor the efficiancy of the Soil data model
export const useUserListAndData = <T2 extends keyof SoilDatabase>({ uid, dataType, dataKey }: Props<T2>) => {
  const [data, setData] = useState<DataState<T2>>({});
  const [dataList, setDataList] = useState<Partial<DataList>>({});
  const [toGetList, setToGetList] = useState<Partial<DataList>>();

  const dataTypeList = useMemo(() => (dataType ? dataList[dataType] : undefined), [dataList, dataType]);
  const dataTypeData = useMemo(() => (dataType ? data[dataType] : undefined), [data, dataType]);
  const dataKeyData = useMemo(
    () => (dataType && dataKey ? data[dataType]?.[dataKey] : undefined),
    [data, dataKey, dataType]
  );

  const getData = useCallback((dType: T2, dKey: string) => {
    getDataKeyValue({ dataType: dType, dataKey: dKey }).then((val) =>
      setData((prev) => ({ ...prev, [dType]: { ...prev[dType], [dKey]: val } }))
    );
  }, []);

  const getDataOrCache = useCallback(
    async (dType: T2, dKey: string) => data[dType]?.[dKey] ?? getData(dType, dKey),
    [data, getData]
  );

  const userDataTypeListChanged = useCallback((dTypeList: DataList[T2], dType: T2) => {
    setDataList((prev) => ({ ...prev, [dType]: dTypeList }));
  }, []);

  const userDataTypeListRemoved = useCallback((dType: T2) => {
    setDataList((prev) => {
      const next = { ...prev };
      delete next[dType];
      return next;
    });
    setData((prev) => {
      const next = { ...prev };
      delete next[dType];
      return next;
    });
  }, []);

  useEffect(() => {
    if (dataType && dataKey) {
      getDataOrCache(dataType, dataKey);
    }
  }, [dataType, dataKey, getDataOrCache]);

  useEffect(() => {
    let off: Maybe<VoidFunction>;
    if (uid) {
      off = onUserDataListChildChanged(uid, userDataTypeListChanged, userDataTypeListRemoved);
    }

    return () => {
      off?.();
      setData({});
      setDataList({});
    };
  }, [uid, userDataTypeListChanged, userDataTypeListRemoved]);

  const toGetListChanged = useCallback((dTypeList: DataList, dKey: T2) => {
    setToGetList((prev) => ({ ...prev, [dKey]: dTypeList }));
  }, []);

  const toGetListRemoved = useCallback(
    (dType: T2) =>
      setToGetList((prev) => {
        if (!prev) return prev;

        const next = { ...prev };
        delete next[dType];
        return next;
      }),
    []
  );

  useEffect(() => {
    if (dataType && dataKey) {
      const off = onConnectionDataListChildChanged(dataType, dataKey, toGetListChanged, toGetListRemoved);

      return () => {
        off();
        setToGetList(undefined);
      };
    }

    return undefined;
  }, [dataType, dataKey, toGetListChanged, toGetListRemoved]);

  return { data, dataList, dataTypeList, dataTypeData, dataKeyData, toGetList, getData, getDataOrCache };
};
