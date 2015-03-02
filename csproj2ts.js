var fs = require('fs');
var xml2js = require('xml2js');
var csproj2ts;
(function (csproj2ts) {
    csproj2ts.getTypeScriptSettings = function (projectFile, callback) {
        var parser = new xml2js.Parser();
        parser.addListener('end', function (result) {
            var temp = {
                configurations: ['Debug', 'Production', 'Thingy']
            };
            callback(temp, null);
        });
        fs.readFile(projectFile, function (err, data) {
            if (err.errno !== 0) {
                callback(null, err);
            }
            else {
                parser.parseString(data);
            }
        });
    };
})(csproj2ts || (csproj2ts = {}));
module.exports = csproj2ts;
