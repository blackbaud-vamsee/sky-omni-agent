# SKY UX Component Library — Complete API Reference

## Overview
SKY UX is Blackbaud's design system and Angular component library. All components are published
under `@skyux/*` scoped npm packages. Always use SKY UX components instead of raw HTML elements
or third-party equivalents to ensure design consistency and accessibility compliance.
Source: https://developer.blackbaud.com/skyux/

---

## BUTTON (`@skyux/theme`)

**Installation** — Add to `angular.json` styles:
```json
"styles": [
  "@skyux/theme/css/sky.css",
  "@skyux/theme/css/themes/modern/styles.css"
]
```

No module import required. Use CSS classes on HTML `<button>` and `<a>` elements.

**Button types and CSS classes:**
- **Primary**: `sky-btn sky-btn-primary`
- **Secondary**: `sky-btn sky-btn-default`
- **Link**: `sky-btn sky-btn-link`
- **Borderless icon**: `sky-btn sky-btn-icon-borderless`
- **Block**: add `sky-btn-block` to any button class
- **Inline link**: `sky-btn sky-btn-link-inline` on `<a>` elements
- **Toolbar**: `sky-btn sky-btn-default` inside `<sky-toolbar-item>` (toolbar applies extra styling)

**Code examples:**
```html
<!-- Primary button -->
<button type="button" class="sky-btn sky-btn-primary">Save</button>

<!-- Primary + icon -->
<button type="button" class="sky-btn sky-btn-primary">
  <sky-icon iconName="add" />
  New record
</button>

<!-- Secondary -->
<button type="button" class="sky-btn sky-btn-default">Edit</button>

<!-- Borderless icon (requires aria-label) -->
<button type="button" class="sky-btn sky-btn-icon-borderless" aria-label="Edit address">
  <sky-icon iconName="edit" />
</button>

<!-- Disabled -->
<button type="button" class="sky-btn sky-btn-primary" [disabled]="true">Save</button>

<!-- Toolbar button -->
<sky-toolbar>
  <sky-toolbar-item>
    <button type="button" class="sky-btn sky-btn-default">
      <sky-icon iconName="add" /> New
    </button>
  </sky-toolbar-item>
</sky-toolbar>
```

**Rules:**
- Use `<button>` for actions that change state; use `<a>` only for pure navigation
- Icon-only buttons MUST have `aria-label`
- Multiple same-label buttons on one page need unique `aria-label` (e.g. "Edit phone", "Edit address")
- To disable: use `disabled` attribute or `[disabled]="true"` — never use CSS to fake it

---

## INPUT BOX (`@skyux/forms`)

**NPM**: `npm install --save-exact @skyux/forms`
**Module**: `import { SkyInputBoxModule } from '@skyux/forms';`

**Component**: `sky-input-box` selector

**Inputs on `SkyInputBoxComponent`:**
- `labelText: string` — label text auto-associated with the inner input
- `hintText: string` — persistent guidance text below input
- `stacked: BooleanInput` — adds bottom margin when stacked with another input box
- `disabled: boolean` — visually highlights input as disabled
- `hasErrors: boolean` — forces error state visually
- `characterLimit: number` — adds SKY UX character count with validator
- `helpPopoverContent: string | TemplateRef` — adds help inline button that opens popover
- `helpPopoverTitle: string` — title for the help popover
- `helpKey: string` — key to invoke global help

**`sky-form-error` sub-component** (for custom errors inside input box):
- `errorName: string` (required) — name of the error
- `errorText: string` (required) — message to display

**Code example:**
```html
<sky-input-box labelText="Email address" hintText="Use your work email." [stacked]="true">
  <input type="email" formControlName="email" />
  <sky-form-error errorName="email" errorText="Please enter a valid email address" />
</sky-input-box>
```

**Advanced usage** (custom label / help / error):
- Add class `sky-form-control` on custom form element
- Add class `sky-control-label` on custom label element
- Add class `sky-control-help` on custom help element
- Use `<sky-form-error>` with `@if` for conditional custom errors

---

## LOOKUP (`@skyux/lookup`)

**NPM**: `npm install --save-exact @skyux/lookup`
**Module**: `import { SkyLookupModule } from '@skyux/lookup';`

**Component**: `sky-lookup` selector

**Must be wrapped in `sky-input-box`.**

**Key inputs on `SkyLookupComponent`:**
- `selectMode: SkyLookupSelectModeType` — `'single'` | `'multiple'` (default: `'multiple'`)
- `descriptorProperty: string` — property to display after selection (default: `'name'`)
- `enableShowMore: boolean` — shows 'Show all' / 'Show matches' picker button
- `showAddButton: boolean` — adds 'New' button to create items
- `data: any[]` — static data source (deprecated; prefer `searchAsync`)
- `propertiesToSearch: string[]` — which properties to search (deprecated; prefer `searchAsync`)
- `searchTextMinimumCharacters: number` — min chars before search (default: `1`)
- `searchResultsLimit: number` — max results in dropdown
- `searchResultTemplate: TemplateRef` — custom template for each dropdown result
- `idProperty: string` — unique ID property (required with `enableShowMore` + `searchAsync`)
- `required: boolean` — marks field required
- `disabled: boolean` — disables field
- `placeholderText: string` — input placeholder
- `showMoreConfig: SkyLookupShowMoreConfig` — config for the 'Show all' picker

**Outputs:**
- `searchAsync: EventEmitter<SkyAutocompleteSearchAsyncArgs>` — fires on search text change; set `args.result` to an `Observable`
- `addClick: EventEmitter<SkyLookupAddClickEventArgs>` — fires when 'New' button clicked

**Code example (async search):**
```html
<sky-input-box labelText="Constituent" [stacked]="true">
  <sky-lookup
    [selectMode]="'single'"
    [enableShowMore]="true"
    descriptorProperty="fullName"
    (searchAsync)="onSearchAsync($event)">
  </sky-lookup>
</sky-input-box>
```
```typescript
onSearchAsync(args: SkyAutocompleteSearchAsyncArgs): void {
  args.result = this.constituentService.search(args.searchText).pipe(
    map(items => ({ items, totalCount: items.length, hasMore: false }))
  );
}
```

**SkyAutocompleteSearchAsyncArgs interface:**
```typescript
interface SkyAutocompleteSearchAsyncArgs {
  searchText: string;
  offset: number;
  displayType: 'popover' | 'modal';
  result?: Observable<SkyAutocompleteSearchAsyncResult>;
  continuationData?: unknown;
}
```

---

## MODAL (`@skyux/modals`)

**NPM**: `npm install --save-exact @skyux/modals`
**Module**: `import { SkyModalModule } from '@skyux/modals';`

**Open a modal:**
```typescript
import { SkyModalService, SkyModalConfigurationInterface } from '@skyux/modals';

constructor(private modalService: SkyModalService) {}

openModal(): void {
  const ref = this.modalService.open(MyModalComponent, {
    size: 'large', // 'small' | 'medium' | 'large'
    providers: [{ provide: MyData, useValue: this.data }]
  });
  ref.closed.subscribe(args => {
    if (args.reason === 'save') { /* handle save */ }
  });
}
```

**`SkyModalConfigurationInterface` properties:**
- `size: string` — `'small'` | `'medium'` (default) | `'large'`
- `fullPage: boolean` — full-screen modal (default: `false`)
- `providers: StaticProvider[]` — Angular DI providers to inject into modal
- `wrapperClass: string` — extra CSS class (e.g. `'ag-custom-component-popup'` for AG Grid modals)

**Modal component template:**
```html
<sky-modal [headingText]="'Add constituent'">
  <sky-modal-content>
    <!-- form content here -->
  </sky-modal-content>
  <sky-modal-footer>
    <button class="sky-btn sky-btn-primary" (click)="save()">Save</button>
    <button class="sky-btn sky-btn-link" (click)="cancel()">Cancel</button>
  </sky-modal-footer>
</sky-sky-modal>
```

**Inputs on `sky-modal`:**
- `headingText: string` — modal header text
- `headingHidden: boolean` — hides header (for banner-image modals)
- `helpPopoverContent: string | TemplateRef` — inline help button in header
- `helpKey: string` — global help key
- `formErrors: SkyModalError[]` — list of `{ message: string }` for form-level errors
- `layout: 'none' | 'fit'` — layout mode

**`SkyModalInstance` methods (inject in modal component):**
```typescript
constructor(private instance: SkyModalInstance) {}
save(): void { this.instance.save(result); }
cancel(): void { this.instance.cancel(); }
```

**Unsaved data warning:**
```html
<sky-modal [headingText]="'Edit'" [isDirty]="formGroup.dirty">
```
Add `SkyModalIsDirtyDirective` with `isDirty` input — shows confirmation dialog if user closes without saving.

---

## DATEPICKER (`@skyux/datetime`)

**NPM**: `npm install --save-exact @skyux/datetime`
**Module**: `import { SkyDatepickerModule } from '@skyux/datetime';`

**Must be wrapped in `sky-input-box`.**

**Usage:**
```html
<sky-input-box labelText="Start date" hintText="Use MM/DD/YYYY format" [stacked]="true">
  <sky-datepicker>
    <input
      skyDatepickerInput
      formControlName="startDate"
      [dateFormat]="'MM/DD/YYYY'"
      [minDate]="minDate"
      [maxDate]="maxDate" />
  </sky-datepicker>
</sky-input-box>
```

**`skyDatepickerInput` directive inputs:**
- `dateFormat: string` — format string (default: `'MM/DD/YYYY'`)
- `minDate: Date` — earliest selectable date
- `maxDate: Date` — latest selectable date
- `startingDay: number` — first day of week (`0` = Sunday)
- `startAtDate: Date` — initial calendar view date
- `strict: boolean` — strict format matching
- `skyDatepickerNoValidate: boolean` — disables date validation

**Fuzzy datepicker** (partial dates like year-only or month/year):
```html
<sky-datepicker>
  <input skyFuzzyDatepickerInput formControlName="dob" [yearRequired]="false" />
</sky-datepicker>
```

**`SkyFuzzyDate` interface:**
```typescript
interface SkyFuzzyDate { month?: number; day?: number; year?: number; }
```

---

## DROPDOWN (`@skyux/popovers`)

**NPM**: `npm install --save-exact @skyux/popovers`
**Module**: `import { SkyDropdownModule } from '@skyux/popovers';`

**Components:** `sky-dropdown`, `sky-dropdown-button`, `sky-dropdown-menu`, `sky-dropdown-item`

**Code example:**
```html
<sky-dropdown buttonType="context-menu" label="Actions for Robert Hernandez">
  <sky-dropdown-button>Actions</sky-dropdown-button>
  <sky-dropdown-menu>
    <sky-dropdown-item><button type="button" (click)="edit()">Edit</button></sky-dropdown-item>
    <sky-dropdown-item><button type="button" (click)="delete()">Delete</button></sky-dropdown-item>
  </sky-dropdown-menu>
</sky-dropdown>
```

**`sky-dropdown` inputs:**
- `buttonType: SkyDropdownButtonType` — `'select'` (default) | `'context-menu'` | `'tab'`
- `buttonStyle: string` — `'default'` | `'primary'` | `'link'`
- `label: string` — ARIA label for accessibility
- `horizontalAlignment: 'left' | 'center' | 'right'` — menu alignment (default: `'left'`)
- `disabled: boolean`

---

## TOOLBAR (`@skyux/layout`)

**NPM**: `npm install --save-exact @skyux/layout`
**Module**: `import { SkyToolbarModule } from '@skyux/layout';`

**Components:**
- `sky-toolbar` — wrapper
- `sky-toolbar-item` — individual action container
- `sky-toolbar-section` — groups items in a row
- `sky-toolbar-view-actions` — right-side view switcher/filter section

**`sky-toolbar` inputs:**
- `listDescriptor: string` — plural name for the list (e.g. `'constituents'`), used in ARIA labels for search inputs

**Code example:**
```html
<sky-toolbar [listDescriptor]="'constituents'">
  <sky-toolbar-item>
    <button type="button" class="sky-btn sky-btn-default">
      <sky-icon iconName="add" /> New
    </button>
  </sky-toolbar-item>
  <sky-toolbar-item>
    <button type="button" class="sky-btn sky-btn-default">
      <sky-icon iconName="columns" /> Columns
    </button>
  </sky-toolbar-item>
  <sky-toolbar-view-actions>
    <!-- view switcher / filters go here -->
  </sky-toolbar-view-actions>
</sky-toolbar>
```

---

## DATA GRID / REPEATER (`@skyux/ag-grid`, `@skyux/lists`)

### Data Grid
**NPM**: `npm install --save-exact @skyux/ag-grid ag-grid-angular ag-grid-community`
**Module**: `import { SkyAgGridModule } from '@skyux/ag-grid';`
**Also need**: `import { AgGridAngular } from 'ag-grid-angular';`, `ModuleRegistry.registerModules([AllCommunityModule]);`

**AG Grid styles** — add `@skyux/ag-grid/css/sky-ag-grid.css` to `angular.json` styles.

**Wrapper component**: `sky-ag-grid-wrapper` (provides WCAG keyboard navigation + sticky headers)

**`SkyAgGridService`** — inject and call:
- `getGridOptions(args)` — read-only grid options with SKY UX defaults
- `getEditableGridOptions(args)` — editable grid options with SKY UX cell editors

**`SkyCellType` enum** (use as AG Grid column `type`):
```typescript
import { SkyCellType } from '@skyux/ag-grid';

columnDefs = [
  { field: 'name', type: SkyCellType.Text },
  { field: 'startDate', type: SkyCellType.Date },
  { field: 'amount', type: SkyCellType.Currency },
  { field: 'constituent', type: SkyCellType.Lookup },
  { field: 'select', type: SkyCellType.RowSelector },
];
```

Full `SkyCellType` values: `Autocomplete`, `Currency`, `CurrencyValidator`, `Date`, `Lookup`, `Number`, `NumberValidator`, `RightAligned`, `RowSelector`, `Template`, `Text`, `Validator`

**Row delete**: `skyAgGridRowDelete` directive on `sky-ag-grid-wrapper`:
```html
<sky-ag-grid-wrapper [(rowDeleteIds)]="deleteIds" (rowDeleteConfirm)="onConfirm($event)" (rowDeleteCancel)="onCancel($event)">
  <ag-grid-angular ...></ag-grid-angular>
</sky-ag-grid-wrapper>
```

### Repeater (`@skyux/lists`)
**Module**: `import { SkyRepeaterModule } from '@skyux/lists';`
**Selectors**: `sky-repeater`, `sky-repeater-item`, `sky-repeater-item-title`, `sky-repeater-item-content`, `sky-repeater-item-context-menu`

**`sky-repeater` inputs:**
- `expandMode: SkyRepeaterExpandModeType` — `'none'` (default, all expanded) | `'single'` | `'multiple'`
- `activeIndex: number` — highlight specific item (e.g. for split-view)
- `reorderable: boolean` — enable drag-to-reorder

**`sky-repeater-item` inputs:**
- `isExpanded: boolean` (default: `true`)
- `isSelected: boolean` — checkbox selection state
- `selectable: boolean` — show checkbox
- `showInlineForm: boolean` — toggle inline form
- `inlineFormConfig: SkyInlineFormConfig`

**Code example:**
```html
<sky-repeater expandMode="multiple">
  <sky-repeater-item *ngFor="let item of items" [isExpanded]="true">
    <sky-repeater-item-title>{{ item.name }}</sky-repeater-item-title>
    <sky-repeater-item-content>{{ item.description }}</sky-repeater-item-content>
    <sky-repeater-item-context-menu>
      <sky-dropdown buttonType="context-menu">
        <sky-dropdown-menu>
          <sky-dropdown-item><button (click)="edit(item)">Edit</button></sky-dropdown-item>
        </sky-dropdown-menu>
      </sky-dropdown>
    </sky-repeater-item-context-menu>
  </sky-repeater-item>
</sky-repeater>
```

---

## Installation
```bash
npm install @skyux/components @skyux/layout @skyux/data-manager @skyux/ag-grid @skyux/indicators
```

---

## Core Components

### sky-data-grid (Data Grid)
Package: `@skyux/ag-grid`
Module: `SkyAgGridModule`

Used for tabular data with sorting, filtering, and pagination.

```typescript
import { SkyAgGridModule } from '@skyux/ag-grid';
import { AgGridModule } from 'ag-grid-angular';

@Component({
  standalone: true,
  imports: [SkyAgGridModule, AgGridModule],
  template: `
    <sky-ag-grid-wrapper>
      <ag-grid-angular
        skyAgGrid
        [columnDefs]="columnDefs"
        [rowData]="rowData"
        domLayout="autoHeight">
      </ag-grid-angular>
    </sky-ag-grid-wrapper>
  `
})
export class DonorGridComponent {
  columnDefs: ColDef[] = [
    { field: 'name', headerName: 'Donor Name', sortable: true, filter: true },
    { field: 'amount', headerName: 'Amount', sortable: true },
    { field: 'date', headerName: 'Date', sortable: true }
  ];
  rowData = [];
}
```

---

### sky-search (Search Component)
Package: `@skyux/lookup`
Module: `SkySearchModule`

```typescript
import { SkySearchModule } from '@skyux/lookup';

// Template:
// <sky-search (searchApply)="onSearch($event)" (searchClear)="onClear()"></sky-search>
```

---

### sky-button (Button)
Package: `@skyux/components`
Module: `SkyButtonModule`

Button variants: `primary`, `default`, `link`, `danger`

```html
<button skyButton="primary" (click)="onSave()">Save</button>
<button skyButton="default" (click)="onCancel()">Cancel</button>
<button skyButton="danger" (click)="onDelete()">Delete</button>
```

---

### sky-modal (Modal Dialog)
Package: `@skyux/modals`
Module: `SkyModalModule`

```typescript
import { SkyModalModule, SkyModalService } from '@skyux/modals';

// Inject SkyModalService and call:
this.modalService.open(MyModalComponent, { providers: [...] });
```

---

### sky-tabs (Tabbed Navigation)
Package: `@skyux/tabs`
Module: `SkyTabsModule`

```html
<sky-tabset>
  <sky-tab tabHeading="Overview">...</sky-tab>
  <sky-tab tabHeading="Details">...</sky-tab>
</sky-tabset>
```

---

### sky-card (Card Layout)
Package: `@skyux/layout`
Module: `SkyCardModule`

```html
<sky-card>
  <sky-card-title>Donor Summary</sky-card-title>
  <sky-card-content>...</sky-card-content>
  <sky-card-actions>
    <button skyButton="primary">View Details</button>
  </sky-card-actions>
</sky-card>
```

---

### sky-repeater (List View)
Package: `@skyux/lists`
Module: `SkyRepeaterModule`

Use sky-repeater for list-style records instead of raw `<ul>` or `<table>`.

```html
<sky-repeater>
  <sky-repeater-item *ngFor="let donor of donors">
    <sky-repeater-item-title>{{ donor.name }}</sky-repeater-item-title>
    <sky-repeater-item-content>
      Amount: {{ donor.amount | currency }}
    </sky-repeater-item-content>
  </sky-repeater-item>
</sky-repeater>
```

---

### sky-status-indicator (Status Badges)
Package: `@skyux/indicators`
Module: `SkyStatusIndicatorModule`

```html
<sky-status-indicator indicatorType="success" descriptionType="none">Active</sky-status-indicator>
<sky-status-indicator indicatorType="danger" descriptionType="none">Lapsed</sky-status-indicator>
<sky-status-indicator indicatorType="warning" descriptionType="none">Pending</sky-status-indicator>
```

---

## Design Tokens (CSS Custom Properties)

Always use SKY UX CSS custom properties instead of hardcoded values:

| Purpose         | Token                        |
|-----------------|------------------------------|
| Primary color   | `var(--sky-color-brand-primary)` |
| Background      | `var(--sky-background-color-page-default)` |
| Text default    | `var(--sky-text-color-default)` |
| Spacing unit    | `var(--sky-space-md)` (8px base grid) |
| Border radius   | `var(--sky-border-radius-xs)` |
| Font family     | `var(--sky-font-family)` |

---

## Accessibility Rules
- All interactive elements must have `aria-label` or visible label
- Data grids must have `aria-label` on the wrapping element
- Modals must trap focus and return focus on close
- Color must not be the only means of conveying information (use text/icons too)
- Minimum touch target: 44x44px

---

## Deprecated Components (Do NOT Use)
- `sky-list` — replaced by `sky-data-manager` + `sky-ag-grid`
- `sky-list-toolbar` — replaced by `sky-toolbar`
- `SkyGridModule` — replaced by `SkyAgGridModule`
- `skyux-builder` — replaced by Angular CLI with `@skyux/packages`
