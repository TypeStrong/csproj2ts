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
        csproj2ts.getTypeScriptSettings("tests/artifacts/this_does_not_exist.csproj", function (settings, error) {
            test.equal(settings, null, "Expected settings to be null.");
            test.equal(error.errno, 34, "Expected file not found error.");
            test.done();
        });
    }
};
