import type { SoilDatabase } from "firebase-soil";
import { PATHS } from "firebase-soil/paths";
import { onChildAdded, onChildChanged, onChildRemoved } from "firebase-soil/client";

export const onUserDataTypeListChildChanged = (
  uid: string,
  dataType: keyof SoilDatabase,
  childChanged: (val: number, key: string) => void,
  childRemoved: (key: string) => void
) => {
  const path = PATHS.userDataTypeList(uid, dataType);

  const addedOff = onChildAdded(path, childChanged);
  const changedOff = onChildChanged(path, childChanged);
  const removedOff = onChildRemoved(path, childRemoved);

  return () => {
    addedOff();
    changedOff();
    removedOff();
  };
};
