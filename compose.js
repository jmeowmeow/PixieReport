const Jimp = require("jimp");
console.log("Jimp composition to pixie.png");
Jimp.read("pixifier/pixies/backgrounds/starrynightbkg.png").then((background) =>
{
  Jimp.read("pixifier/pixies/pixieselfie/pixie-cool.png")
  .then((pixie) => {
    return background
      .composite(pixie, 0, 0, { })
      .write("pixie.png");
  });
}).catch((err) => {
    console.error(err);
});
