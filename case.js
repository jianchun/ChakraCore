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
    'node', 'linear', 'flow', 'scan', 'liveness', 'glob', 'debug', 'layout', 'bail',
    'queued', 'full', 'jit', 'work', 'item', 'opt', 'expr', 'op', 'code', 'jn',
    'does', 'matter', 'range', 'lower', 'native', 'inlining', 'decider', 'peeps',
    'emit', 'emitter', 'interpreter', 'thunk', 'pre', 'kind', 'inline', 'bounds', 'agen',
    'lifetime', 'generator', 'profiling', 'viewer', 'sym', 'switch', 'helpers', 'shared',
    'reg', 'encoder', 'lowerer', 'encode', 'arch', 'backward', 'inlinee',
    'pass', 'prolog', 'allocators', 'assembly', 'step', 'legalize', 'unwind', 'codes',
    'thunks', 'attr', 'opnd', 'fields', 'region', 'db', 'post', 'relative',
    'heuristics', 'security', 'temp', 'tracker', 'constant', 'induction', 'variable',
    'func', 'jsrt', 'exports', 'runtime', 'source', 'hooks', 'rt',
    'errors', 'writer', 'pattern', 'char', 'trie',
    'classifier', 'formals', 'insensitive', 'standard', 'octoquad', 'identifier',
    'chars', 'compile', 'background', 'textbook', 'boyer', 'moore', 'contcodes',
    'detached', 'language', 'dynamic', 'mutator', 'utils', 'loop', 'ops',
    'javascript', 'conversion', 'recyclable', 'function', 'arg', 'index',
    'float', 'storage', 'pointer', 'handler', 'bool', 'uint', 'link',
    'instruction', 'int32x4', 'int16x8', 'uint16x8', '32x4', '8x16', '64x2', '16x8',
    'uint32x4', 'names', 'arguments', 'module', 'tagged', 'walker',
    'execution', 'mode', 'modes', 'optimization', 'override', 'body', 'expirable',
    'read', 'only', 'process', 'windows', 'globalization', 'adapter',
    'foundation', 'property', 'cross', 'site', 'leave', 'sink', 'hint', 'profiler',
    'hi', 'res', 'record', 'entropy', 'call', 'descriptions', 'prober', 'direct',
    'diag', 'probe', 'document', 'breakpoint', 'debugging', 'mutation',
    'bound', 'model', 'container', 'constructor', 'null', 'literal',
    'implementation', 'or', 'single', 'timer', 'iterator', 'intl', 'extension',
    'engine', 'interface', 'boolean', 'concat', 'typed', 'regular', 'expression',
    'snapshot', 'result', 'functions', 'same', 'scanner', 'view', 'copy',
    'promise', 'variant', 'non', 'reflect', 'segment', 'sub', 'built', 'in', 'ins',
    'global', 'uri', 'deferred', 'deserialization', 'deserialize', 'parsing',
    'host', 'tag', 'entries', 'proxy', 'prototype', 'slot', 'accessor',
    'for', 'compound', 'extended', 'statement', 'serializer', 'var', 'reader',
    'count', 'layouts', 'scope', 'release', 'aux', 'spread', 'missing', 'static',
    'version', 'argument', 'edge', 'descriptor', 'activation', 'path',
    'unordered', 'with', 'ranges', 'crt', 'serializable', 'inl', 'ptrs',
    'simd', 'cfg', 'fpu', 'id', 'api', 'tls', 'scc', 'file',
    '16', '32', '86', '64', '128',
];

// Known words to be in upper case
var knownUpperCaseWords = [
    'i', 'x', 'a', 'p', 'json','ir', 'sse2', 'wp', 'es5', 'u', 's', 'd'
];

// Reserved words to remain unchanged
var reservedWords = [
    'vtinfo', 'vtregistry', 'vcxproj', 'arm', 'ARM', 'amd',
    'quicksort', 'vpm', 'UInt',
    'strtod', '32b', '64b',
    'i386', 'md', 'MD', 'Md',
    'kwd-lsc', 'kwd', 'kwds', 'sw', 'globals', 'keywords', 'cmperr', 'idiom', 'ptree',
    'ptlist', 'pnodediff', 'CharSet', 'tokens', 'errstr', 'screrror',
    'pnodechange', 'pnodewalk', 'pnodevisit', 'jserr', 'objnames', 'kwds_sw-nocolor',
    'rterrors', 'limits', 'kwd-swtch', 'perrors', 'popcode', 'rterror', '-nocolor',
    'EHBailoutData', 'CharString', 'EhFrame', 'CodeSerializer', 'CodeSerialize',
    'RegExp', 'RegexParser', 'RegexPattern', 'Backend'
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


var g_current; // current file name (bare)

function transformName(name) {
    if (name.length == 0) {
        return name;
    }

    if (name == name.toUpperCase()) {
        // special dealing with cases: arm_SAVE_REGISTERS.asm
        if (g_current.indexOf('_') > 0) {
            return name;
        }
    }

    for (var len = name.length; len > 0; len--) {
        var part = name.substr(0, len);
        var w = dict.get(part) || dict.get(part.toLowerCase());
        if (w) {
            return w + transformName(name.substr(len));
        }
    }

    throw new Error("don't know how to transform: " + name);
}

var path = require('path');
var extraExtensions = [ /\.js\..*/, /\.vcxproj\..*/ ];

module.exports = function(p) {
    var ext = path.extname(p);
    if (ext.length > 0) {
        extraExtensions.forEach(e => {
            var i = p.search(e);
            if (i >= 0) {
                ext = p.substr(i);
            }
        });
    }

    var bare = p.substr(0, p.length - ext.length);
    g_current = bare;

    try {
        return bare.split('/').map(name =>
            name.split('.').map(part =>
                part.split('_').map(word => transformName(word)).join('_')
            ).join('.')
        ).join('/') + ext;
    } catch(ex) {
        throw new Error(p + ", " + ex.message);
    }
}
