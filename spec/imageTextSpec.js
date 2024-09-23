// imageTextSpec.js

const { useMetric } = require('../pixifier/compute-image-text.js');

describe("useMetric? ", function() {

    it("should use metric by default", function() {
        expect(useMetric({})).toBe(true);
    });

    const cases = [
      [ {stationCode: 'KSEA'}, false],
      [ {stationCode: 'LIMC'}, true ],
      [ {stationCode: '....'}, true ],
      [ {stationCode: 'KSEA', units: 'C'}, true ],
      [ {stationCode: 'LIMC', units: 'C'}, true ],
      [ {stationCode: '....', units: 'C'}, true ],
      [ {stationCode: 'KSEA', units: 'F'}, false],
      [ {stationCode: 'LIMC', units: 'F'}, false],
      [ {stationCode: '....', units: 'F'}, false],
    ]

    for (each of cases) {
        const params = each[0];
        const expected = each[1];
        const pstring = JSON.stringify(params);
        it(pstring, function() {
            expect(useMetric(params)).toBe(expected);
        });
    }
});