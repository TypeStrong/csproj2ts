module.exports = function (grunt) {
    grunt.initConfig({
        ts: {
            default: {
                src: ["**/*.ts", "!node_modules/**/*.ts"],
                options: {
                    target: 'es5',
                    module: 'commonjs',
                    sourceMap: false
                }
            }
        },
        nodeunit: {
            all: ['tests/*tests.js']
        }
    });
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks("grunt-contrib-nodeunit");
    grunt.registerTask("default", ["ts"]);
    grunt.registerTask("test", ["ts","nodeunit"]);
};