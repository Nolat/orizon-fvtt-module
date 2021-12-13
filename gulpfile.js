const gulp = require('gulp');
const path = require('path');
var fs = require('fs');
const del = require('del');
const ts = require('gulp-typescript');
const zip = require('gulp-zip');
const rename = require('gulp-rename');
const minify = require('gulp-minify');
const tabify = require('gulp-tabify');
const stringify = require('json-stringify-pretty-compact');

const GLOB = '**/*';
const DIST = 'dist/';
const BUNDLE = 'bundle/';
const SOURCE = 'src/';
const LANG = 'lang/';

var PACKAGE = JSON.parse(fs.readFileSync('package.json'));

String.prototype.replaceAll = function (pattern, replace) {
  return this.split(pattern).join(replace);
};
function pdel(patterns, options) {
  return () => {
    return del(patterns, options);
  };
}

/**
 * Compile the source code into the distribution directory
 */
function buildSource(minifySources = false, output = null) {
  return () => {
    var stream = gulp.src(SOURCE + GLOB);
    stream = stream.pipe(ts.createProject('tsconfig.json')());
    if (minifySources)
      stream = stream.pipe(
        minify({
          ext: { min: '.js' },
          mangle: false,
          noSource: true,
        })
      );
    else stream = stream.pipe(tabify(4, false));
    return stream.pipe(gulp.dest((output || DIST) + SOURCE));
  };
}
exports.step_buildSource = buildSource();
exports.step_buildSourceMin = buildSource(true);

/**
 * Builds the module manifest based on the package, sources.
 */
function buildManifest(output = null) {
  const files = []; // Collector for all the file paths
  return (cb) =>
    gulp
      .src(PACKAGE.main) // collect the source files
      .pipe(rename({ extname: '.js' })) // rename their extensions to `.js`
      .on('data', (file) => files.push(path.relative(file.cwd, file.path))) // Collect all the file paths
      .on('end', () => {
        // output the filepaths to the module.json
        if (files.length == 0)
          throw Error('No files found in ' + SOURCE + GLOB);
        const js = files.filter((e) => e.endsWith('js'));
        fs.readFile('module.json', (err, data) => {
          const module = data
            .toString() // Inject the data into the module.json
            .replaceAll('{{name}}', PACKAGE.name)
            .replaceAll('{{title}}', PACKAGE.title)
            .replaceAll('{{version}}', PACKAGE.version)
            .replaceAll('{{description}}', PACKAGE.description)
            .replace(
              '"{{sources}}"',
              stringify(js, null, '\t').replaceAll('\n', '\n\t')
            );
          fs.writeFile((output || DIST) + 'module.json', module, cb); // save the module to the distribution directory
        });
      });
}
exports.step_buildManifest = buildManifest();

function outputLanguages(output = null) {
  return () => gulp.src(LANG + GLOB).pipe(gulp.dest((output || DIST) + LANG));
}
function outputMetaFiles(output = null) {
  return () =>
    gulp
      .src(['LICENSE', 'README.md', 'CHANGELOG.md'])
      .pipe(gulp.dest(output || DIST));
}

/**
 * Copy files to module named directory and then compress that folder into a zip
 */
function compressDistribution() {
  return gulp.series(
    // Copy files to folder with module's name
    () =>
      gulp
        .src(DIST + GLOB)
        .pipe(gulp.dest(DIST + `${PACKAGE.name}/${PACKAGE.name}`)),
    // Compress the new folder into a ZIP and save it to the `bundle` folder
    () =>
      gulp
        .src(DIST + PACKAGE.name + '/' + GLOB)
        .pipe(zip(PACKAGE.name + '.zip'))
        .pipe(gulp.dest(BUNDLE)),
    // Copy the module.json to the bundle directory
    () => gulp.src(DIST + '/module.json').pipe(gulp.dest(BUNDLE)),
    // Cleanup by deleting the intermediate module named folder
    pdel(DIST + PACKAGE.name)
  );
}
exports.step_compressDistribution = compressDistribution();

/**
 * Simple clean command
 */
exports.clean = pdel([DIST, BUNDLE]);
/**
 * Default Build operation
 */
exports.default = gulp.series(
  pdel([DIST]),
  gulp.parallel(
    buildSource(true, false),
    buildManifest(),
    outputLanguages(),
    outputMetaFiles()
  )
);
/**
 * Performs a default build and then zips the result into a bundle
 */
exports.zip = gulp.series(
  pdel([DIST]),
  gulp.parallel(
    buildSource(false, false),
    buildManifest(),
    outputLanguages(),
    outputMetaFiles()
  ),
  compressDistribution(),
  pdel([DIST])
);
/**
 * Sets up a file watch on the project to detect any file changes and automatically rebuild those components.
 */
exports.watch = function () {
  exports.default();
  gulp.watch(
    SOURCE + GLOB,
    gulp.series(pdel(DIST + SOURCE), buildSource(true, false))
  );
  gulp.watch(LANG + GLOB, gulp.series(pdel(DIST + LANG), outputLanguages()));
  gulp.watch(['LICENSE', 'README.md', 'CHANGELOG.md'], outputMetaFiles());
};
