export type GroupItem<T> = T[];
export type Group<T> = {
    [key: string]: GroupItem<T> | Group<T>;
};
export type GroupValue<T> = GroupItem<T> | Group<T>;
export type GroupPath<T> = Array<[Group<T>, string]>;
type GroupActionResult<P> = boolean | undefined | null | GroupItem<P> | Group<P>;
type GroupAction<T, P = T> = (value: GroupValue<T>, key: string | undefined, group: Group<T> | undefined, path: GroupPath<T>, abort: <V>(value: V) => V) => GroupActionResult<P>;
type ItemAction<T, P> = (items: GroupItem<T>, path: GroupPath<T>) => GroupActionResult<P>;
type ItemPredicate<T> = (value: T, index: number, array: T[]) => boolean;
type ItemMapper<T, P> = (value: T, index: number, array: T[], path: GroupPath<T>) => P;
type ItemComparator<T> = (a: T, b: T, path: GroupPath<T>) => number;
type ItemKeyExtractor<T, P> = (value: T, path: GroupPath<T>) => P;
export default class Groupable<T> {
    private value;
    constructor(value: GroupValue<T>);
    private set;
    get(): GroupValue<T>;
    groupBy<K extends PropertyKey>(groupKey: (item: T) => K | K[]): Groupable<T>;
    filter(predicate: ItemPredicate<T>): Groupable<T>;
    filterGroups(predicate: GroupAction<T, T>): Groupable<T>;
    flat<V extends (T extends (infer U)[] ? U : T)>(): Groupable<V>;
    ungroup(): Groupable<T>;
    ungroupDistinct(comparator?: (a: T, b: T) => boolean): Groupable<T>;
    removeEmptyGroups(): Groupable<T>;
    map<P>(mapper: ItemMapper<T, P>): Groupable<P>;
    sort(comparator?: ItemComparator<T>): Groupable<T>;
    sortBy<P>(keyExtractor?: ItemKeyExtractor<T, P>): Groupable<T>;
    reverse(): Groupable<T>;
    countByGroup(): Groupable<number>;
    count(): number;
    distinct(comparator?: (a: T, b: T) => boolean): Groupable<T>;
    keys(): string[];
    withEachItem<P>(action: ItemAction<T, P>): GroupValue<P>;
    withEachGroup<P>(action: GroupAction<T, P>): GroupValue<P>;
    copy(): Groupable<T>;
    getCopy(): GroupValue<T>;
}
export {};
