module.exports = function (grunt) {
    grunt.initConfig({
        ts: {
            default: {
                src: ["**/*.ts", "!node_modules/**/*.ts"]
            }
        },
        nodeunit: {
            test: ['tests/tests.js']
        }
    });
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-contrib-nodeunit");
    grunt.registerTask("default", ["ts"]);
    grunt.registerTask("test", ["ts","test"]);
};