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
import type { FirebaseHechDatabase, Data, ConnectionDataListDatabase } from "firebase-hech";
import { useOnConnectionsTypeData } from "../hooks";
import { useGetSafeContext } from "./useGetSafeContext";

type BaseConnectionsTypeDataContext<
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase
> = {
  data: Maybe<Nullable<Record<string, Data<ChildT>>>>;
  dataArray: Mandate<Data<ChildT>, "key">[];
  setParentKey: Dispatch<SetStateAction<Maybe<ParentK>>>;
  setShouldPoke: Dispatch<SetStateAction<{ decided: boolean; decision: boolean }>>;
};

export const createConnectionsTypeDataContext = <
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase
>(
  parentType: ParentT,
  dataType: ChildT
) => {
  const ConnectionsTypeDataContext =
    createContext<Maybe<BaseConnectionsTypeDataContext<ParentT, ParentK, ChildT>>>(undefined);

  const useConnectionsTypeDataContext = ({ dataKey, poke }: { dataKey: ParentK; poke: boolean }) => {
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
    const [parentKey, setParentKey] = useState<ParentK>();
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
