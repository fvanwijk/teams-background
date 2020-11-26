const path = require('path');
const { format } = require('date-fns');

input = 'weerkaart_empty.jpg';
output = 'weerkaart.jpg';

const Jimp = require('jimp');

const positions = [
  { key: 'wind', x: 640, y: 443, font: Jimp.FONT_SANS_64_WHITE },
  { key: 'temp_nh', x: 978, y: 235, font: Jimp.FONT_SANS_64_BLACK },
  { key: 'temp_gr', x: 1306, y: 120, font: Jimp.FONT_SANS_64_BLACK },
  { key: 'temp_ov', x: 1306, y: 422, font: Jimp.FONT_SANS_64_BLACK },
  { key: 'temp_ut', x: 1062, y: 555, font: Jimp.FONT_SANS_64_BLACK },
  { key: 'temp_zl', x: 743, y: 697, font: Jimp.FONT_SANS_64_BLACK },
  { key: 'temp_lb', x: 1145, y: 871, font: Jimp.FONT_SANS_64_BLACK },
];

const data = {
  wind: 5,
  temp_nh: 20,
  temp_gr: 18,
  temp_ov: 20,
  temp_ut: 21,
  temp_zl: 20,
  temp_lb: 22,
};

async function convert() {
  try {
    Jimp.read(path.join(`./${input}`)).then(async image => {
      const [whiteFont, blackFont, dateFont] = await Promise.all([
        Jimp.loadFont(Jimp.FONT_SANS_64_WHITE),
        Jimp.loadFont(Jimp.FONT_SANS_64_BLACK),
        Jimp.loadFont(Jimp.FONT_SANS_64_BLACK),
      ]);

      const fonts = {
        [Jimp.FONT_SANS_64_WHITE]: whiteFont,
        [Jimp.FONT_SANS_64_BLACK]: blackFont,
      };

      image.print(dateFont, 80, 148, format(new Date(), 'd MMMM'));
      positions.forEach(({ font, key, x, y }) => {
        image.print(fonts[font], x, y, data[key]);
      });
      await image.writeAsync(output);

      console.log(`Output image at ${output}`);
    });
  } catch (e) {
    console.log('Failed', e);
  }
}
convert();
