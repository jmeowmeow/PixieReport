const Jimp = require("jimp");

async function compose() {

  const background = await Jimp.read("pixifier/pixies/backgrounds/starrynightbkg.png");
  const foreground = await Jimp.read("pixifier/pixies/pixieselfie/pixie-cool.png");
  return background.composite(foreground, 0, 0, { });

}

exports.compose = compose;
exports.Jimp = Jimp;
