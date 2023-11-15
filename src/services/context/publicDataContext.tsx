import React, { useEffect, useMemo, ReactNode, createContext, useCallback, memo, useState } from "react";
import { Data, SoilDatabase, StatefulData } from "firebase-soil";
import { usePublicData } from "../..";
import { useSoilContext } from "./soilContext";
import { useGetSafeContext } from "./getSafeContext";

type BasePublicDataContext<T2 extends keyof SoilDatabase> = {
  data: Record<string, StatefulData<T2>>;
  dataArray: Mandate<Data<T2>, "key">[];
  turnDataOn: VoidFunction;
};

export const createPublicDataContext = <T2 extends keyof SoilDatabase>(dataType: T2) => {
  const PublicDataContext = createContext<Maybe<BasePublicDataContext<T2>>>(undefined);

  const usePublicDataFromContext = () => {
    const useContextResult = useGetSafeContext(PublicDataContext);

    if (!useContextResult) throw new Error(`You must wrap your component in an instance of the ${dataType} context`);

    const { data, dataArray, turnDataOn } = useContextResult;

    useEffect(() => {
      turnDataOn();
    }, [turnDataOn]);

    return { data, dataArray };
  };

  const PublicDataContextProviderComponent = memo(function PublicDataContextProviderComponent({
    children,
  }: {
    children: ReactNode;
  }) {
    const { initiallyLoading } = useSoilContext();
    const [publicDataOn, setPublicDataOn] = useState(false);
    const turnDataOn = useCallback(() => setPublicDataOn(true), []);

    const { data, dataArray } = usePublicData<T2>({
      dataType,
      fetchData: true,
      includeArray: true,
      enabled: !initiallyLoading && publicDataOn,
    });

    const ctx = useMemo(() => ({ data, dataArray, turnDataOn }), [data, dataArray, turnDataOn]);

    return <PublicDataContext.Provider value={ctx}>{children}</PublicDataContext.Provider>;
  });

  return { usePublicDataFromContext, PublicDataContextProviderComponent };
};
