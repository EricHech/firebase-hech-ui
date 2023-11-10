import type { DataList, SoilDatabase } from "firebase-soil";
import { onChildAdded, onChildChanged, onChildRemoved, PATHS } from "firebase-soil/client";

export const onConnectionDataListChildChanged = <T2 extends keyof SoilDatabase>(
  dataType: T2,
  dataKey: string,
  childChanged: (val: DataList, key: string) => void,
  childRemoved: (key: string) => void
) => {
  const addedOff = onChildAdded(PATHS.connectionDataListKey(dataType, dataKey), childChanged);
  const changedOff = onChildChanged(PATHS.connectionDataListKey(dataType, dataKey), childChanged);
  const removedOff = onChildRemoved(PATHS.connectionDataListKey(dataType, dataKey), childRemoved);

  return () => {
    addedOff();
    changedOff();
    removedOff();
  };
};
