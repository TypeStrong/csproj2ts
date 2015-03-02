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
    }
};
