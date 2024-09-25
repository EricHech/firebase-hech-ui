// FirebaseHech
import { PATHS } from "firebase-hech/paths";
import type { ListenerPaginationOptions, FirebaseHechDatabase, ConnectionDataListDatabase } from "firebase-hech";

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
export const getDirection = <
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK]
>(
  sort: Sort<ParentT, ParentK, ChildT, ChildK, Val>
) => {
  if (typeof sort === "string" ? sort.endsWith("newest") : sort.direction === "desc") {
    return "limitToLast";
  }

  return "limitToFirst";
};
export const getSide = <
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK]
>(
  sort: Sort<ParentT, ParentK, ChildT, ChildK, Val>
) => {
  if (typeof sort === "string" ? sort.endsWith("newest") : sort.direction === "desc") {
    return "high";
  }

  return "low";
};
export const getOrderBy = <
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK]
>(
  sort: Sort<ParentT, ParentK, ChildT, ChildK, Val>
) => {
  if (typeof sort === "string" && sort.startsWith("created")) return "orderByKey";
  return typeof sort === "string" ? { path: "updatedAt" } : { path: sort.childKey as string };
};

export const getMarker = <
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK]
>(
  el: [string, Val | number],
  orderBy: "orderByKey" | { path: string }
) => {
  const resource = orderBy === "orderByKey" ? el[0] : el[1];

  if (typeof resource === "number" || typeof resource === "string") return resource;

  if (orderBy === "orderByKey") throw Error("Invalid `sort` settings.");
  return resource[orderBy.path as keyof Val] as string | number;
};

export const getPaginationOptions = <
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK]
>(
  sort: Sort<ParentT, ParentK, ChildT, ChildK, Val>,
  opts: CustomPaginationOpts
) => {
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
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildT2 extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK]
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
  dataType: ChildT;
  settings: SettingsVersion<ParentT, ParentK, ChildT, ChildT2, ChildK, Val>;
  paginate: ListenerPaginationOptions;
  childAdded: (val: Val | number, key: ChildK | string, previousOrderingKey?: Nullable<string>) => void;
  childChanged: (val: Val | number, key: ChildK | string, previousOrderingKey?: Nullable<string>) => void;
  childRemoved: (key: ChildK | string) => void;
  skipChildAdded: boolean;
}) => {
  let off: Maybe<VoidFunction>;

  if (settings.version === "connectionDataList" && settings.parentDataKey) {
    off = onConnectionsDataListChildChanged<ParentT, ParentK, ChildT, ChildK, Val>(
      settings.parentDataType,
      settings.parentDataKey,
      (settings.connectionType || dataType) as ChildT,
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
  ParentT extends keyof ConnectionDataListDatabase,
  ParentK extends keyof ConnectionDataListDatabase[ParentT],
  ChildT extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildT2 extends keyof ConnectionDataListDatabase[ParentT][ParentK] & keyof FirebaseHechDatabase,
  ChildK extends keyof ConnectionDataListDatabase[ParentT][ParentK][ChildT],
  Val extends ConnectionDataListDatabase[ParentT][ParentK][ChildT][ChildK]
>(
  version: SettingsVersion<ParentT, ParentK, ChildT, ChildT2, ChildK, Val>,
  dataType: ChildT,
  userUid: Maybe<string>
) => {
  if (version.version === "connectionDataList" && version.parentDataKey) {
    return PATHS.connectionDataListConnectionType(
      version.parentDataType as unknown as ParentT,
      version.parentDataKey as unknown as ParentK,
      (version.connectionType || dataType) as unknown as ChildT
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
