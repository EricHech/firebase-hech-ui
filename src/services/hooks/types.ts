export type DataListHookProps<T2, Poke extends boolean> = {
  dataType: T2;
  /** Set this to true if you want the data in array form using `dataArray` (`data` will still be populated). */
  includeArray?: boolean;
  /** Turn the realtime data fetching on and off. */
  enabled?: boolean;
  /** Set this to true if you want to fetch the data before listening to be able to have certainty as to when hydration is complete */
  poke: Poke;
};
