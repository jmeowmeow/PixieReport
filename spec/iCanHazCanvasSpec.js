// iCanHazCanvasSpec.js
// node-canvas is a little brittle because of binary dependencies
// which need to be recompiled when the NPM bindings for external
// binaries change.
// Primarily this is a check to see if the CI env has node-canvas

var nodeCanvas = {};
var createCanvas = {};
var loadImage = {};

describe("iCanHazCanvas has node-canvas", function() {
  beforeAll(function() {
    nodeCanvas = require('canvas');
    createCanvas = nodeCanvas['createCanvas'];
    loadImage    = nodeCanvas['loadImage'];
  });

  it("should have loaded node-canvas", function() {
    expect(nodeCanvas).not.toBe(null);
  });

  it("should have loaded createCanvas", function() {
    expect(createCanvas).not.toBe(null);
  });

  it("should have loaded loadImage", function() {
    expect(loadImage).not.toBe(null);
  });

  it("should create a pixie canvas and 2d context", function() {
    const pixiewidth  = 125;
    const pixieheight = 175;
    const canvas = createCanvas(pixiewidth, pixieheight);
    expect(canvas).not.toBe(null);
    context2d = canvas.getContext('2d');
    expect(context2d).not.toBe(null);
  });

  it("should copy from a narrow canvas into a wide canvas", function() {
    const pixiewidth  = 125;
    const pixieheight = 175;
    const pixiecanvas = createCanvas(pixiewidth, pixieheight);
    const twitter_no_crop = createCanvas(pixiewidth*3, pixieheight);
    const twitterctx = twitter_no_crop.getContext('2d');
    const xoffset = pixiewidth;
    twitterctx.drawImage(pixiecanvas, xoffset, 0);
    const buffer = twitter_no_crop.toBuffer('image/png');
    expect(buffer).not.toBe(null);
  });

});

