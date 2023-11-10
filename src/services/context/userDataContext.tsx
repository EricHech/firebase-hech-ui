"use client";

import { useEffect, useMemo, ReactNode, createContext, useContext, useCallback, memo, useState } from "react";
import { Data, SoilDatabase, StatefulData } from "firebase-soil";
import { useUserData } from "../..";
import { useSoilContext } from "./soilContext";

type BaseUserDataContext<T2 extends keyof SoilDatabase, T3 extends object = {}> = {
  data: Record<string, StatefulData<T2>>;
  dataArray: Mandate<Data<T2>, "key">[];
  dataMutations: T3;
  turnDataOn: VoidFunction;
};

export const createUserDataContext = <T2 extends keyof SoilDatabase, T3 extends object = {}>(
  dataType: T2,
  getDataMutations?: (data: Record<string, StatefulData<T2>>, dataArray: Mandate<Data<T2>, "key">[]) => T3
) => {
  const UserDataContext = createContext<Maybe<BaseUserDataContext<T2, T3>>>(undefined);

  const useUserDataFromContext = () => {
    const useContextResult = useContext(UserDataContext);

    if (!useContextResult) throw new Error(`You must wrap your component in an instance of the ${dataType} context`);

    const { data, dataArray, dataMutations, turnDataOn } = useContextResult;

    useEffect(() => {
      turnDataOn();
    }, [turnDataOn]);

    return { data, dataArray, dataMutations };
  };

  const UserDataContextProviderComponent = memo(function UserDataContextProviderComponent({
    children,
  }: {
    children: ReactNode;
  }) {
    const { initiallyLoading, user } = useSoilContext();
    const [dataOn, setDataOn] = useState(false);
    const turnDataOn = useCallback(() => setDataOn(true), []);

    const { data, dataArray } = useUserData({
      uid: user?.uid,
      dataType,
      fetchData: true,
      includeArray: true,
      enabled: !initiallyLoading && dataOn,
    });

    const dataMutations = useMemo(() => getDataMutations?.(data, dataArray) ?? ({} as T3), [data, dataArray]);

    const ctx = useMemo(
      () => ({ data, dataArray, dataMutations, turnDataOn }),
      [data, dataArray, dataMutations, turnDataOn]
    );

    return <UserDataContext.Provider value={ctx}>{children}</UserDataContext.Provider>;
  });

  return { useUserDataFromContext, UserDataContextProviderComponent };
};
