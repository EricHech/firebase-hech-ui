import type { SoilDatabase } from "firebase-soil";
import { PATHS } from "firebase-soil/paths";
import { onChildAdded, onChildChanged, onChildRemoved } from "firebase-soil/client";

export const onOwnersChildChanged = (
  dataType: keyof SoilDatabase,
  dataKey: string,
  childChanged: (val: number, key: string) => void,
  childRemoved: (key: string) => void
) => {
  const addedOff = onChildAdded(PATHS.ownerDataKey(dataType, dataKey), childChanged, {});
  const changedOff = onChildChanged(PATHS.ownerDataKey(dataType, dataKey), childChanged);
  const removedOff = onChildRemoved(PATHS.ownerDataKey(dataType, dataKey), childRemoved);

  return () => {
    addedOff();
    changedOff();
    removedOff();
  };
};
