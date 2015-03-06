import fs = require('fs');
import xml2js = require('xml2js');
import _ = require("lodash");
import path = require("path");
import _PromiseLibrary = require('es6-promise');
var Promise = _PromiseLibrary.Promise;

module csproj2ts {
    interface TypeScriptSettings extends TypeScriptConfiguration {
        VSProjectDetails: VSProjectDetails;
        files: string[];
    }

    interface VSImportElement {
        Project: string;
        Condition?: string;
    }

    export interface VSProjectParams {
        ProjectFileName: string;
        MSBuildExtensionsPath32?: string;
        VisualStudioVersion?: string;
        ActiveConfiguration?: string;
    }

    export interface VSProjectDetails extends VSProjectParams {
        DefaultProjectConfiguration?: string;
        DefaultVisualStudioVersion?: string;
        TypeScriptDefaultPropsFilePath: string;
        NormalizedTypeScriptDefaultPropsFilePath: string;
        TypeScriptDefaultConfiguration: TypeScriptConfiguration;
    }

    /** Configuration tags used by Visual Studio TypeScript Project Properties/MSBuild.
     * url: * https://github.com/Microsoft/TypeScript/issues/1712#issuecomment-70574319
     * */
    export interface TypeScriptConfiguration {
        AdditionalFlags?: string;
        Charset?: string;
        CodePage?: string;
        CompileOnSaveEnabled?: boolean;
        EmitBOM?: boolean;
        GeneratesDeclarations?: boolean;
        MapRoot?: string;
        ModuleKind?: string;
        NoEmitOnError?: boolean;
        NoImplicitAny?: boolean;
        NoLib?: boolean;
        NoResolve?: boolean;
        OutFile?: string;
        OutDir?: string;
        PreserveConstEnums?: boolean;
        RemoveComments?: boolean;
        SourceMap?: boolean;
        SourceRoot?: string;
        SuppressImplicitAnyIndexErrors?: boolean;
        Target?: string;
    }

    // Thanks: "timo" http://stackoverflow.com/questions/263965/how-can-i-convert-a-string-to-boolean-in-javascript/28152765#28152765
    var cboolean = (value: string | boolean) => {
        return (typeof value === 'string') ? (value.toLowerCase() === 'true') : value;
    }

    var getTSSetting = <T>(project: any, abbreviatedSettingName: string, projectConfiguration: string, defaultValue: T): T => {
        var typeOfGrouping = "PropertyGroup";
        var result = defaultValue;
        if (project[typeOfGrouping]) {
            var items = toArray(project[typeOfGrouping]);
            _.map(items,(item) => {
                if (item["$"] && item["$"]["Condition"]) {
                    var condition = item["$"]["Condition"];
                    condition = condition.replace(/ /g, "");
                    if (condition === "'$(Configuration)'=='" + projectConfiguration + "'") {
                        if (item["TypeScript" + abbreviatedSettingName]) {
                            result = item["TypeScript" + abbreviatedSettingName][0];
                        }
                    }
                }
            });
        }
        return result;
    }

    export var xml2jsReadXMLFile = (fileName: string) : Promise<any> => {
        return new Promise((resolve, reject) => {
            var parser = new xml2js.Parser();
            parser.addListener('end', function (parsedXMLFileResult) {
                resolve(parsedXMLFileResult);
            });
            fs.readFile(fileName, function (err, data) {
                if (err && err.errno !== 0) {
                    reject(err);
                } else {
                    parser.parseString(data);
                }
            });

        });
    };

    export var getTypeScriptSettings = (projectInfo: VSProjectParams): Promise<TypeScriptSettings> => {

        if (!projectInfo.MSBuildExtensionsPath32) {
            projectInfo.MSBuildExtensionsPath32 = path.join(programFiles(), "/MSBuild/");
        }

        return new Promise((resolve, reject) => {
            xml2jsReadXMLFile(projectInfo.ProjectFileName).then((parsedVSProject) => {
                if (!parsedVSProject || !parsedVSProject.Project) {
                    reject(new Error("No result from parsing the project."));
                } else {
                    var project = parsedVSProject.Project;
                    var projectDefaultConfig = getDefaultConfiguration(project);
                    var projectActiveConfig = projectInfo.ActiveConfiguration || projectDefaultConfig;
                    var result: TypeScriptSettings = {
                        VSProjectDetails: {
                            DefaultProjectConfiguration: projectDefaultConfig,
                            DefaultVisualStudioVersion: getDefaultVisualStudioVersion(project),
                            TypeScriptDefaultPropsFilePath: getTypeScriptDefaultPropsFilePath(project),
                            NormalizedTypeScriptDefaultPropsFilePath: "",
                            ActiveConfiguration: projectInfo.ActiveConfiguration,
                            MSBuildExtensionsPath32: projectInfo.MSBuildExtensionsPath32,
                            ProjectFileName: projectInfo.ProjectFileName,
                            VisualStudioVersion: projectInfo.VisualStudioVersion,
                            TypeScriptDefaultConfiguration: null
                        },
                        files: getTypeScriptFilesToCompile(project),
                        AdditionalFlags: getTSSetting(project, "AdditionalFlags", projectActiveConfig, undefined),
                        Charset: getTSSetting(project, "Charset", projectActiveConfig, undefined),
                        CodePage: getTSSetting(project, "CodePage", projectActiveConfig, undefined),
                        CompileOnSaveEnabled: cboolean(getTSSetting(project, "CompileOnSaveEnabled", projectActiveConfig, undefined)),
                        EmitBOM: cboolean(getTSSetting(project, "EmitBOM", projectActiveConfig, undefined)),
                        GeneratesDeclarations: cboolean(getTSSetting(project, "GeneratesDeclarations", projectActiveConfig, undefined)),
                        MapRoot: getTSSetting(project, "MapRoot", projectActiveConfig, undefined),
                        ModuleKind: getTSSetting(project, "ModuleKind", projectActiveConfig, undefined),
                        NoEmitOnError: cboolean(getTSSetting(project, "NoEmitOnError", projectActiveConfig, undefined)),
                        NoImplicitAny: cboolean(getTSSetting(project, "NoImplicitAny", projectActiveConfig, undefined)),
                        NoLib: cboolean(getTSSetting(project, "NoLib", projectActiveConfig, undefined)),
                        NoResolve: cboolean(getTSSetting(project, "NoResolve", projectActiveConfig, undefined)),
                        OutDir: getTSSetting(project, "OutDir", projectActiveConfig, undefined),
                        OutFile: getTSSetting(project, "OutFile", projectActiveConfig, undefined),
                        PreserveConstEnums: cboolean(getTSSetting(project, "PreserveConstEnums", projectActiveConfig, undefined)),
                        RemoveComments: cboolean(getTSSetting(project, "RemoveComments", projectActiveConfig, undefined)),
                        SourceMap: cboolean(getTSSetting(project, "SourceMap", projectActiveConfig, undefined)),
                        SourceRoot: getTSSetting(project, "SourceRoot", projectActiveConfig, undefined),
                        SuppressImplicitAnyIndexErrors: cboolean(getTSSetting(project, "SuppressImplicitAnyIndexErrors", projectActiveConfig, undefined)),
                        Target: getTSSetting(project, "Target", projectActiveConfig, undefined)
                    };

                    normalizePaths(result);
                    
                    getTypeScriptDefaultsFromPropsFile(result.VSProjectDetails.NormalizedTypeScriptDefaultPropsFilePath)
                        .then((typeScriptDefaults) => {

                        result.VSProjectDetails.TypeScriptDefaultConfiguration = typeScriptDefaults;
                        
                        _.forOwn(result,(value, key) => {
                            if (_.isNull(value) || _.isUndefined(value)) {
                                result[key] = typeScriptDefaults[key];
                            }
                        });
                        
                        resolve(result);
                    });
                    
                }
            },(error) => {
                    reject(error);
            });
        });
    }

    var normalizePaths = (settings: TypeScriptSettings) => {
        settings.VSProjectDetails.NormalizedTypeScriptDefaultPropsFilePath = normalizePath(
            settings.VSProjectDetails.TypeScriptDefaultPropsFilePath, settings
            );
    };

    var normalizePath = (path: string, settings: TypeScriptSettings): string => {
        if (path.indexOf("$(VisualStudioVersion)") > -1) {
            path = path.replace(/\$\(VisualStudioVersion\)/g,
                settings.VSProjectDetails.VisualStudioVersion || settings.VSProjectDetails.DefaultVisualStudioVersion
                );
        }

        if (path.indexOf("$(MSBuildExtensionsPath32)") > -1) {
            path = path.replace(/\$\(MSBuildExtensionsPath32\)/g,
                settings.VSProjectDetails.MSBuildExtensionsPath32
                );
            //path = path.replace(/\\\\/g, "\\"); //fix extra backslashes in path
        }
        return path;
    };

    var toArray = <T>(itemOrArray: T | T[]): T[] => {
        if (_.isArray(itemOrArray)) {
            return <T[]>itemOrArray;
        } else {
            return <T[]>[itemOrArray];
        }
    };

    var getImports = (project: any): VSImportElement[]=> {
        var result: VSImportElement[] = [];
        if (project.Import) {
            var importItems = toArray(project.Import);
            _.map(importItems,(item) => {
                if (item["$"]) {
                    result.push(item["$"]);
                }
            })
        }
        return result;
    };

    var getVSConfigDefault = (project: any, typeOfGrouping: string, nodeName: string, defaultCondition: string): string => {
        var result: string = "";
        if (project[typeOfGrouping]) {
            var items = toArray(project[typeOfGrouping]);
            _.map(items,(item) => {
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

    var getDefaultVisualStudioVersion = (project: any): string => {
        return getVSConfigDefault(project, "PropertyGroup", "VisualStudioVersion", "'$(VisualStudioVersion)'==''");
    };

    var getDefaultConfiguration = (project: any): string => {
        return getVSConfigDefault(project, "PropertyGroup", "Configuration", "'$(Configuration)'==''");
    };
    var getTypeScriptFilesToCompile = (project: any): string[]=> {
        var typeOfGrouping = "ItemGroup"
        var result: string[] = [];
        if (project[typeOfGrouping]) {
            var items = toArray(project[typeOfGrouping]);
            _.map(items,(item) => {
                if (item["TypeScriptCompile"]) {
                    _.map(toArray(item["TypeScriptCompile"]),(compileItem) => {
                        if (compileItem["$"] && compileItem["$"]["Include"]) {
                            result.push(compileItem["$"]["Include"]);
                        }
                    });
                }
            });
        }
        return result;
    };

    var getTypeScriptDefaultPropsFilePath = (project: any): string => {
        var typeOfGrouping = "Import"
        var result: string = "";
        if (project[typeOfGrouping]) {
            var items = toArray(project[typeOfGrouping]);
            _.map(items,(item) => {
                if (item["$"] && item["$"]["Project"]) {
                    var projectValue: string = item["$"]["Project"];
                    if (projectValue.indexOf("Microsoft.TypeScript.Default.props") > -1) {
                        result = projectValue;
                    }
                }
            });
        }
        return result;
    };
    
    function getFirstValueOrDefault<T>(item: any[], defaultValue: T): T {
        if (item && _.isArray(item) && item.length > 0 && !_.isNull(item[0]) && !_.isUndefined(item[0])) {
            if (typeof defaultValue === "boolean") {
                return <T><any>cboolean(item[0]);  //todo: is the requirement to cast here a bug?
            }
            return item[0];
        }
        return defaultValue;
    }
 

    export var getTypeScriptDefaultsFromPropsFile =
        (propsFileName: string): Promise<TypeScriptConfiguration> => {

            return new Promise((resolve, reject) => {
                xml2jsReadXMLFile(propsFileName).then((parsedPropertiesFile) => {
                    if (!parsedPropertiesFile || !parsedPropertiesFile.Project || !parsedPropertiesFile.Project.PropertyGroup) {
                        reject(new Error("No result from parsing the project."));
                    } else {
                        var pg = toArray(parsedPropertiesFile.Project.PropertyGroup)[0];
                        var result: TypeScriptConfiguration = <any>{};

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
                },(error) => { reject(error); });
            });
        };

    export var programFiles = (): string => {
        return process.env["ProgramFiles(x86)"] || process.env["ProgramFiles"] || "";
    };

}

export = csproj2ts;