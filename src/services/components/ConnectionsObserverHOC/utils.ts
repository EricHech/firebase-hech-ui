// Soil
import {
  onConnectionsDataListChildChanged,
  onUserDataTypeListChildChanged,
  onPublicDataTypeListChildChanged,
} from "../../helpers";
import { PATHS } from "firebase-soil/paths";
import type { ListenerPaginationOptions, SoilDatabase } from "firebase-soil";

// Local
import type { CustomPaginationOpts, SettingsVersion, Sort } from "./types";

export const getDirection = (sort: Sort) => (sort.endsWith("newest") ? "limitToLast" : "limitToFirst");

export const getPaginationOptions = (sort: Sort, opts: CustomPaginationOpts) => {
  const paginate: ListenerPaginationOptions = {};
  if (sort.startsWith("created")) paginate.orderBy = "key";
  else paginate.orderBy = "value";

  if (opts.pagination?.amount) {
    paginate.limit = {
      amount: opts.pagination.amount,
      direction: getDirection(sort),
      exclusiveTermination: opts.pagination.exclusiveTermination,
    };
  } else if (opts.exclusiveBetween) {
    paginate.exclusiveBetween = { ...opts.exclusiveBetween };
  } else if (opts.exclusiveSide) {
    paginate.exclusiveSide = { ...opts.exclusiveSide };
  }

  return paginate;
};

export const attachListeners = <
  T2 extends keyof SoilDatabase,
  T22 extends keyof SoilDatabase,
  T222 extends keyof SoilDatabase
>({
  userUid,
  dataType,
  settings,
  paginate,
  childChanged,
  childRemoved,
  skipChildAdded,
}: {
  userUid: Maybe<string>;
  dataType: T22;
  settings: SettingsVersion<T2, T22, T222>;
  paginate: ListenerPaginationOptions;
  childChanged: (val: number, key: string) => void;
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
      { paginate, skipChildAdded }
    );
  } else if (settings.version === "userDataList" && userUid) {
    off = onUserDataTypeListChildChanged(
      userUid, //
      dataType,
      childChanged,
      childRemoved,
      { paginate, skipChildAdded }
    );
  } else if (settings.version === "publicDataList") {
    off = onPublicDataTypeListChildChanged(
      dataType, //
      childChanged,
      childRemoved,
      { paginate, skipChildAdded }
    );
  }

  return off;
};

export const getPath = <T2 extends keyof SoilDatabase, T22 extends keyof SoilDatabase, T222 extends keyof SoilDatabase>(
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

  if (version.version === "userDataList" && userUid) {
    return PATHS.publicDataTypeList(dataType);
  }

  return undefined;
};
