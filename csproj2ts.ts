import fs = require('fs');
import xml2js = require('xml2js');
import _ = require("lodash");

module csproj2ts {
    interface TypeScriptSettings {
        imports: VSImportElement[];
        defaultConfiguration: string;
    }

    interface VSImportElement {
        Project: string;
        Condition?: string;
    }

    export interface VSProjectInfo {
        ProjectFileName: string;
        MSBuildExtensionsPath32?: string;
        VisualStudioVersion?: string;
        Configuration?: string;
    }

    export var getTypeScriptSettings = (projectInfo: VSProjectInfo, callback: (settings: TypeScriptSettings, error: NodeJS.ErrnoException) => void): void => {

        var parser = new xml2js.Parser();
        parser.addListener('end', function (parsedVSProject) {

            if (!parsedVSProject || !parsedVSProject.Project) {
                callback(null, { name: "", message: "No result from parsing the project." });
            } else {
                var project = parsedVSProject.Project;
                var result: TypeScriptSettings = {
                    defaultConfiguration: getDefaultConfiguration(project),
                    imports: getImports(project)
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

    var getDefaultConfiguration = (project: any): string => {
        var result: string = "";
        if (project.PropertyGroup) {
            var propertyGroupItems = toArray(project.PropertyGroup);
            _.map(propertyGroupItems,(item) => {
                //if (item["$"]) {
                //    result.push(item["$"]);
                //}
                if (item.Configuration && _.isArray(item.Configuration) &&
                      item.Configuration.length > 0) {
                    var subitem = item.Configuration[0]["$"];
                    if (subitem.Condition) {
                        var condition = subitem.Condition.replace(/ /g, '');

                        if (condition == "'$(Configuration)'==''") {
                            result = item.Configuration[0]["_"] + "";
                        }
                    }
                }
            })
        }
        return result;
    }


}

export = csproj2ts;