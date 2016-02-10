'use strict';

const request = require('request'),
    config = require('./config'),
    xml2js = require('xml2js');

class MovieInfoProvider {
    _processPlainText(text) {
        let result = {};
        text = text.split('\n');
        for (let i = 0; i < text.length; i++) {
            text[i] = text[i].split('|').map(str => {
                return str.trim();
            });
            result[text[i][0]] = text[i].length > 2 ? text[i].slice(1, text[i].length) : text[i][1];
        }
        return result;
    }

    execute(name) {
        new Promise((resolve, reject) => {
            request.get({
                url: `${config.URL}query?input=movie%20${name}&appid=${config.API_KEY}&podstate=BasicInformation:MovieData__More&includepodid=BasicInformation:MovieData&includepodid=Cast:MovieData&podstate=Cast:MovieData__More`,
                json: true
            }, (err, httpResponse, body) => {
                if (err) throw err;
                xml2js.parseString(body, (err, result) => {
                    if (result.queryresult.$.success === 'true' && result.queryresult.$.datatypes.toLowerCase().indexOf('movie') !== -1) {
                        let pods = result.queryresult.pod;
                        result = {};
                        for (let i = 0; i < pods.length; i++) {
                            if (pods[i].$.id === 'BasicInformation:MovieData') {
                                let movieInfo = pods[i].subpod[0].plaintext[0];                                
                                Object.assign(result, this._processPlainText(movieInfo));
                            } else if (pods[i].$.id === 'Cast:MovieData') {
                                let movieInfo = pods[i].subpod[0].plaintext[0];
                                result.cast = this._processPlainText(movieInfo);                                
                            }
                        }                        
                        if (result.keys({}).length > 0) resolve(result);
                    }
                    reject();
                });
            });
        });
    }
}

//new Movie().getMovieInfo('terminator');

module.exports = MovieInfoProvider;
