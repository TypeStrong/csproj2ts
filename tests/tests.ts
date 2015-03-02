/// <reference path="../typings/nodeunit/nodeunit.d.ts" />

import nodeunit = require('nodeunit');

export var testGroup: nodeunit.ITestGroup = {
    setUp: function (callback: nodeunit.ICallbackFunction) {
	    callback();
	},
    tearDown: function (callback: nodeunit.ICallbackFunction) {
	    callback();
	},
    tests_run_at_all: function (test: nodeunit.Test) {
        test.expect(1);
        test.ok(true, "Expected tests to run at all.");
	    test.done();
	}
}