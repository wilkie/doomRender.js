/*global module:false*/
module.exports = function(grunt) {

  // Helper methods
  function wrapModules(head, tail) {
    return head.concat(MODULE_LIST).concat(tail);
  }

  // Add modules:
  var MODULE_LIST = grunt.file.expand(['src/**/*.js',
                         '!src/doomRender.intro.js',
                         '!src/doomRender.const.js',
                         '!src/doomRender.core.js',
                         '!src/doomRender.outro.js']);

  var DIST_HEAD_LIST = [
      'src/doomRender.intro.js',
      'src/doomRender.const.js',
      'src/doomRender.core.js'
    ];

  // This is the same as DIST_HEAD_LIST, just without *.const.js (which is just
  // there UglifyJS conditional compilation).
  var DEV_HEAD_LIST = [
      'src/doomRender.intro.js',
      'src/doomRender.core.js'
    ];

  var TAIL_LIST = [
      'src/doomRender.init.js',
      'src/doomRender.outro.js'
    ];

  // Gets inserted at the top of the generated files in dist/.
  var BANNER = [
      '/*! <%= pkg.name %> - v<%= pkg.version %> - ',
      '<%= grunt.template.today("yyyy-mm-dd") %> - <%= pkg.author %> */\n'
    ].join('');

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      dist: {
        options: {
          banner: BANNER
        },
        src: wrapModules(DIST_HEAD_LIST, TAIL_LIST),
        dest: 'dist/doomRender.js'
      },
      dev: {
        options: {
          banner: BANNER
        },
        src: wrapModules(DEV_HEAD_LIST, TAIL_LIST),
        dest: 'dist/doomRender.js'
      }
    },
    uglify: {
      dist: {
        files: {'dist/doomRender.min.js': ['dist/doomRender.js']}
      },
      options: {
        banner: BANNER
      }
    },
    jsdoc: {
      basic: {
        src: grunt.file.expand(['src/**/*.js', '!src/doomRender.intro.js', '!src/doomRender.outro.js']),
      }
    },
    jasmine: {
      src: grunt.file.expand(['vendor/jquery.min.js',
                              'vendor/d3.min.js',
                              'test/jasmine-jquery/jasmine-jquery.js',
                              'test/mockjax/jquery.mockjax.js',
                              'src/**/*.js', '!src/doomRender.intro.js', '!src/doomRender.outro.js']),
      options: {
        specs: ['test/*Spec.js']
      }
    },
    jshint: {
      all_files: [
        'Gruntfile.js',
        'vendor/jQuery.min.js',
        'src/**/doomRender.!(intro|outro|const)*.js',
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    }
  });

  grunt.registerTask('default', [
      'jshint',
      'jasmine',
      'jsdoc',
      'build',
    ]);
  grunt.registerTask('build', [
      'concat:dist',
      'uglify:dist',
      'concat:dev'
    ]);
};

