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

var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var sprintf = require('sprintf');

function rename(oldPath, newPath) {
    var dir = path.dirname(newPath);
    if (dir.length > 0) {
        shell.mkdir('-p', dir);
    }

    fs.renameSync(oldPath, newPath);
}

var transform = require('./case.js');
var lastDir;
process.stdin.pipe(require('split')()).on('data', line => {
    if (line.length == 0 || !fs.lstatSync(line).isFile()) {
        return; // skip dirs
    }

    var result = transform(line);

    if (result != line) {
        var oldName = path.basename(line);
        var newName = path.basename(result);
        if (oldName != newName) {
            var oldDir = path.dirname(line);
            if (oldDir != lastDir) {
                if (lastDir) {
                    console.log();
                }
                console.log(oldDir, "\t=>\t", path.dirname(result));
                console.log();
                lastDir = oldDir;
            }

            console.log(sprintf("\t%-20s\t%-20s", oldName, newName));
        }

        if (!options.test) {
            rename(line, result);
        }
    }
});

