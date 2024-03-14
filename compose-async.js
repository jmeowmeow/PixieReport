const Jimp = require("jimp");
// console.log("Jimp composition to pixie.png");

async function compose() {

  const background = await Jimp.read("pixifier/pixies/backgrounds/starrynightbkg.png");
  const foreground = await Jimp.read("pixifier/pixies/pixieselfie/pixie-cool.png");
  return background.composite(foreground, 0, 0, { }); //.write("pixie.png");

}

// compose().catch(console.error);

exports.compose = compose;
exports.Jimp = Jimp;