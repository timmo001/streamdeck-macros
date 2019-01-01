const Jimp = require('jimp');

const addText = (filePath, text, white, cb) => {
  let output;
  Jimp.read(filePath)
    .then(image => {
      output = image;
      return white ?
        Jimp.loadFont(Jimp.FONT_SANS_64_WHITE) :
        Jimp.loadFont(Jimp.FONT_SANS_64_BLACK);
    }).then(font => {
      let outputFilePath = `./resources/images/tmp/${Math.floor((Math.random() * 10000) + 1)}.png`;
      output.print(font, 88 - (text.length * 16), 60, text)
        .write(outputFilePath);
      setTimeout(() => cb(outputFilePath), 200);
    }).catch(err => console.error(err));
};

module.exports = {
  addText
};
