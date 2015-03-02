import fs = require('fs');
import xml2js = require('xml2js');

module csproj2ts {
    interface TypeScriptSettings {
        configurations: string[]
    }

    export var getTypeScriptSettings = (projectFile: string, callback: (settings: TypeScriptSettings, error: NodeJS.ErrnoException) => void): void => {

        var parser = new xml2js.Parser();
        parser.addListener('end', function (result) {
            //console.log(result);
            //console.log('Done.');
            var temp: TypeScriptSettings = {
                configurations: ['Debug','Production','Thingy']
            };
            callback(temp, null);
        });

        fs.readFile(projectFile, function (err, data) {
            //console.log(data);
            //console.log(err);
            if (err.errno !== 0) {
                callback(null, err);
            } else {
                //todo: try/catch here
                parser.parseString(data);
            }
        });

    }
}

export = csproj2ts;