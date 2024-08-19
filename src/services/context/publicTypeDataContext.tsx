import React, { useEffect, useMemo, ReactNode, createContext, memo, useState, SetStateAction, Dispatch } from "react";
import type { Data, FirebaseHechDatabase, StatefulData } from "firebase-hech";
import { useOnPublicTypeData } from "../hooks";
import { useFirebaseHechContext } from "./firebaseHechContext";
import { useGetSafeContext } from "./useGetSafeContext";

type BasePublicTypeDataContext<T2 extends keyof FirebaseHechDatabase> = {
  data: Maybe<Nullable<Record<string, StatefulData<T2>>>>;
  dataArray: Mandate<Data<T2>, "key">[];
  setShouldPoke: Dispatch<SetStateAction<{ decided: boolean; decision: boolean }>>;
};

export const createPublicTypeDataContext = <T2 extends keyof FirebaseHechDatabase>(dataType: T2, poke: boolean) => {
  const PublicTypeDataContext = createContext<Maybe<BasePublicTypeDataContext<T2>>>(undefined);

  const usePublicTypeDataFromContext = () => {
    const useContextResult = useGetSafeContext(PublicTypeDataContext);

    if (!useContextResult) throw new Error(`You must wrap your component in an instance of the ${dataType} context`);

    const { data, dataArray, setShouldPoke } = useContextResult;

    useEffect(() => {
      setShouldPoke({ decided: true, decision: poke });
    }, [setShouldPoke, poke]);

    return { data, dataArray };
  };

  const PublicTypeDataContextProviderComponent = memo(function PublicTypeDataContextProviderComponent({
    children,
  }: {
    children: ReactNode;
  }) {
    const { initiallyLoading } = useFirebaseHechContext();

    const [poke, setShouldPoke] = useState({ decided: false, decision: false });

    const { data, dataArray } = useOnPublicTypeData<T2, boolean>({
      dataType,
      includeArray: true,
      enabled: Boolean(!initiallyLoading && poke.decided),
      poke: poke.decision,
    });

    const ctx = useMemo(() => ({ data, dataArray, setShouldPoke }), [data, dataArray, setShouldPoke]);

    return <PublicTypeDataContext.Provider value={ctx}>{children}</PublicTypeDataContext.Provider>;
  });

  return { usePublicTypeDataFromContext, PublicTypeDataContextProviderComponent };
};
