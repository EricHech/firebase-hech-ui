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
import type { SoilDatabase, Data } from "firebase-soil";
import { useOnConnectionsTypeData } from "../hooks";
import { useGetSafeContext } from "./useGetSafeContext";

type BaseConnectionsTypeDataContext<T22 extends keyof SoilDatabase> = {
  data: Maybe<Nullable<Record<string, Data<T22>>>>;
  dataArray: Mandate<Data<T22>, "key">[];
  setParentKey: Dispatch<SetStateAction<Maybe<string>>>;
  setShouldPoke: Dispatch<SetStateAction<{ decided: boolean; decision: boolean }>>;
};

export const createConnectionsTypeDataContext = <T2 extends keyof SoilDatabase, T22 extends keyof SoilDatabase>(
  parentType: T2,
  dataType: T22
) => {
  const ConnectionsTypeDataContext = createContext<Maybe<BaseConnectionsTypeDataContext<T22>>>(undefined);

  const useConnectionsTypeDataContext = ({ dataKey, poke }: { dataKey: string; poke: boolean }) => {
    const useContextResult = useGetSafeContext(ConnectionsTypeDataContext);

    if (!useContextResult) throw new Error(`You must wrap your component in an instance of the ${dataType} context`);

    const { data, dataArray, setParentKey, setShouldPoke } = useContextResult;

    useEffect(() => {
      setParentKey(dataKey);
    }, [setParentKey, dataKey]);

    useEffect(() => {
      setShouldPoke({ decided: true, decision: poke });
    }, [setShouldPoke, poke]);

    return { data, dataArray };
  };

  const ConnectionsTypeDataContextProviderComponent = memo(function ConnectionsTypeDataContextProviderComponent({
    children,
  }: PropsWithChildren<{}>) {
    const [parentKey, setParentKey] = useState<string>();
    const [poke, setShouldPoke] = useState({ decided: false, decision: false });

    const { data, dataArray } = useOnConnectionsTypeData({
      parentType,
      parentKey,
      dataType,
      includeArray: true,
      enabled: Boolean(parentKey && poke.decided),
      poke: poke.decision,
    });

    const ctx = useMemo(() => ({ data, dataArray, setParentKey, setShouldPoke }), [data, dataArray]);

    return <ConnectionsTypeDataContext.Provider value={ctx}>{children}</ConnectionsTypeDataContext.Provider>;
  });

  return { useConnectionsTypeDataContext, ConnectionsTypeDataContextProviderComponent };
};
