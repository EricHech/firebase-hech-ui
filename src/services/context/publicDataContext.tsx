import React, { useEffect, useMemo, ReactNode, createContext, memo, useState, SetStateAction, Dispatch } from "react";
import type { Data, SoilDatabase, StatefulData } from "firebase-soil";
import { useOnPublicTypeData } from "../hooks";
import { useSoilContext } from "./soilContext";
import { useGetSafeContext } from "./useGetSafeContext";

type BasePublicDataContext<T2 extends keyof SoilDatabase> = {
  data: Maybe<Nullable<Record<string, StatefulData<T2>>>>;
  dataArray: Mandate<Data<T2>, "key">[];
  setShouldPoke: Dispatch<SetStateAction<{ decided: boolean; decision: boolean }>>;
};

export const createPublicDataContext = <T2 extends keyof SoilDatabase>(dataType: T2, poke: boolean) => {
  const PublicDataContext = createContext<Maybe<BasePublicDataContext<T2>>>(undefined);

  const usePublicDataFromContext = () => {
    const useContextResult = useGetSafeContext(PublicDataContext);

    if (!useContextResult) throw new Error(`You must wrap your component in an instance of the ${dataType} context`);

    const { data, dataArray, setShouldPoke } = useContextResult;

    useEffect(() => {
      setShouldPoke({ decided: true, decision: poke });
    }, [setShouldPoke, poke]);

    return { data, dataArray };
  };

  const PublicDataContextProviderComponent = memo(function PublicDataContextProviderComponent({
    children,
  }: {
    children: ReactNode;
  }) {
    const { initiallyLoading } = useSoilContext();

    const [poke, setShouldPoke] = useState({ decided: false, decision: false });

    const { data, dataArray } = useOnPublicTypeData<T2, boolean>({
      dataType,
      includeArray: true,
      enabled: Boolean(!initiallyLoading && poke.decided),
      poke: poke.decision,
    });

    const ctx = useMemo(() => ({ data, dataArray, setShouldPoke }), [data, dataArray, setShouldPoke]);

    return <PublicDataContext.Provider value={ctx}>{children}</PublicDataContext.Provider>;
  });

  return { usePublicDataFromContext, PublicDataContextProviderComponent };
};
