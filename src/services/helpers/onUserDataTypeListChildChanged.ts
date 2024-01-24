import type { SoilDatabase } from "firebase-soil";
import { PATHS } from "firebase-soil/paths";
import { onChildAdded, onChildChanged, onChildRemoved } from "firebase-soil/client";

export const onUserDataTypeListChildChanged = (
  uid: string,
  dataType: keyof SoilDatabase,
  childChanged: (val: number, key: string) => void,
  childRemoved: (key: string) => void,
  paginate?: {
    limit?: { amount: number; direction: "limitToFirst" | "limitToLast" };
    orderBy?: "value" | { path: string };
  }
) => {
  const path = PATHS.userDataTypeList(uid, dataType);

  const addedOff = onChildAdded(path, childChanged, paginate);
  const changedOff = onChildChanged(path, childChanged, paginate);
  const removedOff = onChildRemoved(path, childRemoved, paginate);

  return () => {
    addedOff();
    changedOff();
    removedOff();
  };
};
