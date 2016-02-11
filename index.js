var cli = require('command-line-args')([
    {
        name: 'test',  alias: 't',
        description: 'test only, do not rename',
        type: Boolean
    },
    {
        name: 'filenameOnly', alias: 'f',
        description: '(when test) display filename changes only',
        type: Boolean, defaultValue: true
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

var fs = require('fs');
var shell = require('shelljs');
function rename(oldPath, newPath) {
    var i = newPath.lastIndexOf('/');
    if (i >= 0) {
        var dir = newPath.substr(0, i);
        shell.mkdir('-p', dir);
    }

    fs.renameSync(oldPath, newPath);
}

function filenameOf(path) {
    var i = path.lastIndexOf('/');
    return i >= 0 ? path.substr(i + 1) : path;
}

var transform = require('./case.js');
process.stdin.pipe(require('split')()).on('data', line => {
    if (line.length == 0 || !fs.lstatSync(line).isFile()) {
        return; // skip dirs
    }

    var result = transform(line);
    if (result != line) {
        if (options.test) {
            if (options.filenameOnly) {
                line = filenameOf(line);
                result = filenameOf(result);
            }
            if (result != line) {
                console.log(line, "\t", result);
            }
        } else {
            rename(line, result);
        }
    }
});
