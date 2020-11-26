const path = require('path');
const fs = require('fs');
const { format } = require('date-fns');
const Jimp = require('jimp');
const fetch = require('node-fetch');

input = 'weerkaart_empty.jpg';
output = 'weerkaart.jpg';

const positions = [
  // { key: 'wind', x: 640, y: 443, font: Jimp.FONT_SANS_64_WHITE },
  { name: 'nh', id: 2757220, x: 978, y: 235, font: Jimp.FONT_SANS_64_BLACK },
  { name: 'gr', id: 2747956, x: 1306, y: 120, font: Jimp.FONT_SANS_64_BLACK },
  { name: 'ov', id: 2743477, x: 1306, y: 422, font: Jimp.FONT_SANS_64_BLACK },
  { name: 'ut', id: 2745912, x: 1062, y: 555, font: Jimp.FONT_SANS_64_BLACK },
  { name: 'zl', id: 2750896, x: 743, y: 697, font: Jimp.FONT_SANS_64_BLACK },
  { name: 'lb', id: 2751283, x: 1145, y: 871, font: Jimp.FONT_SANS_64_BLACK },
];

const currentWeatherSymbol = 'https://gadgets.buienradar.nl/gadget/weathersymbol';

async function getWeatherData() {
  const api = 'https://forecast.buienradar.nl/2.0/forecast/';
  return Promise.all(
    positions.map(async ({ id, name, x, y, font }) => {
      const json = await (await fetch(`${api}${id}`)).json();
      return {
        id,
        font,
        name,
        temp: Math.round(json.nowrelevant.values[0].value),
        x,
        y,
      };
    })
  );
}

getWeatherData();

async function convert() {
  try {
    const data = await getWeatherData();

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

      image.print(
        dateFont,
        -20,
        187,
        {
          text: format(new Date(), 'd MMM').toUpperCase(),
          alignmentX: Jimp.HORIZONTAL_ALIGN_RIGHT,
          alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
        },
        484,
        0
      );
      data.forEach(({ font, temp, x, y }) => {
        image.print(fonts[font], x, y, temp);
      });
      await image.writeAsync(output);

      console.log(`Output image at ${output}`);
    });
  } catch (e) {
    console.log('Failed', e);
  }
}

convert();
