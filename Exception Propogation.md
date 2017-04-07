Exception Propogation
=====================

Chakra maintains a caller stack manually to support exception propogation
across script engine.

## `DispatchExCaller`

```c
dispex.idl

interface IDispatchEx : IDispatch
    ...
  	HRESULT InvokeEx(..., IServiceProvider *pspCaller);

interface ICanHandleException : IUnknown
    ...
    // If a call to InvokeEx, or similar, results in an exception, the called
    // method can use this interface to determine if the caller is capable of
    // dealing with the exception. If the caller can handle the exception,
    // function returns S_OK. Otherwise it returns E_FAIL.
    HRESULT CanHandleException([in] EXCEPINFO *pExcepInfo, [in] VARIANT *pvar);
```

`DispatchExCaller` implements `IServiceProvider` and `ICanHandleException`.

```c++
class DispatchExCaller: public IServiceProvider, public ICanHandleException
  ...
  ScriptSite *scriptSite;
  IUnknown *m_punkCaller;
```

```c
// In current engine we have a top level try_catch block for all JS exceptions
// raised from CallRootFunction. these "leaked" exceptions are caught and
// translate to JSErr_UncaughtException. So now we don't really need this flag
// any more as we can populate the exception between the boundaries between DOM
// and JS engine.
//
// However we need this for cross thread/cross process calls.
//
// In this code path, we are likely in a HostDispatch call to other engine or
// remote process call. We should record the exception here, and let the call
// return back to us later with SCRIPT_E_PROPAGATE error, and we'll retrieve
// and throw the exception at that time. We shouldn't throw here as we are
// likely being called from different thread/different engine.
HRESULT DispatchExCaller::CanHandleException(
```

`DispatchExCaller::CanHandleException()` simply tries to create a new
`JavascriptExceptionObject` to hold the error object and calls its site's
`scriptContext->RecordException`.


## ScriptEngine -- ServiceProvider

```c
edgescriptdirect.idl:

    // Get the service provider of the calling context.
    HRESULT GetServiceProvider([out] IServiceProvider** serviceProvider);

    // Get and release the service provider of the calling context and use it
    // for IDispatchEx::InvokeEx
    HRESULT GetServiceProviderOfCaller(IServiceProvider** serviceProvider);
    HRESULT ReleaseServiceProviderOfCaller(IServiceProvider* serviceProvider);

    // serviceProvider : Caller's service provider - used for exception
    // propagation etc.
    HRESULT Execute(... IServiceProvider* serviceProvider, Var* varResult);
```

These are implemented on ScriptEngine. `Execute` passes the caller service
provider down to

```c++
HRESULT ScriptSite::CallRootFunction(..., IServiceProvider * pspCaller, ...)
    ...
    BEGIN_TRANSLATE_EXCEPTION_AND_ERROROBJECT_TO_HRESULT_NESTED
    {
        *result = function->CallRootFunction(args, scriptContext, false);
    }
    TRANSLATE_EXCEPTION_TO_HRESULT_ENTRY(const Js::JavascriptException& err)
    {
        ...
        hr = HandleJavascriptException(..., pspCaller);
    }
    END_TRANSLATE_EXCEPTION_TO_HRESULT(hr);
```

```c++
HRESULT ScriptSite::HandleJavascriptException(..., IServiceProvider * pspCaller)
    ...
    if (pspCaller != nullptr)
    {
        hr = ActiveScriptError::CanHandleException(..., pspCaller);
    }

    if (FAILED(hr) && hr != SCRIPT_E_RECORDED && hr != SCRIPT_E_PROPAGATE)
    {
        hr = ReportError(exceptionObject, scriptContext);
    }
    return hr;
```

We get `SCRIPT_E_RECORDED` when exception recorded by local script engine;
`SCRIPT_E_PROPAGATE` when exception recorded by another caller script engine.

```c++
HRESULT ScriptSite::ReportError(...)
    ...
    if (SUCCEEDED(ActiveScriptError::CreateRuntimeError(..., &pase)))
    {
        // ... unhandled exception, fire onScriptError ...
        hr = SCRIPT_E_REPORTED;
```

`HRESULT ActiveScriptError::CanHandleException(..., IServiceProvider * pspCaller)`

    Walk the caller chain with SID_GetCaller service.

    If a caller is local script engine (same process? what about cross thread?
    identified by QI IID_IJavascriptLocalProxy), directly call
    `scriptContext->RecordException` and return SCRIPT_E_RECORDED.

    Otherwise if a caller CanHandleException (QI `ICanHandleException` and call),
    assume the caller recorded exception, return `SCRIPT_E_PROPAGATE`.


### Caller Chain

`ScriptEngine` get/release ServiceProvider delegates to `ScriptSite`.

`HRESULT ScriptSite::GetDispatchExCaller(DispatchExCaller **dispatchExCaller)`

    Returns cached `currentDispatchExCaller` or newly created
    `DispatchExCaller(this, m_punkCaller)`. Clears all cached data (Don't know
    why. Resulting in only one live copy. Another call to get ServiceProvider
    would see NULL m_punkCaller.)

`void ScriptSite::ReleaseDispatchExCaller(DispatchExCaller *dispatchExCaller)`

    Cache as new `currentDispatchExCaller`.

`void ScriptSite::SetCaller(IUnknown *punkNew, IUnknown **ppunkPrev)`

    Set new `m_punkCaller`. Clears cache `currentDispatchExCaller` if exists.

`SetCaller` is only called by `CrossSite::CommonThunk`.

```c++
Var CrossSite::CommonThunk(RecyclableObject* function, ...)

    HostScriptContext* calleeHostScriptContext =
        targetScriptContext->GetHostScriptContext();
    HostScriptContext* callerHostScriptContext =
        targetScriptContext->GetThreadContext()->GetPreviousHostScriptContext();
                                                    // stack top

    // We need to setup the caller chain when we go across script site
    // boundary. Property access is OK, and we need to let host know who the
    // caller is when a call is from another script site. CrossSiteObject is
    // the natural place but it is in the target site. We build up the site
    // chain through PushDispatchExCaller/PopDispatchExCaller, and we call
    // SetCaller in the target site to indicate who the caller is. We first
    // need to get the site from the previously pushed site and set that as the
    // caller for current call, and push a new DispatchExCaller for future
    // calls off this site. GetDispatchExCaller and ReleaseDispatchExCaller is
    // used to get the current caller. currentDispatchExCaller is cached to
    // avoid multiple allocations.
    TryFinally([&]()
    {
        hr = callerHostScriptContext->GetDispatchExCaller(
                (void**)&sourceCaller);

        if (SUCCEEDED(hr))
        {
            hr = calleeHostScriptContext->SetCaller(
                (IUnknown*)sourceCaller, (IUnknown**)&previousSourceCaller);
        }

        if (SUCCEEDED(hr))
        {
            wasCallerSet = TRUE;
            hr = calleeHostScriptContext->PushHostScriptContext();
                    // now callee becomes the stack top caller
        }

        result = JavascriptFunction::CallFunction<true>(function, ...);
        ...
    },
    [&](bool hasException)
    {
        ...
            callerHostScriptContext->ReleaseDispatchExCaller(sourceCaller);
        ...
        if (wasDispatchExCallerPushed)
        {
            calleeHostScriptContext->PopHostScriptContext();
        }
        if (wasCallerSet)
        {
            calleeHostScriptContext->SetCaller(previousSourceCaller, ...);
```

## HostDispatch, JavascriptDispatch -- crossthread

Test with jshost.

testcrossother.js:

```javascript
    function echo() { print.apply(this, arguments); }
```

testcross.js:

```javascript
    function foo() {
        var other = WScript.LoadScriptFile('testcrossother.js', 'crossthread');
        other.echo('Hello', 'cross thread');
    }
    foo();
```

The call actually goes through HostDispatch and passes caller to DispatchEx.

```c++
HRESULT HostDispatch::CallInvokeExInternal(...)

    hr = this->scriptSite->GetDispatchExCaller(&pdc);
    ...
    hr = pDispEx->InvokeEx(id, lcid, wFlags, pdp, pvarRes, pei, pdc);
    ...
    this->scriptSite->ReleaseDispatchExCaller(pdc);
```

```c++
HRESULT JavascriptDispatch::InvokeEx(..., IServiceProvider *  pspCaller)

        AutoCallerPointer callerPointer(scriptSite, pspCaller);
```

The initial caller was set by following, although weirdly that caller is of
`JsHostActiveScriptSite` type and implements neither IServiceProvider nor
ICanHandleException.

```c++
HRESULT ScriptEngine::ExecutePendingScripts(VARIANT *pvarRes, EXCEPINFO *pei)

    AutoCallerPointer callerPointer(GetScriptSiteHolder(), m_pActiveScriptSite);
```

Change the test to `samethread`, then we hit above `CrossSite::CommonThunk`
path.

Change the echo function to throw an exception, we can see how the exception
propogates to caller script.

```
0:005> !jd.jstack
 #
00 chakra!DispatchExCaller::CanHandleException+0x575
01 RPCRT4!Invoke+0x73
...
07 combase!DefaultStubInvoke+0x216
...
0e user32!DispatchMessageWorker+0x19f
...
14 combase!ClassicSTAThreadDispatchCrossApartmentCall+0x59
...
18 combase!NdrExtpProxySendReceive+0xec
19 RPCRT4!NdrpClientCall3+0x423
1a RPCRT4!NdrClientCall3+0xed
1b dispex!IDispatchEx_InvokeEx_Proxy+0x127
1c chakra!HostDispatch::CallInvokeExInternal+0x345
1d chakra!HostDispatch::CallInvokeHandler+0x131
1e chakra!HostDispatch::CallInvokeEx+0xc8
1f chakra!HostDispatch::InvokeMarshaled+0xda
20 chakra!HostDispatch::InvokeByDispId+0xd61
21 chakra!DispMemberProxy::DefaultInvoke+0x176
22 chakra!amd64_CallFunction+0x86
23 chakra!Js::JavascriptFunction::CallFunction<1>+0xd7
...
2b js!foo (#1.1, #2) [Interpreter 0x000000130a5fcfd0]
...
34 chakra!Js::InterpreterStackFrame::InterpreterThunk+0x98
35 js!Global code (#1.0, #1) [Interpreter 0x000000130a5fda80]
...
3a chakra!ScriptSite::CallRootFunction+0x1a2
3b chakra!ScriptSite::Execute+0x570
3c chakra!ScriptEngine::ExecutePendingScripts+0x43b
3d chakra!ScriptEngine::ParseScriptTextCore+0xd63
3e chakra!ScriptEngine::ParseScriptText+0x2dc
3f JSHOST!JsHostActiveScriptSite::LoadScriptFromString+0x2bf
40 JSHOST!JsHostActiveScriptSite::LoadScriptFromFile+0x10de
```

The top frame's handler `DispatchExCaller` is the instance passed by frame
`chakra!HostDispatch::CallInvokeExInternal+0x345`. So the exception thrown by
the callee script is propogated and recorded by caller script engine.
