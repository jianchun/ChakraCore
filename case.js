// Known words to be converted to CamelCase
var knownWords = [
    'lib', 'common', 'codex', 'chakra', 'utf8'
];

// Reserved words to remain unchanged
var reservedWords = [

];


function toCamelCase(word) {
    word = word.toLowerCase();
    return word[0].toUpperCase() + word.substr(1);
}

var dict = new Map();

reservedWords.forEach(w => {
    if (dict.has(w)) {
        throw new Error("ERROR: duplicated reservedWords: " + w);
    }
    dict.set(w, w);
});

knownWords.forEach(w => {
    if (dict.has(w)) {
        throw new Error("ERROR: duplicated knownWords: " + w);
    }
    var r = toCamelCase(w);
    dict.set(w, r);
    dict.set(r, r); // Also put expected in to handle already correct casing.
});


function transformName(name) {
    if (name.length == 0) {
        return name;
    }

    for (var len = name.length; len > 0; len--) {
        var w = dict.get(name.substr(0, len));
        if (w) {
            return w + transformName(name.substr(len));
        }
    }

    throw new Error("ERROR: don't know how to transform: " + name);
}

module.exports = function(path) {
    var len = path.lastIndexOf('.');
    if (len < 0) {
        len = path.length;
    }

    var bare = path.substr(0, len);
    var ext = path.substr(len);
    return bare.split('/').map(name =>
        name.split('.').map(part => transformName(part)).join('.')
    ).join('/') + ext;
}
