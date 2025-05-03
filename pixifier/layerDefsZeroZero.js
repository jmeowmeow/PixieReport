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
      desc: "a seaborne marker buoy at zero latitude and zero longitude.",
      path: 'pixifier/pixies/zerozero/pixie-buoy.png'
    },
    '1': {
      desc: "a seaborne marker buoy at zero latitude and zero longitude.",
      path: 'pixifier/pixies/zerozero/pixie-buoy.png'
    },
    '2': {
      desc: "a seaborne marker buoy at zero latitude and zero longitude.",
      path: 'pixifier/pixies/zerozero/pixie-buoy.png'
    },
    '3': {
      desc: "a seaborne marker buoy at zero latitude and zero longitude.",
      path: 'pixifier/pixies/zerozero/pixie-buoy.png'
    },
    '4': {
      desc: "a seaborne marker buoy at zero latitude and zero longitude.",
      path: 'pixifier/pixies/zerozero/pixie-buoy.png'
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
exports.layerDefsZeroZero = layerDefSnapshot;
