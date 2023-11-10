type Timestamp = number;

type Key<T> = keyof T;

type Maybe<T> = T | undefined;
type Nullable<T> = T | null;
type ValueOf<T extends object> = T[keyof T];

type NullableKey<T> = { [P in keyof T]?: T[P] | null };
type NullableKeys<T, K extends Key<T> = Key<T>> = Pick<T, Exclude<Key<T>, K>> & NullableKey<Pick<T, K>>;

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/**
 * Make one or more keys optional. It is equivalent to Partial if the second type argument is omitted.
 * ```
 * ex: Optional<{ a: string; b: number; c: boolean }, 'a' | 'b'> -> { a?: string; b?: number; c: boolean }
 * ```
 */
type Optional<T, K extends Key<T> = Key<T>> = Pick<T, Exclude<Key<T>, K>> & Partial<Pick<T, K>>;

/**
 * Enforce one or more optional keys to be defined. The opposite of Optional.
 * ```
 * ex: Mandate<{ a?: string; b?: number; c: boolean }, 'a' | 'b'> -> { a: string; b: number; c: boolean }
 * ```
 */
type Mandate<T extends {}, K extends Key<T>> = Omit<T, K> & { [MK in K]-?: NonNullable<T[MK]> };

/**
 * Enforce all keys to be defined.
 */
type MandateAll<T extends {}> = Omit<T, keyof T> & { [MK in keyof T]-?: NonNullable<T[MK]> };

/**
 * A type to require at least one property of a type.
 * ```
 * ex: RequireAtLeastOne<{ a: string; b: number; c?: boolean }, 'a' | 'b'> -> { a?: string, b?: number, c?: boolean } will throw an error without at least 'a' or 'b'
 * ```
 */
type RequireAtLeastOne<T, Keys extends Key<T> = Key<T>> = Pick<T, Exclude<Key<T>, Keys>> &
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>> }[Keys];

type _TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N ? R : _TupleOf<T, N, [T, ...R]>;
type Tuple<T, N extends number> = N extends N ? (number extends N ? T[] : _TupleOf<T, N, []>) : never;

/**
 * This is saying: create a mapped type of T where T[K] is either the type that we want (KT)
 * or if not then make it it never.
 *
 * Then the [keyof T] maps the set (union) of all valid keys, which cannot include never,
 * so any keys with never are dropped, and all keys that are not of type KT will be removed from the union.
 */
type KeysOfType<T, KT> = {
  [K in keyof T]: T[K] extends KT ? K : never;
}[keyof T];
