import type { ListenerPaginationOptions, SoilDatabase } from "firebase-soil";
import { PATHS } from "firebase-soil/paths";
import { onChildAdded, onChildChanged, onChildRemoved } from "firebase-soil/client";

export const onConnectionsDataListChildChanged = (
  parentType: keyof SoilDatabase,
  parentKey: string,
  dataType: keyof SoilDatabase,
  childChanged: (val: number, key: string) => void,
  childRemoved: (key: string) => void,
  paginate?: ListenerPaginationOptions
) => {
  const path = PATHS.connectionDataListConnectionType(parentType, parentKey, dataType);

  const addedOff = onChildAdded(path, childChanged, paginate);
  const changedOff = onChildChanged(path, childChanged, paginate);
  const removedOff = onChildRemoved(path, childRemoved, paginate);

  return () => {
    addedOff();
    changedOff();
    removedOff();
  };
};
