export type DataListHookProps<T2, Poke extends boolean> = {
  dataType: T2;
  /** Defaults to `false`. Set this to true if you want the data in array form using `dataArray` (`data` will still be populated). */
  includeArray?: boolean;
  /** Defaults to `true`. Turn the realtime data fetching on and off. */
  enabled?: boolean;
  /** Defaults to `false`. Set to true if, once enabled and then disabled, it maintains the data from when it was enabled */
  maintainWhenDisabled?: boolean;
  /** Set this to true if you want to fetch the data before listening to be able to have certainty as to when hydration is complete */
  poke: Poke;
};
