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
    try_to_run_something: function (test) {
        test.expect(1);
        var settings = csproj2ts.getTypeScriptSettings("artifacts/example1.csproj");
        test.ok(!!settings, "Expected settings to have a value.");
        test.done();
    }
};
