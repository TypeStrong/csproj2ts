import nodeunit = require('nodeunit');

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
	}
}