'use strict';

var gulp = require('gulp'),
	watch = require('gulp-watch'),
	prefixer = require('gulp-autoprefixer'),
	uglify = require('gulp-uglify'),
	fileinclude = require('gulp-file-include'),
	less = require('gulp-less'),
	sourcemaps = require('gulp-sourcemaps'),
	reference = require('gulp-reference'),
	cssnano = require('gulp-cssnano'),
	rimraf = require('rimraf'),

	path = {
		dist: {
			base: 'dist/',
			html: 'dist/',
			js: 'dist/js/',
			style: 'dist/css/',
			img: 'dist/images/',
			fonts: 'dist/fonts/',
			vendor: 'dist/vendor/'
		},
		src: {
			html: ['src/*.html'],
			js: ['src/js/ui.js'],
			style: ['src/style/ui.less', 'src/style/test.less'],
			img: ['src/images/**/*.*'],
			fonts: ['src/fonts/**/*.*'],
			vendor: ['src/vendor/**/*.*']
		},
		watch: {
			html: ['src/index.html'],
			js: ['src/js/**/*.js'],
			style: ['src/style/**/*.less', 'src/style/**/*.css'],
			img: ['src/images/**/*.*'],
			fonts: ['src/fonts/**/*.*']
		},
		clean: './dist'
	},

	logError = function(error)
	{
		console.log(error.toString());
		this.emit('end');
	};


gulp.task('html:build', function ()
{
	gulp.src(path.src.html)
		.pipe(fileinclude({
			prefix: '//@'
		}))
		.pipe(gulp.dest(path.dist.html));
});

gulp.task('js:build', function ()
{
	gulp.src(path.src.js)
		.pipe(reference())
		.pipe(uglify())
		.pipe(gulp.dest(path.dist.js));
});
gulp.task('js:watch', function ()
{
	gulp.src(path.src.js)
		.pipe(sourcemaps.init())
		.pipe(reference())
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(path.dist.js));
});

gulp.task('style:build', function ()
{
	gulp.src(path.src.style)
		.pipe(reference())
		.pipe(less())
		.pipe(prefixer())
		.pipe(cssnano())
		.pipe(gulp.dest(path.dist.style));
});
gulp.task('style:watch', function ()
{
	gulp.src(path.src.style)
		.pipe(sourcemaps.init())
		.pipe(reference())
		.pipe(less())
		.on('error', logError)
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(path.dist.style));
});

gulp.task('image:build', function ()
{
	gulp.src(path.src.img)
		.pipe(gulp.dest(path.dist.img));
});

gulp.task('fonts:build', function()
{
	gulp.src(path.src.fonts)
		.pipe(gulp.dest(path.dist.fonts));
});

gulp.task('vendor:build', function()
{
	gulp.src(path.src.vendor)
		.pipe(gulp.dest(path.dist.vendor));
});


gulp.task('build', [
	'html:build',
	'js:build',
	'style:build',
	'image:build',
	'fonts:build',
	'vendor:build'
]);
gulp.task('default', ['build']);


gulp.task('clean', function (cb)
{
	rimraf(path.clean, cb);
});

gulp.task('watch', function(){
	watch(path.watch.html, function(event, cb)
	{
		gulp.start('html:build');
	});
	watch(path.watch.style, function(event, cb)
	{
		gulp.start('style:watch');
	});
	watch(path.watch.js, function(event, cb)
	{
		gulp.start('js:watch');
	});
	watch(path.watch.img, function(event, cb)
	{
		gulp.start('image:build');
	});
	watch(path.watch.fonts, function(event, cb)
	{
		gulp.start('fonts:build');
	});
});
