import type { SoilDatabase } from "firebase-soil";
import { PATHS } from "firebase-soil/paths";
import { onChildAdded, onChildChanged, onChildRemoved } from "firebase-soil/client";

export const onConnectionsDataListChildChanged = (
  parentType: keyof SoilDatabase,
  parentKey: string,
  dataType: keyof SoilDatabase,
  childChanged: (val: number, key: string) => void,
  childRemoved: (key: string) => void
) => {
  const addedOff = onChildAdded(
    PATHS.connectionDataListConnectionType(parentType, parentKey, dataType),
    childChanged,
    {}
  );
  const changedOff = onChildChanged(
    PATHS.connectionDataListConnectionType(parentType, parentKey, dataType),
    childChanged
  );
  const removedOff = onChildRemoved(
    PATHS.connectionDataListConnectionType(parentType, parentKey, dataType),
    childRemoved
  );

  return () => {
    addedOff();
    changedOff();
    removedOff();
  };
};
