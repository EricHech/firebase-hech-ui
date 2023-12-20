import type { DataList, SoilDatabase } from "firebase-soil";
import { PATHS } from "firebase-soil/paths";
import { onChildAdded, onChildChanged, onChildRemoved } from "firebase-soil/client";

export const onConnectionDataListChildChanged = <T2 extends keyof SoilDatabase>(
  dataType: T2,
  dataKey: string,
  childChanged: (val: DataList, key: T2) => void,
  childRemoved: (key: T2) => void
) => {
  const path = PATHS.connectionDataListKey(dataType, dataKey);

  const addedOff = onChildAdded(path, childChanged);
  const changedOff = onChildChanged(path, childChanged);
  const removedOff = onChildRemoved(path, childRemoved);

  return () => {
    addedOff();
    changedOff();
    removedOff();
  };
};
