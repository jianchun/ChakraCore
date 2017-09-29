jd hbstats
==========

Count recycler objects. People read this one to understand fragmentation.

# !hbstats

```
0:008> !hbm
----------------------------
Type     Count       Bytes
----------------------------
Large:      35      880640
Small:    1622    27213824
----------------------------
Total:    1657    28094464

0:008> !hbstats
Bucket stats Recycler: 000002968802b760
---------------------------------------------------------------------------------------
                  #Blk   #Objs    #Fin      PgBytes   FreeBytes  TotalBytes UsedPercent
---------------------------------------------------------------------------------------
Normal (S)   16 :    72    5902       0       94432     1085216     1179648     8.01%
Leaf   (S)   16 :    50    3987       0       63792      755408      819200     7.79%
NormWB (S)   16 :    28    1453       0       23248      435504      458752     5.07%
Normal (S)   32 :   144   13098       0      419136     1940160     2359296    17.77%
Leaf   (S)   32 :   144    9599       0      307168     2052128     2359296    13.02%
Fin    (S)   32 :     2     378     378       12096       20672       32768    36.91%
NormWB (S)   32 :    19     602       0       19264      292032      311296     6.19%
...
Normal (S)  768 :     2      42       0       32256         512       32768    98.44%
Leaf   (S)  768 :     1       1       0         768       15616       16384     4.69%
Normal (M) 1024 :     1      15       0       15360       17408       32768    46.88%
Leaf   (M) 1024 :     2      32       0       32768       32768       65536    50.00%
...
Normal (M) 7168 :     1       1       0        7168       21504       28672    25.00%
Leaf   (M) 8192 :     2       4       0       32768       32768       65536    50.00%
Large           :    35      35       0      789216       91424      880640    89.62%
-----------------------------------------------------------------------------------------
Total           :  1657  115709   10610     9238160    18856304    28094464    32.88%
```

This inspects the HeapBlockMap of current Recycler.

## RemoteHeapBlockMap

RemoteHeapBlockMap() constructor builds the local `address -> RemoteHeapBlock`
map and cache in jd.

```c++
        ForEachHeapBlockRaw(heapBlockMap, [this, &localCachedHeapBlock, &iter](
          ULONG64 nodeIndex, ULONG64 l1, ULONG64 l2, ULONG64 block,
          RemoteHeapBlock& heapBlock)
        {
            ULONG64 address =
              ((nodeIndex * l1ChunkSize + l1) * l2ChunkSize + l2) * g_Ext->m_PageSize;
            (*localCachedHeapBlock.get())[address] = heapBlock;
```

### ForEachHeapBlockRaw

On x86, `ProcessL1Chunk()` on `heapBlockMap.map`. On x64, walk
`heapBlockMap.list` and `ProcessL1Chunk()` on each. These are in corresponding
to runtime `HeapBlockMap32` and `HeapBlockMap64`.

`HeapBlockMap64` keeps a `list` of `Node`:
`{ uint nodeIndex; Node * next; HeapBlockMap32 map; }`.

`nodeIndex` = `address >> 32`.

### ProcessL1Chunk, ProcessL2Chunk

`HeapBlockMap32` has

```c++
    static const uint L1Count = 4096;
    static const uint L2Count = 256;
    static const uint PageSize = AutoSystemInfo::PageSize; // 4096

    class L2MapChunk
    {
        HeapBlockInfo blockInfo[L2Count];
        HeapBlock* map[L2Count];
    };

    uint count;  // of L2 chunks
    L2MapChunk * map[L1Count];
```

Each L2 chunk represents 256 * 4096 = 1MB address space. Total L1Count 4096
chunks represents 4GB space.

```
         +--- nodeIndex
        /
  | high 32 bit |   | 12-bit   8-bit   12-bit |
                        /       |        \
                id1  --+        +-- id2   +-- 1 page
```

For each address, the lower 32 bits determines chunk mapping. Top 12 bits
(4096), id1, maps to a L2 chunk. Middle 8 bits (256), id2, maps to a HeapBlock.

## RemoteHeapBlock

`RemoteHeapBlock()` constructor reads HeapBlock `heapBlockType`, `address`, and
computes large HeapBlock size.

## Stats

For each HeapBlock type jd computes stats:

```c++
stats->count++;                                                     // #Blk
stats->totalByteCount += remoteHeapBlock.GetSize();             // TotalBytes
stats->finalizeCount += remoteHeapBlock.GetFinalizeCount();         // #Fin
stats->objectCount += remoteHeapBlock.GetAllocatedObjectCount();    // #Objs
stats->objectByteCount += remoteHeapBlock.GetAllocatedObjectSize(); // PgBytes
```

totalByteCount (size):
 - LargeHeapBlock: pageCount * PAGE_SIZE
 - SmallHeapBlock: objectSize * objectCount

allocated object count / size:
 - LargeHeapBlock: Walk LargeObjectHeader* list, accumulate large object count
   and `objectSize`.

  ```
    LargeHeapBlocK
    LargeObjectHeader* [objectCount]
    TrackerData* [objectCount] (optional)
    LargeObjectHeader LargeObject
    LargeObjectHeader LargeObject
    ...
  ```

- SmallHeapBlock: Subtract free objects from total objects. Search
  heapBlock.heapBucket.allocatorHead list for this heapBlock. Between
  allocator.freeObjectList and allocator.endAddress are free objects.

