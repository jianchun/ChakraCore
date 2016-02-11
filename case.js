// Known words to be converted to CamelCase
var knownWords = [
    'lib', 'common', 'codex', 'chakra', 'utf8', 'defines', 'min',
    'target', 'ver', 'math', 'util',
    'int16', 'int32', 'int64',
    'rejit', 'reason', 'get', 'current', 'frame', 'event',
    'daylight', 'time', 'helper', 'logger',
    'number', 'utilities', 'jobs', 'thread', 'service', 'tick', 'date',
    'base', 'byte', 'swap', 'smart', 'control', 'enum', 'back', 'end',
    'data', 'structures', 'doubly', 'linked', 'list',
    'fixed', 'bit', 'vector', 'line', 'offset', 'cache',
    'dictionary', 'internal', 'string', 'no', 'case', 'comparer',
    'continuous', 'page', 'stack', 'eval', 'map', 'simple', 'hash', 'table',
    'large', 'character', 'buffer', 'sparse', 'array', 'size', 'policy',
    'unit', 'big', 'int', 'immutable', 'regex', 'key', 'growing',
    'value', 'pair', 'mru', 'leaf', 'interval', 'weak', 'reference',
    'template', 'parameter', 'exceptions', 'exception', 'asm', 'js', 'parse',
    'operation', 'aborted', 'report', 'error', 'out', 'of', 'memory', 'overflow',
    'not', 'implemented', 'disabled', 'script', 'abort',
    'recycler', 'heuristic', 'small', 'normal', 'heap', 'block', 'root', 'ptr',
    'info', 'allocation', 'fast', 'allocator', 'custom', 'finalizable',
    'forced', 'constraints', 'virtual', 'alloc', 'wrapper',
    'write', 'barrier', 'manager', 'stress', 'test', 'object', 'graph', 'dumper',
    'leak', 'bucket', 'free', 'valid', 'pointers', 'gen', 'build',
    'arena', 'mark', 'watson', 'telemetry', 'idle', 'decommit', 'collection', 'state',
    'auto', 'type', 'filter', 'etw', 'tracking', 'place', 'holder',
    'external', 'method', 'core', 'config', 'flags', 'profile', 'cmd',
    'perf', 'counter', 'fault', 'injection', 'dbg', 'help', 'symbol', 'trace',
    'atom', 'lock', 'guids', 'sys', 'binary', 'feature', 'critical', 'section',
    'delay', 'load', 'resource', 'class', 'pinned', 'default', 'pch', 'reasons',
    'element', 'option', 'queue', 'stats', 'entry', 'builder', 'enumerator', 'tuple',
    'tree', 'check', 'throw', 'banned', 'pool', 'sweep', 'operators', 'context',
    'declarations', 'constants', 'output', 'typedefs', 'max', 'parser', 'instrument',
    'set', 'assert', 'impl', 'assertions', 'library', 'types', 'warnings', 'basic',

];

// Known words to be in upper case
var knownUpperCaseWords = [
    'id', 'cfg', 'fpu', 'i', 'x'
];

// Reserved words to remain unchanged
var reservedWords = [
    'vtinfo', 'vtregistry', 'vcxproj', 'arm', 'arm64', 'amd64',
    '_GET_CURRENT_FRAME', 'UInt16', 'UInt32', 'SList', 'DList', 'quicksort', 'vpm',
    '_SAVE_REGISTERS', 'FILE', 'inl', '_strtod', 'api', 'API', 'Api', '32b', '64b',
];

function toCamelCase(word) {
    word = word.toLowerCase();
    return word[0].toUpperCase() + word.substr(1);
}

var dict = new Map();

knownWords.forEach(w => {
    if (dict.has(w)) {
        throw new Error("ERROR: duplicated knownWords: " + w);
    }
    var r = toCamelCase(w);
    dict.set(w, r);
    dict.set(r, r); // Also put expected in to handle already correct casing.
});
knownUpperCaseWords.forEach(w => {
    if (dict.has(w)) {
        throw new Error("ERROR: duplicated knownUpperCaseWords: " + w);
    }
    var r = w.toUpperCase();
    dict.set(w, r);
    dict.set(r, r); // Also put expected in to handle already correct casing.
});
reservedWords.forEach(w => {
    if (dict.has(w)) {
        throw new Error("ERROR: duplicated reservedWords: " + w);
    }
    dict.set(w, w);

    // Assume this list has recommented casing. Try from lowercase -> this.
    var lower = w.toLowerCase();
    if (!dict.has(lower)) {
        dict.set(lower, w);
    }
});



function transformName(name) {
    if (name.length == 0) {
        return name;
    }

    // if (name == toCamelCase(name)) {
    //     return name; // ignore if already camel case
    // }

    for (var len = name.length; len > 0; len--) {
        var part = name.substr(0, len);
        var w = dict.get(part) || dict.get(part.toLowerCase());
        if (w) {
            return w + transformName(name.substr(len));
        }
    }

    throw new Error("don't know how to transform: " + name);
}

module.exports = function(path) {
    try {
        var len = path.lastIndexOf('.');
        if (len < 0) {
            len = path.length;
        }

        var bare = path.substr(0, len);
        var ext = path.substr(len);
        return bare.split('/').map(name =>
            name.split('.').map(part => transformName(part)).join('.')
        ).join('/') + ext;
    } catch(ex) {
        throw new Error(path + ", " + ex.message);
    }
}
