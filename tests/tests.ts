﻿import nodeunit = require('nodeunit');
import csproj2ts = require('../csproj2ts');

var programFiles = csproj2ts.programFiles();

export var testGroup: nodeunit.ITestGroup = {
    setUp: (callback) => {
        callback();
    },
    tearDown: (callback) => {
        callback();
    },
    tests_run_at_all: (test: nodeunit.Test) => {
        test.expect(1);
        test.ok(true, "Expected tests to run at all.");
        test.done();
    },
    non_existent_file_returns_null_and_error_message: (test: nodeunit.Test) => {
        test.expect(1);
        const vsProjInfo = {
            ProjectFileName: "tests/artifacts/this_does_not_exist.csproj"
        };
        csproj2ts.getTypeScriptSettings(vsProjInfo).then((settings) => {
            test.done();
        }).catch((error) => {
            test.equal(error.code, "ENOENT", "Expected file not found error.");
            test.done();
        });

    },
    find_default_settings: (test: nodeunit.Test) => {
        test.expect(6);
        const vsProjInfo = {
            ProjectFileName: "tests/artifacts/example1.csproj",
        };

        csproj2ts.getTypeScriptSettings(vsProjInfo).then((settings) => {
            test.ok(!!settings, "Expected settings to have a value.");
            test.equal(settings.VSProjectDetails.DefaultProjectConfiguration, "Debug", "Expected 'Debug' to be the default config.");
            test.equal(settings.VSProjectDetails.DefaultVisualStudioVersion, "12.0", "Expected '12.0' to be the default VS version.");
            test.equal(settings.VSProjectDetails.MSBuildExtensionsPath32, programFiles + "\\MSBuild\\", "Expected correct value to be automatically set for MSBuildExtensionsPath32.");
            test.equal(settings.ExperimentalDecorators, true,"Expected experimental decorators to be active.")
            test.equal(settings.EmitDecoratorMetadata, true,"Expected decorator metadata to be active.")
            test.done();
        }).catch((error) => {
            test.ok(false, "Should not be any errors.");
            test.done();
        });
    },
    find_default_settings_vs2015: (test: nodeunit.Test) => {
        test.expect(2);
        const vsProjInfo = {
            ProjectFileName: "tests/artifacts/vs2015project.csproj",
        };

        csproj2ts.getTypeScriptSettings(vsProjInfo).then((settings) => {
            test.equal(settings.VSProjectDetails.DefaultProjectConfiguration, "Debug", "Expected 'Debug' to be the default config.");
            test.equal(settings.VSProjectDetails.DefaultProjectPlatform, "AnyCPU", "Expected 'AnyCPU' to be the default platform.");
            test.done();
        }).catch((error) => {
            test.ok(false, "Should not be any errors.  got: " + error);
            test.done();
        });
    },
    use_TypeScript_fallback_configuration_if_referenced_props_file_not_found: (test: nodeunit.Test) => {
        test.expect(2);
        const vsProjInfo = {
            ProjectFileName: "tests/artifacts/props_does_not_exist.csproj",
            ActiveConfiguration: "Release",
            TypeScriptVersion: "1.3"
        };

        csproj2ts.getTypeScriptSettings(vsProjInfo).then((settings) => {
            test.equal(settings.NoEmitOnError, false, "expected TypeScript 1.3 default to emit on error");
            vsProjInfo.TypeScriptVersion = "1.4";

            return csproj2ts.getTypeScriptSettings(vsProjInfo).then((settings) => {
                test.equal(settings.NoEmitOnError, true, "expected TypeScript 1.4 default to not emit on error");
                test.done();
            });

        }).catch((error) => {
            test.ok(false, "Should not be any errors.");
            test.done();
        });

    },
    find_TypeScript_default_props_file: (test: nodeunit.Test) => {
        test.expect(1);
        const vsProjInfo = {
            ProjectFileName: "tests/artifacts/example1.csproj"
        };

        csproj2ts.getTypeScriptSettings(vsProjInfo).then((settings) => {
            test.equal(csproj2ts.normalizePath(settings.VSProjectDetails.TypeScriptDefaultPropsFilePath, settings),
                programFiles + "\\MSBuild\\\\Microsoft\\VisualStudio\\v12.0\\TypeScript\\Microsoft.TypeScript.Default.props",
                "Expected to see appropriate .props file name.");
            test.done();
        }).catch((error) => {
            test.ok(false, "Should not be any errors.");
            test.done();
        });

    },
    default_settings_work_with_TypeScript_1_5: (test: nodeunit.Test) => {
        test.expect(3);
        const vsProjInfo = {
            ProjectFileName: "tests/artifacts/example1.csproj",
            TypeScriptVersion: "1.5",
            ActiveConfiguration: "Release"
        };

        csproj2ts.getTypeScriptSettings(vsProjInfo).then((settings) => {
            test.strictEqual( settings.Target, "ES5" , "Expected ES5 default.");
            test.strictEqual(settings.ExperimentalDecorators, undefined,"Expected experimental decorators to be active.")
            test.strictEqual(settings.EmitDecoratorMetadata, undefined,"Expected decorator metadata to be active.")
            test.done();
        }).catch((error) => {
            test.ok(false, "Should not be any errors.");
            test.done();
        });

    },
    typescript_27_settings_work: (test: nodeunit.Test) => {
        test.expect(2);
        const vsProjInfo = {
            ProjectFileName: "tests/artifacts/example1.csproj",
            TypeScriptVersion: "2.7",
            ActiveConfiguration: "Debug"
        };
        csproj2ts.getTypeScriptSettings(vsProjInfo).then(settings => {
            test.strictEqual(settings.ESModuleInterop, true );
            test.strictEqual(settings.StrictPropertyInitialization, true)
            test.done();
        }).catch((error) => {
            test.ok(false, "Should not be any errors.");
            test.done();
        });

    },
    test_fixVersion: (test: nodeunit.Test) => {
        test.expect(5);
        test.equal(csproj2ts.fixVersion("1"),"1.0.0");
        test.equal(csproj2ts.fixVersion("1.2"),"1.2.0");
        test.equal(csproj2ts.fixVersion("1.5.3"),"1.5.3");
        test.equal(csproj2ts.fixVersion("1.5.1-alpha"),"1.5.1");
        test.equal(csproj2ts.fixVersion(""),csproj2ts.DEFAULT_TYPESCRIPT_VERSION);
        test.done();
    },
    identify_all_typeScript_files_properly: (test: nodeunit.Test) => {
        test.expect(2);
        const vsProjInfo = {
            ProjectFileName: "tests/artifacts/example1.csproj"
        };

        csproj2ts.getTypeScriptSettings(vsProjInfo).then((settings) => {
            test.equal(settings.files.length, 16, "Expected to see the correct number of TypeScript files.");
            test.ok(settings.files.indexOf("tasks/ts.ts") !== 0, "Expected to see tasks/ts.ts in the files list.");
            test.done();
        }).catch((error) => {
            test.ok(false, "Should not be any errors.");
            test.done();
        });
    } ,
    fetch_default_properties_properly: (test: nodeunit.Test) => {
        test.expect(18);

        const settings : csproj2ts.TypeScriptSettings = {
          VSProjectDetails: {
            TypeScriptDefaultPropsFilePath: "tests/artifacts/Microsoft.TypeScript.Default.props"
          }
        };

        csproj2ts.getTypeScriptDefaultsFromPropsFileOrDefaults(settings)
            .then((result) => {

            test.equal(result.AdditionalFlags, undefined);
            test.equal(result.Charset, undefined);
            test.equal(result.CodePage, undefined);
            test.equal(result.CompileOnSaveEnabled, true);
            test.equal(result.EmitBOM, undefined, "expected undefined EmitBOM");
            test.equal(result.GeneratesDeclarations, false, "expected false GeneratesDeclarations");
            test.equal(result.MapRoot, "", "expected blank MapRoot");
            test.equal(result.ModuleKind, "none", "expected 'none' as ModuleKind");
            test.equal(result.NoEmitOnError, true, "expected true for NoEmitOnError");
            test.equal(result.NoImplicitAny, false, "expected false for NoImplicitAny");
            test.equal(result.NoLib, undefined, "expected undefined for NoLib");
            test.equal(result.NoResolve, undefined, "expected undefined for NoResolve");
            test.equal(result.OutDir, "", "expected blank for OutDir");
            test.equal(result.OutFile, "", "expected blank for OutFile");
            test.equal(result.RemoveComments, false, "expected false for RemoveComments");
            test.equal(result.SourceMap, true, "expected true for Source Maps");
            test.equal(result.SourceRoot, "", "expected blank for the Source Root");
            test.equal(result.Target, "ES5", "expected ES5 as the target");

            test.done();
        }).catch((error) => {
            test.ok(false, "Should not be any errors.");
            test.done();
        });
    },
    find_TypeScript_properties_for_Release: (test: nodeunit.Test) => {
        test.expect(2);
        const vsProjInfo : csproj2ts.VSProjectParams = {
            ProjectFileName: "tests/artifacts/example1.csproj",
            ActiveConfiguration: "Release"
        };
        csproj2ts.getTypeScriptSettings(vsProjInfo).then((settings) => {
            test.equal(settings.RemoveComments, true, "expected remove comments = true for Release");
            test.equal(settings.SourceMap, false, "expected source map = false for Release");

            test.done();
        }).catch((error) => {
            test.ok(false, "Should not be any errors.");
            test.done();
        });
    },
    finds_common_properties_when_config_specified: (test: nodeunit.Test) => {
        test.expect(1);
        const vsProjInfo : csproj2ts.VSProjectParams = {
            ProjectFileName: "tests/artifacts/hasCommonPropertyGroup.csproj",
            ActiveConfiguration: "Release"
        };
        csproj2ts.getTypeScriptSettings(vsProjInfo).then((settings) => {
            test.equal(settings.SourceRoot, "this_is_the_source_root", "expected source root to be = this_is_the_source_root for Release");
            test.done();
        }).catch((error) => {
            test.ok(false, "Should not be any errors.");
            test.done();
        });
    },
    finds_common_properties_when_config_not_specified: (test: nodeunit.Test) => {
        test.expect(1);
        const vsProjInfo : csproj2ts.VSProjectParams = {
            ProjectFileName: "tests/artifacts/hasCommonPropertyGroup.csproj"
        };
        csproj2ts.getTypeScriptSettings(vsProjInfo).then((settings) => {
            test.equal(settings.SourceRoot, "this_is_the_source_root", "expected source root to be = this_is_the_source_root for unspecified config");
            test.done();
        }).catch((error) => {
            test.ok(false, "Should not be any errors.");
            test.done();
        });
    },
    vs2015_project_works_as_expected: (test: nodeunit.Test) => {
        test.expect(6);
        const vsProjInfo = {
            ProjectFileName: "tests/artifacts/vs2015project.csproj"
        };

        csproj2ts.getTypeScriptSettings(vsProjInfo).then((settings) => {
            test.equal(settings.OutDir, "C:/REDACTED/PATH/TO/PROJECT/FOLDER/jsOut");
            test.equal(settings.ModuleKind, "System");
            test.equal(settings.EmitDecoratorMetadata, true);
            test.equal(settings.ExperimentalDecorators, true);
            test.equal(settings.GeneratesDeclarations, true);
            test.equal(settings.ModuleResolution, "node");

            test.done();
        }).catch((error) => {
            test.ok(false, "Should not be any errors.  got:" + error);
            test.done();
        });
    },
}
