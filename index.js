const path = require('path');
const fs = require('fs');
const getAppDataPath = require('appdata-path');
const { format } = require('date-fns');
const Jimp = require('jimp');
const fetch = require('node-fetch');
const logger = require('pino')({
  prettyPrint: { levelFirst: true, translateTime: 'yyyy-mm-dd HH:MM:ss', ignore: 'pid,hostname' },
});

input = 'weerkaart_empty.jpg';
output = 'weerkaart.jpg';

const positions = [
  { name: 'wind', id: 2744042, x: 640, y: 443, font: Jimp.FONT_SANS_64_WHITE },
  { name: 'nh', id: 100000262, x: 978, y: 235, font: Jimp.FONT_SANS_64_BLACK },
  { name: 'gr', id: 2756408, x: 1306, y: 120, font: Jimp.FONT_SANS_64_BLACK },
  { name: 'ov', id: 2743477, x: 1306, y: 422, font: Jimp.FONT_SANS_64_BLACK },
  { name: 'ut', id: 2757783, x: 1062, y: 555, font: Jimp.FONT_SANS_64_BLACK },
  { name: 'zl', id: 2745392, x: 743, y: 697, font: Jimp.FONT_SANS_64_BLACK },
  { name: 'lb', id: 2759350, x: 1145, y: 871, font: Jimp.FONT_SANS_64_BLACK },
];

const currentWeatherSymbol = 'https://gadgets.buienradar.nl/gadget/weathersymbol';

const teamsDir = process.env.NODE_ENV === 'production' ? getAppDataPath('Microsoft/Teams/Backgrounds/Uploads') : './';

async function getWeatherData() {
  const api = 'https://forecast.buienradar.nl/2.0/forecast/';
  return Promise.all(
    positions.map(async ({ id, name, x, y, font }) => {
      let temp, wind, windDir, windDeg;
      if (id) {
        const json = await (await fetch(`${api}${id}`)).json();
        const {
          nowrelevant: { values },
        } = json;
        const t = values.find(({ type }) => type === 'maxtemperature');
        const w = values.find(({ type }) => type === 'beaufort');
        temp = t && Math.round(t.value);
        wind = w && w.value;
        windDir = json.days[0].winddirection;
        windDeg = json.days[0].winddirectiondegrees;
      } else {
        temp = undefined;
        wind = undefined;
        windDir = undefined;
        windDeg = undefined;
      }

      return { id, font, name, temp, wind, windDir, windDeg, x, y };
    })
  );
}

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

      const dataToRender = data.map(({ font, temp, wind, x, y }) => {
        return {
          font: fonts[font],
          value: { [Jimp.FONT_SANS_64_WHITE]: wind, [Jimp.FONT_SANS_64_BLACK]: temp }[font],
          x,
          y,
        };
      });

      dataToRender.forEach(({ font, value, x, y }) => {
        image.print(font, x, y, value);
      });
      const outputPath = path.join(teamsDir, output);
      await image.writeAsync(outputPath);

      logger.info(`Output image at ${outputPath}`);
    });
  } catch (e) {
    logger.error('Failed', e);
  }
}

convert();

if (process.env.INTERVAL_MINUTES) {
  setInterval(convert, process.env.INTERVAL_MINUTES * 60000);
}
