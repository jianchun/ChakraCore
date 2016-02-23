var cli = require('command-line-args')([
    {
        name: 'dirs', alias: 'd', type: String,
        multiple: true, defaultOption: true,
        description: 'dirs to examine sources'
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
var shell = require('shelljs');

options.dirs.forEach(function find_vcxproj(dir) {
    fs.readdirSync(dir).forEach(x => {
        if (x[0] == '.') {
            return; // skip . .. or any other 'hidden' items
        }

        var p = path.join(dir, x);
        if (fs.lstatSync(p).isDirectory()) {
            find_vcxproj(p);
        } else {
            var ext = path.extname(x);
            if (ext.toLowerCase() == ".vcxproj") {
                try_cmakelists_from(p);
            }
        }
    });
});

function try_cmakelists_from(vcxproj) {
    var dir = path.dirname(vcxproj);
    var cmakelists = path.join(dir, "CMakeLists.txt");

    try {
        fs.statSync(cmakelists);
        return; // file exists, skip
    } catch(ex) {
    }

    var targetName;
    var cppfiles = [];
    fs.readFileSync(vcxproj).toString().split('\n').forEach(line => {
        if (!targetName) {
            var r = /^\s*<TargetName>(.+)<.TargetName/i.exec(line);
            if (r) {
                targetName = r[1];
            }
            return;
        }

        var r = /^\s*<ClCompile Include="(\$\(MS\w+\))?([^"]+)".*$/i.exec(line);
        if (r) {
            cppfiles.push(r[2]);
        }
    });

    if (targetName) {
        var output = [
            "# xplat-todo: This is a skeleton make file and not used in build yet.",
            "# Please add this to build and fix issues.",
            ""];
        output.push("add_library (" + targetName);
        cppfiles.sort().forEach(f => output.push("    " + f));
        output.push("    )");
        output.push("");
        output.push("target_include_directories (");
        output.push("    " + targetName + " PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})");
        output.push("");

        fs.writeFileSync(cmakelists, output.join('\n'));
        console.log(cmakelists);
    }
}
