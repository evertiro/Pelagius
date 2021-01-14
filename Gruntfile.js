/*global module, require*/
module.exports = function (grunt) {
  'use strict';

  // Load multiple grunt tasks using globbing patterns
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // Run JSHint
    jshint: {
      options: {
        jshintrc: '.jshintrc',
      },
      all: ['Gruntfile.js', 'pelagius.js'],
    },

    // Run MarkdownLint
    markdownlint: {
      full: {
        options: {
          config: {
            default: true,
          },
        },
        src: [
          '**/*.md',
          '!node_modules/**/*.md',
          '!vendor/**/*.md',
          '!**/CHANGELOG.md',
        ],
      },
      changelog: {
        options: {
          config: {
            default: true,
            MD022: false,
            MD024: false,
            MD032: false,
          },
        },
        src: [
          '**/CHANGELOG.md',
          '!node_modules/**/*.md',
          '!vendor/**/*.md'
        ],
      },
    },
  });

  // Build task(s).
  grunt.registerTask('lint_jshint', ['jshint']);
  grunt.registerTask('lint_markdownlint', ['markdownlint']);

  grunt.registerTask('lint', [
    'lint_jshint',
    'lint_markdownlint',
  ]);
};
