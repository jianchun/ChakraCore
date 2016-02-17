var cli = require('command-line-args')([
    {
        name: 'dirs', alias:'d', type: String,
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

// Ref files
var REF_EXTS = new Set(['.h', '.inl', '.cpp', '.cc', '.ver', '.def', '.inc', '.js', '.cmd', '.vcxproj']);

// Source files to update ref file names
var SOURCE_FILES = [
    {
        exts: new Set(['.h', '.inl', '.cpp', '.cc']),
        match: /^(\s*#include\s*[<"])(.*)([>"]\s*)$/,
        pref: '/'
    },
    {
        exts: new Set(['.vcxproj', '.filters']),
        match: /^(.*Include="$\(MSBuildThisFileDirectory\))([^"]+)(".*)$/,
        pref: '\\'
    },
    {
        exts: new Set(['.vcxproj', '.filters']),
        match: /^(.*Include=")([^$"]+)(".*)$/,
        pref: '\\',
        ignore: new Set(['i386', 'amd64', 'arm', 'arm64'])
    },
];

var fs = require('fs');
var path = require('path');

// Collect all ref files info
var refs = new Map();
function read_dir_refs(dir) {
    fs.readdirSync(dir).forEach(x => {
        if (x[0] == '.') {
            return; // skip . .. or any other 'hidden' items
        }

        var p = path.join(dir, x);
        if (fs.lstatSync(p).isDirectory()) {
            read_dir_refs(p);
        } else {
            var ext = path.extname(x);
            if (ext.toLowerCase() != ext) {
                console.warn('ext not lowercase:', p);
            }
            if (REF_EXTS.has(ext)) {
                var key = x.toLowerCase();
                if (!refs.has(key)) {
                    refs.set(key, [p]);
                } else {
                    refs.get(key).push(p);
                }
            }
        }
    });
}

options.dirs.forEach(read_dir_refs);

var unknown_refs = new Set([
    "wchar.h", "windows.h", "wtypes.h", "cmath", "math.h", "typeinfo.h", "intsafe.h",
    "windows.foundation.h", "time.h", "intrin.h", "process.h", "float.h", "stdarg.h",
    "limits.h", "io.h", "malloc.h", "stdio.h", "assert.h", "initguid.h", "fcntl.h",
    "share.h", "strsafe.h", "dbghelp.h", "string.h", "psapi.h", "wincrypt.h", "versionhelpers.h",
    "mmintrin.h", "oaidl.h", "windows.globalization.h", "windows.data.text.h", "crtdefs.h",
    "activation.h", "winstring.h", "cor.h", "roparameterizediid.h", "activprof.h",
    "windows.foundation.diagnostics.h", "implements.h", "windows.globalization.numberformatting.h",
    "windows.globalization.datetimeformatting.h", "shlwapi.h", "activdbg_private.h", "emmintrin.h",
    "activscp_private.h", "restrictederrorinfo.h", "activdbg100.h", "map", "atlbase.h",
    "direct.h", "stdlib.h", "stat.h", "objbase.h", "xmllite.h",

    // Following not in ChakraCore, for NTBUILD
    "gctelemetry.h", "ntassert.h", "microsoft-scripting-chakraevents.h", "ieresp_mshtml.h",
    "microsoft-scripting-jscript9.internalevents.h", "microsoft-scripting-jscript9.internalcounters.h",
    "memprotectheap.h", "jitprofiling.h", "scriptcontexttelemetry.h", "telemetry.h",
    "javascripttypedobjectslotaccessorfunction.h", "directcall.h", "languagetelemetry.h",
]);
var PATH_SPLIT_REGEX = /\\|\//;
function normalize(filename, pref, refByFile, line, ignore) {
    var parts = filename.split(PATH_SPLIT_REGEX);
    var key = parts[parts.length - 1].toLowerCase();
    if (!refs.has(key)) {
        if (!(ignore && ignore.has(key))
            && !unknown_refs.has(key)) {
                console.warn('Ignore', key, "\n\t", refByFile, "\n\t", line);
                unknown_refs.add(key);
        }
        return filename;
    }

    // deal with ../../dir/file.h
    var nameBegin = parts.filter(x => x == '..').length;
    var prefix = nameBegin > 0 ?
            path.join.apply(path, parts.slice(0, nameBegin)) : undefined;
    var name = path.join.apply(path, parts.slice(nameBegin)).toLowerCase();
    var results = [];

    refs.get(key).forEach(p => {
        if (p.length >= name.length) {
            var i = p.length - name.length;
            if (p.toLowerCase().substr(i) == name
                && (i == 0 || p[i - 1].match(PATH_SPLIT_REGEX))) {
                    var n = p.substr(i);
                    if (prefix) {
                        n = path.join(prefix, n);
                    }
                    results.push(n);
            }
        }
    });

    // sort, unique
    results = results.sort().filter((v, i, a) => i == 0 || a[i] != a[i - 1]);
    if (results.length == 1) {
        return results[0].split(PATH_SPLIT_REGEX).join(pref);
    }

    throw new Error("Failed to match " + filename + ", candidates: " + refs.get(key));
}

function process_dir(dir) {
    fs.readdirSync(dir).forEach(x => {
        if (x[0] == '.') {
            return; // skip . .. or any other 'hidden' items
        }

        var p = path.join(dir, x);
        if (fs.lstatSync(p).isDirectory()) {
            process_dir(p);
        } else {
            var ext = path.extname(x);
            var content;
            var modified;
            SOURCE_FILES.forEach(entry => {
                if (entry.exts.has(ext)) {
                    if (!content) {
                        content = fs.readFileSync(p).toString().split('\n');
                    }
                    content.forEach((line, i) => {
                        var m = entry.match.exec(line);
                        if (m) {
                            var n = normalize(m[2], entry.pref, p, line, entry.ignore);
                            if (m[2] != n) {
                                console.log(p, "\n\t", content[i]);
                                content[i] = m[1] + n + m[3];
                                console.log("\t", content[i]);
                                modified = true;
                            }
                        }
                    });
                    if (modified) {
                        fs.writeFileSync(p, content.join('\n'));
                    }
                }
            });
        }
    });
}

options.dirs.forEach(process_dir);
