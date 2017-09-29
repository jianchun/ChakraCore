jd memstats
===========

# !memstats

```
0:045> !jd.memstats /all
Page Allocator Total Used Bytes: 38215680
Thread context: 0000029688027d90 Recycler: 000002968802b760(switch to thread) (!jsobjectstats)
Page Allocators:
-----------------------------------------------------------------------------------------------------------------
Allocator           Committed        Used      Unused |   Used% |    Reserved    Disabled   Commit%     Disabled%
-----------------------------------------------------------------------------------------------------------------
Thread          :     9502720     9035776      466944 |  95.09% |    10223616           0    92.95%        0.00%
WriteWatch      :    18481152    18022400      458752 |  97.52% |    19922944           0    92.76%        0.00%
WriteWatchLarge :     1409024      884736      524288 |  62.79% |     1441792           0    97.73%        0.00%
WriteBarrier    :     1966080     1966080           0 | 100.00% |     2097152           0    93.75%        0.00%
MarkCxt         :       36864       36864           0 | 100.00% |      131072           0    28.13%        0.00%
Diag            :        4096        4096           0 | 100.00% |      131072           0     3.13%        0.00%
CodePreRes      :      811008      811008           0 | 100.00% |      917504       57344    88.39%        6.25%
CodeThunk       :       12288       12288           0 | 100.00% |      131072           0     9.38%        0.00%
BG-CodeGen      :       36864       36864           0 | 100.00% |      131072           0    28.13%        0.00%
-----------------------------------------------------------------------------------------------------------------
0000029688027d90:    32260096    30810112     1449984 |  95.51% |    35127296       57344    91.84%        0.16%
Arena Allocators:
-------------------------------------------------------------------------------------
Allocator     #Block       Total        Used      Unused    Overhead OverHead% Unused%
-------------------------------------------------------------------------------------
TC             :  44      195904      187472        7024        1408   0.72%   3.61%
TC-InlineCache :  17       93936       89232        4160         544   0.58%   4.45%
TC-IsInstIC    :   1        4080         112        3936          32   0.79%  97.23%
TC-ProtoChain  :   1        4080          32        4016          32   0.79%  99.21%
SC             :  15       65296       56608        8208         480   0.74%  12.66%
SC-InlineCache : 120      489600      450592       35168        3840   0.79%   7.24%
SC-IsInstIC    :   1        4080         384        3664          32   0.79%  90.51%
SC-Guest       :   1        4080           0        4048          32   0.79% 100.00%
SC-Diag        :   1        4080          96        3952          32   0.79%  97.63%
SC-BGJIT       :   9       36720       34672        1760         288   0.79%   4.83%
```

### Page Allocator Total Used Bytes: 38215680

This is from process global variable `chakra!totalUsedBytes`. It is updated by
each PageAllocator via `AddUsedBytes/SubUsedBytes`, and emitted ETW event
`JSCRIPT_PAGE_ALLOCATOR_USED_SIZE` with each update.

Q: Above all "Used" addup does not equal that totalUsedBytes number (31629312
vs. 38215680). Maybe there are missing/hidden allocators not listed?

### Thread context: 0000029688027d90 Recycler: 000002968802b760

Then read process global `ThreadContext::globalListFirst` to travel all
threadContexts.

### Page Allocators:

Walk `threadContext.ForEachPageAllocator()`. The list of possible page
allocators are hard coded and checked. Typically:

```
Thread: threadContext.Field("pageAllocator") or recycler.Field("threadPageAllocator")

WriteWatch: recycler.Field("recyclerPageAllocator")
WriteWatchLarge: recycler.Field("recyclerLargeBlockPageAllocator"
WriteBarrier: recycler.Field("recyclerWithBarrierPageAllocator")
MarkStack: recycler.Field("markStackPageAllocator")
MarkCxt: recycler.Field("markContext").Field("pagePool").Field("pageAllocator")
ParaMarkCxt1: recycler.Field("parallelMarkContext1").Field("pagePool").Field("pageAllocator")
BGProfiler: recycler.Field("backgroundProfilerPageAllocator")

Diag: threadContext.Field("diagnosticPageAllocator") or debugManager.Field("diagnosticPageAllocator")

(pre RS1)
BGJob: threadContext.jobProcessor.parallelThreadData[].backgroundPageAllocator

CodePreRes: threadContext.codePageAllocators.preReservedHeapAllocator
Code: threadContext.codePageAllocators.pageAllocator
CodeThunkPreRes: threadContext.thunkPageAllocators.preReservedHeapAllocator
CodeThunk: threadContext.thunkPageAllocators.pageAllocator

FG-CodeGen: scriptContext.nativeCodeGen.foregroundAllocators.pageAllocator
BG-CodeGen: scriptContext.nativeCodeGen.backgroundAllocators.pageAllocator
```

### Arena Allocators:

```
TC: threadContext.threadAlloc
TC-InlineCache: threadContext.inlineCacheThreadInfoAllocator
TC-IsInstIC: threadContext.isInstInlineCacheThreadInfoAllocator
TC-ProtoChain: threadContext.prototypeChainEnsuredToHaveOnlyWritableDataPropertiesAllocator

SC-...: scriptContext arena allocators
```

## Page Allocator fields

reservedBytes, committedBytes, usedBytes, unusedBytes

Except "usedBytes", jd states some version doesn't have accurate numbers on
page allocators and always compute by digging in page allocator data.

### ComputeReservedAndCommittedBytes

Walk [segments, fullSegments, emptySegments, decommitSegments, largeSegments].

```
reserved += segmentPageCount * 4096
decommitted += decommitPageCount * 4096
freed += freePageCount * 4096

committed = reserved - decommitted
```
