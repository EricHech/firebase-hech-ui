import { SoilDatabase, Data } from "firebase-soil";
import { onChildAdded, onChildChanged, onChildRemoved, PATHS } from "firebase-soil/client";

export const onDataTypeChildChanged = <T2 extends keyof SoilDatabase>(
  dataType: T2,
  childChanged: (val: Data<T2>, key: string) => void,
  childRemoved: (key: string) => void
) => {
  const addedOff = onChildAdded(PATHS.dataType(dataType), childChanged);
  const changedOff = onChildChanged(PATHS.dataType(dataType), childChanged);
  const removedOff = onChildRemoved(PATHS.dataType(dataType), childRemoved);

  return () => {
    addedOff();
    changedOff();
    removedOff();
  };
};
