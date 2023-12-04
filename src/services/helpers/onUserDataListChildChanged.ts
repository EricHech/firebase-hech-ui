import type { SoilDatabase, DataList } from "firebase-soil";
import { PATHS } from "firebase-soil/paths";
import { onChildAdded, onChildChanged, onChildRemoved } from "firebase-soil/client";

export const onUserDataListChildChanged = <T2 extends keyof SoilDatabase>(
  uid: string,
  childChanged: (val: DataList[T2], key: T2) => void,
  childRemoved: (key: T2) => void
) => {
  const addedOff = onChildAdded(PATHS.userDataList(uid), childChanged);
  const changedOff = onChildChanged(PATHS.userDataList(uid), childChanged);
  const removedOff = onChildRemoved(PATHS.userDataList(uid), childRemoved);

  return () => {
    addedOff();
    changedOff();
    removedOff();
  };
};
