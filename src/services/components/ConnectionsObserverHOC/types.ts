import { FC } from "react";

// FirebaseHech
import type {
  ListenerPaginationOptions,
  FirebaseHechDatabase,
  StatefulData,
  ConnectionDataListDatabase,
} from "firebase-hech";

// Local
import type { GetCache, SetCache } from "../../hooks";

export type Sort<
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK]
> =
  | "created oldest"
  | "created newest"
  | "updated oldest"
  | "updated newest"
  | { childKey: keyof Val; direction: "asc" | "desc" };

export type CustomPaginationOpts =
  | {
      edge?: Mandate<ListenerPaginationOptions, "edge">["edge"];
      between?: undefined;
      pagination?: undefined;
    }
  | {
      between?: Mandate<ListenerPaginationOptions, "between">["between"];
      edge?: undefined;
      pagination?: undefined;
    }
  | {
      pagination?: Omit<Mandate<ListenerPaginationOptions, "limit">["limit"], "direction">;
      between?: undefined;
      edge?: undefined;
    };

export type ManagePagination = {
  /** The page size. */
  amount: number;
  /** The number of elements from the end that should trigger another page fetch. */
  buffer: number;
};

export type EmptyComponentProps<
  ChildT extends keyof FirebaseHechDatabase,
  ParentT extends Maybe<keyof ConnectionDataListDatabase> = undefined
> = {
  dataType: ChildT;
  /** This will be undefined if the version is not `connectionDataList` */
  parentDataType: Maybe<ParentT>;
  /** This will be undefined if the version is not `connectionDataList` */
  parentDataKey: Maybe<string>;
};

export type LoadingComponentProps<
  ChildT extends keyof FirebaseHechDatabase,
  ParentT extends Maybe<keyof ConnectionDataListDatabase> = undefined
> = {
  dataType: ChildT;
  /** This will be undefined if the version is not `connectionDataList` */
  parentDataType: Maybe<ParentT>;
  /** This will be undefined if the version is not `connectionDataList` */
  parentDataKey: Maybe<string>;
};

export type ItemComponentProps<
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK]
> = {
  top: boolean;
  bottom: boolean;
  idx: number;
  list: [string, Val | number][];
  timestamp: number;
  queryNode: number | Val;
  data: StatefulData<ChildT>;
  dataType: ChildT;
  dataKey: string;
  /** This will be undefined if the version is not `connectionDataList` */
  parentDataType: Maybe<ParentT>;
  /** This will be undefined if the version is not `connectionDataList` */
  parentDataKey: Maybe<string>;
  observed: boolean;
  setCache: SetCache;
  getCache: GetCache;
};

export type GroupingComponentProps = {
  idx: number;
  top: boolean;
  bottom: boolean;
  timestamp: number;
  /** Data used to track information during the iteration progress. It is reset every render. */
  groupingData: Record<string, unknown>;
};

export type ObservedDataProps<
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK]
> = {
  /** Indicates whether or not you want the card delay animation */
  animate?: boolean;
  idx: number;
  list: [string, Val | number][];
  top: boolean;
  bottom: boolean;
  dataType: ChildT;
  dataKey: string;
  /** This will be undefined if the version is not `connectionDataList` */
  parentDataType: Maybe<ParentT>;
  /** This will be undefined if the version is not `connectionDataList` */
  parentDataKey: Maybe<string>;
  /** Make sure that this function is memoed or otherwised saved to avoid infinite re-renders */
  memoizedCustomGet?: (_key: string) => Promise<StatefulData<ChildT>>;
  timestamp: number;
  queryNode: number | Val;
  observe: (_el: HTMLLIElement) => void;
  observed: boolean;
  setCache: SetCache;
  getCache: GetCache;
  ItemComponent: FC<ItemComponentProps<ParentT, ParentK, ChildT, ChildK, Val>>;
  /** Return `true` to filter this element out of the list. Make sure that this function is memoed or otherwised saved to avoid infinite re-renders */
  memoizedFilterOutCb?: (key: string, queryNode: number | Val, value: StatefulData<ChildT>) => boolean;
};

type ConnectionVersion<
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildT2 extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK]
> = {
  version: "connectionDataList";
  parentDataType: ParentT;
  parentDataKey: Maybe<ParentK>;
  /** Include this key if you want to use a connectionList other than the dataType you're requesting */
  connectionType?: ChildT2;
  ItemComponent: ObservedDataProps<ParentT, ParentK, ChildT, ChildK, Val>["ItemComponent"];
  EmptyComponent?: FC<EmptyComponentProps<ChildT, ParentT>>;
  LoadingComponent?: FC<LoadingComponentProps<ChildT, ParentT>>;
};

type PublicOrUserListVersion<
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK]
> = {
  version: "publicDataList" | "userDataList";
  parentDataType?: undefined;
  parentDataKey?: undefined;
  connectionType?: undefined;
  ItemComponent: ObservedDataProps<ParentT, ParentK, ChildT, ChildK, Val>["ItemComponent"];
  EmptyComponent?: FC<EmptyComponentProps<ChildT, ParentT>>;
  LoadingComponent?: FC<LoadingComponentProps<ChildT, ParentT>>;
};

export type Version<
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildT2 extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK]
> =
  | ConnectionVersion<ParentT, ParentK, ChildT, ChildT2, ChildK, Val>
  | PublicOrUserListVersion<ParentT, ParentK, ChildT, ChildK, Val>;

export type SettingsVersion<
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildT2 extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK]
> =
  | Omit<
      ConnectionVersion<ParentT, ParentK, ChildT, ChildT2, ChildK, Val>,
      "ItemComponent" | "EmptyComponent" | "LoadingComponent"
    >
  | Omit<
      PublicOrUserListVersion<ParentT, ParentK, ChildT, ChildK, Val>,
      "ItemComponent" | "EmptyComponent" | "LoadingComponent"
    >;

export type ConnectionsObserverHOCProps<
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildT2 extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK]
> = Version<ParentT, ParentK, ChildT, ChildT2, ChildK, Val> & {
  /** The scroll wrapper. This is essential for determining when elements are `observed` and utilizing the `hydrationBufferAmount`. */
  root: Nullable<Element>;
  /** This is required to prevent it from initially fetching all of the data */
  listItemMinHeightPx: number;
  /** This is required to prevent it from initially fetching all of the data */
  listItemMinWidthPx: number;
  /**
   * This number will be multiplied by the `listItemMin` sizes to determine how far
   * the intersection observer will consider `observed` beyond the window boundary
   */
  hydrationBufferAmount: number;
  /** If nothing is passed in, it will fetch all of the keys by default. */
  managePagination?: ManagePagination;
  /** If passed in, this will serve as a limit on the query (ie. all values higher/lower than x) */
  terminationEdge?: string | number;
  sort: Sort<ParentT, ParentK, ChildT, ChildK, Val>;
  /**
   * If this is true, `onChildAdded` listeners will only be added to the first page.
   * In some situations, such as with chat, it is unnecessary to have them elsewhere.
   */
  ignoreNonStartingEdgeAdditions?: boolean;
  dataType: ChildT;
  /** Make sure that this function is memoed or otherwised saved to avoid infinite re-renders */
  memoizedCustomGet?: (_key: string) => Promise<StatefulData<ChildT>>;
  className?: string;
  /** The provided keys will be omitted from the list */
  omitKeys?: Record<string, boolean>;
  /**
   * Indicates whether or not you want the card delay animation.
   * Allows you to set `--gridCardAnimation` and `--gridCardDelay`.
   */
  animate?: boolean;
  /** Don't forget to memoize. */
  memoizedPrefixedListItems?: JSX.Element;
  disable?: boolean;
  /**
   * Return `true` to filter this element out of the list. Make sure that this function is memoed or otherwised saved to avoid infinite re-renders
   *
   * TODO: Refactor this out into `getChildAddedOrChanged` and the initial `getOrderByWithLimit` fetch:
   * Sometimes the query list, if empty, matches more than it should. For example, when getting two lists of past and future alerts using the
   * termination edge, Firebase returns the entire list because nothing matched the query. So you have to filter it out on the client. This
   * should be done before we hydrate the data in the initial fetch and the subsequent listeners. For now, we're lumping it into this lazy feature.
   */
  memoizedFilterOutCb?: (key: string, queryNode: number | Val, value: StatefulData<ChildT>) => boolean;
} & (
    | {
        GroupingComponent: FC<GroupingComponentProps>;
        /** Method by which you want to section the list (ie. day, year, etc.) */
        grouping: "day" | "minute";
        /** The query node key if sorting by a custom key rather than `updatedAt` */
        groupingQueryNodeKey?: keyof Val;
        /** If your list is reversed using CSS, you will need to indicate that here if using a GroupingComponent */
        listIsCssReversed?: boolean;
      }
    | {
        GroupingComponent?: undefined;
        /** Method by which you want to section the list (ie. day, year, etc.) */
        grouping?: undefined;
        /** The query node key if sorting by a custom key rather than `updatedAt` */
        groupingQueryNodeKey?: undefined;
        /** If your list is reversed using CSS, you will need to indicate that here if using a GroupingComponent */
        listIsCssReversed?: undefined;
      }
  );
