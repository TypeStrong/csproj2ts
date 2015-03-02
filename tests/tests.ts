import nodeunit = require('nodeunit');
import csproj2ts = require('../csproj2ts');

export var testGroup: nodeunit.ITestGroup = {
    setUp: function (callback) {
	    callback();
	},
    tearDown: function (callback) {
	    callback();
	},
    tests_run_at_all: function (test: nodeunit.Test) {
        test.expect(1);
        test.ok(true, "Expected tests to run at all.");
        test.done();
    },
    try_to_run_something: function (test: nodeunit.Test) {
        test.expect(1);
        var settings = csproj2ts.getTypeScriptSettings("artifacts/example1.csproj");
        test.ok(!!settings, "Expected settings to have a value.");
        test.done();
    }
}