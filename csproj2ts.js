var fs = require('fs');
var xml2js = require('xml2js');
var _ = require("lodash");
var path = require("path");
var _PromiseLibrary = require('es6-promise');
var Promise = _PromiseLibrary.Promise;
var csproj2ts;
(function (csproj2ts) {
    var str2bool = function (strvalue) {
        return (typeof strvalue == 'string' && strvalue) ? (strvalue.toLowerCase() == 'true') : (strvalue == true);
    };
    var getTSSetting = function (project, abbreviatedSettingName, projectConfiguration, defaultValue) {
        var typeOfGrouping = "PropertyGroup";
        if (project[typeOfGrouping]) {
            var items = toArray(project[typeOfGrouping]);
            _.map(items, function (item) {
                if (item["$"] && item["$"]["Condition"]) {
                    var condition = item["$"]["Condition"];
                    condition = condition.replace(/ /g, "");
                    if (condition === "'$(Configuration)'=='" + projectConfiguration + "'") {
                        console.log(item);
                        if (item["TypeScript" + abbreviatedSettingName]) {
                            console.log("Returning " + item["TypeScript" + abbreviatedSettingName][0]);
                            return item["TypeScript" + abbreviatedSettingName][0];
                        }
                    }
                }
            });
        }
        return defaultValue;
    };
    csproj2ts.xml2jsReadXMLFile = function (fileName) {
        return new Promise(function (resolve, reject) {
            var parser = new xml2js.Parser();
            parser.addListener('end', function (parsedXMLFileResult) {
                resolve(parsedXMLFileResult);
            });
            fs.readFile(fileName, function (err, data) {
                if (err && err.errno !== 0) {
                    reject(err);
                }
                else {
                    parser.parseString(data);
                }
            });
        });
    };
    csproj2ts.getTypeScriptSettings = function (projectInfo) {
        if (!projectInfo.MSBuildExtensionsPath32) {
            projectInfo.MSBuildExtensionsPath32 = path.join(csproj2ts.programFiles(), "/MSBuild/");
        }
        return new Promise(function (resolve, reject) {
            csproj2ts.xml2jsReadXMLFile(projectInfo.ProjectFileName).then(function (parsedVSProject) {
                if (!parsedVSProject || !parsedVSProject.Project) {
                    reject(new Error("No result from parsing the project."));
                }
                else {
                    var project = parsedVSProject.Project;
                    var projectDefaultConfig = getDefaultConfiguration(project);
                    var projectActiveConfig = projectInfo.ActiveConfiguration || projectDefaultConfig;
                    var result = {
                        VSProjectDetails: {
                            DefaultProjectConfiguration: projectDefaultConfig,
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
                        files: getTypeScriptFilesToCompile(project),
                        AdditionalFlags: undefined,
                        Charset: undefined,
                        CodePage: undefined,
                        CompileOnSaveEnabled: undefined,
                        EmitBOM: undefined,
                        GeneratesDeclarations: undefined,
                        MapRoot: undefined,
                        ModuleKind: undefined,
                        NoEmitOnError: undefined,
                        NoImplicitAny: undefined,
                        NoLib: undefined,
                        NoResolve: undefined,
                        OutDir: undefined,
                        OutFile: undefined,
                        PreserveConstEnums: undefined,
                        RemoveComments: null,
                        SourceMap: undefined,
                        SourceRoot: undefined,
                        SuppressImplicitAnyIndexErrors: undefined,
                        Target: undefined
                    };
                    console.log("A\n");
                    console.log(result);
                    console.log("B\n");
                    console.log(result.RemoveComments);
                    result.RemoveComments = getTSSetting(project, "RemoveComments", projectActiveConfig, undefined);
                    console.log(result.RemoveComments);
                    normalizePaths(result);
                    csproj2ts.getTypeScriptDefaultsFromPropsFile(result.VSProjectDetails.NormalizedTypeScriptDefaultPropsFilePath).then(function (typeScriptDefaults) {
                        result.VSProjectDetails.TypeScriptDefaultConfiguration = typeScriptDefaults;
                        console.log("PAC:" + projectActiveConfig);
                        console.log("props:" + result.RemoveComments);
                        console.log("Defs: " + typeScriptDefaults.RemoveComments);
                        result.RemoveComments = result.RemoveComments || typeScriptDefaults.RemoveComments;
                        resolve(result);
                    });
                }
            }, function (error) {
                reject(error);
            });
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
    function getFirstValueOrDefault(item, defaultValue) {
        if (item && _.isArray(item) && item.length > 0 && !_.isNull(item[0]) && !_.isUndefined(item[0])) {
            if (typeof defaultValue === "boolean") {
                return str2bool(item[0]);
            }
            return item[0];
        }
        return defaultValue;
    }
    csproj2ts.getTypeScriptDefaultsFromPropsFile = function (propsFileName) {
        return new Promise(function (resolve, reject) {
            csproj2ts.xml2jsReadXMLFile(propsFileName).then(function (parsedPropertiesFile) {
                if (!parsedPropertiesFile || !parsedPropertiesFile.Project || !parsedPropertiesFile.Project.PropertyGroup) {
                    reject(new Error("No result from parsing the project."));
                }
                else {
                    var pg = toArray(parsedPropertiesFile.Project.PropertyGroup)[0];
                    var result = {};
                    result.Target = getFirstValueOrDefault(pg.TypeScriptTarget, "ES3");
                    result.CompileOnSaveEnabled = getFirstValueOrDefault(pg.TypeScriptCompileOnSaveEnabled, false);
                    result.NoImplicitAny = getFirstValueOrDefault(pg.TypeScriptNoImplicitAny, false);
                    result.ModuleKind = getFirstValueOrDefault(pg.TypeScriptModuleKind, "");
                    result.RemoveComments = getFirstValueOrDefault(pg.TypeScriptRemoveComments, false);
                    result.OutFile = getFirstValueOrDefault(pg.TypeScriptOutFile, "");
                    result.OutDir = getFirstValueOrDefault(pg.TypeScriptOutDir, "");
                    result.GeneratesDeclarations = getFirstValueOrDefault(pg.TypeScriptGeneratesDeclarations, false);
                    result.SourceMap = getFirstValueOrDefault(pg.TypeScriptSourceMap, false);
                    result.MapRoot = getFirstValueOrDefault(pg.TypeScript, "");
                    result.SourceRoot = getFirstValueOrDefault(pg.TypeScriptSourceRoot, "");
                    result.NoEmitOnError = getFirstValueOrDefault(pg.TypeScript, true);
                    resolve(result);
                }
            }, function (error) {
                reject(error);
            });
        });
    };
    csproj2ts.programFiles = function () {
        return process.env["ProgramFiles(x86)"] || process.env["ProgramFiles"] || "";
    };
})(csproj2ts || (csproj2ts = {}));
module.exports = csproj2ts;
