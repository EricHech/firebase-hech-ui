import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FirebaseHechDatabase, StatefulData, DataList } from "firebase-hech";
import { getDataKeyValue, getOrderByWithLimit } from "firebase-hech/client";

// Context
import { useFirebaseHechContext } from "../../context";

// Hooks
import { useStaticCachedDataKeyValues } from "../../hooks";

// Local
import { useBasicIntersectionObserver } from "./useBasicIntersectionObserver";
import { useGetListeners } from "./useGetListeners";
import { attachListeners, getDirection, getOrderBy, getPaginationOptions, getPath, getSide } from "./utils";
import type {
  ConnectionsObserverHOCProps,
  CustomPaginationOpts,
  ItemComponentProps,
  GroupingComponentProps,
  EmptyComponentProps,
  ObservedDataProps,
} from "./types";

export type { ItemComponentProps, GroupingComponentProps, EmptyComponentProps };

export function ObservedData<
  T22 extends keyof FirebaseHechDatabase,
  T2 extends Maybe<keyof FirebaseHechDatabase> = undefined
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

/**
 * This component allows you to fetch a list of firebase-hech keys (by connection, ownership, or public lists)
 * and then hydrate the data for those keys only when those keys are scrolled into view. However, it
 * combines this method with optionally fetching keys in chunks to further improve performance if dealing
 * with extremely large lists. For example, if working with lists in the hundreds or even thousands, you
 * can feel comfortable fetching all of the keys and hydrating when scrolled into view. But if working
 * with a list of tens of thousands or more, such as in the case of a chat, you should pass in `managePagination`.
 */
export function ConnectionsObserverHOC<
  T2 extends keyof FirebaseHechDatabase,
  T22 extends keyof FirebaseHechDatabase,
  T222 extends keyof FirebaseHechDatabase
>(props: ConnectionsObserverHOCProps<T2, T22, T222>) {
  const { initiallyLoading, user } = useFirebaseHechContext();

  // ---- Prop Settings -----------------------------------------------------------------------------------------------
  const {
    listItemMinHeightPx,
    listItemMinWidthPx,
    hydrationBufferAmount,
    sort,
    managePagination,
    terminationEdge: terminationEdgeMarker,
    ignoreNonStartingEdgeAdditions,
    dataType,
    memoizedCustomGet,
    omitKeys,
    className,
    animate,
    root,
    GroupingComponent,
    memoizedPrefixedListItems = null,
    grouping,
    disable,
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

  const direction = useMemo(() => getDirection(sort), [sort]);
  const side = useMemo(() => getSide(sort), [sort]);
  const orderBy = useMemo(() => getOrderBy(sort), [sort]);
  // ------------------------------------------------------------------------------------------------------------------

  // ---- Observer ----------------------------------------------------------------------------------------------------
  const verticalMarginNum = hydrationBufferAmount * listItemMinHeightPx;
  const horizontalMarginNum = hydrationBufferAmount * listItemMinWidthPx;
  const rootMargin = `${verticalMarginNum}px ${horizontalMarginNum}px ${verticalMarginNum}px ${horizontalMarginNum}px`;

  const { observe, observedIds } = useBasicIntersectionObserver(root, rootMargin);
  // ------------------------------------------------------------------------------------------------------------------

  // ---- Data --------------------------------------------------------------------------------------------------------
  // We save the data as an array of pages because the added/changed/removed listeners read statuses according to their page
  const [data, setData] = useState<DataList[T22][]>([]);
  const nextPageIdx = data.length;

  const dataList = useMemo(() => {
    const list = data.reduce((prev, curr) => {
      /* eslint-disable no-param-reassign */
      if (direction === "limitToFirst") prev = { ...prev, ...curr };
      else prev = { ...curr, ...prev };
      /* eslint-enable no-param-reassign */
      return prev;
    }, {} as DataList[T22]);

    if (sort === "created oldest" || sort === "updated oldest") return Object.entries(list);
    return Object.entries(list).reverse();
  }, [direction, sort, data]);

  // ------------------------------------------------------------------------------------------------------------------

  // ---- Fetch Helpers -----------------------------------------------------------------------------------------------
  const { getChildAddedOrChanged, getChildRemoved } = useGetListeners(setData);
  // ------------------------------------------------------------------------------------------------------------------

  // ---- New Page Fetching -------------------------------------------------------------------------------------------
  const [peripheryMarker, setPeripheryMarker] = useState<string | number>();
  const fetchingNewPage = useRef(false);
  const fetchedAll = useRef(false);

  const newPageListenerOffs = useRef<VoidFunction[]>([]);

  const listenToNewPage = useCallback(
    async (startPos: string | number) => {
      fetchingNewPage.current = true;
      setPeripheryMarker(undefined);

      if (managePagination?.amount === undefined) throw Error("`managePagination?.amount` was `undefined`.");
      const { amount } = managePagination;

      const path = getPath(versionSettings, dataType, user?.uid);
      if (!path) throw Error("Unable to determine database path.");

      // When fetching a new page, first get the initial page data...
      const newData = await getOrderByWithLimit<DataList[T22]>(path, orderBy, {
        amount,
        direction,
        termination: { key: startPos, version: "exclusive" },
      });

      const newDataArray = Object.entries(newData || {});
      const newDataLength = newDataArray.length;
      const empty = !newDataLength;

      const paginationOpts: CustomPaginationOpts = {};

      if (!empty) setData((prev) => [...prev, newData]);

      const startEl = newDataArray[0];
      const endEl = newDataArray[newDataLength - 1];
      const start = orderBy === "orderByKey" ? startEl[0] : startEl[1];
      const end = orderBy === "orderByKey" ? endEl[0] : endEl[1];

      // ...if less than a full page came back, you are at the end and should listen to the opposite of the starting edge now also...
      if (newDataLength < amount) {
        fetchedAll.current = true;
        paginationOpts.edge = {
          side: side === "high" ? "low" : "high",
          termination: { key: side === "high" ? end : start, version: "exclusive" },
        };
      } else {
        // ...otherwise, set the listeners for that page...
        paginationOpts.between = { start, end, version: "exclusive" };
      }

      const paginate = getPaginationOptions(sort, paginationOpts);

      // ...then establish the listeners for changes
      const scrolledPageOff = attachListeners({
        userUid: user?.uid,
        dataType,
        settings: versionSettings,
        paginate,
        childAdded: getChildAddedOrChanged(nextPageIdx),
        childChanged: getChildAddedOrChanged(nextPageIdx),
        childRemoved: getChildRemoved(nextPageIdx),
        skipChildAdded: Boolean(ignoreNonStartingEdgeAdditions),
      });

      if (scrolledPageOff) newPageListenerOffs.current.push(scrolledPageOff);

      fetchingNewPage.current = false;
    },
    [
      getChildAddedOrChanged,
      getChildRemoved,
      dataType,
      managePagination,
      ignoreNonStartingEdgeAdditions,
      sort,
      direction,
      side,
      orderBy,
      versionSettings,
      user?.uid,
      nextPageIdx,
    ]
  );
  // ------------------------------------------------------------------------------------------------------------------

  // ---- New Page Determination --------------------------------------------------------------------------------------
  useEffect(() => {
    if (managePagination?.buffer !== undefined && !fetchedAll.current) {
      const periphery = dataList.slice(managePagination.buffer * -1);
      const peripheryObserved = periphery.some(([key]) => observedIds[key]);

      if (peripheryObserved) {
        const el = periphery[periphery.length - 1];
        const marker = sort.startsWith("created") ? el[0] : el[1];
        setPeripheryMarker(marker);
      } else {
        setPeripheryMarker(undefined);
      }
    }
  }, [managePagination?.buffer, dataList, observedIds, sort]);

  useEffect(() => {
    if (!fetchingNewPage.current && !fetchedAll.current && peripheryMarker) {
      listenToNewPage(peripheryMarker);
    }
  }, [listenToNewPage, peripheryMarker]);
  // ------------------------------------------------------------------------------------------------------------------

  // ---- Primary Hydration and Listeners -----------------------------------------------------------------------------
  const [initialHydrationComplete, setInitialHydrationComplete] = useState(!managePagination); // initial hydration can only be tracked if managing pagination

  useEffect(() => {
    let primaryListenerOff: Maybe<VoidFunction>;

    if (!initiallyLoading && !disable) {
      // (1) If you are managing pagination...
      if (managePagination) {
        const path = getPath(versionSettings, dataType, user?.uid);

        if (path) {
          const { amount } = managePagination;
          const terminationEdge = terminationEdgeMarker
            ? ({ key: terminationEdgeMarker, version: "inclusive" } as const)
            : undefined;

          // ...get the initial chunk of data...
          getOrderByWithLimit<DataList[T22]>(path, orderBy, {
            amount,
            direction,
            termination: terminationEdge,
          }).then((newData) => {
            const newDataArray = Object.entries(newData);

            const paginationOpts: CustomPaginationOpts = {};

            if (newDataArray.length) {
              // ...set it...
              setData([newData]);

              // If you are setting a custom edge (rather than the actual end of the infinite scroll)...
              if (terminationEdge) {
                // ...then use the `pagination` prop, which aims in the direction you're paginating...
                paginationOpts.pagination = { amount, termination: terminationEdge };
              } else {
                // ...otherwise, set the `edge`, which will look in the direction of the starting place in case more data comes in
                const elIndex = side === "high" ? 0 : newDataArray.length - 1;
                const el = newDataArray[elIndex];
                const marker = orderBy === "orderByKey" ? el[0] : el[1];

                paginationOpts.edge = { side, termination: { key: marker, version: "inclusive" } };
              }
            }
            setInitialHydrationComplete(true);

            if (newDataArray.length < amount) fetchedAll.current = true;
            const paginate = getPaginationOptions(sort, paginationOpts);

            // ...and then listen for any new data that comes in
            primaryListenerOff = attachListeners({
              userUid: user?.uid,
              dataType,
              settings: versionSettings,
              paginate,
              childAdded: getChildAddedOrChanged(0),
              childChanged: getChildAddedOrChanged(0),
              childRemoved: getChildRemoved(0),
              skipChildAdded: false,
            });
          });
        }
      } else {
        // (2) Otherwise just listen to all the data
        fetchedAll.current = true;
        const paginate = getPaginationOptions(sort, {});

        primaryListenerOff = attachListeners({
          userUid: user?.uid,
          dataType,
          settings: versionSettings,
          paginate,
          childAdded: getChildAddedOrChanged(0),
          childChanged: getChildAddedOrChanged(0),
          childRemoved: getChildRemoved(0),
          skipChildAdded: false,
        });
      }
    }

    return () => {
      primaryListenerOff?.();
      newPageListenerOffs.current.forEach((pageOff) => pageOff());
      setData([]);
    };
  }, [
    initiallyLoading,
    user?.uid,
    dataType,
    sort,
    direction,
    side,
    orderBy,
    versionSettings,
    managePagination,
    terminationEdgeMarker,
    getChildAddedOrChanged,
    getChildRemoved,
    disable,
  ]);
  // ------------------------------------------------------------------------------------------------------------------

  const { setCache, getCache } = useStaticCachedDataKeyValues();

  const groupingDataRef = useRef<Record<string, unknown>>({});
  groupingDataRef.current = {};

  /* eslint-disable react/destructuring-assignment */
  if (props.LoadingComponent && !initialHydrationComplete) {
    return props.version === "connectionDataList" ? (
      <div className={className}>
        <props.LoadingComponent
          dataType={dataType} //
          parentDataType={props.parentDataType}
          parentDataKey={props.parentDataKey}
        />
      </div>
    ) : (
      <div className={className}>
        <props.LoadingComponent
          dataType={dataType} //
          parentDataType={undefined}
          parentDataKey={undefined}
        />
      </div>
    );
  }
  /* eslint-enable react/destructuring-assignment */

  /* eslint-disable react/destructuring-assignment */
  if (dataList.length === 0 && props.EmptyComponent && initialHydrationComplete) {
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

  /* eslint-disable react/destructuring-assignment */
  return (
    <ul
      className={className}
      style={{
        "--listItemMinHeightPx": `${listItemMinHeightPx}px`,
        "--listItemMinWidthPx": `${listItemMinWidthPx}px`,
      }}
    >
      {memoizedPrefixedListItems}

      {dataList.map(([key, timestamp], i) => {
        if (omitKeys?.[key]) return null;

        const dataJsx =
          props.version === "connectionDataList" ? (
            <ObservedData
              animate={animate}
              idx={i}
              list={dataList}
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
              setCache={setCache}
              getCache={getCache}
              ItemComponent={props.ItemComponent}
            />
          ) : (
            <ObservedData
              animate={animate}
              idx={i}
              list={dataList}
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
              setCache={setCache}
              getCache={getCache}
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
                <GroupingComponent
                  idx={i}
                  top={i === 0}
                  bottom={i === dataList.length - 1}
                  timestamp={currentGrouping}
                  groupingData={groupingDataRef.current}
                />
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
