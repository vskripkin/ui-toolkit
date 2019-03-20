'use strict';

var gulp        = require('gulp'),
	watch       = require('gulp-watch'),
	prefixer    = require('gulp-autoprefixer'),
	uglify      = require('gulp-uglify'),
	fileinclude = require('gulp-file-include'),
	less        = require('gulp-less'),
	sourcemaps  = require('gulp-sourcemaps'),
	reference   = require('gulp-reference'),
	cssnano     = require('gulp-cssnano'),
	rename      = require('gulp-rename'),
	rimraf      = require('rimraf'),

	path = {
		html: 'index.html',

		src: {
			html: ['docs/docs.html'],
			js:   ['docs/js/docs.js'],
			css:  ['docs/less/docs.less']
		},
		watch: {
			html: ['docs/docs.html', 'docs/components/**/*.html'],
			js:   ['docs/js/**/*.js'],
			css:  ['docs/less/*.less', 'docs/components/**/*.less']
		},
		dist: {
			html: 'docs/',
			js:   'docs/assets/',
			css:  'docs/assets/'
		},
		clean: './docs/assets/'
	},

	logError = function(error)
	{
		console.log(error.toString());
		this.emit('end');
	};


gulp.task('clean', function (_cb)
{
	rimraf(path.clean, _cb);
});


gulp.task('html:build', function ()
{
	return gulp.src(path.src.html)
		.pipe(fileinclude({
			prefix: '//@'
		}))
		.pipe(rename(path.html))
		.pipe(gulp.dest(path.dist.html));
});
gulp.task('js:build', function ()
{
	return gulp.src(path.src.js)
		.pipe(reference())
		.pipe(uglify())
		.pipe(gulp.dest(path.dist.js));
});
gulp.task('css:build', function ()
{
	return gulp.src(path.src.css)
		.pipe(reference())
		.pipe(less())
		.pipe(prefixer())
		.pipe(cssnano())
		.pipe(gulp.dest(path.dist.css));
});


gulp.task('js:watch', function ()
{
	return gulp.src(path.src.js)
		.pipe(sourcemaps.init())
		.pipe(reference())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(path.dist.js));
});
gulp.task('css:watch', function ()
{
	return gulp.src(path.src.css)
		.pipe(reference())
		.pipe(less())
		.on('error', logError)
		.pipe(prefixer())
		.pipe(cssnano())
		.pipe(gulp.dest(path.dist.css));
});


gulp.task('build', [
	'html:build',
	'js:build',
	'css:build'
]);

gulp.task('default', ['clean'], function ()
{
	return gulp.start('build');
});


gulp.task('watch', function ()
{
	watch(path.watch.html, function (event, cb)
	{
		gulp.start('html:build');
	});
	watch(path.watch.js, function (event, cb)
	{
		gulp.start('js:watch');
	});
	watch(path.watch.css, function (event, cb)
	{
		gulp.start('css:watch');
	});
});
