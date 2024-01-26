import { Dispatch, SetStateAction, useCallback } from "react";

// Types
import type { DataList, SoilDatabase } from "firebase-soil";

export const useGetListeners = (
  orderBy: "orderByKey" | "orderByValue",
  setData: Dispatch<SetStateAction<DataList[keyof SoilDatabase]>>
) => {
  const childAdded = useCallback(
    (val: number, key: string) =>
      setData((prev) => {
        // Convert to an array for manipulation
        const entries = Object.entries(prev);

        // Find the correct insertion point
        let insertionIndex: number;
        if (orderBy === "orderByKey") {
          insertionIndex = entries.findIndex(([k]) => k > key);
        } else {
          insertionIndex = entries.findIndex(([, v]) => v > val);
        }

        // Handle case where the new item should be inserted at the end
        if (insertionIndex === -1) insertionIndex = entries.length;

        // Insert the new item
        entries.splice(insertionIndex, 0, [key, val]);

        // Convert back to an object
        const next = entries.reduce((obj, [k, v]) => {
          obj[k] = v; // eslint-disable-line no-param-reassign
          return obj;
        }, {} as DataList[keyof SoilDatabase]);

        return next;
      }),
    [orderBy, setData]
  );

  const childChanged = useCallback(
    (val: number, key: string) =>
      setData((prev) => {
        const next: DataList[keyof SoilDatabase] = { ...prev };
        next[key] = val;
        return next;
      }),
    [setData]
  );

  const childRemoved = useCallback(
    (key: string) =>
      setData((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      }),
    [setData]
  );

  return { childAdded, childChanged, childRemoved };
};
