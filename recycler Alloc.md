recycler Alloc
==============

Essential call path:

```c++
template <ObjectInfoBits attributes, bool nothrow>
char * AllocWithAttributes(DECLSPEC_GUARD_OVERFLOW size_t size)
{
  return AllocWithAttributesInlined<attributes, nothrow>(size);
}

template <ObjectInfoBits attributes, bool nothrow>
inline char *
Recycler::AllocWithAttributesInlined(DECLSPEC_GUARD_OVERFLOW size_t size)
{
  RealAlloc<(ObjectInfoBits)(attributes & InternalObjectInfoBitMask), nothrow>(
    &autoHeap, allocSize)
}

template <ObjectInfoBits attributes, bool nothrow>
inline char*
Recycler::RealAlloc(HeapInfo* heap, size_t size)
{
  if (HeapInfo::IsSmallObject(size))
  {
    RealAllocFromBucket<attributes, true, nothrow>(heap, size);
  }

  if (HeapInfo::IsMediumObject(size))
  {
    RealAllocFromBucket<attributes, false, nothrow>(heap, size);
  }

  LargeAlloc<nothrow>(heap, size, attributes);
}
```

# LargeAlloc

Try in order
 - heap->largeObjectBucket.largeBlockList->Alloc
   heap->largeObjectBucket.PageHeapAlloc (if page heap enabled)
 - heap->AddLargeHeapBlock(sizeCat)->Alloc

LargeHeapBlock::Alloc
 - Try allocate at [`allocAddressEnd`, `addressEnd`).

LargeHeapBucket::AddLargeHeapBlock

# Small/Medium

`HeapInfo` organizes small buckets into groups, each group contains normal,
leaf, finalizable... buckets.

```c++
// HeapInfo
  HeapBucketGroup<SmallAllocationBlockAttributes> heapBuckets[HeapConstants::BucketCount];
  HeapBucketGroup<MediumAllocationBlockAttributes> mediumHeapBuckets[HeapConstants::MediumBucketCount];
  LargeHeapBucket largeObjectBucket;

// HeapBucketGroup
  SmallNormalHeapBucketT<TBlockAttributes>       heapBucket;
  SmallLeafHeapBucketT<TBlockAttributes>         leafHeapBucket;
  SmallFinalizableHeapBucketT<TBlockAttributes>  finalizableHeapBucket;
  SmallNormalWithBarrierHeapBucketT<TBlockAttributes> smallNormalWithBarrierHeapBucket;
  SmallFinalizableWithBarrierHeapBucketT<TBlockAttributes> smallFinalizableWithBarrierHeapBucket;

// HeapBucket
  TBlockAllocatorType allocatorHead;
  TBlockType * nextAllocableBlockHead;
  TBlockType * emptyBlockList;     // list of blocks that is empty and has it's page freed

  TBlockType * fullBlockList;      // list of blocks that are fully allocated
  TBlockType * heapBlockList;      // list of blocks that has free objects

// SmallHeapBlockAllocator
  char * endAddress;
  FreeObject * freeObjectList;
  TBlockType * heapBlock;

  SmallHeapBlockAllocator * prev;
  SmallHeapBlockAllocator * next;
```

```c++
Recycler::RealAllocFromBucket(HeapInfo* heap, size_t size)
{
  heap->RealAlloc<attributes, nothrow>(this, sizeCat, size);
}

HeapInfo::RealAlloc(Recycler * recycler, size_t sizeCat, size_t size)
{
  Assert(HeapInfo::IsAlignedSmallObjectSize(sizeCat));
  auto& bucket = this->GetBucket<...>(sizeCat);
  return bucket.template RealAlloc<...>(recycler, sizeCat, size);
}

HeapBucketT<TBlockType>::RealAlloc(Recycler * recycler, size_t sizeCat, size_t size)
{
  char * memBlock = allocatorHead.template InlinedAlloc<...>(recycler, sizeCat);
  if (memBlock == nullptr)
  {
      memBlock = SnailAlloc(recycler, &allocatorHead, sizeCat, size, attributes, nothrow);
  }
}
```
