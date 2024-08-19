import React, { useEffect, useMemo, ReactNode, createContext, memo, useState, Dispatch, SetStateAction } from "react";
import type { Data, FirebaseHechDatabase, StatefulData } from "firebase-hech";
import { useOnUserTypeData } from "../hooks";
import { useFirebaseHechContext } from "./firebaseHechContext";
import { useGetSafeContext } from "./useGetSafeContext";

type BaseUserTypeDataContext<T2 extends keyof FirebaseHechDatabase, T3 extends object = {}> = {
  data: Maybe<Nullable<Record<string, StatefulData<T2>>>>;
  dataArray: Mandate<Data<T2>, "key">[];
  setShouldPoke: Dispatch<SetStateAction<{ decided: boolean; decision: boolean }>>;
};

export const createUserTypeDataContext = <T2 extends keyof FirebaseHechDatabase, T3 extends object = {}>(
  dataType: T2,
  poke: boolean
) => {
  const UserTypeDataContext = createContext<Maybe<BaseUserTypeDataContext<T2, T3>>>(undefined);

  const useUserTypeDataFromContext = () => {
    const useContextResult = useGetSafeContext(UserTypeDataContext);

    if (!useContextResult) throw new Error(`You must wrap your component in an instance of the ${dataType} context`);

    const { data, dataArray, setShouldPoke } = useContextResult;

    useEffect(() => {
      setShouldPoke({ decided: true, decision: poke });
    }, [setShouldPoke, poke]);

    return { data, dataArray };
  };

  const UserTypeDataContextProviderComponent = memo(function UserTypeDataContextProviderComponent({
    children,
  }: {
    children: ReactNode;
  }) {
    const { initiallyLoading, user } = useFirebaseHechContext();

    const [poke, setShouldPoke] = useState({ decided: false, decision: false });

    const { data, dataArray } = useOnUserTypeData({
      uid: user?.uid,
      dataType,
      includeArray: true,
      enabled: Boolean(!initiallyLoading && poke.decided),
      poke: poke.decision,
    });

    const ctx = useMemo(() => ({ data, dataArray, setShouldPoke }), [data, dataArray, setShouldPoke]);

    return <UserTypeDataContext.Provider value={ctx}>{children}</UserTypeDataContext.Provider>;
  });

  return { useUserTypeDataFromContext, UserTypeDataContextProviderComponent };
};
