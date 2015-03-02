var csproj2ts = require('../csproj2ts');
exports.testGroup = {
    setUp: function (callback) {
        callback();
    },
    tearDown: function (callback) {
        callback();
    },
    tests_run_at_all: function (test) {
        test.expect(1);
        test.ok(true, "Expected tests to run at all.");
        test.done();
    },
    non_existent_file_returns_null_and_error_message: function (test) {
        test.expect(2);
        var vsProjInfo = {
            ProjectFileName: "tests/artifacts/this_does_not_exist.csproj"
        };
        csproj2ts.getTypeScriptSettings(vsProjInfo, function (settings, error) {
            test.equal(settings, null, "Expected settings to be null.");
            test.equal(error.errno, 34, "Expected file not found error.");
            test.done();
        });
    },
    find_default_settings: function (test) {
        test.expect(4);
        var vsProjInfo = {
            ProjectFileName: "tests/artifacts/example1.csproj",
        };
        csproj2ts.getTypeScriptSettings(vsProjInfo, function (settings, error) {
            test.ok(!!settings, "Expected settings to have a value.");
            test.equal(settings.VSProjectDetails.DefaultConfiguration, "Debug", "Expected 'Debug' to be the default config.");
            test.equal(settings.VSProjectDetails.DefaultVisualStudioVersion, "12.0", "Expected '12.0' to be the default VS version.");
            var programFiles = csproj2ts.programFiles();
            test.equal(settings.VSProjectDetails.MSBuildExtensionsPath32, programFiles + "\\MSBuild\\", "Expected correct value to be automatically set for MSBuildExtensionsPath32.");
            test.done();
        });
    },
    find_import_items: function (test) {
        test.expect(1);
        var vsProjInfo = {
            ProjectFileName: "tests/artifacts/example1.csproj"
        };
        csproj2ts.getTypeScriptSettings(vsProjInfo, function (settings, error) {
            test.equal(settings.VSProjectDetails.imports.length, 4, "Expected 4 imports items.");
            test.done();
        });
    }
};
