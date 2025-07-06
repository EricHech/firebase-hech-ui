import React, { memo, useEffect, useRef, useState } from "react";
import type { FirebaseHechDatabase, StatefulData, ConnectionDataListDatabase } from "firebase-hech";
import { getDataKeyValue } from "firebase-hech/client";
import { generateDbKey } from "firebase-hech/paths";

// Local
import type { ItemComponentProps, GroupingComponentProps, EmptyComponentProps, ObservedDataProps } from "./types";

export type { ItemComponentProps, GroupingComponentProps, EmptyComponentProps };

function ObservedDataFunction<
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
  queryNode,
  observe,
  observed,
  setCache,
  getCache,
  ItemComponent,
  memoizedCustomGet,
  memoizedFilterOutCb,
  enableOfflineCaching,
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
    if (!observed) return undefined;
    const getter = memoizedCustomGet //
      ? () => memoizedCustomGet(dataKey)
      : () => getDataKeyValue({ dataType, dataKey });

    // If caching enabled, use it for immediate feedback and offline-persistence, and then try to fetch and set the data
    const cacheKey = generateDbKey(dataType, dataKey);
    enableOfflineCaching?.getData(cacheKey).then((cachedData) => {
      if (cachedData) setData(cachedData as StatefulData<ChildT>);
    });

    getter().then((d) => {
      if (d === null) enableOfflineCaching?.clearData(cacheKey);
      else enableOfflineCaching?.setData(cacheKey, d);

      setData(d);
    });

    return undefined;
  }, [timestamp, observed, dataType, dataKey, memoizedCustomGet, enableOfflineCaching]);

  const animationStyle = animate
    ? {
        animation: "var(--gridCardAnimation)",
        animationDelay: `calc(${idx} * var(--gridCardDelay))`,
      }
    : undefined;

  const listItemStyle: React.CSSProperties = {
    minHeight: "var(--listItemMinHeightPx)",
    minWidth: "var(--listItemMinWidthPx)",
    ...animationStyle,
  };

  // Once the data is in view and has been fetched, possibly determine if it should be filtered out
  if (data !== undefined && memoizedFilterOutCb?.(dataKey, queryNode, data)) return null;

  return (
    <li id={dataKey} ref={ref} style={listItemStyle}>
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
        queryNode={queryNode}
      />
    </li>
  );
}

export const ObservedData = memo(ObservedDataFunction) as unknown as typeof ObservedDataFunction;
