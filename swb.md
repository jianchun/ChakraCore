The chakra implementation of concurrent GC and partial GC are based on background scanning the dirty pages. On windows, the OS kernel provides a feature called Write Watch( we also call it hardware write barrier), which the system keeps track of the pages that are written to in the committed memory region, ChakraCore GC use this information to determine which recycler allocated pages are dirty and do background rescan/mark on them. On non-Windows platform the hardware write barrier is not available, so we use software write barrier to track the dirty pages. In implementation of software write barrier ChakraCore uses a card table to map the whole address space, every page in the process has one byte in the card table corresponding to it. And all the recycler allocated non-Leaf struct have smart pointer wrapped to all its recycler pointer fields, while updating the pointer field, the smart pointer will update the corresponding byte in the card table, so the background thread knows the page is dirty. 

The key to make the software write barrier work correctly and stably is to make sure all necessary pointer fields are annotated with the smart pointer correctly. In order to achieve this, here's a few rules:

1. Annotate all fields recycler allocated struct/class with "Field" macro like below. Please also annotate non-pointer as well, it is a no-op for now but can use to provide more information for precised GC in the future. If you believe a pointer field will not be pointing to recycler memory, or, if it's pointing to recycler memory but the target recycler memory lifetime is tracked specifically on another struct/class, you can explicitly mark this field with FieldNoBarrier, while won't do barrier bit updating while modifying this field.
```
    struct A
    {
        Field(int)              intField;
        Field(int*)             intArray;
        Field(Var)              aVar;
        Field(Field(Var)*)      varArray;
        FieldNoBarrier(char*)   buffer; // e.g: buffer is heap allocated
    }
```

2. If your function receive a recycler pointer to update, please use Field to define a local substitution of the argument and use that to do the update
```
    void UpdateSlot(Var* slots, int idx)
    {
        Field(Var)* localSlots = slots;
        localSlots[idx] = RecyclerNew(...);
    }
```

3. If you need to cast a WriteBarrierPtr<T> to T*, the suggested way is to use PointerValue() function.

4. Try the best to avoid 'plus Array' at the end of structure, if that's really necessary make sure #2 above is applied.

5. In the initialization list of constructor, if you have a write barrier pointer need to be initialized as null, use nullptr instead of NULL or 0. There's special overload to avoid unnecessary barrier update in this case.

6. If you are going to add a global instance of annotated structure, please design a special contructor to avoid updating barrier bits. This is because on x64 the card table is not initialized for the image. See FunctionInfo structure as an example.



In linux build, there is a clang plugin to help preventing missing annotations, if you hit build error in CI please do following

- JC, can you write this part


Other than the plugin, there's runtime flags to help check if there's missing barrier. You can run your test with "-RecyclerConcurrentStress -RecyclerVerifyMark -KeepRecyclerTrackData" switches. Usually you'll get assertion for missing barrier. Sometimes you may get 'IsMarked()' assertion, some of such assertion can be false positive because of the conservative GC nature. 

If would like to test this with windows, here's the steps to enable it:

1. change #define GLOBAL_ENABLE_WRITE_BARRIER 0 to be 1 under _WIN32 and rebuild
2. run tests with "-ForceSoftwareWriteBarrier" switch, this can be combined with the above stressing/verifying switches.