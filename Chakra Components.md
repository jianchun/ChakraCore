Chakra Components
=================

`AllocationPolicyManager`
-----------------------

Allows a client to cap memory usage, configure concurrency, control/notify
allocate/free.

`JsCreateRuntime` HeapNew `AllocationPolicyManager` and pass to `ThreadContext`
constructor.

`~JsrtRuntime` HeapDelete its allocationPolicyManager.


`ThreadContext`
---------------

`JsCreateRuntime` HeapNew `ThreadContext`, and pass to HeapNew `JsrtRuntime`.

`JsSetCurrentContext` sets or clears ThreadContext in `ThreadContextTLSEntry`.

`JsDisposeRuntime` HeapDelete `ThreadContext` and `JsrtRuntime`.


`ScriptContext`
---------------

`JsCreateContext` RecyclerNew `JsrtContext`. `JsrtContext` constructor ensures
`ScriptContext` (HeapNew), and Initialize() it.

`ScriptContext::Initialize` RecyclerNew and pin `globalObject`, and
Initialize() it.

`GlobalObject::Initialize` RecyclerNew and reference `JavascriptLibrary`.


`Recycler`
----------

`JsCreateContext` ensures `runtime->threadContext->recycler` (HeapNew), before
it RecyclerNew `JsrtContext`.

`~ThreadContext` HeapDelete its recycler.