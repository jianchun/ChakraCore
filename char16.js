var cli = require('command-line-args')([
    {
        name: 'apply',  alias: 'a', type: Boolean,
        description: 'apply the changes (by default test only)',
    },
    {
        name: 'dirs', alias: 'd', type: String,
        multiple: true, defaultOption: true,
        description: 'dirs to perform char16 replacements'
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
        /CommonTypedefs\.h$/i,
        /Jsrt.ChakraCommon\.h$/i,
        /Jsrt.ChakraCore\.h$/i,
        /ChakraRt\.h$/i,
        /jsrtprivate\.h$/i,
        /jsrt\.cpp$/i,
        /(^|[\\\/])(external|build|ProjectionTests|jsrt)[\\\/]/i,
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
        var r = line.replace(/wchar_t/g, 'char16')
                    .replace(/(^|\W)L("(\\"|[^"]|\n)*")/g, '$1_u($2)')
                    .replace(/(^|\s|\(|\)|,|{)L('(\\'|[^']|\n)*')/g, '$1_u($2)')
                    .replace(/L\s*##\s*(#?\w+)/g, '_u($1)')
                    .replace(/L#(\s*)([a-zA-Z_]\w*)/g, '_u(#$2)');
        if (r != line) {
            content[i] = r;
            modified = true;
        }
    });

    if (modified) {
      console.log('Update', f);
      if (options.apply) {
        fs.writeFileSync(f, content.join('\n'));
      }
    }
}

options.dirs.forEach(process_dir);
