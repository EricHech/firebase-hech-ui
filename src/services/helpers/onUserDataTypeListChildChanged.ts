import type { ListenerPaginationOptions, SoilDatabase } from "firebase-soil";
import { PATHS } from "firebase-soil/paths";
import { onChildAdded, onChildChanged, onChildRemoved } from "firebase-soil/client";

export const onUserDataTypeListChildChanged = (
  uid: string,
  dataType: keyof SoilDatabase,
  childChanged: (val: number, key: string, previousOrderingKey?: Nullable<string>) => void,
  childRemoved: (key: string) => void,
  opts?: {
    paginate?: ListenerPaginationOptions;
    skipChildAdded?: boolean;
    childAdded?: (val: number, key: string, previousOrderingKey?: Nullable<string>) => void;
  }
) => {
  const { paginate, skipChildAdded, childAdded } = opts || {};
  const path = PATHS.userDataTypeList(uid, dataType);

  const addedOff = skipChildAdded ? undefined : onChildAdded(path, childAdded || childChanged, paginate);
  const changedOff = onChildChanged(path, childChanged, paginate);
  const removedOff = onChildRemoved(path, childRemoved, paginate);

  return () => {
    addedOff?.();
    changedOff();
    removedOff();
  };
};
