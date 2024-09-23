// imageTextSpec.js

const { useMetric } = require('../pixifier/compute-image-text.js');

describe("useMetric depending on station or units override parameter", function() {

    it("should use metric by default", function() {
        expect(useMetric({})).toBe(true);
    });


});