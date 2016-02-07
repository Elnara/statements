module.exports = function() {
    var src = './src/',
        client = src + 'client/',
        clientApp = client + 'app/',
        dist = './dist/'
        fontdir = 'fonts',
        temp = './.tmp/',
        report = './report/',
        server = src + 'server/',
        wiredep = require('wiredep'),
        bowerFiles = wiredep({devDependencies: true})['js'],
        bower = {
            json: require('./bower.json'),
            directory: './bower_components/',
            ignorePath: '../..'
        },
        specRunnerFile = 'specs.html',
        nodeModules = 'node_modules',
        bowerModules = 'bower_components',
        bowerFiles = wiredep({devDependencies: true})['js'];

    var config = {
        // directory settings
        client: client,
        server: server,
        dist: dist,
        tmp: './.tmp/',

        // client settings
        index: client + 'index.html',
        styles: client + '/styles/*.styl',
        css: './.tmp/styles/*.css',
        font: bower.directory + 'bootstrap-stylus/fonts' + '/**/*',
        fontout: dist + fontdir,
        report: report,
        images: client + 'images/*.*',
        // app js, with no specs
        jsTest: [
            clientApp + '*.module.js',
            clientApp + '*.js',
            '!' + clientApp + '*.spec.js'
        ],
        js: {
            all: client + 'app/*.js',
            entry: client + 'app/statement.module.js',
            output: 'app.js',  
        },
        jsOrder: [
            'statement.module.js',
            '*.module.js',
            '*.js'
        ],
        templates: client + 'app/*.html',
        templateCache: {
            module: 'statement',
            file: 'templates.js',
            root: 'app/'
        },
        stubsjs: [
            bower.directory + 'angular-mocks/angular-mocks.js',
            client + 'stubs/*.js'
        ],

        /**
         * plato
         */
        plato: {js: clientApp + '*.js'},

        /**
         * Bower and NPM files
         */
        bower: bower,

        /**
         * specs.html, our HTML spec runner
         */
        specRunner: client + specRunnerFile,
        specRunnerFile: specRunnerFile,

        /**
         * The sequence of the injections into specs.html:
         *  1 testlibraries
         *      mocha setup
         *  2 bower
         *  3 js
         *  4 spechelpers
         *  5 specs
         *  6 templates
         */
        testlibraries: [
            bowerModules + '/angular/angular.js',
            bowerModules + '/angular-mocks/angular-mocks.js',
            nodeModules + '/mocha/mocha.js',
            nodeModules + '/chai/chai.js',
            nodeModules + '/mocha-clean/index.js',
            nodeModules + '/sinon-chai/lib/sinon-chai.js'
        ],
        specHelpers: [client + 'test-helpers/*.js'],
        specs: [clientApp + '*.spec.js'],
        serverIntegrationSpecs: [client + 'tests/server-integration/*.spec.js'],

        // server settings
        defaultPort: 3007,
        nodeServer: server + 'app.js',
        browserReloadDelay: 1000,
    };


    /**
     * wiredep and bower settings
     */
    config.getWiredepDefaultOptions = function() {
        var options = {
            bowerJson: config.bower.json,
            directory: config.bower.directory,
            ignorePath: config.bower.ignorePath
        };
        return options;
    };

    /**
     * karma settings
     */
    config.karma = getKarmaOptions();

    return config;

    ////////////////

    function getKarmaOptions() {


        var options = {
            files: [].concat(
                bowerFiles,
                config.specHelpers,
                clientApp + '*.module.js',
                clientApp + '*.js',
                temp + config.templateCache.file,
                config.serverIntegrationSpecs
            ),
            exclude: [],
            coverage: {
                dir: report + 'coverage',
                reporters: [
                    // reporters not supporting the `file` property
                    {type: 'html', subdir: 'report-html'},
                    {type: 'lcov', subdir: 'report-lcov'},
                    {type: 'text-summary'} //, subdir: '.', file: 'text-summary.txt'}
                ]
            },
            preprocessors: {}

        };

        options.preprocessors[clientApp + '**/!(*.spec)+(.js)'] = ['coverage'];

        return options;
    }
}
