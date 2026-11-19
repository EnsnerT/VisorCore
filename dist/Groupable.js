/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	const __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	// define getter/value functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop));
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ 	
/************************************************************************/
let __webpack_exports__ = {};
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Groupable)
/* harmony export */ });
function isGroup(value) {
    return (value !== null &&
        typeof value === "object" &&
        !Array.isArray(value));
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
function withEachGroupItem(groupOrItems, action) {
    return withEachGroup(groupOrItems, (value, _key, _group, path, abort) => {
        if (Array.isArray(value)) {
            return abort(action(value, path));
        }
        if (isGroup(value)) {
            /*
             * Keep a group and continue recursively.
             */
            return true;
        }
        return undefined;
    });
}
/*
 * Generic recursive traversal.

 * The input contains T.
 * The resulting leaves contain P.

 * Boolean and undefined results do not themselves contain P,
 * so they are handled internally while traversing.
 */
function withEachGroup(groups, action, path = []) {
    /*
     * Root list.
     */
    if (Array.isArray(groups)) {
        if (path.length === 0) {
            const result = action(groups, undefined, undefined, [], (value) => value);
            /*
             * At runtime, the result can also be boolean, undefined,
             * or null. The original implementation returns it directly.
             */
            return result;
        }
        /*
         * Nested lists are processed by their parent action.
         */
        return groups;
    }
    const inputGroup = groups;
    /*
     * This output group may contain P rather than T.
     */
    const outputGroup = inputGroup;
    for (const key in inputGroup) {
        const value = inputGroup[key];
        const currentPath = [
            ...path,
            [inputGroup, key]
        ];
        let continued = true;
        const aborter = (newValue) => {
            continued = false;
            return newValue;
        };
        const result = action(value, key, inputGroup, currentPath, aborter);
        let kept = true;
        if (typeof result === "boolean") {
            kept = result;
            continued = result;
        }
        else if (result === undefined || result === null) {
            kept = false;
            continued = false;
        }
        else {
            /*
             * The action transformed T into P.
             */
            outputGroup[key] = result;
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
            outputGroup[key] = withEachGroup(outputGroup[key], action, currentPath);
        }
    }
    return outputGroup;
}
/*
U[] = (T[])[]
T[]
T = any?
*/
function polyfill_flat(input) {
    if ("flat" in input && typeof input.flat === "function") {
        // @ts-ignore
        return input.flat();
    }
    else {
        const result = [];
        for (let idx = 0; idx < input.length; idx++) {
            const value = input[idx];
            if (Array.isArray(value)) {
                result.push(...value);
            }
            else {
                result.push(value); // value could be unknown 
            }
        }
        return result;
    }
}
class Groupable {
    constructor(value) {
        this.value = value;
    }
    set(value) {
        /*
         * The original API mutates and returns the same wrapper object.
         * The cast is necessary because TypeScript cannot change the
         * generic parameter of an existing class instance in place.
         */
        this.value = value;
        return this;
    }
    get() {
        return this.value;
    }
    groupBy(groupKey) {
        const result = withEachGroupItem(this.get(), (list) => {
            return list.reduce((groups, item) => {
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
                    }
                    else {
                        groups[property] = [item];
                    }
                }
                return groups;
            }, {});
        });
        return this.set(result);
    }
    filter(predicate) {
        const result = withEachGroupItem(this.get(), (list) => list.filter(predicate));
        return this.set(result);
    }
    filterGroups(predicate) {
        const result = withEachGroup(this.get(), predicate);
        return this.set(result);
    }
    flat() {
        return this.set(withEachGroupItem(this.get(), function (items) { return polyfill_flat(items); }));
    }
    ungroup() {
        const allItems = [];
        withEachGroupItem(this.get(), (list) => {
            allItems.push(list);
            return false;
        });
        const flattened = polyfill_flat(allItems);
        return this.set(flattened);
    }
    ungroupDistinct(comparator) {
        return this.ungroup().distinct(comparator);
    }
    removeEmptyGroups() {
        const result = withEachGroup(this.get(), (value) => {
            return Array.isArray(value)
                ? value.length > 0
                : true;
        });
        return this.set(result);
    }
    map(mapper) {
        const result = withEachGroupItem(this.get(), (list, path) => {
            return list.map((value, index, array) => {
                return mapper(value, index, array, path);
            });
        });
        return this.set(result);
    }
    sort(comparator) {
        const actualComparator = comparator !== null && comparator !== void 0 ? comparator : ((a, b) => {
            return a < b
                ? -1
                : a > b
                    ? 1
                    : 0;
        });
        const result = withEachGroupItem(this.get(), (list, path) => {
            return list.sort((a, b) => {
                return actualComparator(a, b, path);
            });
        });
        return this.set(result);
    }
    sortBy(keyExtractor) {
        const actualKeyExtractor = keyExtractor !== null && keyExtractor !== void 0 ? keyExtractor : ((value) => value);
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
    reverse() {
        const result = withEachGroupItem(this.get(), (list) => list.reverse());
        return this.set(result);
    }
    /*
     * The result is no longer Groupable<T>.
     * It is Groupable<number>, because every list becomes a number.
     * Groups are {<groupID>:[<groupLength>]}
     */
    countByGroup() {
        const result = withEachGroupItem(this.get(), (items) => [items.length]);
        return this.set(result);
    }
    count() {
        let count = 0;
        withEachGroupItem(this.get(), (items) => {
            count += items.length;
            return items;
        });
        return count;
    }
    distinct(comparator) {
        const equals = comparator !== null && comparator !== void 0 ? comparator : ((a, b) => a === b);
        const result = withEachGroupItem(this.get(), (list) => {
            return list.reduce((unique, currentItem) => {
                const exists = unique.some((existingItem) => equals(existingItem, currentItem));
                if (!exists) {
                    unique.push(currentItem);
                }
                return unique;
            }, []);
        });
        return this.set(result);
    }
    // might add entries(); with F = {key: string, value: (F|T)[]}; returns F[]; but since it is an array, it can be given to Groupable again.
    keys() {
        if (Array.isArray(this.get())) // is not a group!
            return [];
        const result = [];
        this.withEachGroup(function (value, key, parent, path, aborter) {
            if (typeof key === 'string')
                result.push(key);
            return aborter(true); // only read level 0
        });
        return result;
    }
    withEachItem(action) {
        return withEachGroupItem(this.get(), action);
    }
    withEachGroup(action) {
        return withEachGroup(this.get(), action);
    }
    copy() {
        return this.set(this.getCopy());
    }
    getCopy() {
        return structuredClone(this.value);
    }
}
/*
 * Browser-global API.
 */
globalThis.Groupable = Groupable;
// keep it! the simple way to export it without the use of Webpack!

/******/ })()
;