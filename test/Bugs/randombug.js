//-------------------------------------------------------------------------------------------------------
// Copyright (C) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.txt file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

function write()
{
  for(var i=0;i<arguments.length;i++)
  {
    WScript.Echo(arguments[i]);
  }
}

function TrimStackTracePath(line) {
    return line && line.replace(/\(.+\\test.bugs./ig, "(").replace(/:\d+:\d+\)/g, ")");
}

write("Test case 32");
(function test32()
{
    var shouldBailout = false;
    function test0()
    {
        var arrObj0 = {};
        var func1 = function(){
          print("-- in func1 ",
            JSON.stringify(Object.getOwnPropertyDescriptor(arrObj0, "length")));
        };
        Object.prototype.method0 = func1;
        shouldBailout ?
            (
              Object.defineProperty(arrObj0, 'length', {value: 123, configurable: true}),
              arrObj0.method0()
            ) :
            arrObj0.method0();
    };

    // generate profile
    test0();
    shouldBailout = true;
    test0();
})();
write("Passed");

write("Test case 33");
(function test33()
{
    try
    {
        function inlinee(arg0 , arg1 , arg2)
        {
            throw new Object();
        }
        function inliner(arg0 , arg1)
        {
        }
        function func()
        {
            inliner(29,39,inlinee(22,33,44,55));
        }
        func(24,42);
    }catch(e){};
})();
write("Passed");

write("Test case 34");
(function test34()
{
    var a;
    a = (typeof(a) == "boolean");
    write(a);
})();
write("Passed");

write("Test case 34");
(function test34()
{
    for (var x = 1; x >= 0; x--)
    {
        var f = [];
        var c = f[0] ;
        c = f.push(c);
        write(f[0]);
    }
})();
write("Passed");

write("Test case 35")
function test35()
{
   if(typeof EvalError == "test") //use random comparison
   {
     return true;
   }
   return false;
}
test35();
write("Passed");

write("Test case 36")
function test36() {
    (function () {
        for (let hvkbnr in null)
            throw 'u5623';
    }());
}
try
{
 test36();
}catch(e)
{
}
try
{
 test36();
}catch(e)
{
}
write("Passed")

write("Test case 37")
var test37 = function()
{
};
test37.prototype.B = function(a,b,c,d){return  a+b+c+d;};
var A = new test37();

function F()
{
 this.init.apply(this,arguments);
}
F.prototype.init = function()
{
  A.B.apply(this, arguments);
}
function bar()
{
  return new F(10,30,40,50);
}
write(bar());
write(bar());
write("passed");

write("Test case 38")
var test38 = function (d, j, a)
{
    do
    {
        if (d >= j)
        {
           break;
        }
    }
    while(1);
    for (;d < j;)
    {
    }
    return 10;
};
write("passed")

write("Test case 40");
(function test31()
{
    function testRuntimeError()
    {
        eval(" for (var x in []) { undefinedFunction((test ? false &= 1 : true)); }");
    };
    try
    {
    testRuntimeError();
    }
    catch(ex)
    {
        write(TrimStackTracePath(ex.stack));
    }
})();
write("Passed");

write("Test case 41");
(function test41()
{
    var obj0 = {};
    var arrObj0 = {};
    var func1 = function () {}
    obj0.method0 = func1;
    var IntArr1 = new Array();
    Object.prototype.prop0 = 1;
    var __loopvar0 = 0;
    for (var _strvar20 in arrObj0) {
        if (_strvar20.indexOf('method') != -1)
            continue;
        if (__loopvar0++ > 3)
            break;
        arrObj0[_strvar20] = Math.pow((IntArr1.push(obj0.method0(), (arrObj0.prop1 != arrObj0.prop0), (typeof(obj0.prop0) == 'number'), (typeof(781458996) != 'number'), IntArr1[(((Object.prototype.prop0 >= 0 ? Object.prototype.prop0 : 0)) & 0XF)], (typeof(this.prop0) == 'string'), (typeof(this.prop0) == 'string'))), 1);
        function func22() {
            Math.pow((IntArr1.push(obj0.method0(), (arrObj0.prop1 != arrObj0.prop0), (typeof(obj0.prop0) == 'number'), (typeof(781458996) != 'number'), IntArr1[(((Object.prototype.prop0 >= 0 ? Object.prototype.prop0 : 0)) & 0XF)], (typeof(this.prop0) == 'string'), (typeof(this.prop0) == 'string'))), 1);
        }
    }
})();
write("Passed");
