import { useState, useCallback, useEffect } from "react";
import type { SoilDatabase, DataList } from "firebase-soil";
import { getAllConnections } from "firebase-soil/client";
import { onConnectionsDataListChildChanged } from "../helpers/onConnectionsDataListChildChanged";
import { DataListHookProps } from "./useUserData";

export const useConnectionsTypeConnections = <T2 extends keyof SoilDatabase, T3 extends keyof SoilDatabase>({
  parentType,
  parentKey,
  dataType,
  enabled = true,
}: Pick<DataListHookProps<T2, boolean>, "dataType" | "enabled"> & {
  parentType: T3;
  parentKey: Maybe<string>;
}) => {
  const [connections, setConnections] = useState({} as Record<string, DataList>);

  const getConnections = useCallback(
    (key: string) =>
      getAllConnections(dataType, key).then(
        (val) => val && setConnections((prev) => ({ ...prev, [key]: { ...val, key } }))
      ),
    [dataType]
  );

  const childChanged = useCallback((_: number, key: string) => getConnections(key), [getConnections]);

  const childRemoved = useCallback(
    (key: string) =>
      setConnections((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      }),
    []
  );

  useEffect(() => {
    if (parentKey && enabled) {
      const offs = onConnectionsDataListChildChanged(parentType, parentKey, dataType, childChanged, childRemoved);

      return () => {
        offs();
        setConnections({});
      };
    }

    return undefined;
  }, [parentType, parentKey, dataType, childChanged, childRemoved, enabled]);

  return { connections };
};
