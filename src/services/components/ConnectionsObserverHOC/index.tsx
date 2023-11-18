import React, { FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SoilDatabase, StatefulData, DataList } from "firebase-soil";
import { getDataKeyValue } from "firebase-soil/client";
import {
  onConnectionsDataListChildChanged,
  onUserDataTypeListChildChanged,
  onPublicDataTypeListChildChanged,
} from "../../helpers";
import {
  useSoilContext,
} from "../../context";
import { useBasicIntersectionObserver } from "./useBasicIntersectionObserver";

export type EmptyComponentProps<T22 extends keyof SoilDatabase, T2 extends Maybe<keyof SoilDatabase> = undefined> = {
  dataType: T22;
  /** This will be undefined if the version is not `connectionDataList` */
  parentDataType: T2;
  /** This will be undefined if the version is not `connectionDataList` */
  parentDataKey: Maybe<string>;
};

export type ItemComponentProps<T22 extends keyof SoilDatabase, T2 extends Maybe<keyof SoilDatabase> = undefined> = {
  top: boolean;
  bottom: boolean;
  data: StatefulData<T22>;
  dataType: T22;
  dataKey: string;
  /** This will be undefined if the version is not `connectionDataList` */
  parentDataType: T2;
  /** This will be undefined if the version is not `connectionDataList` */
  parentDataKey: Maybe<string>;
  observed: boolean;
};

export type GroupingComponentProps = {
  timestamp: number;
};

type ObservedDataProps<T22 extends keyof SoilDatabase, T2 extends Maybe<keyof SoilDatabase> = undefined> = {
  /** Indicates whether or not you want the card delay animation */
  animate?: boolean;
  idx: number;
  top: boolean;
  bottom: boolean;
  dataType: T22;
  dataKey: string;
  /** This will be undefined if the version is not `connectionDataList` */
  parentDataType: T2;
  /** This will be undefined if the version is not `connectionDataList` */
  parentDataKey: Maybe<string>;
  timestamp: number;
  observe: (el: HTMLLIElement) => void;
  observed: boolean;
  ItemComponent: FC<ItemComponentProps<T22, T2>>;
};

export function ObservedData<T22 extends keyof SoilDatabase, T2 extends Maybe<keyof SoilDatabase> = undefined>({
  animate,
  idx,
  top,
  bottom,
  dataType,
  dataKey,
  parentDataType,
  parentDataKey,
  observe,
  timestamp,
  observed,
  ItemComponent,
}: ObservedDataProps<T22, T2>) {
  const ref = useRef<HTMLLIElement>(null);
  const [data, setData] = useState<StatefulData<T22>>();

  useEffect(() => {
    if (ref.current) {
      const unobserve = observe(ref.current);

      return unobserve;
    }

    return undefined;
  }, [observe]);

  useEffect(() => {
    if (observed) getDataKeyValue({ dataType, dataKey }).then(setData);
  }, [timestamp, observed, dataType, dataKey]);

  const animationStyle = animate
    ? { animation: "var(--gridCardAnimation)", animationDelay: `calc(${idx} * var(--gridCardDelay))` }
    : undefined;

  return (
    <li
      id={dataKey}
      ref={ref}
      style={{
        minHeight: "var(--listItemMinHeight)",
        minWidth: "var(--listItemMinWidth)",
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
        top={top}
        bottom={bottom}
      />
    </li>
  );
}

export type ConnectionsObserverHOCProps<
  T2 extends keyof SoilDatabase,
  T22 extends keyof SoilDatabase,
  T222 extends keyof SoilDatabase
> = {
  /** This is required to prevent it from initially fetching all of the data */
  listItemMinHeight: string;
  /** This is required to prevent it from initially fetching all of the data */
  listItemMinWidth: string;
  /** Note, the `created` options are faster than the `updated` options which require sorting: O(n) vs O(n log n). */
  sort: "created oldest" | "created newest" | "updated oldest" | "updated newest";
  dataType: T22;
  className?: string;
  /** Indicates whether or not you want the card delay animation */
  animate?: boolean;
  root?: Nullable<Element>;
} & (
  | {
      version: "connectionDataList";
      parentDataType: T2;
      parentDataKey: Maybe<string>;
      /** Include this key if you want to use a connectionList other than the dataType you're requesting */
      connectionType?: T222;
      ItemComponent: ObservedDataProps<T22, T2>["ItemComponent"];
      EmptyComponent?: FC<EmptyComponentProps<T22, T2>>;
    }
  | {
      version: "publicDataList" | "userDataList";
      parentDataType?: undefined;
      parentDataKey?: undefined;
      connectionType?: undefined;
      ItemComponent: ObservedDataProps<T22>["ItemComponent"];
      EmptyComponent?: FC<EmptyComponentProps<T22>>;
    }
) &
  (
    | {
        GroupingComponent: FC<GroupingComponentProps>;
        /** Method by which you want to section the list (ie. day, year, etc.) */
        grouping: "day" | "minute";
      }
    | {
        GroupingComponent?: undefined;
        /** Method by which you want to section the list (ie. day, year, etc.) */
        grouping?: undefined;
      }
  );

/** Allows  you to set "--gridCardAnimation" and "--gridCardDelay" */
export function ConnectionsObserverHOC<
  T2 extends keyof SoilDatabase,
  T22 extends keyof SoilDatabase,
  T222 extends keyof SoilDatabase
>(props: ConnectionsObserverHOCProps<T2, T22, T222>) {
  const { listItemMinHeight, listItemMinWidth, sort, dataType, className, animate, root, GroupingComponent, grouping } =
    props;
  const { initiallyLoading, user } = useSoilContext();

  // ---- Data Fetching -----------------------------------------------------------------------------------------------
  const [data, setData] = useState<DataList[T22]>({});

  const childChanged = useCallback((val: number, key: string) => setData((prev) => ({ ...prev, [key]: val })), []);

  const childRemoved = useCallback(
    (key: string) =>
      setData((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      }),
    []
  );

  /* eslint-disable react/destructuring-assignment */
  useEffect(() => {
    let off: VoidFunction;
    if (!initiallyLoading) {
      if (props.version === "connectionDataList" && props.parentDataKey) {
        off = onConnectionsDataListChildChanged(
          props.parentDataType,
          props.parentDataKey,
          props.connectionType || dataType,
          childChanged,
          childRemoved
        );
      } else if (props.version === "userDataList" && user?.uid) {
        off = onUserDataTypeListChildChanged(
          user.uid, //
          dataType,
          childChanged,
          childRemoved
        );
      } else if (props.version === "publicDataList") {
        off = onPublicDataTypeListChildChanged(
          dataType, //
          childChanged,
          childRemoved
        );
      }
    }

    return () => {
      off?.();
      setData({});
    };
  }, [
    initiallyLoading,
    user?.uid,
    dataType,
    childChanged,
    childRemoved,
    props.version,
    props.parentDataKey,
    props.parentDataType,
    props.connectionType,
  ]);
  /* eslint-enable react/destructuring-assignment */
  // ------------------------------------------------------------------------------------------------------------------

  // ---- Observer ----------------------------------------------------------------------------------------------------
  const { observe, observedIds } = useBasicIntersectionObserver(root, "150px 150px 150px 150px");
  // ------------------------------------------------------------------------------------------------------------------

  const dataList = useMemo(() => {
    const list = Object.entries(data);
    if (sort === "created oldest") return list;
    if (sort === "created newest") return list.reverse();
    if (sort === "updated oldest") return list.sort(([, a], [, b]) => a - b);

    // "updated newest"
    return list.sort(([, a], [, b]) => b - a);
  }, [sort, data]);

  /* eslint-disable react/destructuring-assignment */
  if (dataList.length === 0 && props.EmptyComponent) {
    return props.version === "connectionDataList" ? (
      <div className={className}>
        <props.EmptyComponent
          dataType={dataType} //
          parentDataType={props.parentDataType}
          parentDataKey={props.parentDataKey}
        />
      </div>
    ) : (
      <div className={className}>
        <props.EmptyComponent
          dataType={dataType} //
          parentDataType={undefined}
          parentDataKey={undefined}
        />
      </div>
    );
  }
  /* eslint-enable react/destructuring-assignment */

  if (dataList.length === 0) return null;

  let currentGrouping = 0;

  // TODO: Limit to n keys in dataList
  /* eslint-disable react/destructuring-assignment */
  return (
    <ul
      className={className}
      style={{
        "--listItemMinHeight": listItemMinHeight,
        "--listItemMinWidth": listItemMinWidth,
      }}
    >
      {dataList.map(([key, timestamp], i) => {
        const dataJsx =
          props.version === "connectionDataList" ? (
            <ObservedData
              animate={animate}
              idx={i}
              top={i === 0}
              bottom={i === dataList.length - 1}
              dataKey={key}
              dataType={dataType}
              parentDataType={props.parentDataType}
              parentDataKey={props.parentDataKey}
              timestamp={timestamp}
              observe={observe}
              observed={Boolean(observedIds[key])}
              ItemComponent={props.ItemComponent}
            />
          ) : (
            <ObservedData
              animate={animate}
              idx={i}
              top={i === 0}
              bottom={i === dataList.length - 1}
              dataKey={key}
              dataType={dataType}
              parentDataType={undefined}
              parentDataKey={undefined}
              timestamp={timestamp}
              observe={observe}
              observed={Boolean(observedIds[key])}
              ItemComponent={props.ItemComponent}
            />
          );

        if (grouping) {
          let current: Maybe<number>;
          if (grouping === "day") current = new Date(timestamp).setHours(0, 0, 0, 0);
          if (grouping === "minute") current = new Date(timestamp).setSeconds(0, 0);

          if (current && current !== currentGrouping) {
            currentGrouping = current;

            return (
              <Fragment key={key}>
                <GroupingComponent timestamp={currentGrouping} />
                {dataJsx}
              </Fragment>
            );
          }
        }

        return <Fragment key={key}>{dataJsx}</Fragment>;
      })}
    </ul>
  );
  /* eslint-enable react/destructuring-assignment */
}
