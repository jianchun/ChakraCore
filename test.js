function MyModule() {
    "use asm";

    function add(a, b) {
        a = a | 0;
        b = +b;
        return a + b;
    }

    return {add: add};
}

var m = MyModule();
print(m.add(12, 34.56));
