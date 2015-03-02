import fs = require('fs');
import xml2js = require('xml2js');

module csproj2ts {
    interface TypeScriptSettings {

    }

    export var getTypeScriptSettings = (projectFile: string) : TypeScriptSettings => {
        xml2js.parseString("<root>Hello xml2js!</root>",(err: any, result: any) => {
            console.log(result);
        });
        return true;
    }
}

export = csproj2ts;