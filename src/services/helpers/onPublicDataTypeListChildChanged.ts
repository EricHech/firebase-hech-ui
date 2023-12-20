import type { SoilDatabase } from "firebase-soil";
import { PATHS } from "firebase-soil/paths";
import { onChildAdded, onChildChanged, onChildRemoved } from "firebase-soil/client";

export const onPublicDataTypeListChildChanged = (
  dataType: keyof SoilDatabase,
  childChanged: (val: number, key: string) => void,
  childRemoved: (key: string) => void
) => {
  const addedOff = onChildAdded(PATHS.publicDataTypeList(dataType), childChanged, {});
  const changedOff = onChildChanged(PATHS.publicDataTypeList(dataType), childChanged);
  const removedOff = onChildRemoved(PATHS.publicDataTypeList(dataType), childRemoved);

  return () => {
    addedOff();
    changedOff();
    removedOff();
  };
};
