import { SoilDatabase } from "firebase-soil";
import { onChildAdded, onChildChanged, onChildRemoved, PATHS } from "firebase-soil/dist/client";

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
