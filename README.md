﻿# csproj2ts

Queries a Visual Studio project file (.csproj, .vbproj, .njsproj, etc.) for TypeScript configuration information.  Will also find default config in a `Microsoft.TypeScript.Default.props` file, if referenced by the project.

Visual Studio TypeScript settings are documented on the TypeScript wiki [here](http://www.typescriptlang.org/docs/handbook/compiler-options-in-msbuild.html).

Tested with latest project configuration settings in TypeScript 2.7.

## Install

To install, run `npm install csproj2ts`.

This module only *collects* the information.  What you do with it after is up to you.

## Example Usage:
```javascript

    var csproj2ts = require('csproj2ts');

    var vsProjInfo = {
        ProjectFileName: "path/to/my/project.csproj", // the name and path to the project file
        ActiveConfiguration: "Release"                // the MSBuild config to query
    }

    csproj2ts.getTypeScriptSettings(vsProjInfo).then(function (settings) {
        console.log(settings.files);          // will output the array of files
        console.log(settings.RemoveComments); // will output true or false.
        console.log(settings.OutDir);         // will output the OutDir string or undefined.
        console.log(settings);                // will output all identified configuration.
    });

```

## Developing:

You must run `npm install` to fetch dependencies prior to developing or testing csproj2ts.

To build, run `grunt`.

To build and run tests with nodeunit, run `grunt test`.

To build, run tests, and launch the demo script, run `grunt demo`.  (You can also run `node demo.js` directly (assumes `csproj2ts.csproj` in current folder).)

## Publishing:

  * Ensure `grunt test` comes back clean.
  * Update the `package.json` with the new version number.
  * Merge work to `master` on GitHub.
  * Run `npm publish`.

### Quickstart for debugging with Node Inspector

Install [Node Inspector](https://github.com/node-inspector/node-inspector) via npm:

`npm install -g node-inspector`

Example command-line to debug a particular test ("test_run_at_all") on Windows:

`node-debug --debug-brk "./node_modules/grunt-contrib-nodeunit/node_modules/nodeunit/bin/nodeunit" "tests/tests.js" -t "tests_run_at_all"`

Set breakpoints in the Chrome dev tools, or use `debugger;` where needed.


## API:

The main function of csproj2ts, getTypeScriptSettings(), returns a promise.

In the then() result of the promise, the returned settings object has the following documented properties:

  * files: string[] - This is an array of the files that will be compiled.
  * VSProjectDetails - This object has the following properties which correspond to what was passed-in to csproj2ts (not what was found in the project file):
    * ProjectFileName: string
    * MSBuildExtensionsPath32: string
    * VisualStudioVersion: string
    * TypeScriptVersion: string
    * ActiveConfiguration: string
    * ActivePlatform: string
    * DefaultProjectConfiguration?: string;
    * DefaultProjectPlatform?: string;
    * DefaultVisualStudioVersion?: string;
    * TypeScriptDefaultPropsFilePath: string;
    * TypeScriptDefaultConfiguration: - this property has the settings (seen below) that correspond to the defaults on the referenced .props file.


The returned settings object also has the following properties that correspond to the TypeScript configuration settings found in the project file:

  * AdditionalFlags?: string;
  * AllowJS?: boolean;
  * AllowSyntheticDefaultImports?: boolean;
  * AllowUnusedLabels?: boolean;
  * AllowUnreachableCode?: boolean;
  * AlwaysStrict?: boolean;
  * Charset?: string;
  * CheckJs?: boolean;
  * CodePage?: string;
  * CompileBlocked?: boolean;
  * CompileOnSaveEnabled?: boolean;
  * DownlevelIteration?: boolean;
  * EmitBOM?: boolean;
  * EmitDecoratorMetadata?: boolean;
  * ExperimentalAsyncFunctions?: boolean;
  * ExperimentalDecorators?: boolean;
  * ForceConsistentCasingInFileNames?: boolean;
  * GeneratesDeclarations?: boolean;
  * ImportHelpers?: boolean;
  * InlineSourceMap?: boolean;
  * InlineSources?: boolean;
  * IsolatedModules?: boolean;
  * JSXEmit?: string;
  * JSXFactory?: string;
  * Lib?: string;
  * MapRoot?: string;
  * ModuleKind?: string;
  * ModuleResolution?: string;
  * NewLine?: string;
  * NoEmitOnError?: boolean;
  * NoEmitHelpers?: boolean;
  * NoFallthroughCasesInSwitch?: boolean;
  * NoImplicitAny?: boolean;
  * NoImplicitUseStrict?: boolean;
  * NoLib?: boolean;
  * NoResolve?: boolean;
  * NoStrictGenericChecks?: boolean;
  * OutFile?: string;
  * OutDir?: string;
  * PreserveConstEnums?: boolean;
  * PreserveSymlinks?: boolean;
  * PreferredUILang?: string;
  * ReactNamespace?: string;
  * RemoveComments?: boolean;
  * RootDir?: boolean;
  * SkipDefaultLibCheck?: boolean;
  * SourceMap?: boolean;
  * SourceRoot?: string;
  * SuppressImplicitAnyIndexErrors?: boolean;
  * SuppressExcessPropertyErrors?: boolean;
  * Target?: string;
