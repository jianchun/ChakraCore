Chakra Components
=================

## High level life time

### `ThreadContext`

`JsCreateRuntime` HeapNew `ThreadContext`, and pass to HeapNew `JsrtRuntime`.

`JsSetCurrentContext` sets or clears ThreadContext in `ThreadContextTLSEntry`.

`JsDisposeRuntime` HeapDelete `ThreadContext` and `JsrtRuntime`.


### `ScriptContext`

`JsCreateContext` RecyclerNew `JsrtContext`. `JsrtContext` constructor ensures
`ScriptContext` (HeapNew), and Initialize() it.

`ScriptContext::Initialize` RecyclerNew and pin `globalObject`, and
Initialize() it.

`GlobalObject::Initialize` RecyclerNew and reference `JavascriptLibrary`.


### `Recycler`

`JsCreateContext` ensures `runtime->threadContext->recycler` (HeapNew), before
it RecyclerNew `JsrtContext`.

`~ThreadContext` HeapDelete its recycler.


### `AllocationPolicyManager`

Allows a client to cap memory usage, configure concurrency, control/notify
allocate/free.

`JsCreateRuntime` HeapNew `AllocationPolicyManager` and pass to `ThreadContext`
constructor.

`~JsrtRuntime` HeapDelete its allocationPolicyManager.


## GC Components

`ThreadContext` keeps a `IdleDecommitPageAllocator pageAllocator` using the
allocationPolicyManager. `Recycler` uses it as `threadPageAllocator`, also 3
other `RecyclerPageAllocator`:

```c
    IdleDecommitPageAllocator * threadPageAllocator;
    RecyclerPageAllocator recyclerWithBarrierPageAllocator;
    RecyclerPageAllocator recyclerPageAllocator;
    RecyclerPageAllocator recyclerLargeBlockPageAllocator;
```

### `Segment`

A `Segment` maintains a number of pages. (An OS page is 4KB memory. OS
allocation granularity is 64KB.) It may reserve some pages for secondary
allocation. It can use leading/trailing guard pages (decommitted) to detect
buffer overrun. `~Segment` releases its pages.

```c
    char * address;
    size_t segmentPageCount;
```

`PageSegment` extends `Segment` to support page level access. It records free
or decommitted pages. User can allocate/release pages, or decommit/allocate
again (either free or decommited).

```c
    PageBitVector freePages;
    PageBitVector decommitPages;
    uint     freePageCount;
    uint     decommitPageCount;
```

A `PageSegment` supports maximum 256 pages (1MB), plus maximum 16 guard pages.

