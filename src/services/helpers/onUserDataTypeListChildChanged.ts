import type { SoilDatabase } from "firebase-soil";
import { PATHS } from "firebase-soil/paths";
import { onChildAdded, onChildChanged, onChildRemoved } from "firebase-soil/client";

export const onUserDataTypeListChildChanged = (
  uid: string,
  dataType: keyof SoilDatabase,
  childChanged: (val: number, key: string) => void,
  childRemoved: (key: string) => void
) => {
  const addedOff = onChildAdded(PATHS.userDataTypeList(uid, dataType), childChanged);
  const changedOff = onChildChanged(PATHS.userDataTypeList(uid, dataType), childChanged);
  const removedOff = onChildRemoved(PATHS.userDataTypeList(uid, dataType), childRemoved);

  return () => {
    addedOff();
    changedOff();
    removedOff();
  };
};
