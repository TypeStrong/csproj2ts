var xml2js = require('xml2js');
var csproj2ts;
(function (csproj2ts) {
    csproj2ts.getTypeScriptSettings = function (projectFile) {
        xml2js.parseString("<root>Hello xml2js!</root>", function (err, result) {
            console.log(result);
        });
        return true;
    };
})(csproj2ts || (csproj2ts = {}));
module.exports = csproj2ts;
