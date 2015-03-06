var csproj2ts = require('../csproj2ts');
var programFiles = csproj2ts.programFiles();
exports.testGroup = {
    setUp: function (callback) {
        callback();
    },
    tearDown: function (callback) {
        callback();
    },
    find_TypeScript_properties_for_Release: function (test) {
        test.expect(1);
        var vsProjInfo = {
            ProjectFileName: "tests/artifacts/example1.csproj",
            ActiveConfiguration: "Release"
        };
        csproj2ts.getTypeScriptSettings(vsProjInfo).then(function (settings) {
            test.equal(settings.RemoveComments, true, "expected remove comments = true for Release");
            test.done();
        }).catch(function (error) {
            test.ok(false, "Should not be any errors.");
            test.done();
        });
    }
};
