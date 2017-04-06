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

`ThreadContext` keeps a `IdleDecommitPageAllocator pageAllocator` using its
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

Properties:

 - `PageCount`: all page count (excluding guard pages). Including pages
 available to user and secondary pages.

 - `AvailablePageCount`: pages available to user (excluding
 secondaryAllocPageCount).

 - `Address`: user pages starting address.

 - `EndAddress`: user pages ending address, same as secondary pages starting
 address.


`PageSegment` extends `Segment` to support page level access. It records free
or decommitted pages. User can allocate/release pages, or decommit/allocate
again (either free or decommited).

```c
    PageBitVector freePages;
    PageBitVector decommitPages;
    uint     freePageCount;
    uint     decommitPageCount;
```

Some properties:

 - `IsEmpty`: All available pages are free.

 - `IsAllDecommitted`: All available pages are decommited.

 - `ShouldBeInDecommittedList`: Has some decommited pages.

 - `IsFull`: No free pages and no decommited pages (cannot allocate).

A `PageSegment` supports maximum 256 pages (1MB), plus maximum 16 guard pages.


A `PageAllocation` records info about an allocation from a `Segment` in the
front.

```
    {pageCount, segment}----+------------------------
    ^                       ^
    |                       |
    pageAllocation          address, size
```


### `PageAllocator`

`PageAllocator` manages page segments.

```c
    DListBase<TPageSegment> segments;
    DListBase<TPageSegment> fullSegments;
    DListBase<TPageSegment> emptySegments;
    DListBase<TPageSegment> decommitSegments;

    DListBase<TSegment> largeSegments;
```

`PageAllocation* AllocPagesForBytes(size_t requestBytes)`

    `AllocAllocation` pages to hold `PageAllocation + requestBytes`.

`PageAllocation* AllocAllocation(size_t pageCount)`

    If `pageCount` exceeds `maxAllocPageCount` (default 32 pages --> 128KB),
    allocate a new large segment for it. Otherwise `AllocPages`.

`char* AllocPages(uint pageCount, TPageSegment ** pageSegment)`

    1. `TryAllocFreePages`

    2. `SnailAllocPages`

`char* TryAllocFreePages(uint pageCount, TPageSegment ** pageSegment)`

    1. Try allocate from one of `this->segments`.

    2. Try allocate from background zero or free page queue.

`char* SnailAllocPages(uint pageCount, TPageSegment ** pageSegment)`

    1. Try scan and allocate from one of `this->emptySegments`.

    2. Try scan and allocate from one of `this->decommitSegments`.

    3. If allocating `maxAllocPageCount` is going to create new free pages and
    exceed `maxFreePageCount` (default 1024 --> 4MB, but 0 for thread page
    allocator), create a new decommit segment and allocate from it.

    4. Otherwise allocate a new empty segment and allocate from it.

`void ReleaseAllocation(PageAllocation * allocation)`

    Call `Release` with allocation->pageCount/segment info.

`void Release(void * address, size_t pageCount, void * segmentParam)`

    If `pageCount` exceeds `maxAllocPageCount`, `ReleaseSegment` (from
    `this->largeSegments`). Otherwise `ReleasePages`.

`void ReleasePages(void * address, uint pageCount, void * segmentParam)`

    If adding these pages to free page pool exceeds `maxFreePageCount`, either
    release a whole empty segment (to reduce the number of VirtualFree and
    fragmentation) and add the pages to free pool if possible, or just decommit
    the pages to reduce working set.

    Otherwise either queue zero pages if allowed, or zero them and add to free
    page pool right away.


### `IdleDecommitPageAllocator`

Support idle decommit.

```
ThreadContext::EnterScriptStart
 -> recycler->EnterIdleDecommit()
  -> each pageAllocator->EnterIdleDecommit()

ThreadContext::EnterScriptEnd
 -> recycler->LeaveIdleDecommit()
  -> each pageAllocator->LeaveIdleDecommit()
```

LeaveIdleDecommit(): When a pageAllocator determines it needs idle decommit,
recycler will fire `this->concurrentIdleDecommitEvent` to wake up background
thread to do the work. (Except when idle decommit not enabled, or if
threadService present, LeaveIdleDecommit will DecommitNow in thread instead.)

Properties:

 - `isUsed`: Track if this page allocator did any allocation during current
 enter/leave script session. Used as a heuristics factor.

 - `maxFreePageCount`: Toggles between max idle count (OnEnter, default to 4MB)
 and non-idle count (OnLeave if nothing to decommit and not used, default to
 0). Setting to larger idle count for in-script to reduce in-script decommit.

 - `decommitTime`: Desired decommit time, computed OnLeave to be 1 second in
 future if `isUsed`.

 - `hasDecommitTimer`: Track if OnLeave has indicated needs timer (or signal)
 for idle decommit. Passes down to `hadDecommitTimer` to affect scheduling.

Related functions:

`void Recycler::EnterIdleDecommit()`

    1. Each pageAllocator->EnterIdleDecommit()

    2. Reset `needIdleDecommitSignal` to `IdleDecommitSignal_None` if it was
    `IdleDecommitSignal_NeedTimer` (will recompute OnLeave). No change if it
    was `IdleDecommitSignal_NeedSignal`.

`void Recycler::LeaveIdleDecommit()`

    1. Each pageAllocator->LeaveIdleDecommit()

    2. If any pageAllocator indicates need signal (to decommit now), or if any
    pageAllocator needs timer (to decommit in future) but background thread
    missed that and was waiting INFINITE, fire `concurrentIdleDecommitEvent`
    event to wake up background thread.

`DWORD Recycler::ThreadProc()`

    Do background thread work. Each pageAllocator->IdleDecommit() either
    DecommitNow() or returns waitTime for future. Compute the min waitTime,
    wait on it; if min waitTime is INFINITE, change `needIdleDecommitSignal` to
    indicate it needs signal to wake up (or if `needIdleDecommitSignal` changed
    already, restart work loop immediately).

`DWORD IdleDecommitPageAllocator::IdleDecommit()`

    Called by and run on background thread. Either DecommitNow() or compute a
    waitTime to retry in future.
