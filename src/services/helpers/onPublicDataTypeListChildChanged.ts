import { SoilDatabase } from "firebase-soil";
import { onChildAdded, onChildChanged, onChildRemoved, PATHS } from "firebase-soil/client";

export const onPublicDataTypeListChildChanged = (
  dataType: keyof SoilDatabase,
  childChanged: (val: number, key: string) => void,
  childRemoved: (key: string) => void
) => {
  const addedOff = onChildAdded(PATHS.publicDataTypeList(dataType), childChanged);
  const changedOff = onChildChanged(PATHS.publicDataTypeList(dataType), childChanged);
  const removedOff = onChildRemoved(PATHS.publicDataTypeList(dataType), childRemoved);

  return () => {
    addedOff();
    changedOff();
    removedOff();
  };
};
