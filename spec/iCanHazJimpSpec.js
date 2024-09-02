// iCanHazJimpSpec.js
// replaces the node-canvas liveness spec, mostly documentary
// since "jimp" is pure javascript and requires no external binary.
// but since read() is async, it's worth demonstrating that.

var jimpLibrary = {};
var createImage = {};
var readImage = {};
let tamsin, blank; // Make a slow load more obvious.

jimpLibrary  = require('jimp');
createImage  = jimpLibrary['create'];
readImage    = jimpLibrary['read'];
createImage('spec/resources/tamsinpixie.png').then((t) => {tamsin = t;});

describe("iCanHazJimp has jimp library", function() {
  beforeAll(function() {
    blank = new jimpLibrary(125, 175, (e, i) => {});
  });

  it("should have loaded the jimp library", function() {
    expect(jimpLibrary).not.toBe(null);
  });

  it("should have loaded jimp.create == jimp.read", function() {
    expect(createImage).not.toBe(null);
  });

  it("should have loaded jimp.read == jimp.create", function() {
    expect(readImage).not.toBe(null);
  });

  it("should have created the blank pixie image with new()", function() {
    expect(blank).not.toBe(undefined);
    expect(blank).not.toBe(null);
    expect(blank.bitmap).not.toBe(undefined);
    expect(blank.bitmap).not.toBe(null);
    expect(blank.bitmap.width).toBe(125);
    expect(blank.bitmap.height).toBe(175);
  });

  it("should have read the sample Tamsin pixie with create()", function() {
    expect(tamsin).not.toBe(undefined);
    expect(tamsin).not.toBe(null);
    expect(tamsin.bitmap).not.toBe(undefined);
    expect(tamsin.bitmap).not.toBe(null);
    expect(tamsin.bitmap.width).toBe(124);
    expect(tamsin.bitmap.height).toBe(175);
  });

  it("should read the sample Tamsin pixie with read()", function() {
    let tamsinr;
    readImage('spec/resources/tamsinpixie.png').then((t) => {tamsinr = t;
      expect(tamsinr).not.toBe(undefined);
      expect(tamsinr).not.toBe(null);
      expect(tamsinr.bitmap).not.toBe(undefined);
      expect(tamsinr.bitmap).not.toBe(null);
      expect(tamsinr.bitmap.width).toBe(124);
      expect(tamsinr.bitmap.height).toBe(175);
      });
  });

  it("should clone the sample Tamsin pixie", function() {
    const tamsinclone = tamsin.clone();
    expect(tamsinclone).not.toBe(null);
    expect(tamsinclone.bitmap.width).toBe(124);
    expect(tamsinclone.bitmap.height).toBe(175);
  });

//   it("should copy from a narrow canvas into a wide canvas", function() {
//    const pixiewidth  = 125;
//    const pixieheight = 175;
//    const pixiecanvas = createImage(pixiewidth, pixieheight);
//    const twitter_no_crop = createImage(pixiewidth*3, pixieheight);
//    const twitterctx = twitter_no_crop.getContext('2d');
//    const xoffset = pixiewidth;
//    twitterctx.drawImage(pixiecanvas, xoffset, 0);
//    const buffer = twitter_no_crop.toBuffer('image/png');
//    expect(buffer).not.toBe(null);
//  });

});

