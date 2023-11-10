"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  Dispatch,
  SetStateAction,
  createContext,
  memo,
  PropsWithChildren,
} from "react";
import { SoilDatabase, Data } from "firebase-soil";
import { GetChildrenEqualTo } from "firebase-soil/dist/client";
import { useConnectionsTypeData } from "../..";
import { useGetSafeContext } from "./getSafeContext";

type BaseConnectionsTypeDataContext<T2 extends keyof SoilDatabase> = {
  data: Nullable<Record<string, Data<T2>>>;
  dataArray: Mandate<Data<T2>, "key">[];
  setParentKey: Dispatch<SetStateAction<Maybe<string>>>;
  setInitialChildEqualToQuery: Dispatch<SetStateAction<Maybe<GetChildrenEqualTo>>>;
};

export const createConnectionsTypeDataContext = <T2 extends keyof SoilDatabase, T22 extends keyof SoilDatabase>(
  parentType: T2,
  dataType: T22
) => {
  const ConnectionsTypeDataContext = createContext<Maybe<BaseConnectionsTypeDataContext<T22>>>(undefined);

  const useConnectionsTypeDataContext = (dataKey: string, initialChildEqualTo?: GetChildrenEqualTo) => {
    const useContextResult = useGetSafeContext(ConnectionsTypeDataContext);

    if (!useContextResult) throw new Error(`You must wrap your component in an instance of the ${dataType} context`);

    const { data, dataArray, setParentKey, setInitialChildEqualToQuery } = useContextResult;

    useEffect(() => {
      setParentKey(dataKey);
    }, [setParentKey, dataKey]);

    useEffect(() => {
      if (initialChildEqualTo?.path) {
        setInitialChildEqualToQuery({ path: initialChildEqualTo.path, val: initialChildEqualTo.val });
      }
    }, [setInitialChildEqualToQuery, initialChildEqualTo?.path, initialChildEqualTo?.val]);

    return { data, dataArray };
  };

  const ConnectionsTypeDataContextProviderComponent = memo(function ConnectionsTypeDataContextProviderComponent({
    children,
  }: PropsWithChildren<{}>) {
    const [parentKey, setParentKey] = useState<string>();
    const [initialChildEqualToQuery, setInitialChildEqualToQuery] = useState<GetChildrenEqualTo>();

    const { data, dataArray } = useConnectionsTypeData({
      parentType,
      parentKey,
      dataType,
      includeArray: true,
      enabled: Boolean(parentKey),
      initialChildEqualToQuery,
    });

    const ctx = useMemo(
      () => ({ data, dataArray, setParentKey, setInitialChildEqualToQuery }),
      [data, dataArray, setParentKey, setInitialChildEqualToQuery]
    );

    return <ConnectionsTypeDataContext.Provider value={ctx}>{children}</ConnectionsTypeDataContext.Provider>;
  });

  return { useConnectionsTypeDataContext, ConnectionsTypeDataContextProviderComponent };
};
