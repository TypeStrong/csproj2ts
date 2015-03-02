var fs = require('fs');
var xml2js = require('xml2js');
var _ = require("lodash");
var path = require("path");
var csproj2ts;
(function (csproj2ts) {
    csproj2ts.getTypeScriptSettings = function (projectInfo, callback) {
        if (!projectInfo.MSBuildExtensionsPath32) {
            projectInfo.MSBuildExtensionsPath32 = path.join(csproj2ts.programFiles(), "/MSBuild/");
        }
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
                        DefaultVisualStudioVersion: getDefaultVisualStudioVersion(project),
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
    var getVSConfigDefault = function (project, typeOfGrouping, nodeName, defaultCondition) {
        var result = "";
        if (project[typeOfGrouping]) {
            var items = toArray(project[typeOfGrouping]);
            _.map(items, function (item) {
                if (item[nodeName] && _.isArray(item[nodeName]) && item[nodeName].length > 0) {
                    var subitem = item[nodeName][0]["$"];
                    if (subitem.Condition) {
                        var condition = subitem.Condition.replace(/ /g, '');
                        if (condition === defaultCondition) {
                            result = item[nodeName][0]["_"] + "";
                        }
                    }
                }
            });
        }
        return result;
    };
    var getDefaultVisualStudioVersion = function (project) {
        return getVSConfigDefault(project, "PropertyGroup", "VisualStudioVersion", "'$(VisualStudioVersion)'==''");
    };
    var getDefaultConfiguration = function (project) {
        return getVSConfigDefault(project, "PropertyGroup", "Configuration", "'$(Configuration)'==''");
    };
    csproj2ts.programFiles = function () {
        return process.env["ProgramFiles(x86)"] || process.env["ProgramFiles"] || "";
    };
})(csproj2ts || (csproj2ts = {}));
module.exports = csproj2ts;
