export type GroupItem<T> = T[];

export type Group<T> = {
    [key: string]: GroupItem<T> | Group<T>;
};

export type GroupValue<T> =
    GroupItem<T>
    | Group<T>;

export type GroupPath<T> = Array<[Group<T>, string]>;

/*
 * A group action receives values containing T and may return:
 *
 * - true       keep and continue
 * - false      remove and stop
 * - undefined  remove and stop
 * - null       remove and stop
 * - GroupItem<P>
 * - Group<P>
 *
 * P is the type produced by the action.
 */
export type GroupActionResult<P> =
    | boolean
    | undefined
    | null
    | GroupItem<P>
    | Group<P>;

type GroupAction<T, P = T> = (
    value: GroupValue<T>,
    key: string | undefined,
    group: Group<T> | undefined,
    path: GroupPath<T>,
    abort: <V>(value: V) => V
) => GroupActionResult<P>;

type ItemAction<T, P> = (
    items: GroupItem<T>,
    path: GroupPath<T>
) => GroupActionResult<P>;

type ItemPredicate<T> = (
    value: T,
    index: number,
    array: T[]
) => boolean;

type ItemMapper<T, P> = (
    value: T,
    index: number,
    array: T[],
    path: GroupPath<T>
) => P;

type ItemComparator<T> = (
    a: T,
    b: T,
    path: GroupPath<T>
) => number;

type ItemKeyExtractor<T, P> = (
    value: T,
    path: GroupPath<T>
) => P;

function isGroup<T>(value: unknown): value is Group<T> {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

/*
 * Traverses every leaf list.

 * Input:
 *     GroupValue<T>

 * Output:
 *     GroupValue<P>
 *
 * P may differ from T. For example:
 *
 *     withEachGroupItem<T, number>(...)
 */
function withEachGroupItem<T, P>(
    groupOrItems: GroupValue<T>,
    action: ItemAction<T, P>
): GroupValue<P> {
    return withEachGroup<T, P>(
        groupOrItems,
        (value, _key, _group, path, abort) => {
            if (Array.isArray(value)) {
                return abort(action(value, path));
            }

            if (isGroup<T>(value)) {
                /*
                 * Keep a group and continue recursively.
                 */
                return true;
            }

            return undefined;
        }
    );
}
/*
 * Generic recursive traversal.

 * The input contains T.
 * The resulting leaves contain P.

 * Boolean and undefined results do not themselves contain P,
 * so they are handled internally while traversing.
 */
function withEachGroup<T, P>(
    groups: GroupValue<T>,
    action: GroupAction<T, P>,
    path: GroupPath<T> = []
): GroupValue<P> {
    /*
     * Root list.
     */
    if (Array.isArray(groups)) {
        if (path.length === 0) {
            const result = action(
                groups,
                undefined,
                undefined,
                [],
                <V>(value: V): V => value
            );

            /*
             * At runtime, the result can also be boolean, undefined,
             * or null. The original implementation returns it directly.
             */
            return result as GroupValue<P>;
        }

        /*
         * Nested lists are processed by their parent action.
         */
        return groups as unknown as GroupValue<P>;
    }

    const inputGroup = groups as Group<T>;

    /*
     * This output group may contain P rather than T.
     */
    const outputGroup = inputGroup as unknown as Group<P>;

    for (const key in inputGroup) {
        const value = inputGroup[key];

        const currentPath: GroupPath<T> = [
            ...path,
            [inputGroup, key]
        ];

        let continued = true;

        const aborter = <V>(newValue: V): V => {
            continued = false;
            return newValue;
        };

        const result = action(
            value,
            key,
            inputGroup,
            currentPath,
            aborter
        );

        let kept = true;

        if (typeof result === "boolean") {
            kept = result;
            continued = result;
        } else if (result === undefined || result === null) {
            kept = false;
            continued = false;
        } else {
            /*
             * The action transformed T into P.
             */
            outputGroup[key] = result as GroupItem<P> | Group<P>;
        }

        if (!kept) {
            delete outputGroup[key];
            continue;
        }

        if (continued) {
            /*
             * Recursion is only type-safe after the action has preserved
             * the current value as a group. The cast reflects the runtime
             * behavior of the original JavaScript implementation.
             */
            outputGroup[key] = withEachGroup(
                outputGroup[key] as unknown as GroupValue<T>,
                action,
                currentPath
            ) as GroupItem<P> | Group<P>;
        }
    }

    return outputGroup;
}

function polyfill_flat<T, V extends (T extends (infer U)[] ? U : T)>(input: T[]): V[] {
    if ("flat" in input && typeof input.flat === "function") {
        // @ts-ignore
        return input.flat() as V[];
    } else {
        const result: (V)[] = [];
        for (let idx = 0; idx < input.length; idx++) {
            const value: T = input[idx];
            if (Array.isArray(value)) {
                result.push(...value);
            } else {
                result.push(value as unknown as V); // value could be unknown 
            }
        }
        return result;
    }
}

class Groupable<T> {
    private value: GroupValue<T>;

    constructor(value: GroupValue<T>) {
        this.value = value;
    }

    private set<P>(
        value: GroupValue<P>
    ): Groupable<P> {
        /*
         * The original API mutates and returns the same wrapper object.
         * The cast is necessary because TypeScript cannot change the
         * generic parameter of an existing class instance in place.
         */
        (this as unknown as Groupable<P>).value = value;

        return this as unknown as Groupable<P>;
    }

    public get(): GroupValue<T> {
        return this.value;
    }

    public groupBy<K extends PropertyKey>(
        groupKey: (item: T) => K | K[]
    ): Groupable<T> {
        const result = withEachGroupItem<T, T>(
            this.get(),
            (list) => {
                return list.reduce<Group<T>>(
                    (groups, item) => {
                        const returnedKeys = groupKey(item);
                        const keys = Array.isArray(returnedKeys)
                            ? returnedKeys
                            : [returnedKeys];

                        for (const key of keys) {
                            const property = String(key);
                            const existing = groups[property];

                            if (existing !== undefined) {
                                /*
                                 * Since this method creates the groups,
                                 * an existing value is expected to be a list.
                                 */
                                if (Array.isArray(existing)) {
                                    existing.push(item);
                                }
                            } else {
                                groups[property] = [item];
                            }
                        }

                        return groups;
                    },
                    {}
                );
            }
        );

        return this.set(result);
    }

    public filter(
        predicate: ItemPredicate<T>
    ): Groupable<T> {
        const result = withEachGroupItem<T, T>(
            this.get(),
            (list) => list.filter(predicate)
        );

        return this.set(result);
    }

    public filterGroups(
        predicate: GroupAction<T, T>
    ): Groupable<T> {
        const result = withEachGroup<T, T>(
            this.get(),
            predicate
        );

        return this.set(result);
    }

    public flat<V extends (T extends (infer U)[] ? U : T)>(): Groupable<V> {
        return this.set(withEachGroupItem<T, V>(this.get(), function (items) { return polyfill_flat(items); }));
    }

    public ungroup(): Groupable<T> {
        const allItems: Array<T[]> = [];

        withEachGroupItem<T, T>(
            this.get(),
            (list) => {
                allItems.push(list);
                return false;
            }
        );

        const flattened: T[] = polyfill_flat(allItems);

        return this.set(flattened);
    }

    public ungroupDistinct(
        comparator?: (a: T, b: T) => boolean
    ): Groupable<T> {
        return this.ungroup().distinct(comparator);
    }

    public removeEmptyGroups(): Groupable<T> {
        const result = withEachGroup<T, T>(
            this.get(),
            (value) => {
                return Array.isArray(value)
                    ? value.length > 0
                    : true;
            }
        );

        return this.set(result);
    }

    public map<P>(
        mapper: ItemMapper<T, P>
    ): Groupable<P> {
        const result = withEachGroupItem<T, P>(
            this.get(),
            (list, path) => {
                return list.map((value, index, array) => {
                    return mapper(value, index, array, path);
                });
            }
        );

        return this.set(result);
    }

    public sort(
        comparator?: ItemComparator<T>
    ): Groupable<T> {
        const actualComparator =
            comparator ??
            ((a: T, b: T): number => {
                return a < b
                    ? -1
                    : a > b
                        ? 1
                        : 0;
            });

        const result = withEachGroupItem<T, T>(
            this.get(),
            (list, path) => {
                return list.sort((a, b) => {
                    return actualComparator(a, b, path);
                });
            }
        );

        return this.set(result);
    }

    public sortBy<P>(
        keyExtractor?: ItemKeyExtractor<T, P>
    ): Groupable<T> {
        const actualKeyExtractor =
            keyExtractor ??
            ((value: T): T => value);

        return this.sort((a, b, path) => {
            const aKey = actualKeyExtractor(a, path);
            const bKey = actualKeyExtractor(b, path);

            return aKey < bKey
                ? -1
                : aKey > bKey
                    ? 1
                    : 0;
        });
    }

    public reverse(): Groupable<T> {
        const result = withEachGroupItem<T, T>(
            this.get(),
            (list) => list.reverse()
        );

        return this.set(result);
    }

    /*
     * The result is no longer Groupable<T>.
     * It is Groupable<number>, because every list becomes a number.
     * Groups are {<groupID>:[<groupLength>]}
     */
    public countByGroup(): Groupable<number> {
        const result = withEachGroupItem<T, number>(
            this.get(),
            (items) => [items.length]
        );

        return this.set(result);
    }

    public count(): number {
        let count = 0;

        withEachGroupItem<T, T>(
            this.get(),
            (items) => {
                count += items.length;
                return items;
            }
        );

        return count;
    }

    public distinct(
        comparator?: (a: T, b: T) => boolean
    ): Groupable<T> {
        const equals =
            comparator ??
            ((a: T, b: T): boolean => a === b);

        const result = withEachGroupItem<T, T>(
            this.get(),
            (list) => {
                return list.reduce<T[]>(
                    (unique, currentItem) => {
                        const exists = unique.some(
                            (existingItem) =>
                                equals(existingItem, currentItem)
                        );

                        if (!exists) {
                            unique.push(currentItem);
                        }

                        return unique;
                    },
                    []
                );
            }
        );

        return this.set(result);
    }

    // might add entries(); with F = {key: string, value: (F|T)[]}; returns F[]; but since it is an array, it can be given to Groupable again.

    public keys(): string[] { // might update to F = {key:string,childs:F[]}; return F[];
        if (Array.isArray(this.get())) // is not a group!
            return [];
        const result: string[] = [];
        this.withEachGroup(function (value, key, parent, path, aborter) {
            if (typeof key === 'string')
                result.push(key);
            return aborter(true); // only read level 0
        });
        return result;
    }

    public withEachItem<P>(
        action: ItemAction<T, P>
    ): GroupValue<P> {
        return withEachGroupItem<T, P>(
            this.get(),
            action
        );
    }

    public withEachGroup<P>(
        action: GroupAction<T, P>
    ): GroupValue<P> {
        return withEachGroup<T, P>(
            this.get(),
            action
        );
    }

    public copy(): Groupable<T> {
        return this.set(this.getCopy());
    }

    public getCopy(): GroupValue<T> {
        return structuredClone(this.value);
    }
}

export default Groupable;
