# Error Pattern: Angular SKY UX — Module Not Imported / Component Not Recognized

## Error ID: FE-SKY-004
## System: Angular 18 SPA — SKY UX Component Library
## Severity: MEDIUM

---

## Raw Log Sample
```
ERROR in src/app/features/gift-form/gift-form.component.html:12:5
NG8001: 'sky-input-box' is not a known element:
  1. If 'sky-input-box' is an Angular component, then verify that it is included in the '@Component.imports' of this component.
  2. If 'sky-input-box' is a Web Component then add 'CUSTOM_ELEMENTS_SCHEMA' to the '@Component.schemas' of this component to suppress this message.

ERROR in src/app/features/gift-form/gift-form.component.html:18:9
NG8001: 'sky-lookup' is not a known element:
  1. If 'sky-lookup' is an Angular component, then verify that it is included in the '@Component.imports' of this component.
  2. If 'sky-lookup' is a Web Component then add 'CUSTOM_ELEMENTS_SCHEMA' to the '@Component.schemas' of this component to suppress this message.

ERROR in src/app/features/gift-form/gift-form.component.html:25:9
NG8002: Can't bind to 'labelText' since it isn't a known property of 'sky-input-box'.

src/app/features/gift-form/gift-form.component.ts:8
@Component({
  standalone: true,
  selector: 'app-gift-form',
  imports: [CommonModule, ReactiveFormsModule],  // <-- missing SKY UX modules
  templateUrl: './gift-form.component.html'
})

Build failed with 3 errors.
```

---

## Root Cause
The component uses `sky-input-box`, `sky-lookup`, and their input bindings in the template but
the corresponding Angular modules (`SkyInputBoxModule`, `SkyLookupModule`) are not listed in
the `imports` array of the standalone component decorator. Angular strict template checking
reports each missing module as a separate compile error.

Common causes:
1. Developer used a SKY UX component in the template but forgot to add the module import
2. The module was removed during a refactor or code review
3. The wrong module name was imported (e.g. `SkyFormsModule` instead of `SkyInputBoxModule`)

---

## Fix
Add the missing SKY UX modules to the standalone component's `imports` array:

```typescript
// BEFORE (broken):
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-gift-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './gift-form.component.html'
})

// AFTER (fixed):
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SkyInputBoxModule } from '@skyux/forms';
import { SkyLookupModule } from '@skyux/lookup';
import { SkyDatepickerModule } from '@skyux/datetime';

@Component({
  standalone: true,
  selector: 'app-gift-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SkyInputBoxModule,   // provides sky-input-box, sky-form-error
    SkyLookupModule,     // provides sky-lookup
    SkyDatepickerModule, // provides sky-datepicker + skyDatepickerInput
  ],
  templateUrl: './gift-form.component.html'
})
```

Each SKY UX component has its own module:
- `sky-input-box`, `sky-form-error` → `SkyInputBoxModule` from `@skyux/forms`
- `sky-lookup` → `SkyLookupModule` from `@skyux/lookup`
- `sky-datepicker` → `SkyDatepickerModule` from `@skyux/datetime`
- `sky-modal`, `sky-modal-content`, `sky-modal-footer` → `SkyModalModule` from `@skyux/modals`
- `sky-toolbar`, `sky-toolbar-item` → `SkyToolbarModule` from `@skyux/layout`
- `sky-dropdown` → `SkyDropdownModule` from `@skyux/popovers`
- `sky-repeater`, `sky-repeater-item` → `SkyRepeaterModule` from `@skyux/lists`
- `sky-ag-grid-wrapper` → `SkyAgGridModule` from `@skyux/ag-grid`

---

## Prevention
- Use a shared `SKYUX_IMPORTS` constant array across feature components to avoid re-listing
- Add ESLint rule for missing template imports
- Run `ng build` (not just `ng serve`) in CI to catch template errors at build time
