import * as fs from 'fs';
import * as xml2js from 'xml2js';
import * as _ from 'lodash';
import * as path from 'path';
import {Promise} from 'es6-promise';
import * as semver from 'semver';

module csproj2ts {

    export const DEFAULT_TYPESCRIPT_VERSION = "1.6.2";

    export interface TypeScriptSettings extends TypeScriptConfiguration {
        VSProjectDetails?: VSProjectDetails;
        files?: string[];
    }

    interface VSImportElement {
        Project: string;
        Condition?: string;
    }

    export interface VSProjectParams {
        ProjectFileName?: string;
        MSBuildExtensionsPath32?: string;
        VisualStudioVersion?: string;
        TypeScriptVersion?: string;
        ActiveConfiguration?: string;
    }

    export interface VSProjectDetails extends VSProjectParams {
        DefaultProjectConfiguration?: string;
        DefaultVisualStudioVersion?: string;
        TypeScriptDefaultPropsFilePath?: string;
        TypeScriptDefaultConfiguration?: TypeScriptConfiguration;
    }

    /** Configuration tags used by Visual Studio TypeScript Project Properties/MSBuild.
     * https://github.com/Microsoft/TypeScript/issues/1712#issuecomment-70574319
     * https://github.com/Microsoft/TypeScript/wiki/Setting-Compiler-Options-in-MSBuild-projects
     * */
    export interface TypeScriptConfiguration {
        AdditionalFlags?: string;
        Charset?: string;
        CodePage?: string;
        CompileBlocked?: boolean;
        CompileOnSaveEnabled?: boolean;
        EmitBOM?: boolean;
        EmitDecoratorMetadata?: boolean;
        ExperimentalAsyncFunctions?: boolean;
        ExperimentalDecorators?: boolean;
        GeneratesDeclarations?: boolean;
        InlineSourceMap?: boolean;
        InlineSources?: boolean;
        IsolatedModules?: boolean;
        JSXEmit?: string;
        MapRoot?: string;
        ModuleKind?: string;
        ModuleResolution?: string;
        NewLine?: string;
        NoEmitOnError?: boolean;
        NoEmitHelpers?: boolean;
        NoImplicitAny?: boolean;
        NoLib?: boolean;
        NoResolve?: boolean;
        OutFile?: string;
        OutDir?: string;
        PreserveConstEnums?: boolean;
        PreferredUILang?: string; // implements --locale
        RemoveComments?: boolean;
        RootDir?: boolean;
        SourceMap?: boolean;
        SourceRoot?: string;
        SuppressImplicitAnyIndexErrors?: boolean;
        SuppressExcessPropertyErrors?: boolean;
        Target?: string;
    }

    // Thanks: "timo" http://stackoverflow.com/questions/263965/how-can-i-convert-a-string-to-boolean-in-javascript/28152765#28152765
    var cboolean = (value: string | boolean) => {
        return (typeof value === 'string') ? (value.toLowerCase() === 'true') : value;
    }

    var getSettingOrDefault = <T>(item: any[], abbreviatedSettingName: string, defaultValue: T) => {
      if (item["TypeScript" + abbreviatedSettingName]) {
          return item["TypeScript" + abbreviatedSettingName][0];
      }
      return defaultValue;
    };

    export const fixVersion = (version: string) => {
      let testVersion = version + "";
      if (!testVersion) {
        return DEFAULT_TYPESCRIPT_VERSION;
      }
      if (testVersion.indexOf("-") > -1) {
        let versionInfo = testVersion.split("-");
        testVersion = versionInfo[0];
      }
      if (semver.valid(testVersion)) {
        return testVersion;
      }
      testVersion += ".0";
      if (semver.valid(testVersion)) {
        return testVersion;
      }
      testVersion += ".0";
      if (semver.valid(testVersion)) {
        return testVersion;
      }
      return DEFAULT_TYPESCRIPT_VERSION;
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
                        result = getSettingOrDefault(item, abbreviatedSettingName, result);
                    }
                } else {
                  result = getSettingOrDefault(item, abbreviatedSettingName, result);
                }
            });
        }
        return result;
    };

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
                            ActiveConfiguration: projectInfo.ActiveConfiguration,
                            MSBuildExtensionsPath32: projectInfo.MSBuildExtensionsPath32,
                            ProjectFileName: projectInfo.ProjectFileName,
                            VisualStudioVersion: projectInfo.VisualStudioVersion,
                            TypeScriptVersion: fixVersion(projectInfo.TypeScriptVersion)
                        },
                        files: getTypeScriptFilesToCompile(project),
                        AdditionalFlags: getTSSetting(project, "AdditionalFlags", projectActiveConfig, undefined),
                        Charset: getTSSetting(project, "Charset", projectActiveConfig, undefined),
                        CodePage: getTSSetting(project, "CodePage", projectActiveConfig, undefined),
                        CompileBlocked: getTSSetting(project, "CompileBlocked", projectActiveConfig, false),
                        CompileOnSaveEnabled: cboolean(getTSSetting(project, "CompileOnSaveEnabled", projectActiveConfig, undefined)),
                        EmitBOM: cboolean(getTSSetting(project, "EmitBOM", projectActiveConfig, undefined)),
                        EmitDecoratorMetadata: cboolean(getTSSetting(project, "EmitDecoratorMetadata", projectActiveConfig, undefined)),
                        ExperimentalAsyncFunctions: cboolean(getTSSetting(project, "ExperimentalAsyncFunctions", projectActiveConfig, undefined)),
                        ExperimentalDecorators: cboolean(getTSSetting(project, "ExperimentalDecorators", projectActiveConfig, undefined)),
                        GeneratesDeclarations: cboolean(getTSSetting(project, "GeneratesDeclarations", projectActiveConfig, undefined)),
                        InlineSourceMap: cboolean(getTSSetting(project, "InlineSourceMap", projectActiveConfig, undefined)),
                        InlineSources: cboolean(getTSSetting(project, "InlineSources", projectActiveConfig, undefined)),
                        IsolatedModules: cboolean(getTSSetting(project, "IsolatedModules", projectActiveConfig, undefined)),
                        JSXEmit: getTSSetting(project, "JSXEmit", projectActiveConfig, undefined),
                        MapRoot: getTSSetting(project, "MapRoot", projectActiveConfig, undefined),
                        ModuleKind: getTSSetting(project, "ModuleKind", projectActiveConfig, undefined),
                        ModuleResolution: getTSSetting(project, "ModuleResolution", projectActiveConfig, undefined),
                        NewLine: getTSSetting(project, "NewLine", projectActiveConfig, undefined),
                        NoEmitOnError: cboolean(getTSSetting(project, "NoEmitOnError", projectActiveConfig, undefined)),
                        NoEmitHelpers: cboolean(getTSSetting(project, "NoEmitHelpers", projectActiveConfig, undefined)),
                        NoImplicitAny: cboolean(getTSSetting(project, "NoImplicitAny", projectActiveConfig, undefined)),
                        NoLib: cboolean(getTSSetting(project, "NoLib", projectActiveConfig, undefined)),
                        NoResolve: cboolean(getTSSetting(project, "NoResolve", projectActiveConfig, undefined)),
                        OutDir: getTSSetting(project, "OutDir", projectActiveConfig, undefined),
                        OutFile: getTSSetting(project, "OutFile", projectActiveConfig, undefined),
                        PreferredUILang: getTSSetting(project, "PreferredUILang", projectActiveConfig, undefined),
                        PreserveConstEnums: cboolean(getTSSetting(project, "PreserveConstEnums", projectActiveConfig, undefined)),
                        RemoveComments: cboolean(getTSSetting(project, "RemoveComments", projectActiveConfig, undefined)),
                        RootDir: getTSSetting(project, "RootDir", projectActiveConfig, undefined),
                        SourceMap: cboolean(getTSSetting(project, "SourceMap", projectActiveConfig, undefined)),
                        SourceRoot: getTSSetting(project, "SourceRoot", projectActiveConfig, undefined),
                        SuppressImplicitAnyIndexErrors: cboolean(getTSSetting(project, "SuppressImplicitAnyIndexErrors", projectActiveConfig, undefined)),
                        SuppressExcessPropertyErrors: cboolean(getTSSetting(project, "SuppressExcessPropertyErrors", projectActiveConfig, undefined)),
                        Target: getTSSetting(project, "Target", projectActiveConfig, undefined)
                    };

                    getTypeScriptDefaultsFromPropsFileOrDefaults(result)
                        .then((typeScriptDefaults) => {
                          result.VSProjectDetails.TypeScriptDefaultConfiguration = typeScriptDefaults;
                          finishUp(typeScriptDefaults);
                    }).catch((error) => {
                        var fallbackDefaults = VSTypeScriptDefaults(result.VSProjectDetails.TypeScriptVersion);
                        result.VSProjectDetails.TypeScriptDefaultConfiguration = fallbackDefaults;
                        finishUp(fallbackDefaults);
                    });

                    var finishUp = (defaults :TypeScriptConfiguration ) => {
                      _.forOwn(result,(value, key) => {
                          if (_.isNull(value) || _.isUndefined(value)) {
                              result[key] = defaults[key];
                          }
                      });
                      resolve(result);
                    };

                }
            },(error : NodeJS.ErrnoException) => {
                //Error parsing project file.
                reject(error);
            });
        });
    }

    export var normalizePath = (path: string, settings: TypeScriptSettings): string => {
        if (path.indexOf("$(VisualStudioVersion)") > -1) {
            path = path.replace(/\$\(VisualStudioVersion\)/g,
                settings.VSProjectDetails.VisualStudioVersion || settings.VSProjectDetails.DefaultVisualStudioVersion
                );
        }

        if (path.indexOf("$(MSBuildExtensionsPath32)") > -1) {
            path = path.replace(/\$\(MSBuildExtensionsPath32\)/g,
                settings.VSProjectDetails.MSBuildExtensionsPath32
                );
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
            });
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

    var highestVisualStudioVersionToTestFor = function() {
      // hack: please pretend you didn't see this.
      var currentYear = new Date().getFullYear();
      return currentYear - 1995;
    };

    const minimumVisualStudioVersion = 10;

    var findPropsFileName = (settings: TypeScriptSettings): Promise<string> => {
      return new Promise((resolve, reject) => {

        var propsFileName = normalizePath(settings.VSProjectDetails.TypeScriptDefaultPropsFilePath, settings);

        if (fs.existsSync(propsFileName)){
          resolve(propsFileName);
          return;
        }

        var alternateSettings = _.cloneDeep(settings);

        for (var i = highestVisualStudioVersionToTestFor(); i >= minimumVisualStudioVersion; i-=1) {

          alternateSettings.VSProjectDetails.VisualStudioVersion = i.toString() + ".0";
          propsFileName = normalizePath(settings.VSProjectDetails.TypeScriptDefaultPropsFilePath, alternateSettings);
          if (fs.existsSync(propsFileName)){
            resolve(propsFileName);
            return;
          }
        }

        reject(new Error("Could not find a valid props file."));

      });
    }

    export var getTypeScriptDefaultsFromPropsFileOrDefaults =
        (settings: TypeScriptSettings): Promise<TypeScriptConfiguration> => {
            return new Promise((resolve, reject) => {
              findPropsFileName(settings).then((propsFileName) => {
                xml2jsReadXMLFile(propsFileName).then((parsedPropertiesFile) => {
                    if (!parsedPropertiesFile || !parsedPropertiesFile.Project || !parsedPropertiesFile.Project.PropertyGroup) {
                        reject(new Error("No result from parsing the project."));
                    } else {
                        var pg = toArray(parsedPropertiesFile.Project.PropertyGroup)[0];
                        var result: TypeScriptConfiguration = {};

                        var def = VSTypeScriptDefaults(settings.VSProjectDetails.TypeScriptVersion);


                        result.Target = getFirstValueOrDefault(pg.TypeScriptTarget, def.Target);
                        result.CompileOnSaveEnabled = getFirstValueOrDefault(pg.TypeScriptCompileOnSaveEnabled, def.CompileOnSaveEnabled);
                        result.NoImplicitAny = getFirstValueOrDefault(pg.TypeScriptNoImplicitAny, def.NoImplicitAny);
                        result.ModuleKind = getFirstValueOrDefault(pg.TypeScriptModuleKind, def.ModuleKind);
                        result.RemoveComments = getFirstValueOrDefault(pg.TypeScriptRemoveComments, def.RemoveComments);
                        result.OutFile = getFirstValueOrDefault(pg.TypeScriptOutFile, def.OutFile);
                        result.OutDir = getFirstValueOrDefault(pg.TypeScriptOutDir, def.OutDir);
                        result.GeneratesDeclarations = getFirstValueOrDefault(pg.TypeScriptGeneratesDeclarations, def.GeneratesDeclarations);
                        result.SourceMap = getFirstValueOrDefault(pg.TypeScriptSourceMap, def.SourceMap);
                        result.MapRoot = getFirstValueOrDefault(pg.TypeScript, def.MapRoot);
                        result.SourceRoot = getFirstValueOrDefault(pg.TypeScriptSourceRoot, def.SourceRoot);
                        result.NoEmitOnError = getFirstValueOrDefault(pg.TypeScript, def.NoEmitOnError);

                        resolve(result);
                      }
                    },(error) => { /* failed to parse the project */ reject(error); });
                },(error) => {
                  /* failed to parse the props file name */
                  reject(error);
                });
        });
    };

    var VSTypeScriptDefaults = (version?: string) => {

      if (!version) {
        version = DEFAULT_TYPESCRIPT_VERSION;
      }

      const target = semver.lt(version,"1.5.0") ? "ES3" : "ES5";
      const noEmitOnError = semver.gte(version,"1.4.0");

      var dev: TypeScriptConfiguration = {
        Target : target,
        CompileOnSaveEnabled : false,
        NoImplicitAny : false,
        ModuleKind : "",
        RemoveComments : false,
        OutFile : "",
        OutDir : "",
        GeneratesDeclarations : false,
        SourceMap : false,
        MapRoot : "",
        SourceRoot : "",
        NoEmitOnError : noEmitOnError
      };

      return dev;

    }

    export var programFiles = (): string => {
        return process.env["ProgramFiles(x86)"] || process.env["ProgramFiles"] || "";
    };

}

export = csproj2ts;
