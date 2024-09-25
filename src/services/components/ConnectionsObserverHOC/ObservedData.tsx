import React, { useEffect, useRef, useState } from "react";
import type { FirebaseHechDatabase, StatefulData, ConnectionDataListDatabase } from "firebase-hech";
import { getDataKeyValue } from "firebase-hech/client";

// Local
import type { ItemComponentProps, GroupingComponentProps, EmptyComponentProps, ObservedDataProps } from "./types";

export type { ItemComponentProps, GroupingComponentProps, EmptyComponentProps };

export function ObservedData<
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK]
>({
  animate,
  idx,
  list,
  top,
  bottom,
  dataType,
  dataKey,
  parentDataType,
  parentDataKey,
  timestamp,
  observe,
  observed,
  setCache,
  getCache,
  ItemComponent,
  memoizedCustomGet,
}: ObservedDataProps<ParentT, ParentK, ChildT, ChildK, Val>) {
  const ref = useRef<HTMLLIElement>(null);
  const [data, setData] = useState<StatefulData<ChildT>>();

  useEffect(() => {
    if (ref.current) {
      const unobserve = observe(ref.current);

      return unobserve;
    }

    return undefined;
  }, [observe]);

  useEffect(() => {
    if (observed) {
      if (memoizedCustomGet) memoizedCustomGet(dataKey).then(setData);
      else getDataKeyValue({ dataType, dataKey }).then(setData);
    }
  }, [timestamp, observed, dataType, dataKey, memoizedCustomGet]);

  const animationStyle = animate
    ? { animation: "var(--gridCardAnimation)", animationDelay: `calc(${idx} * var(--gridCardDelay))` }
    : undefined;

  return (
    <li
      id={dataKey}
      ref={ref}
      style={{
        minHeight: "var(--listItemMinHeightPx)",
        minWidth: "var(--listItemMinWidthPx)",
        ...animationStyle,
      }}
    >
      <ItemComponent
        data={data}
        dataType={dataType}
        dataKey={dataKey}
        parentDataType={parentDataType}
        parentDataKey={parentDataKey}
        observed={observed}
        setCache={setCache}
        getCache={getCache}
        top={top}
        bottom={bottom}
        idx={idx}
        list={list}
        timestamp={timestamp}
      />
    </li>
  );
}
