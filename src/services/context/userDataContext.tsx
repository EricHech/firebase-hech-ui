import React, { useEffect, useMemo, ReactNode, createContext, memo, useState, Dispatch, SetStateAction } from "react";
import type { Data, SoilDatabase, StatefulData } from "firebase-soil";
import { useUserData } from "../hooks";
import { useSoilContext } from "./soilContext";
import { useGetSafeContext } from "./useGetSafeContext";

type BaseUserDataContext<T2 extends keyof SoilDatabase, T3 extends object = {}> = {
  data: Maybe<Nullable<Record<string, StatefulData<T2>>>>;
  dataArray: Mandate<Data<T2>, "key">[];
  setShouldPoke: Dispatch<SetStateAction<{ decided: boolean; decision: boolean }>>;
};

export const createUserDataContext = <T2 extends keyof SoilDatabase, T3 extends object = {}>(
  dataType: T2,
  poke: boolean
) => {
  const UserDataContext = createContext<Maybe<BaseUserDataContext<T2, T3>>>(undefined);

  const useUserDataFromContext = () => {
    const useContextResult = useGetSafeContext(UserDataContext);

    if (!useContextResult) throw new Error(`You must wrap your component in an instance of the ${dataType} context`);

    const { data, dataArray, setShouldPoke } = useContextResult;

    useEffect(() => {
      setShouldPoke({ decided: true, decision: poke });
    }, [setShouldPoke, poke]);

    return { data, dataArray };
  };

  const UserDataContextProviderComponent = memo(function UserDataContextProviderComponent({
    children,
  }: {
    children: ReactNode;
  }) {
    const { initiallyLoading, user } = useSoilContext();

    const [poke, setShouldPoke] = useState({ decided: false, decision: false });

    const { data, dataArray } = useUserData({
      uid: user?.uid,
      dataType,
      includeArray: true,
      enabled: Boolean(!initiallyLoading && poke.decided),
      poke: poke.decision,
    });

    const ctx = useMemo(() => ({ data, dataArray, setShouldPoke }), [data, dataArray, setShouldPoke]);

    return <UserDataContext.Provider value={ctx}>{children}</UserDataContext.Provider>;
  });

  return { useUserDataFromContext, UserDataContextProviderComponent };
};
