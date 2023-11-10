import React, { useState, useMemo, useCallback, PropsWithChildren, useEffect, useRef, CSSProperties } from "react";

export const useBasicIntersectionObserver = (
  root?: Nullable<Element>,
  /** e.g. `"150px 150px 150px 150px"` */
  rootMargin?: string,
  /**
   * An object keyed by element ids set to true if they should not be set as unobserved once observed (such as in the case of a one-time animation)
   * ! Be sure to save as a permanent constant or memoize so as not to cause unecessary re-renders
   */
  observePermanentlyOnceObserved?: Record<string, boolean>
) => {
  const [observedIds, setObservedIds] = useState<Record<string, Maybe<true>>>({});

  const observer = useMemo(
    () =>
      new IntersectionObserver(
        (
          /** This is a partial list of observed entries containing only those entries that triggered a change */
          entries
        ) =>
          // TODO: Possibly debounce using a ref that sets state after changes are complete (~150ms?) to prevent adding lots of render cycles and useless fetches to the stack
          setObservedIds((prevState) =>
            entries.reduce(
              (prev, { isIntersecting, target: { id } }) => {
                if (isIntersecting) prev[id] = isIntersecting; // eslint-disable-line no-param-reassign
                else if (!observePermanentlyOnceObserved?.[id]) delete prev[id]; // eslint-disable-line no-param-reassign
                return prev;
              },
              { ...prevState }
            )
          ),
        { root, rootMargin }
      ),
    [root, rootMargin, observePermanentlyOnceObserved]
  );

  const observe = useCallback(
    (el: Element) => {
      observer.observe(el);

      return () => observer.unobserve(el);
    },
    [observer]
  );

  return { observe, observedIds };
};

type TProps = PropsWithChildren<{
  id: string;
  observe: ReturnType<typeof useBasicIntersectionObserver>["observe"];
  observed: boolean;
  className: string;
  animatedClassName: string;
  style?: CSSProperties;
}>;

export function ObservedAnimation({ id, observe, observed, className, animatedClassName, style, children }: TProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) observe(ref.current);
  }, [observe]);

  const classNames = [className];
  if (observed) classNames.push(animatedClassName);

  return (
    <div id={id} ref={ref} className={classNames.join(" ")} style={style}>
      {children}
    </div>
  );
}
