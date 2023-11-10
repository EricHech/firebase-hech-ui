"use client";

import {
  useState,
  useEffect,
  useMemo,
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  memo,
  useContext,
} from "react";
import { SoilDatabase, DataList } from "firebase-soil";
import { useConnectionsTypeConnections } from "../..";

type BaseConnectionsTypeConnectionsContext = {
  connections: Record<string, DataList>;
  setParentKey: Dispatch<SetStateAction<Maybe<string>>>;
};

export const createConnectionsTypeConnectionsContext = <T2 extends keyof SoilDatabase, T22 extends keyof SoilDatabase>(
  parentType: T2,
  dataType: T22
) => {
  const ConnectionsTypeConnectionsContext = createContext<Maybe<BaseConnectionsTypeConnectionsContext>>(undefined);

  const useConnectionsTypeConnectionsContext = (dataKey: string) => {
    const useContextResult = useContext(ConnectionsTypeConnectionsContext);

    if (!useContextResult) throw new Error(`You must wrap your component in an instance of the ${dataType} context`);

    const { connections, setParentKey } = useContextResult;

    useEffect(() => {
      setParentKey(dataKey);
    }, [setParentKey, dataKey]);

    return { connections };
  };

  const ConnectionsTypeConnectionsContextProviderComponent = memo(
    function ConnectionsTypeConnectionsContextProviderComponent({ children }: { children: ReactNode }) {
      const [parentKey, setParentKey] = useState<string>();

      const { connections } = useConnectionsTypeConnections({
        parentType,
        parentKey,
        dataType,
        enabled: Boolean(parentKey),
      });

      const ctx = useMemo(() => ({ connections, setParentKey }), [connections, setParentKey]);

      return (
        <ConnectionsTypeConnectionsContext.Provider value={ctx}>{children}</ConnectionsTypeConnectionsContext.Provider>
      );
    }
  );

  return { useConnectionsTypeConnectionsContext, ConnectionsTypeConnectionsContextProviderComponent };
};
