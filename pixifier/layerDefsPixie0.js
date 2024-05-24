const layerDefSnapshot = 
{
  bkgd: [
    {
      desc: 'night',
      path: 'pixifier/pixies/backgrounds/starrynightbkg.png'
    },
    {
      desc: 'gray twilight',
      path: 'pixifier/pixies/backgrounds/graybackground.png'
    },
    {
      desc: 'dusk',
      path: 'pixifier/pixies/backgrounds/pinkbackground.png'
    },
    {
      desc: 'day',
      path: 'pixifier/pixies/backgrounds/sunnybackground.png'
    }
  ],
  skyhash: {
    clear: {
      desc: 'clear',
      path: 'pixifier/pixies/skycond/blank.png'
    },
    'mostly clear': {
      desc: 'cloudy',
      path: 'pixifier/pixies/skycond/clouds.png'
    },
    'partly cloudy': {
      desc: 'cloudy',
      path: 'pixifier/pixies/skycond/clouds.png'
    },
    'mostly cloudy': {
      desc: 'cloudy',
      path: 'pixifier/pixies/skycond/clouds.png'
    },
    overcast: {
      desc: 'overcast',
      path: 'pixifier/pixies/skycond/overcast.png'
    },
    obscured: {
      desc: 'overcast',
      path: 'pixifier/pixies/skycond/overcast.png'
    }
  },
  lightningLayer: {
    desc: 'lightning',
    path: 'pixifier/pixies/weather/lightning.png'
  },
  noDollLayer: {
    desc: 'no pixel doll shown',
    path: 'pixifier/pixies/skycond/blank.png'
  },
  dollLayerByTemp: {
    '0': {
      desc: "a slim young woman in a bright red hooded parka with gold fuzz framing her face, a gray mask covering mouth and nose, a transparent visor, a black-and-white neck scarf, yellow mittens, black pants and aqua-blue knee boots.",
      path: 'pixifier/pixies/pixie0/pixie-icy.png'
    },
    '1': {
      desc: "a slim young woman with black hair and a broad pink face with one eyebrow raised, wearing red earmuffs, a red neck scarf, a pale yellow cable-knit sweater, red mittens, black pants with a red belt, and bright red knee boots.",
      path: 'pixifier/pixies/pixie0/pixie-cold.png'
    },
    '2': {
      desc: "a slim young woman with black hair and a broad pink face with one eyebrow raised, wearing a pale yellow cable-knit sweater, light brown corduroy pants, and brown shoes.",
      path: 'pixifier/pixies/pixie0/pixie-cool.png'
    },
    '3': {
      desc: "a slim young woman with black hair and a broad pink face with one eyebrow raised, wearing a black short-sleeved shirt with a large sunflower blossom, blue jeans, and yellow shoes.",
      path: 'pixifier/pixies/pixie0/pixie-warm.png'
    },
    '4': {
      desc: "a slim young woman with black hair and a broad pink face with one eyebrow raised, barefoot, wearing a yellow short-sleeved shirt with a large green and orange sunflower blossom, and blue denim shorts.",
      path: 'pixifier/pixies/pixie0/pixie-hot.png'
    }
  },
  dayhighwind: [
    {
      desc: 'a red high wind warning pennant',
      path: 'pixifier/pixies/highwind/daywarn.png'
    },
    {
      desc: 'two red gale warning pennants',
      path: 'pixifier/pixies/highwind/daygale.png'
    },
    {
      desc: 'a red and black storm warning flag',
      path: 'pixifier/pixies/highwind/daystorm.png'
    },
    {
      desc: 'two red and black hurricane warning flags',
      path: 'pixifier/pixies/highwind/dayhurricane.png'
    }
  ],
  weatherhash: {
    none: {
      desc: '',
      path: 'pixifier/pixies/weather/blank.png'
    },
    'light drizzle': {
      desc: 'drizzle',
      path: 'pixifier/pixies/weather/drizzle.png'
    },
    drizzle: {
      desc: 'drizzle',
      path: 'pixifier/pixies/weather/drizzle.png'
    },
    'heavy drizzle': {
      desc: 'drizzle',
      path: 'pixifier/pixies/weather/drizzle.png'
    },
    'light rain': {
      desc: 'light rain',
      path: 'pixifier/pixies/weather/ltrain.png'
    },
    rain: {
      desc: 'rain',
      path: 'pixifier/pixies/weather/rain.png'
    },
    'heavy rain': {
      desc: 'rain',
      path: 'pixifier/pixies/weather/rain.png'
    },
    mist: {
      desc: 'mist',
      path: 'pixifier/pixies/weather/mist.png'
    },
    fog: {
      desc: 'fog',
      path: 'pixifier/pixies/weather/fog.png'
    },
    'patches of fog': {
      desc: 'fog',
      path: 'pixifier/pixies/weather/fog.png'
    },
    'light snow': {
      desc: 'light snow',
      path: 'pixifier/pixies/weather/ltsnow.png'
    },
    snow: {
      desc: 'snow',
      path: 'pixifier/pixies/weather/snow.png'
    },
    'heavy snow': {
      desc: 'snow',
      path: 'pixifier/pixies/weather/snow.png'
    }
  },
  frame: {
    desc: 'frame',
    path: 'pixifier/pixies/backgrounds/blackframe.png'
  }
};
exports.layerDefsPixie0 = layerDefSnapshot;
