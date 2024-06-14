import { useState, useEffect } from "react";
import type { SoilDatabase } from "firebase-soil";
import { getOwner } from "firebase-soil/client";

export const useIsOwner = ({
  dataType,
  dataKey,
  uid,
}: {
  dataType: keyof SoilDatabase;
  dataKey: Maybe<Nullable<string>>;
  uid: Maybe<Nullable<string>>;
}) => {
  const [isOwner, setIsOwner] = useState<Nullable<boolean>>();

  useEffect(() => {
    if (dataKey && uid) {
      try {
        getOwner({ dataType, dataKey, uid })
          .then((ownerTimestamp) => setIsOwner(typeof ownerTimestamp === "number"))
          .catch(() => setIsOwner(false)); // catch the firebase error that arises if you are not the owner
      } catch (e) {
        // Really, really throw the error away (why trashing it seem to work?)
      }
    } else {
      setIsOwner(undefined);
    }
  }, [dataType, dataKey, uid]);

  return isOwner;
};
