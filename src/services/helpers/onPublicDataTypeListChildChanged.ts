import type { ListenerPaginationOptions, SoilDatabase } from "firebase-soil";
import { PATHS } from "firebase-soil/paths";
import { onChildAdded, onChildChanged, onChildRemoved } from "firebase-soil/client";

export const onPublicDataTypeListChildChanged = (
  dataType: keyof SoilDatabase,
  childChanged: (val: number, key: string) => void,
  childRemoved: (key: string) => void,
  opts?: { paginate?: ListenerPaginationOptions; skipChildAdded?: boolean }
) => {
  const { paginate, skipChildAdded } = opts || {};
  const path = PATHS.publicDataTypeList(dataType);

  const addedOff = skipChildAdded ? undefined : onChildAdded(path, childChanged, paginate);
  const changedOff = onChildChanged(path, childChanged, paginate);
  const removedOff = onChildRemoved(path, childRemoved, paginate);

  return () => {
    addedOff?.();
    changedOff();
    removedOff();
  };
};
