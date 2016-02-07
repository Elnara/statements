var gulp = require('gulp'),
    karma = require('karma').server,
    args = require('yargs').argv,
    stylish = require('jshint-stylish'),
    csslint = require('gulp-csslint'),
    config = require('./gulp.config')(),
    glob = require('glob'),
    del = require('del'),
    browserSync = require('browser-sync'),
    plugins = require('gulp-load-plugins')({lazy: true}),
    wiredep = require('wiredep'),
    env = plugins.util.env,
    port = process.env.PORT || config.defaultPort;

/////////////

gulp.task('jslint', function() {
    log('Analyzing source with JSHint and JSCS');

    return gulp
        .src(config.js.all)
        .pipe(plugins.if(args.verbose, plugins.print()))
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter(stylish))
        .pipe(plugins.jshint.reporter('fail'));
});

gulp.task('clean-font', function(done) {
    var files = [].concat(
        config.fontout);
    clean(files, done);
});

gulp.task('make-font', ['clean-font'], function() {
    log('Iconic font creation..');

    return gulp
        .src([config.font])
        .pipe(gulp.dest(config.fontout));
});

/**
 * Create a visualizer report
 */
gulp.task('plato', function(done) {
    log('Analyzing source with Plato');
    log('Browse to /report/plato/index.html to see Plato results');

    startPlatoVisualizer(done);
});

gulp.task('make-styles', function() {
    log('Compiling Stylus --> CSS');

    return gulp
        .src(config.styles)
        .pipe(plugins.plumber())
        .pipe(plugins.stylus())
        .pipe(plugins.autoprefixer('last 3 version', '> 1%'))
        .pipe(gulp.dest(config.tmp));
});

gulp.task('make-cache', function() {
    log('Creating an AngularJS $templateCache');

    return gulp
        .src(config.templates)
        .pipe(plugins.bytediff.start())
        .pipe(plugins.minifyHtml({empty: true}))
        .pipe(plugins.if(env.verbose, plugins.bytediff.stop(bytediffFormatter)))
        .pipe(plugins.angularTemplatecache(config.templateCache.file, {
            module: config.templateCache.module,
            standalone: false,
            root: config.templateCache.root}))
        .pipe(gulp.dest(config.tmp));
});

/**
 * Run the spec runner
 * @return {Stream}
 */
gulp.task('serve-specs', ['build-specs'], function(done) {
    log('run the spec runner');
    serve(true /* isDev */, true /* specRunner */);
    done();
});

/**
 * Inject all the spec files into the specs.html
 * @return {Stream}
 */
gulp.task('build-specs', ['make-cache'], function(done) {
    log('building the spec runner');

    var wiredep = require('wiredep').stream;
    var templateCache = config.temp + config.templateCache.file;
    var options = config.getWiredepDefaultOptions();
    var specs = config.specs;

    if (args.startServers) {
        specs = [].concat(specs, config.serverIntegrationSpecs);
    }
    options.devDependencies = true;

    return gulp
        .src(config.specRunner)
        .pipe(wiredep(options))
        .pipe(inject(config.jsTest, '', config.jsOrder))
        .pipe(inject(config.testlibraries, 'testlibraries'))
        .pipe(inject(config.specHelpers, 'spechelpers'))
        .pipe(inject(specs, 'specs', ['**/*']))
        .pipe(inject(templateCache, 'templates'))
        .pipe(gulp.dest(config.client));
});

gulp.task('test', ['jslint'], function(done) {
    startTests(true /*singleRun*/ , done);
});

gulp.task('autotest', function() {
    return gulp.watch(['www/js/**/*.js', 'test/spec/*.js'], ['test']);
})

gulp.task('csslint', function() {
  gulp.src(config.css)
    .pipe(csslint())
    .pipe(csslint.reporter());
});

gulp.task('dev', ['make-styles'], function() {
    serve(true /* start dev mode */);
});

gulp.task('dist', ['make-html'], function() {
    serve(false /* start dev mode */);
});

gulp.task('clean-code', function(done) {

    var files = [].concat(
        config.tmp + '**/*.js',
        config.dist + 'js/**/*.js',
        config.dist + '**/*.html'
    );

    clean(files, done);

    return true;
});

gulp.task('clean-styles', function(done) {
    var files = [].concat(
        config.tmp + '**/*.css',
        config.dist + '**/*.css'
    );
    clean(files, done);
});

gulp.task('make-html', ['make-styles', 'make-cache', 'jslint', 'csslint', 'make-font'], function() {
    var assets = plugins.useref.assets({searchPath: './'}),
    jslib = plugins.filter('**/lib.js', {restore: true}),
    jsapp = plugins.filter('**/app.js', {restore: true}),
    cssapp = plugins.filter('**/app.css', {restore: true}),
    templateCache = config.tmp + config.templateCache.file;

    return gulp
        .src(config.index)
        // handle errors
        .pipe(plugins.plumber())
        .pipe(plugins.inject(gulp.src(templateCache, {read: false}), {
            starttag: '<!-- inject:templates:js -->'
        }))
        // collect all assets from source file by the means of useref
        .pipe(assets) 
        // process css
        .pipe(cssapp)
        .pipe(plugins.csso())
        .pipe(cssapp.restore)
        // process libs
        .pipe(jslib)
        .pipe(plugins.uglify())
        .pipe(jslib.restore)
        // process app.js
        .pipe(jsapp)
        .pipe(plugins.uglify())
        .pipe(jsapp.restore)
        // Take inventory of the file names for future rev numbers
        .pipe(plugins.rev())
        // Apply the concat and file replacement with useref
        .pipe(assets.restore())
        .pipe(plugins.useref())
        // Replace the file names in the html with rev numbers
        .pipe(plugins.revReplace())
        .pipe(gulp.dest(config.dist));
});

function startTests(singleRun, done) {
    var child,
        excludeFiles = [],
        fork = require('child_process').fork,
        karma = require('karma').server,
        serverSpecs = config.serverIntegrationSpecs;

    if (args.startServers) {
        log('Starting servers');
        var savedEnv = process.env;
        savedEnv.NODE_ENV = 'dev';
        savedEnv.PORT = 8888;
        child = fork(config.nodeServer);
    } else {
        if (serverSpecs && serverSpecs.length) {
            excludeFiles = serverSpecs;
        }
    }

    karma.start({
        configFile: __dirname + '/karma.conf.js',
        exclude: excludeFiles,
        singleRun: !!singleRun
    }, function() {
        karmaCompleted();   
    });

    ////////////////

    function karmaCompleted(karmaResult) {
        log('Karma completed');
        if (child) {
            log('shutting down the child process');
            child.kill();
        }
        if (karmaResult === 1) {
            done('karma: tests failed with code ' + karmaResult);
        } else {
            done();
        }
    }
}

/**
 * Start Plato inspector and visualizer
 */
function startPlatoVisualizer(done) {
    log('Running Plato');

    var files = glob.sync(config.plato.js);
    var excludeFiles = /.*\.spec\.js/;
    var plato = require('plato');

    var options = {
        title: 'Plato Inspections Report',
        exclude: excludeFiles
    };
    var outputDir = config.report + '/plato';

    plato.inspect(files, outputDir, options, platoCompleted);

    function platoCompleted(report) {
        var overview = plato.getOverviewReport(report);
        if (args.verbose) {
            log(overview.summary);
        }
        if (done) { done(); }
    }
}

function addWatchers(isDev) {
    if (isDev) {
        gulp.watch([config.styles], ['make-styles', browserSync.reload]);
        gulp.watch([config.client + '**/*', '!' + config.styles], browserSync.reload)
             .on('change', function(event) { changeEvent(event); });
    } else {
        gulp.watch([config.styles, config.js.all, config.templates], ['make-html', browserSync.reload])
                .on('change', function(event) { changeEvent(event); });
    }        
}

function serve(isDev) {
    var debug = env.debug || env.debugBrk,
    exec,
    nodeOptions = {
        script: config.nodeServer,
        delayTime: 1,
        env: {
            'PORT': port,
            'NODE_ENV': isDev ? 'dev' : 'dist'
        },
        watch: [config.server]
    };

    if (debug) {
        log('Running node-inspector. Browse to http://localhost:8080/debug?port=5858');
        exec = require('child_process').exec;
        exec('node-inspector');
        nodeOptions.nodeArgs = [debug + '=5858'];
    }

    addWatchers(isDev);

    return plugins.nodemon(nodeOptions)
            .on('start', function() {
                log('Starting...');
                startBrowserSync();
            })
            .on('restart', function() {
                log('Restarting...');
                setTimeout(function() {
                    browserSync.notify('reloading now ...');    
                    browserSync.reload({stream: false});
                }, config.browserReloadDelay);
            });
}

/**
 * Inject files in a sorted sequence at a specified inject label
 * @param   {Array} src   glob pattern for source files
 * @param   {String} label   The label name
 * @param   {Array} order   glob pattern for sort order of the files
 * @returns {Stream}   The stream
 */
function inject(src, label, order) {
    var options = {read: false};
    if (label) {
        options.name = 'inject:' + label;
    }

    return plugins.inject(orderSrc(src, order), options);
}

/**
 * Order a stream
 * @param   {Stream} src   The gulp.src stream
 * @param   {Array} order Glob array pattern
 * @returns {Stream} The ordered stream
 */
function orderSrc (src, order) {
    //order = order || ['**/*'];
    return gulp
        .src(src)
        .pipe(plugins.if(order, plugins.order(order)));
}


function startBrowserSync() {
    if (env.nosync || browserSync.active) {
        return;
    }

    log('Starting BrowserSync on port ' + port);

    var options = {
        proxy: 'localhost:' + port,
        port: 3008, //browserSync port
        ghostMode: {
            clicks: true,
            location: false,
            forms: true,
            scroll: true
        },
        injectChanges: true,
        logFileChanges: true,
        logLevel: 'debug',
        logPrefix: 'gulp-patterns',
        notify: true,
        reloadDelay: 1000
    };

    browserSync(options);
}

/*
 * Delete all files in a given path
 * @param  {Array}   path - array of paths to delete
 * @param  {Function} done - callback when complete
 */
function clean(path, done) {
    log('Cleaning: ' + plugins.util.colors.blue(path));
    del(path, done);
}

/*
 * When files change, log it
 * @param  {Object} event - event that fired
 */
function changeEvent(event) {
    var srcPattern = new RegExp('/.*(?=/' + config.src + ')/');

    log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

/**
 * Log a message or series of messages using chalk's blue color.
 * Can pass in a string, object or array.
 */
function log(msg) {
    if (typeof(msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                plugins.util.log(plugins.util.colors.blue(msg[item]));
            }
        }
    } else {
        plugins.util.log(plugins.util.colors.blue(msg));
    }
}

/**
 *  * Formatter for bytediff to display the size changes after processing
 *   * @param  {Object} data - byte data
 *    * @return {String}      Difference in bytes, formatted
 *     */
function bytediffFormatter(data) {
    var difference = (data.savings > 0) ? ' smaller.' : ' larger.';
    return data.fileName + ' went from ' +
        (data.startSize / 1000).toFixed(2) + ' kB to ' +
        (data.endSize / 1000).toFixed(2) + ' kB and is ' +
        formatPercent(1 - data.percent, 2) + '%' + difference;
}
