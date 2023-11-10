import { SoilDatabase } from "firebase-soil";
import { onChildAdded, onChildChanged, onChildRemoved, PATHS } from "firebase-soil/dist/client";

export const onConnectionsDataListChildChanged = (
  parentType: keyof SoilDatabase,
  parentKey: string,
  dataType: keyof SoilDatabase,
  childChanged: (val: number, key: string) => void,
  childRemoved: (key: string) => void
) => {
  const addedOff = onChildAdded(PATHS.connectionDataListConnectionType(parentType, parentKey, dataType), childChanged);
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
