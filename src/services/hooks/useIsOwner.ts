import { useState, useEffect } from "react";
import { SoilDatabase } from "firebase-soil";
import { getOwner } from "firebase-soil/dist/client";

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
        .catch((e) => {
          // TODO: Add tracking here
          console.error(e); // eslint-disable-line no-console
          setIsOwner(false);
        });
    } else {
      setIsOwner(undefined);
    }
  }, [dataType, dataKey, uid]);

  return isOwner;
};
