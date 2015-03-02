var fs = require('fs');
var xml2js = require('xml2js');
var _ = require("lodash");
var csproj2ts;
(function (csproj2ts) {
    csproj2ts.getTypeScriptSettings = function (projectInfo, callback) {
        var parser = new xml2js.Parser();
        parser.addListener('end', function (parsedVSProject) {
            if (!parsedVSProject || !parsedVSProject.Project) {
                callback(null, { name: "", message: "No result from parsing the project." });
            }
            else {
                var project = parsedVSProject.Project;
                var result = {
                    VSProjectDetails: {
                        DefaultConfiguration: getDefaultConfiguration(project),
                        imports: getImports(project),
                        ActiveConfiguration: projectInfo.ActiveConfiguration,
                        MSBuildExtensionsPath32: projectInfo.MSBuildExtensionsPath32,
                        ProjectFileName: projectInfo.ProjectFileName,
                        VisualStudioVersion: projectInfo.VisualStudioVersion
                    }
                };
                callback(result, null);
            }
        });
        fs.readFile(projectInfo.ProjectFileName, function (err, data) {
            if (err && err.errno !== 0) {
                callback(null, err);
            }
            else {
                parser.parseString(data);
            }
        });
    };
    var toArray = function (itemOrArray) {
        if (_.isArray(itemOrArray)) {
            return itemOrArray;
        }
        else {
            return [itemOrArray];
        }
    };
    var getImports = function (project) {
        var result = [];
        if (project.Import) {
            var importItems = toArray(project.Import);
            _.map(importItems, function (item) {
                if (item["$"]) {
                    result.push(item["$"]);
                }
            });
        }
        return result;
    };
    var getDefaultConfiguration = function (project) {
        var result = "";
        if (project.PropertyGroup) {
            var propertyGroupItems = toArray(project.PropertyGroup);
            _.map(propertyGroupItems, function (item) {
                if (item.Configuration && _.isArray(item.Configuration) && item.Configuration.length > 0) {
                    var subitem = item.Configuration[0]["$"];
                    if (subitem.Condition) {
                        var condition = subitem.Condition.replace(/ /g, '');
                        if (condition == "'$(Configuration)'==''") {
                            result = item.Configuration[0]["_"] + "";
                        }
                    }
                }
            });
        }
        return result;
    };
})(csproj2ts || (csproj2ts = {}));
module.exports = csproj2ts;
