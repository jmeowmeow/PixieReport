const useMetric = function(params) {
  return true;
}

const abbreviateLocation = function(location_label) {
  return location_label;
}

const computeImageTextValues = function (params) {
    // compute the text values to be written on the image
    var temphum = ''; var windbar = '';
    if (useMetric(params)) {
        if (params.degreesCstr) {
            temphum = temphum + params.degreesCstr + 'C ';
        } else {
            temphum = '     ';
        }
        if (params.humidity) {
            temphum = temphum + params.humidity;
        }
        if (!params.windDir) {
            windbar = '       ';
        } else if (params.windDir == "Calm") {
            windbar = '' + params.windDir + '  ';
        } else {
            windbar = '' + params.windDir + ' ' + params.windSpeedKph + 'kph ';
        }
        if (params.hectoPressure == '') {
        } else {
            windbar = windbar + params.hectoPressure + 'hPa';
        }
    } else { // non-metric
        if (params.degreesFstr) {
            temphum = temphum + params.degreesFstr + 'F ';
        } else {
            temphum = '     ';
        }
        if (params.humidity) {
            temphum = temphum + params.humidity;
        }
        if (!params.windDir) {
            windbar = '       ';
        } else if (params.windDir == "Calm") {
            windbar = '' + params.windDir + '  ';
        } else {
            windbar = '' + params.windDir + ' ' + params.windSpeedMph + 'mph ';
        }
        if (params.inHgPressure == '') {
        } else {
            windbar = windbar + params.inHgPressure + 'mmHg';
        }
    }

    // choose a side label to ID the location
    var location_label = params.stationCode;

    var guess_at_name_end = params.stationDesc.lastIndexOf(' (');
    if (guess_at_name_end > 0) {
        location_label = params.stationDesc.substring(0, guess_at_name_end);
        location_label = abbreviateLocation(location_label);
    }
    // return all the things
    let imageText = {
        temphum: temphum,
        windbar: windbar,
        zuluTime: params.zuluTime,
        locationLabel: location_label,
    };
    console.log(`imageText: \n${JSON.stringify(imageText, null, 2)}`);
    return imageText;
}

exports.computeImageTextValues = computeImageTextValues;