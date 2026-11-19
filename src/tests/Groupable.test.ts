import Groupable from '../Groupable';
import data from './Groupable.data.json';

describe('Groupable', function () {
    const DATA_LENGTH = 197;
    const DATA_LENGTH_ID_IS_NUMERIC = 59;

    function isNumeric(value: string): boolean {
        return !isNaN(parseInt(value[0]));
    }

    it('count()', function () {
        const dataSize = new Groupable(data)
            .count();
        expect(dataSize).toBe(DATA_LENGTH);
    });
    it('filter(true)', function () {
        const filteredDataSize = new Groupable(data)
            .filter(function (item) { return true; })
            .count();
        expect(filteredDataSize).toBe(DATA_LENGTH);
    });
    it('filter(false)', function () {
        const filteredDataSize = new Groupable(data)
            .filter(function (item) { return false; })
            .count();
        expect(filteredDataSize).toBe(0);
    });
    it('filter(index !== 0)', function () {
        const filteredDataSize = new Groupable(data)
            .filter(function (item, index, arr) { return index !== 0; })
            .count();
        expect(filteredDataSize).toBe(DATA_LENGTH - 1);
    });
    it('filter(index === 0)', function () {
        const filteredDataSize = new Groupable(data)
            .filter(function (item, index, arr) { return index === 0; })
            .count();
        expect(filteredDataSize).toBe(1);
    });
    it('filter(isNumeric(id))', function () {
        const filteredDataSize = new Groupable(data)
            .filter(function (item, index, arr) { return isNumeric(item.id); })
            .count();
        expect(filteredDataSize).toBe(DATA_LENGTH_ID_IS_NUMERIC);
    });

    it('groupBy(language) + keys()', function () {
        const groupedData = new Groupable(data)
            .groupBy(function (item) { return item.language; })
            .keys();

        expect(groupedData).toHaveLength(10);
        expect(groupedData).toContain("Bosnian");
        expect(groupedData).toContain("Galician");
        expect(groupedData).toContain("Hindi");
        expect(groupedData).toContain("Icelandic");
        expect(groupedData).toContain("Maltese");
        expect(groupedData).toContain("Sesotho sa Leboa");
        expect(groupedData).toContain("Setswana");
        expect(groupedData).toContain("Sindhi");
        expect(groupedData).toContain("Uyghur");
        expect(groupedData).toContain("isiZulu");
    });

    it('countByGroup(language)', function () {
        const groupedData = new Groupable(data)
            .groupBy(function (item) { return item.language; })
            .countByGroup();
        const keys = groupedData.keys();

        expect(keys).toHaveLength(10);
        expect(keys).toContain("Bosnian");
        expect(keys).toContain("Galician");
        expect(keys).toContain("Hindi");
        expect(keys).toContain("Icelandic");
        expect(keys).toContain("Maltese");
        expect(keys).toContain("Sesotho sa Leboa");
        expect(keys).toContain("Setswana");
        expect(keys).toContain("Sindhi");
        expect(keys).toContain("Uyghur");
        expect(keys).toContain("isiZulu");

        const gd = groupedData.get() as { [key: string]: number[] };
        expect(gd["Bosnian"][0]).toBe(14);
        expect(gd["Galician"][0]).toBe(19);
        expect(gd["Hindi"][0]).toBe(41);
        expect(gd["Icelandic"][0]).toBe(16);
        expect(gd["Maltese"][0]).toBe(20);
        expect(gd["Sesotho sa Leboa"][0]).toBe(20);
        expect(gd["Setswana"][0]).toBe(16);
        expect(gd["Sindhi"][0]).toBe(19);
        expect(gd["Uyghur"][0]).toBe(20);
        expect(gd["isiZulu"][0]).toBe(12);
    });

    it('groupBy([language,isNumeric(id)])', function () {
        const multigroupedSize = new Groupable(data)
            .groupBy(function (item) {
                return isNumeric(item.id) ? [item.language, item.id[0]] : [item.language];
            }).count();

        expect(multigroupedSize).toBe(DATA_LENGTH + DATA_LENGTH_ID_IS_NUMERIC);
        // since there are {DATA_LENGTH_ID_IS_NUMERIC} numeric ids, they are added as group "language" AND "0-9" (totally twice)
    })
    it('groupBy([language,isNumeric]).filter(isNumeric(id)).ungroup().groupBy(id).countByGroup()', function () {
        const groupedData = new Groupable(data)
            .groupBy(function (item) {
                return isNumeric(item.id) ? [item.language, item.id[0]] : [item.language];
            })
            .filter(function (item) {
                return isNumeric(item.id);
            })
            .ungroup()
            .groupBy(function (item) {
                return item.id;
            })
            .countByGroup()
            .get() as { [key: string]: number[] };

        for (const key in groupedData) {
            expect(groupedData[key][0]).toBe(2);
        }
        expect.assertions(DATA_LENGTH_ID_IS_NUMERIC);
    })
});
