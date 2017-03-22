//-------------------------------------------------------------------------------------------------------
// Copyright (C) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.txt file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------

  // return double
  // do while and while loops
  function AsmModule() {
    "use asm";

    function f3(x,y){
        x = x|0;
        y = +y;
        return +bar(1,1.1);
    }

    function bar(k,d)
    {
        k = k|0;
        d = +d;
        return  + (d * d)
    }

    return {bar:bar,f3:f3}
}

var obj = AsmModule();
print(obj.f3(1,1.5));
