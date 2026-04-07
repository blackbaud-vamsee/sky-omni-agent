# Error Pattern: Angular Reactive Form — Cannot Read Properties of Undefined (Reading 'value')

## Error ID: FE-FORM-006
## System: Angular 18 — Reactive Form, Gift Entry Component
## Severity: MEDIUM

---

## Raw Log Sample
```
ERROR TypeError: Cannot read properties of undefined (reading 'value')
    at GiftEntryComponent.calculateTotal (gift-entry.component.ts:112)
    at GiftEntryComponent.ngOnInit (gift-entry.component.ts:67)
    at callHook (core.mjs:3583)
    at callHooks (core.mjs:3548)
    at executeInitAndCheckHooks (core.mjs:3499)
    at refreshView (core.mjs:12400)

ERROR TypeError: Cannot read properties of null (reading 'get')
    at GiftEntryComponent.onAmountChange (gift-entry.component.ts:145)
    at HTMLInputElement.<anonymous> (gift-entry.component.html:31)

WARN Angular - ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked.
  Previous value: 'ng-untouched: true'
  Current value: 'ng-untouched: false'
  Find more at https://angular.io/errors/NG0100
```

---

## Root Cause
Three related issues in `GiftEntryComponent`:

1. **`calculateTotal` called in `ngOnInit` before `FormGroup` is initialized**: The method accesses
   `this.giftForm.get('amount').value` but `giftForm` is `undefined` at the point `ngOnInit` runs
   because `initForm()` is called after `calculateTotal()` in the lifecycle sequence.

2. **`onAmountChange` accesses form control on destroyed/recycled component**: The `(input)` binding
   fires an event after the component is destroyed (e.g. inside a modal that closes quickly),
   `this.giftForm` is `null` at that point.

3. **`ExpressionChangedAfterItHasBeenCheckedError`**: A `patchValue()` call inside a subscription
   triggers value change detection after Angular's change detection cycle has completed.

---

## Fix

```typescript
// PROBLEM 1 — call initForm() BEFORE calculateTotal() in ngOnInit:
ngOnInit(): void {
  this.initForm();           // initialize first
  this.calculateTotal();     // then use form safely
  this.loadExistingGift();
}

// PROBLEM 2 — null-guard in event handlers:
onAmountChange(): void {
  if (!this.giftForm) return;  // guard against destroyed component
  const amount = this.giftForm.get('amount')?.value ?? 0;
  this.updateSummary(amount);
}

// PROBLEM 3 — wrap patchValue in setTimeout to defer past change detection:
this.giftTypeService.getDefault().subscribe(defaultType => {
  // Use setTimeout(0) to push update outside current CD cycle
  setTimeout(() => {
    this.giftForm.patchValue({ giftType: defaultType });
  });
});

// BETTER — declare FormGroup immediately at field level so it's never undefined:
export class GiftEntryComponent {
  giftForm: FormGroup = this.fb.group({
    amount: [null, [Validators.required, Validators.min(0.01)]],
    giftType: ['cash', Validators.required],
    constituentId: [null, Validators.required],
    giftDate: [new Date()],
  });

  constructor(private fb: FormBuilder) {}

  // No need to call initForm() in ngOnInit — form exists at construction time
}
```

---

## Prevention
- Always declare `FormGroup` as a class field with initial value using `FormBuilder` injection,
  never as `FormGroup | undefined` initialized later in `ngOnInit`
- Use optional chaining (`?.`) when accessing form controls in event handlers
- Unsubscribe from all observables in `ngOnDestroy` to prevent stale callbacks:
  ```typescript
  private destroy$ = new Subject<void>();
  
  ngOnInit(): void {
    this.someService.data$.pipe(takeUntil(this.destroy$)).subscribe(...);
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  ```
