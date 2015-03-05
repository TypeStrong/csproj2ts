var fs = require('fs');
var xml2js = require('xml2js');
var _ = require("lodash");
var path = require("path");
var _PromiseLibrary = require('es6-promise');
var Promise = _PromiseLibrary.Promise;
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
                        DefaultProjectConfiguration: getDefaultConfiguration(project),
                        DefaultVisualStudioVersion: getDefaultVisualStudioVersion(project),
                        TypeScriptDefaultPropsFilePath: getTypeScriptDefaultPropsFilePath(project),
                        NormalizedTypeScriptDefaultPropsFilePath: "",
                        imports: getImports(project),
                        ActiveConfiguration: projectInfo.ActiveConfiguration,
                        MSBuildExtensionsPath32: projectInfo.MSBuildExtensionsPath32,
                        ProjectFileName: projectInfo.ProjectFileName,
                        VisualStudioVersion: projectInfo.VisualStudioVersion,
                        TypeScriptDefaultConfiguration: null
                    },
                    files: getTypeScriptFilesToCompile(project)
                };
                normalizePaths(result);
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
    var normalizePaths = function (settings) {
        settings.VSProjectDetails.NormalizedTypeScriptDefaultPropsFilePath = normalizePath(settings.VSProjectDetails.TypeScriptDefaultPropsFilePath, settings);
    };
    var normalizePath = function (path, settings) {
        if (path.indexOf("$(VisualStudioVersion)") > -1) {
            path = path.replace(/\$\(VisualStudioVersion\)/g, settings.VSProjectDetails.VisualStudioVersion || settings.VSProjectDetails.DefaultVisualStudioVersion);
        }
        if (path.indexOf("$(MSBuildExtensionsPath32)") > -1) {
            path = path.replace(/\$\(MSBuildExtensionsPath32\)/g, settings.VSProjectDetails.MSBuildExtensionsPath32);
        }
        return path;
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
                        if (defaultCondition.indexOf(condition) > -1 || !defaultCondition) {
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
    var getTypeScriptFilesToCompile = function (project) {
        var typeOfGrouping = "ItemGroup";
        var result = [];
        if (project[typeOfGrouping]) {
            var items = toArray(project[typeOfGrouping]);
            _.map(items, function (item) {
                if (item["TypeScriptCompile"]) {
                    _.map(toArray(item["TypeScriptCompile"]), function (compileItem) {
                        if (compileItem["$"] && compileItem["$"]["Include"]) {
                            result.push(compileItem["$"]["Include"]);
                        }
                    });
                }
            });
        }
        return result;
    };
    var getTypeScriptDefaultPropsFilePath = function (project) {
        var typeOfGrouping = "Import";
        var result = "";
        if (project[typeOfGrouping]) {
            var items = toArray(project[typeOfGrouping]);
            _.map(items, function (item) {
                if (item["$"] && item["$"]["Project"]) {
                    var projectValue = item["$"]["Project"];
                    if (projectValue.indexOf("Microsoft.TypeScript.Default.props") > -1) {
                        result = projectValue;
                    }
                }
            });
        }
        return result;
    };
    csproj2ts.getTypeScriptDefaultsFromPropsFile = function (propsFileName) {
        return null;
    };
    csproj2ts.programFiles = function () {
        return process.env["ProgramFiles(x86)"] || process.env["ProgramFiles"] || "";
    };
})(csproj2ts || (csproj2ts = {}));
module.exports = csproj2ts;
