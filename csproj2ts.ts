import fs = require('fs');
import xml2js = require('xml2js');
import _ = require("lodash");
import path = require("path");

module csproj2ts {
    interface TypeScriptSettings {
        VSProjectDetails: VSProjectDetails
    }

    interface VSImportElement {
        Project: string;
        Condition?: string;
    }

    export interface VSProjectInfo {
        ProjectFileName: string;
        MSBuildExtensionsPath32?: string;
        VisualStudioVersion?: string;
        ActiveConfiguration?: string;
        
    }

    export interface VSProjectDetails extends VSProjectInfo {
        DefaultConfiguration?: string;
        DefaultVisualStudioVersion?: string;
        imports: VSImportElement[];
    }

    export var getTypeScriptSettings = (projectInfo: VSProjectInfo, callback: (settings: TypeScriptSettings, error: NodeJS.ErrnoException) => void): void => {

        if (!projectInfo.MSBuildExtensionsPath32) {
            projectInfo.MSBuildExtensionsPath32 = path.join(programFiles(), "/MSBuild/");
        }

        var parser = new xml2js.Parser();
        parser.addListener('end', function (parsedVSProject) {

            if (!parsedVSProject || !parsedVSProject.Project) {
                callback(null, { name: "", message: "No result from parsing the project." });
            } else {
                var project = parsedVSProject.Project;
                var result: TypeScriptSettings = {
                    VSProjectDetails: {
                        DefaultConfiguration: getDefaultConfiguration(project),
                        DefaultVisualStudioVersion: getDefaultVisualStudioVersion(project),
                        imports: getImports(project),
                        ActiveConfiguration: projectInfo.ActiveConfiguration,
                        MSBuildExtensionsPath32: projectInfo.MSBuildExtensionsPath32,
                        ProjectFileName : projectInfo.ProjectFileName,
                        VisualStudioVersion : projectInfo.VisualStudioVersion
                    }
                };

                callback(result, null);
            }
        });

        fs.readFile(projectInfo.ProjectFileName, function (err, data) {
            if (err && err.errno !== 0) {
                callback(null, err);
            } else {
                //todo: try/catch here
                parser.parseString(data);
            }
        });

    }

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
    }

    var getVSConfigDefault = (project: any, typeOfGrouping: string, nodeName: string, defaultCondition: string): string => {
        var result: string = "";
        if (project[typeOfGrouping]) {
            var items = toArray(project[typeOfGrouping]);
            _.map(items,(item) => {
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
    }

    var getDefaultVisualStudioVersion = (project: any): string => {
        return getVSConfigDefault(project, "PropertyGroup", "VisualStudioVersion", "'$(VisualStudioVersion)'==''");
    }
    var getDefaultConfiguration = (project: any): string => {
        return getVSConfigDefault(project, "PropertyGroup", "Configuration", "'$(Configuration)'==''");
    }

    export var programFiles = () : string => {
        return process.env["ProgramFiles(x86)"] || process.env["ProgramFiles"] || "";
    }

}

export = csproj2ts;