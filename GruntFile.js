module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        // Package
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            options: {
                banner: '<!DOCTYPE html>\n<%= grunt.option("gitRevision") %>\n',
                process: function(src, filepath) {
                    var files = grunt.file.expand('src/*.js'),
                        anchor = 'init();\n</script>',
                        css = grunt.file.read('src/default.css');
                    files.forEach(function(filename) {
                        var file = grunt.file.read(filename);
                        file = file.replace('"use strict";\n', '');
                        src = src.replace(anchor, file + anchor);
                        src = src.replace('<script src="' +
                                          filename.replace('src/', '') +
                                          '"></script>\n', '');
                    }, grunt);
                    src = src.replace('<link rel="stylesheet" href="default.css">',
                                      '<style>\n' + css + '</style>');
                    return src;
                },
            },
            dist: {
                src: ['src/index.html'],
                dest: 'index.html'
            }
        },
        "git-describe": {
            concat: {
                options: {
                    template: '<!-- {%=object%}{%=dirty%} -->'
                }
            }
        }
    });

    // load npm plugins
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-git-describe');

    // default tasks
    grunt.registerTask('default', ['saveRevision', 'concat']);
    grunt.registerTask('saveRevision', function() {
        grunt.event.once('git-describe', function (rev) {
            grunt.option('gitRevision', rev);
        });
        grunt.task.run('git-describe');
    });
};
