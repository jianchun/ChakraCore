//-------------------------------------------------------------------------------------------------------
// Copyright (C) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE.txt file in the project root for full license information.
//-------------------------------------------------------------------------------------------------------
#include "CommonMemoryPch.h"

//----------------------------------------
// Default operator new/delete overrides
//----------------------------------------

// Update:
//
// Overriding global operator new/delete causes problems in host.
// Do not use global operator new/delete.
//
// To support memory tracking, use explicit HeapNew/HeapDelete.
//

// Uncomment to check global operator new/delete calls (link error if any)
#if 0
extern void _not_exist_check_operator_new_delete_call();

_Ret_maybenull_ void * __cdecl
operator new(DECLSPEC_GUARD_OVERFLOW size_t byteSize)
{
    _not_exist_check_operator_new_delete_call();
    return HeapNewNoThrowArray(char, byteSize);
}

_Ret_maybenull_ void * __cdecl
operator new[](DECLSPEC_GUARD_OVERFLOW size_t byteSize)
{
    _not_exist_check_operator_new_delete_call();
    return HeapNewNoThrowArray(char, byteSize);
}

void __cdecl
operator delete(void * obj) _NOEXCEPT_
{
    _not_exist_check_operator_new_delete_call();
    HeapAllocator::Instance.Free(obj, (size_t)-1);
}

void __cdecl
operator delete[](void * obj) _NOEXCEPT_
{
    _not_exist_check_operator_new_delete_call();
    HeapAllocator::Instance.Free(obj, (size_t)-1);
}
#endif
