import React, { FC, Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SoilDatabase, StatefulData, DataList } from "firebase-soil";
import { getDataKeyValue, getOrderByWithLimit } from "firebase-soil/client";

import { useSoilContext } from "../../context";

// Local
import { useBasicIntersectionObserver } from "./useBasicIntersectionObserver";
import { attachListeners, getDirection, getPaginationOptions, getPath } from "./utils";
import type { GroupingComponentProps, ManagePagination, ObservedDataProps, Sort, Version } from "./types";

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
  }, [timestamp, observed, dataType, dataKey, memoizedCustomGet]);

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
> = Version<T2, T22, T222> & {
  /** This is required to prevent it from initially fetching all of the data */
  listItemMinHeight: string;
  /** This is required to prevent it from initially fetching all of the data */
  listItemMinWidth: string;
  sort: Sort;
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
  /* eslint-disable react/destructuring-assignment */
  const versionSettings = useMemo(
    () =>
      props.version === "connectionDataList"
        ? {
            version: props.version,
            parentDataKey: props.parentDataKey,
            parentDataType: props.parentDataType,
            connectionType: props.connectionType,
          }
        : {
            version: props.version,
            parentDataKey: props.parentDataKey,
            parentDataType: props.parentDataType,
            connectionType: props.connectionType,
          },
    [props.connectionType, props.parentDataKey, props.parentDataType, props.version]
  );
  /* eslint-enable react/destructuring-assignment */

  const { initiallyLoading, user } = useSoilContext();

  // ---- Observer ----------------------------------------------------------------------------------------------------
  const { observe, observedIds } = useBasicIntersectionObserver(root, "150px 150px 150px 150px");
  // ------------------------------------------------------------------------------------------------------------------

  // ---- Data --------------------------------------------------------------------------------------------------------
  const [data, setData] = useState<DataList[T22]>({});

  const dataList = useMemo(() => {
    const list = Object.entries(data);
    if (sort === "created oldest" || sort === "updated oldest") return list;
    return list.reverse();
  }, [sort, data]);
  // ------------------------------------------------------------------------------------------------------------------

  // ---- Fetch Helpers -----------------------------------------------------------------------------------------------
  const childChanged = useCallback(
    (val: number, key: string) =>
      setData((prev) => {
        const next: DataList[keyof SoilDatabase] = { ...prev };
        next[key] = val;
        return next;
      }),
    []
  );

  const childRemoved = useCallback(
    (key: string) =>
      setData((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      }),
    []
  );
  // ------------------------------------------------------------------------------------------------------------------

  // ---- New Page Fetching -------------------------------------------------------------------------------------------
  const newPageListenerOffs = useRef<VoidFunction[]>([]);

  const listenToNewPage = useCallback(
    async (start: string | number) => {
      if (managePagination?.amount === undefined) throw Error("`managePagination?.amount` was `undefined`.");
      const { amount } = managePagination;

      const path = getPath(versionSettings, dataType, user?.uid);
      if (!path) throw Error("Unable to determine database path.");

      const direction = getDirection(sort);

      // When fetching a new page, first get the initial page data...
      const newData = await getOrderByWithLimit<DataList[T22]>(path, "orderByKey", {
        amount,
        direction,
        exclusiveTermination: start,
      });

      const newDataLength = Object.keys(newData || {}).length;
      const empty = !newDataLength;

      if (!empty) {
        setData((prev) => (direction === "limitToLast" ? { ...newData, ...prev } : { ...prev, ...newData }));
      }

      const paginate = getPaginationOptions(sort, {
        pagination: { amount, exclusiveTermination: start },
      });

      // ...then establish the listeners for changes
      const scrolledPageOff = attachListeners({
        userUid: user?.uid,
        dataType,
        settings: versionSettings,
        paginate,
        childChanged,
        childRemoved,
        skipChildAdded: true,
      });

      if (scrolledPageOff) newPageListenerOffs.current.push(scrolledPageOff);
    },
    [childChanged, childRemoved, dataType, managePagination, sort, user?.uid, versionSettings]
  );
  // ------------------------------------------------------------------------------------------------------------------

  // ---- New Page Determination --------------------------------------------------------------------------------------
  const [peripharyMarker, setPeripharyMarker] = useState<string | number>();

  useEffect(() => {
    if (managePagination?.buffer !== undefined) {
      const periphery = dataList.slice(managePagination.buffer * -1);
      const peripheryObserved = periphery.some(([key]) => observedIds[key]);

      if (peripheryObserved) {
        const el = periphery[periphery.length - 1];
        const marker = sort.startsWith("created") ? el[0] : el[1];
        setPeripharyMarker(marker);
      } else {
        setPeripharyMarker(undefined);
      }
    }
  }, [managePagination?.buffer, dataList, observedIds, managePagination, sort, listenToNewPage]);

  useEffect(() => {
    if (peripharyMarker) listenToNewPage(peripharyMarker);
  }, [listenToNewPage, peripharyMarker]);
  // ------------------------------------------------------------------------------------------------------------------

  // ---- Primary Hydration and Listeners -----------------------------------------------------------------------------
  useEffect(() => {
    let primaryListenerOff: Maybe<VoidFunction>;

    if (!initiallyLoading) {
      // (1) If you are managing pagination...
      if (managePagination) {
        const path = getPath(versionSettings, dataType, user?.uid);

        if (path) {
          const { amount } = managePagination;
          const direction = getDirection(sort);

          // ...get the initial chunk of data...
          getOrderByWithLimit<DataList[T22]>(path, "orderByKey", {
            amount,
            direction,
          }).then((newData) => {
            if (newData) {
              // ...set it...
              setData(newData);

              const newDataArray = Object.entries(newData);
              const el = newDataArray[newDataArray.length - 1];
              const marker = sort.startsWith("created") ? el[0] : el[1];

              const paginate = getPaginationOptions(sort, {
                exclusiveSide: { direction: "high", exclusiveTermination: marker },
              });

              // ...and then listen for any new data that comes in
              primaryListenerOff = attachListeners({
                userUid: user?.uid,
                dataType,
                settings: versionSettings,
                paginate,
                childChanged,
                childRemoved,
                skipChildAdded: true,
              });
            }
          });
        }
        // (2) Otherwise just listen to all the data
      } else {
        const paginate = getPaginationOptions(sort, {});

        primaryListenerOff = attachListeners({
          userUid: user?.uid,
          dataType,
          settings: versionSettings,
          paginate,
          childChanged,
          childRemoved,
          skipChildAdded: false,
        });
      }
    }

    return () => {
      primaryListenerOff?.();
      newPageListenerOffs.current.forEach((pageOff) => pageOff()); // eslint-disable-line react-hooks/exhaustive-deps
      setData({});
    };
  }, [
    initiallyLoading,
    user?.uid,
    dataType,
    sort,
    managePagination?.amount,
    versionSettings,
    managePagination,
    childChanged,
    childRemoved,
  ]);
  // ------------------------------------------------------------------------------------------------------------------

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
    /* eslint-enable react/destructuring-assignment */
  }

  if (dataList.length === 0) return null;

  let currentGrouping = 0;

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
