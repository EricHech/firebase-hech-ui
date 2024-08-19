import type { ListenerPaginationOptions, FirebaseHechDatabase } from "firebase-hech";
import { PATHS } from "firebase-hech/paths";
import { onChildAdded, onChildChanged, onChildRemoved } from "firebase-hech/client";

export const onConnectionsDataListChildChanged = (
  parentType: keyof FirebaseHechDatabase,
  parentKey: string,
  dataType: keyof FirebaseHechDatabase,
  childChanged: (val: number, key: string, previousOrderingKey?: Nullable<string>) => void,
  childRemoved: (key: string) => void,
  opts?: {
    paginate?: ListenerPaginationOptions;
    skipChildAdded?: boolean;
    childAdded?: (val: number, key: string, previousOrderingKey?: Nullable<string>) => void;
  }
) => {
  const { paginate, skipChildAdded, childAdded } = opts || {};
  const path = PATHS.connectionDataListConnectionType(parentType, parentKey, dataType);

  const addedOff = skipChildAdded ? undefined : onChildAdded(path, childAdded || childChanged, paginate);
  const changedOff = onChildChanged(path, childChanged, paginate);
  const removedOff = onChildRemoved(path, childRemoved, paginate);

  return () => {
    addedOff?.();
    changedOff();
    removedOff();
  };
};
