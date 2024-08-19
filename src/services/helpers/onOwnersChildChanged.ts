import type { FirebaseHechDatabase } from "firebase-hech";
import { PATHS } from "firebase-hech/paths";
import { onChildAdded, onChildChanged, onChildRemoved } from "firebase-hech/client";

export const onOwnersChildChanged = (
  dataType: keyof FirebaseHechDatabase,
  dataKey: string,
  childChanged: (val: number, key: string, previousOrderingKey?: Nullable<string>) => void,
  childRemoved: (key: string) => void
) => {
  const path = PATHS.ownerDataKey(dataType, dataKey);

  const addedOff = onChildAdded(path, childChanged);
  const changedOff = onChildChanged(path, childChanged);
  const removedOff = onChildRemoved(path, childRemoved);

  return () => {
    addedOff();
    changedOff();
    removedOff();
  };
};
