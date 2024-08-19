import { useState, useEffect } from "react";
import type { FirebaseHechDatabase } from "firebase-hech";
import { getOwner } from "firebase-hech/client";

export const useIsOwner = ({
  dataType,
  dataKey,
  uid,
}: {
  dataType: keyof FirebaseHechDatabase;
  dataKey: Maybe<Nullable<string>>;
  uid: Maybe<Nullable<string>>;
}) => {
  const [isOwner, setIsOwner] = useState<Nullable<number | false>>();

  useEffect(() => {
    if (dataKey && uid) {
      try {
        getOwner({ dataType, dataKey, uid })
          .then(setIsOwner)
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
