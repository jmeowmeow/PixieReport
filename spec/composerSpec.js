const fs = require('fs');

const { buildWidePngPixie, buildHtmlPixie, buildLocText, computeLayers, computeSceneText, computeAltText, loadAndCompose, decodedToParamObject, canvas } = require('../pixifier/pixie-composer.js');

describe("composer functions", function() {
  beforeAll(function() {
    expect(buildWidePngPixie).not.toBe(null);
    expect(buildHtmlPixie).not.toBe(null);
    expect(buildLocText).not.toBe(null);
    expect(computeLayers).not.toBe(null);
    expect(computeSceneText).not.toBe(null);
    expect(computeAltText).not.toBe(null);
    expect(loadAndCompose).not.toBe(null);
    expect(decodedToParamObject).not.toBe(null);
    expect(canvas).not.toBe(null);
  });

  it("should have a canvas of size 125x175", function() {
    expect(canvas.width).toBe(125);
    expect(canvas.height).toBe(175);
  });

});
