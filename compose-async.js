const Jimp = require("jimp");

async function compose(params) {

  const layerMap = {
    "night": "pixifier/pixies/backgrounds/starrynightbkg.png",
    "day": "pixifier/pixies/backgrounds/sunnybackground.png",
    "coolPixie": "pixifier/pixies/pixieselfie/pixie-cool.png"
  };

  let zenithAngle = params.sunPos.zenithAngle;

  let background;
  if (zenithAngle < 85) {
    background = await Jimp.read(layerMap.day);
  } else {
    background = await Jimp.read(layerMap.night);
  }
  const foreground = await Jimp.read(layerMap.coolPixie);

  let pixie = background.composite(foreground, 0, 0, { });
  // 8 or 16
  await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE).then((font) => {
    pixie.print(font, 2, 153, params.text); // 125x175 image; don't know text length
  });
  return pixie;

}

exports.compose = compose;
exports.Jimp = Jimp;
