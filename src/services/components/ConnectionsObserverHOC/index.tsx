import React, { FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SoilDatabase, StatefulData, DataList } from "firebase-soil";
import { getDataKeyValue } from "firebase-soil/client";
import {
  onConnectionsDataListChildChanged,
  onUserDataTypeListChildChanged,
  onPublicDataTypeListChildChanged,
} from "../../helpers";
import { useSoilContext } from "../../context";
import { useBasicIntersectionObserver } from "./useBasicIntersectionObserver";

export type ManagePagination = {
  /** The page size. */
  amount: number;
  /** The number of elements from the end that should trigger another page fetch. */
  buffer: number;
};

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
  /** Make sure that this function is memoed or otherwised saved to avoid infinite re-renders */
  memoizedCustomGet?: (key: string) => Promise<StatefulData<T22>>;
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
  memoizedCustomGet,
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
    if (observed) {
      if (memoizedCustomGet) memoizedCustomGet(dataKey).then(setData);
      else getDataKeyValue({ dataType, dataKey }).then(setData);
    }
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
  sort: "created oldest" | "created newest" | "updated oldest" | "updated newest";
  /** If nothing is passed in, it will fetch all of the keys by default. */
  managePagination?: ManagePagination;
  dataType: T22;
  /** Make sure that this function is memoed or otherwised saved to avoid infinite re-renders */
  memoizedCustomGet?: (key: string) => Promise<StatefulData<T22>>;
  className?: string;
  /**
   * Indicates whether or not you want the card delay animation.
   * Allows you to set `--gridCardAnimation` and `--gridCardDelay`.
   */
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

/**
 * This component allows you to fetch a list of soil keys (by connection, ownership, or public lists)
 * and then hydrate the data for those keys only when those keys are scrolled into view. However, it
 * combines this method with optionally fetching keys in chunks to further improve performance if dealing
 * with extremely large lists. For example, if working with lists in the hundreds or even thousands, you
 * can feel comfortable fetching all of the keys and hydrating when scrolled into view. But if working
 * with a list of tens of thousands or more, such as in the case of a chat, you should pass in `managePagination`.
 */
export function ConnectionsObserverHOC<
  T2 extends keyof SoilDatabase,
  T22 extends keyof SoilDatabase,
  T222 extends keyof SoilDatabase
>(props: ConnectionsObserverHOCProps<T2, T22, T222>) {
  const {
    listItemMinHeight,
    listItemMinWidth,
    sort,
    managePagination,
    dataType,
    memoizedCustomGet,
    className,
    animate,
    root,
    GroupingComponent,
    grouping,
  } = props;
  const { initiallyLoading, user } = useSoilContext();

  // ---- Observer ----------------------------------------------------------------------------------------------------
  const { observe, observedIds } = useBasicIntersectionObserver(root, "150px 150px 150px 150px");
  // ------------------------------------------------------------------------------------------------------------------

  // ---- Data Fetching -----------------------------------------------------------------------------------------------
  const [pagination, setPagination] = useState(managePagination?.amount);

  useEffect(() => {
    setPagination(managePagination?.amount);
  }, [managePagination?.amount]);

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

  useEffect(() => {
    let off: VoidFunction;
    if (!initiallyLoading) {
      const paginate: { limit?: { amount: number; direction: "limitToLast" | "limitToFirst" }; orderBy?: "value" } = {};
      if (sort.startsWith("updated")) paginate.orderBy = "value";
      if (pagination) {
        paginate.limit = {
          amount: pagination,
          direction: sort.endsWith("newest") ? "limitToLast" : "limitToFirst",
        };
      }

      /*
        When paginating, we reset the listeners with larger and larger page counts.
        But does this mean that the entire list is being refetched each time?
        Should we instead create multiple listeners?

        If so, an idea of how:
        1. A base useEffect listening to `managePagination?.amount` - fetch the initial list
        2. A second useEffect listening to stateful `pagination` - create new listeners each time
        3. Somehow, the second useEffects needs to only depend on `pagination` and save (to a ref) but not trigger the `off`s on each cycle
        4. A final useEffect with only a cleanup function that uses the ref to clean up all `off`s on unmount
      */

      if (props.version === "connectionDataList" && props.parentDataKey) {
        off = onConnectionsDataListChildChanged(
          props.parentDataType,
          props.parentDataKey,
          props.connectionType || dataType,
          childChanged,
          childRemoved,
          paginate
        );
      } else if (props.version === "userDataList" && user?.uid) {
        off = onUserDataTypeListChildChanged(
          user.uid, //
          dataType,
          childChanged,
          childRemoved,
          paginate
        );
      } else if (props.version === "publicDataList") {
        off = onPublicDataTypeListChildChanged(
          dataType, //
          childChanged,
          childRemoved,
          paginate
        );
      }
    }

    return () => {
      off?.();
      setData({});
    };
  }, [
    sort,
    pagination,
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
  // ------------------------------------------------------------------------------------------------------------------

  // ---- Data Maintenance --------------------------------------------------------------------------------------------
  const dataList = useMemo(() => {
    const list = Object.entries(data);
    if (sort === "created oldest" || sort === "updated oldest") return list;
    return list.reverse();
  }, [sort, data]);

  useEffect(() => {
    if (managePagination?.buffer) {
      const periphery = dataList.slice(managePagination.buffer * -1);
      const peripheryObserved = periphery.some(([key]) => observedIds[key]);
      const moreToFetch = dataList.length === (pagination || 0);

      if (peripheryObserved && moreToFetch) setPagination((prev) => (prev || 0) + managePagination.amount);
    }
  }, [managePagination?.buffer, dataList, observedIds]);
  // ------------------------------------------------------------------------------------------------------------------

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
              memoizedCustomGet={memoizedCustomGet}
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
              memoizedCustomGet={memoizedCustomGet}
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
