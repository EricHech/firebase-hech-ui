import type { SoilDatabase } from "firebase-soil";
import { PATHS } from "firebase-soil/paths";
import { onChildAdded, onChildChanged, onChildRemoved } from "firebase-soil/client";

export const onOwnersChildChanged = (
  dataType: keyof SoilDatabase,
  dataKey: string,
  childChanged: (val: number, key: string, previousOrderingKey?: Nullable<string>) => void,
  childRemoved: (key: string) => void
) => {
  const path = PATHS.ownerDataKey(dataType, dataKey);

  const addedOff = onChildAdded(path, childChanged);
  const changedOff = onChildChanged(path, childChanged);
  const removedOff = onChildRemoved(path, childRemoved);

  return () => {
    addedOff();
    changedOff();
    removedOff();
  };
};
