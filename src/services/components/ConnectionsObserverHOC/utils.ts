// FirebaseHech
import { PATHS } from "firebase-hech/paths";
import type { ListenerPaginationOptions, FirebaseHechDatabase } from "firebase-hech";

// Helpers
import {
  onConnectionsDataListChildChanged,
  onUserDataTypeListChildChanged,
  onPublicDataTypeListChildChanged,
} from "../../helpers";

// Local
import type { CustomPaginationOpts, SettingsVersion, Sort } from "./types";

/**
 * `limitToLast` returns the high end of a list, while `limitToFirst` returns the low end
 * ```
 * "limitToFirst" : 123 | 456 | 789
 * "limitToLast"  : 789 | 456 | 123
 * ```
 */
export const getDirection = (sort: Sort) => (sort.endsWith("newest") ? "limitToLast" : "limitToFirst");
export const getSide = (sort: Sort) => (sort.endsWith("newest") ? "high" : "low");
export const getOrderBy = (sort: Sort) => (sort.startsWith("created") ? "orderByKey" : "orderByValue");

export const getPaginationOptions = (sort: Sort, opts: CustomPaginationOpts) => {
  const paginate: ListenerPaginationOptions = {};

  paginate.orderBy = getOrderBy(sort);

  if (opts.pagination?.amount) {
    paginate.limit = {
      amount: opts.pagination.amount,
      direction: getDirection(sort),
      termination: opts.pagination.termination,
    };
  } else if (opts.between) {
    paginate.between = { ...opts.between };
  } else if (opts.edge) {
    paginate.edge = { ...opts.edge };
  }

  return paginate;
};

export const attachListeners = <
  T2 extends keyof FirebaseHechDatabase,
  T22 extends keyof FirebaseHechDatabase,
  T222 extends keyof FirebaseHechDatabase
>({
  userUid,
  dataType,
  settings,
  paginate,
  childAdded,
  childChanged,
  childRemoved,
  skipChildAdded,
}: {
  userUid: Maybe<string>;
  dataType: T22;
  settings: SettingsVersion<T2, T22, T222>;
  paginate: ListenerPaginationOptions;
  childAdded: (val: number, key: string, previousOrderingKey?: Nullable<string>) => void;
  childChanged: (val: number, key: string, previousOrderingKey?: Nullable<string>) => void;
  childRemoved: (key: string) => void;
  skipChildAdded: boolean;
}) => {
  let off: Maybe<VoidFunction>;

  if (settings.version === "connectionDataList" && settings.parentDataKey) {
    off = onConnectionsDataListChildChanged(
      settings.parentDataType,
      settings.parentDataKey,
      settings.connectionType || dataType,
      childChanged,
      childRemoved,
      { paginate, skipChildAdded, childAdded }
    );
  } else if (settings.version === "userDataList" && userUid) {
    off = onUserDataTypeListChildChanged(
      userUid, //
      dataType,
      childChanged,
      childRemoved,
      { paginate, skipChildAdded, childAdded }
    );
  } else if (settings.version === "publicDataList") {
    off = onPublicDataTypeListChildChanged(
      dataType, //
      childChanged,
      childRemoved,
      { paginate, skipChildAdded, childAdded }
    );
  }

  return off;
};

export const getPath = <
  T2 extends keyof FirebaseHechDatabase,
  T22 extends keyof FirebaseHechDatabase,
  T222 extends keyof FirebaseHechDatabase
>(
  version: SettingsVersion<T2, T22, T222>,
  dataType: T22,
  userUid: Maybe<string>
) => {
  if (version.version === "connectionDataList" && version.parentDataKey) {
    return PATHS.connectionDataListConnectionType(
      version.parentDataType,
      version.parentDataKey,
      version.connectionType || dataType
    );
  }

  if (version.version === "userDataList" && userUid) {
    return PATHS.userDataTypeList(userUid, dataType);
  }

  if (version.version === "publicDataList" && userUid) {
    return PATHS.publicDataTypeList(dataType);
  }

  return undefined;
};
