import { useState, useEffect } from "react";
import type { SoilDatabase } from "firebase-soil";
import { getOwner } from "firebase-soil/client";

export const useIsOwner = (
  dataType: keyof SoilDatabase,
  dataKey: Maybe<Nullable<string>>,
  uid: Maybe<Nullable<string>>
) => {
  const [isOwner, setIsOwner] = useState<Nullable<boolean>>();

  useEffect(() => {
    if (dataKey && uid) {
      getOwner({ dataType, dataKey, uid })
        .then(setIsOwner)
        .catch(() => setIsOwner(false)); // catch the firebase error that arises if you are not the owner
    } else {
      setIsOwner(undefined);
    }
  }, [dataType, dataKey, uid]);

  return isOwner;
};
