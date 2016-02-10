var cli = require('command-line-args')([
    {
        name: 'test',  alias: 't',
        description: 'test only, do not rename',
        type: Boolean
    },
    {
        name: '?', alias: '?',
        description: 'show usage',
        type: Boolean
    },
]);

var description = {
    description: 'rename dirs/files to CamelCase',
    examples: ['find . | node [path]case/index.js' ]
};

var options;
try {
    options = cli.parse();
} catch (x) {
    console.log(x.message, cli.getUsage(description));
    process.exit(-1);
}

if (options["?"]) {
    console.log(cli.getUsage(description));
    process.exit(0);
}

var transform = require('./case.js');
process.stdin.pipe(require('split')()).on('data', line => {
    var result = transform(line);
    if (result != line) {
        if (options.test) {
            console.log(line, "\t", result);
        } else {
            // mv
        }
    }
});
