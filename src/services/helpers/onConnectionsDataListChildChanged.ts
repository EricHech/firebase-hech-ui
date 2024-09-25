import type { ListenerPaginationOptions, FirebaseHechDatabase, ConnectionDataListDatabase } from "firebase-hech";
import { PATHS } from "firebase-hech/paths";
import { onChildAdded, onChildChanged, onChildRemoved } from "firebase-hech/client";

export const onConnectionsDataListChildChanged = <
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK]
>(
  parentType: ParentT,
  parentKey: ParentK,
  dataType: ChildT,
  childChanged: (val: Val, key: ChildK | string, previousOrderingKey?: Nullable<string>) => void,
  childRemoved: (key: ChildK | string) => void,
  opts?: {
    paginate?: ListenerPaginationOptions;
    skipChildAdded?: boolean;
    childAdded?: (val: Val, key: ChildK | string, previousOrderingKey?: Nullable<string>) => void;
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
