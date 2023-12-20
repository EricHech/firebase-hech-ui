import type { SoilDatabase } from "firebase-soil";
import { PATHS } from "firebase-soil/paths";
import { onChildAdded, onChildChanged, onChildRemoved } from "firebase-soil/client";

export const onPublicDataTypeListChildChanged = (
  dataType: keyof SoilDatabase,
  childChanged: (val: number, key: string) => void,
  childRemoved: (key: string) => void
) => {
  const path = PATHS.publicDataTypeList(dataType);

  const addedOff = onChildAdded(path, childChanged);
  const changedOff = onChildChanged(path, childChanged);
  const removedOff = onChildRemoved(path, childRemoved);

  return () => {
    addedOff();
    changedOff();
    removedOff();
  };
};
