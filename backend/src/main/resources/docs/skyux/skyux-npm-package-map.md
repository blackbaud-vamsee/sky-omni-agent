# SKY UX NPM Package → Module → Component Map
# Source: https://developer.blackbaud.com/skyux/
# Use this to determine which package/module to import for each component.

## Quick Reference Table

| Component / Feature       | NPM Package          | Module to Import                            | Selector / Directive             |
|---------------------------|----------------------|--------------------------------------------- |----------------------------------|
| Button                    | `@skyux/theme`       | CSS only — add sky.css + modern/styles.css  | CSS classes on `<button>`        |
| Input Box                 | `@skyux/forms`       | `SkyInputBoxModule`                         | `sky-input-box`                  |
| Form Error                | `@skyux/forms`       | `SkyInputBoxModule`                         | `sky-form-error`                 |
| Character Count           | `@skyux/forms`       | `SkyCharacterCounterModule`                 | `sky-character-counter-indicator`|
| Lookup                    | `@skyux/lookup`      | `SkyLookupModule`                           | `sky-lookup`                     |
| Autocomplete              | `@skyux/lookup`      | `SkyAutocompleteModule`                     | `sky-autocomplete`               |
| Datepicker                | `@skyux/datetime`    | `SkyDatepickerModule`                       | `sky-datepicker` + `skyDatepickerInput` directive |
| Fuzzy Datepicker          | `@skyux/datetime`    | `SkyDatepickerModule`                       | `sky-datepicker` + `skyFuzzyDatepickerInput` |
| Timepicker                | `@skyux/datetime`    | `SkyTimepickerModule`                       | `sky-timepicker`                 |
| Modal                     | `@skyux/modals`      | `SkyModalModule`                            | `sky-modal`, `sky-modal-content`, `sky-modal-footer` |
| Confirm / Alert Dialog    | `@skyux/modals`      | `SkyConfirmModule`                          | `SkyConfirmService`              |
| Toolbar                   | `@skyux/layout`      | `SkyToolbarModule`                          | `sky-toolbar`, `sky-toolbar-item`, `sky-toolbar-section`, `sky-toolbar-view-actions` |
| Box                       | `@skyux/layout`      | `SkyBoxModule`                              | `sky-box`                        |
| Page                      | `@skyux/pages`       | `SkyPageModule`                             | `sky-page`                       |
| Fluid Grid                | `@skyux/layout`      | `SkyFluidGridModule`                        | `sky-fluid-grid`, `sky-row`, `sky-column` |
| Card                      | `@skyux/layout`      | `SkyCardModule`                             | `sky-card`                       |
| Description List          | `@skyux/layout`      | `SkyDescriptionListModule`                  | `sky-description-list`           |
| Repeater                  | `@skyux/lists`       | `SkyRepeaterModule`                         | `sky-repeater`, `sky-repeater-item` |
| Paging                    | `@skyux/lists`       | `SkyPagingModule`                           | `sky-paging`                     |
| Filter                    | `@skyux/lists`       | `SkyFilterModule`                           | `sky-filter-button`, `sky-filter-summary` |
| Sort                      | `@skyux/lists`       | `SkySortModule`                             | `sky-sort`                       |
| Data Manager              | `@skyux/data-manager`| `SkyDataManagerModule`                      | `sky-data-manager`               |
| Data Grid (AG Grid)       | `@skyux/ag-grid`     | `SkyAgGridModule`                           | `sky-ag-grid-wrapper`, `skyAgGridRowDelete` |
| Dropdown / Context Menu   | `@skyux/popovers`    | `SkyDropdownModule`                         | `sky-dropdown`, `sky-dropdown-menu`, `sky-dropdown-item` |
| Popover                   | `@skyux/popovers`    | `SkyPopoverModule`                          | `sky-popover`, `[skyPopover]`    |
| Alert                     | `@skyux/indicators`  | `SkyAlertModule`                            | `sky-alert`                      |
| Label                     | `@skyux/indicators`  | `SkyLabelModule`                            | `sky-label`                      |
| Status Indicator          | `@skyux/indicators`  | `SkyStatusIndicatorModule`                  | `sky-status-indicator`           |
| Icon                      | `@skyux/icon`        | `SkyIconModule`                             | `sky-icon`                       |
| Wait / Spinner            | `@skyux/indicators`  | `SkyWaitModule`                             | `sky-wait`, `SkyWaitService`     |
| Toast                     | `@skyux/toast`       | `SkyToastModule`                            | `SkyToastService`                |
| Tabs                      | `@skyux/tabs`        | `SkyTabsModule`                             | `sky-tabset`, `sky-tab`          |
| Sectioned Form            | `@skyux/tabs`        | `SkySectionedFormModule`                    | `sky-sectioned-form`             |
| Split View                | `@skyux/split-view`  | `SkySplitViewModule`                        | `sky-split-view`                 |
| Selection Modal           | `@skyux/lookup`      | `SkySelectionModalModule`                   | `SkySelectionModalService`       |
| Phone Field               | `@skyux/phone-field` | `SkyPhoneFieldModule`                       | `sky-phone-field`                |
| Country Field             | `@skyux/lookup`      | `SkyCountryFieldModule`                     | `sky-country-field`              |
| Email Validation          | `@skyux/validation`  | `SkyEmailValidationModule`                  | `skyEmail` directive             |
| URL Validation            | `@skyux/validation`  | `SkyUrlValidationModule`                    | `skyUrl` directive               |
| Numeric pipe              | `@skyux/core`        | `SkyNumericModule`                          | `skyNumeric` pipe                |
| Date pipe                 | `@skyux/datetime`    | `SkyDatePipeModule`                         | `skyDate` pipe                   |
| Avatar                    | `@skyux/avatar`      | `SkyAvatarModule`                           | `sky-avatar`                     |
| Flyout                    | `@skyux/flyout`      | `SkyFlyoutModule`                           | `SkyFlyoutService`               |
| Inline Form               | `@skyux/inline-form` | `SkyInlineFormModule`                       | `sky-inline-form`                |
| Action Button             | `@skyux/action-bars` | `SkyActionButtonModule`                     | `sky-action-button`              |

---

## Key Rules for Architect Agent

1. **Always wrap `sky-lookup` and `sky-datepicker` inside `sky-input-box`** — they don't style themselves.
2. **`sky-input-box` provides**: label association, hint text, required marker, error display, help inline button.
3. **Use `SkyModalService.open()` to open modals** — never create modals inline.
4. **Inject `SkyModalInstance`** into the modal component constructor to call `.save()` and `.cancel()`.
5. **AG Grid column types** use `SkyCellType` enum — never raw string column type names.
6. **Register AG Grid modules**: `ModuleRegistry.registerModules([AllCommunityModule])` before using data grid.
7. **Button styles are CSS-only** — no module import needed, just add `@skyux/theme` CSS to angular.json.
8. **For `aria-label` on icon-only buttons**: always required, include context ("Edit phone" not just "Edit").
9. **Primary buttons**: maximum ONE per page/modal.
10. **Use `SkyDataManagerModule`** for list views that need filtering, sorting, and view switching together.

---

## Complete Standalone Component Import Example

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

// SKY UX imports
import { SkyInputBoxModule } from '@skyux/forms';
import { SkyLookupModule } from '@skyux/lookup';
import { SkyDatepickerModule } from '@skyux/datetime';
import { SkyModalModule } from '@skyux/modals';
import { SkyToolbarModule } from '@skyux/layout';
import { SkyRepeaterModule } from '@skyux/lists';
import { SkyDropdownModule } from '@skyux/popovers';
import { SkyIconModule } from '@skyux/icon';
import { SkyAgGridModule } from '@skyux/ag-grid';
import { SkyDataManagerModule } from '@skyux/data-manager';

@Component({
  standalone: true,
  selector: 'app-constituent-list',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SkyInputBoxModule,
    SkyLookupModule,
    SkyDatepickerModule,
    SkyModalModule,
    SkyToolbarModule,
    SkyRepeaterModule,
    SkyDropdownModule,
    SkyIconModule,
    SkyAgGridModule,
    SkyDataManagerModule,
  ],
  templateUrl: './constituent-list.component.html',
})
export class ConstituentListComponent {}
```
