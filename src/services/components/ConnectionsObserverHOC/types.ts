import { FC } from "react";

// Soil
import type { ListenerPaginationOptions, SoilDatabase, StatefulData } from "firebase-soil";

export type Sort = "created oldest" | "created newest" | "updated oldest" | "updated newest";

export type CustomPaginationOpts =
  | {
      exclusiveSide?: Mandate<ListenerPaginationOptions, "exclusiveSide">["exclusiveSide"];
      exclusiveBetween?: undefined;
      pagination?: undefined;
    }
  | {
      exclusiveBetween?: Mandate<ListenerPaginationOptions, "exclusiveBetween">["exclusiveBetween"];
      exclusiveSide?: undefined;
      pagination?: undefined;
    }
  | {
      pagination?: { amount: Maybe<number>; exclusiveTermination?: string | number };
      exclusiveBetween?: undefined;
      exclusiveSide?: undefined;
    };

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

export type ObservedDataProps<T22 extends keyof SoilDatabase, T2 extends Maybe<keyof SoilDatabase> = undefined> = {
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

type ConnectionVersion<
  T2 extends keyof SoilDatabase,
  T22 extends keyof SoilDatabase,
  T222 extends keyof SoilDatabase
> = {
  version: "connectionDataList";
  parentDataType: T2;
  parentDataKey: Maybe<string>;
  /** Include this key if you want to use a connectionList other than the dataType you're requesting */
  connectionType?: T222;
  ItemComponent: ObservedDataProps<T22, T2>["ItemComponent"];
  EmptyComponent?: FC<EmptyComponentProps<T22, T2>>;
};

type PublicOrUserListVersion<T22 extends keyof SoilDatabase> = {
  version: "publicDataList" | "userDataList";
  parentDataType?: undefined;
  parentDataKey?: undefined;
  connectionType?: undefined;
  ItemComponent: ObservedDataProps<T22>["ItemComponent"];
  EmptyComponent?: FC<EmptyComponentProps<T22>>;
};

export type Version<T2 extends keyof SoilDatabase, T22 extends keyof SoilDatabase, T222 extends keyof SoilDatabase> =
  | ConnectionVersion<T2, T22, T222>
  | PublicOrUserListVersion<T22>;

export type SettingsVersion<
  T2 extends keyof SoilDatabase,
  T22 extends keyof SoilDatabase,
  T222 extends keyof SoilDatabase
> =
  | Omit<ConnectionVersion<T2, T22, T222>, "ItemComponent" | "EmptyComponent">
  | Omit<PublicOrUserListVersion<T22>, "ItemComponent" | "EmptyComponent">;
