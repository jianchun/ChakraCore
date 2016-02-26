var cli = require('command-line-args')([
    {
        name: 'dirs', alias: 'd', type: String,
        multiple: true, defaultOption: true,
        description: 'dirs to perform wchar16 replacements'
    },
    {
        name: 'help', alias: '?', type: Boolean,
        description: 'show help'
    }
]);

var options;
try {
    options = cli.parse();
} catch(ex) {
    console.log(cli.getUsage());
    process.exit(-1);
}

if (options.help || !options.dirs) {
    console.log(cli.getUsage());
    process.exit(0);
}

var fs = require('fs');
var path = require('path');
var EXTS = new Set(['.h', '.inl', '.cpp', '.cc']);
var EXCLUDES = [
        /CommonTypedefs\.h$/i
    ];

function process_dir(dir) {
    fs.readdirSync(dir).forEach(x => {
        if (x[0] == '.') {
            return; // skip . .. or any other 'hidden' items
        }

        var p = path.join(dir, x);
        if (EXCLUDES.find(r => r.exec(p) != null)) {
            return; // skip excluded files
        }

        if (fs.lstatSync(p).isDirectory()) {
            process_dir(p);
        } else if (EXTS.has(path.extname(x).toLowerCase())) {
            process_file(p);
        }
    });
}

function process_file(f) {
    var modified;
    var content = fs.readFileSync(f).toString().split('\n');
    content.forEach((line, i) => {
        var r = line.replace(/wchar_t/g, 'wchar16')
                    .replace(/L("(\"|[^"]|\n)*")/g, 'CH_WSTR($1)')
                    .replace(/L('(\'|[^']|\n)+')/g, 'CH_WSTR($1)')
                    .replace(/L##(\w+)/g, 'CH_WSTR($1)')
                    .replace(/L#(\w+)/g, 'CH_WSTR($1)');
        if (r != line) {
            content[i] = r;
            modified = true;
        }
    });
    if (modified) {
        fs.writeFileSync(f, content.join('\n'));
    }
}

options.dirs.forEach(process_dir);
