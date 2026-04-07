# SKY UX Design Guidelines & Angular Patterns
# Source: https://developer.blackbaud.com/skyux/

## Angular 15+ Standalone Component Pattern

SKY UX fully supports Angular standalone components. Always prefer standalone over NgModule for new code.

### Minimal standalone component template
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkyCardModule } from '@skyux/layout';
import { SkyToolbarModule } from '@skyux/layout';

@Component({
  standalone: true,
  selector: 'app-donor-summary',
  imports: [CommonModule, SkyCardModule, SkyButtonModule],
  templateUrl: './donor-summary.component.html'
})
export class DonorSummaryComponent {
  // component logic
}
```

---

## Data Manager Pattern (Recommended for list views)

Use `SkyDataManagerModule` to coordinate filtering, sorting, and view switching across list components.

```typescript
import { SkyDataManagerModule, SkyDataManagerService, SkyDataManagerState } from '@skyux/data-manager';

@Component({
  standalone: true,
  imports: [SkyDataManagerModule, SkyAgGridModule, AgGridModule],
  providers: [SkyDataManagerService],
  template: `
    <sky-data-manager>
      <sky-data-manager-toolbar></sky-data-manager-toolbar>
      <sky-data-view viewId="gridView">
        <sky-ag-grid-wrapper>
          <ag-grid-angular skyAgGrid [columnDefs]="cols" [rowData]="rows">
          </ag-grid-angular>
        </sky-ag-grid-wrapper>
      </sky-data-view>
    </sky-data-manager>
  `
})
export class DonorListComponent implements OnInit {
  constructor(private dataManager: SkyDataManagerService) {}

  ngOnInit() {
    this.dataManager.initDataManager({
      activeViewId: 'gridView',
      dataManagerConfig: {},
      defaultDataState: new SkyDataManagerState({ filterData: { isActive: false, filters: {} } })
    });
  }
}
```

---

## Form Pattern with sky-form-field

```html
<sky-fluid-grid>
  <sky-row>
    <sky-column screenSmall="6">
      <sky-form-field labelText="First Name">
        <input class="sky-form-control" formControlName="firstName" />
        <sky-form-error errorName="required">First name is required.</sky-form-error>
      </sky-form-field>
    </sky-column>
    <sky-column screenSmall="6">
      <sky-form-field labelText="Email Address">
        <input class="sky-form-control" type="email" formControlName="email" />
        <sky-form-error errorName="email">Enter a valid email address.</sky-form-error>
      </sky-form-field>
    </sky-column>
  </sky-row>
</sky-fluid-grid>
```

Required imports: `SkyFluidGridModule`, `SkyFormErrorsModule` from `@skyux/forms`

---

## Paging with sky-paging

```html
<sky-paging
  [currentPage]="currentPage"
  [itemCount]="totalItems"
  [maxPages]="5"
  [pageSize]="pageSize"
  (pageChange)="onPageChange($event)">
</sky-paging>
```

Package: `@skyux/lists`, Module: `SkyPagingModule`

---

## BUTTON DESIGN GUIDELINES
Source: https://developer.blackbaud.com/skyux/components/button

### Button type usage rules
- **Primary button** (`sky-btn-primary`): ONE per page/modal. The most important action. Place in page header for page-level actions; in the container for child-level actions. Examples: Save in a modal, New in a list toolbar.
- **Secondary button** (`sky-btn-default`): Common actions that aren't the most important. Examples: Edit, Export on record pages and action hubs.
- **Link button** (`sky-btn-link`): Infrequently used actions or back/cancel actions that exit without saving. Always use for modal Cancel button.
- **Borderless icon button** (`sky-btn-icon-borderless`): Tight-space actions (edit/delete) when icons are sufficient. Used on repeater rows or inside boxes.
- **Block button** (`sky-btn-block`): Linear limited-option workflows (authentication, checkout). Stack with primary on top.
- **Toolbar button**: `sky-btn-default` inside `sky-toolbar-item`. Same as secondary but styled differently by toolbar.
- **Inline link** (`sky-btn-link-inline` on `<a>`): Navigation links inside text.

### Button label rules
- Use sentence-case capitalization
- Format: `<Verb>` for one-object contexts; `<Verb> <direct object>` for multiple-object contexts
- Create items: use **New** (new from scratch) or **Add** (associate existing item)
- Remove items: use **Delete** (permanent deletion) or **Remove** (sever association)
- Never use "Create" as alternative to "New" or "Add"
- Don't say "Edit goal details" — say "Edit goal" (no extra words)

### Do NOT
- Use multiple primary buttons on one page/modal
- Use block buttons when many tasks are available simultaneously
- Group multiple similar actions \u2014 use a dropdown instead

---

## MODAL DESIGN GUIDELINES
Source: https://developer.blackbaud.com/skyux/components/modal

### Use modals when
- Task is functionally modal (must finish before continuing)
- Form would cause substantial content shifting or require scrolling
- Adding records from paginated/infinite-scroll lists
- Large modals: sectioned forms, wizards (use `size: 'large'`)
- Full-screen: feedback-as-you-type forms, complex tasks with subtasks

### Modal title format
- With indirect object: `<Verb> <direct object> for <indirect object>` e.g. "Edit address for Robert Hernandez"
- Without indirect object: `<Verb> <direct object>` e.g. "Edit address"
- Use sentence-case

### Modal footer buttons
- **Primary button**: most important action (e.g. "Save")
- **Secondary button**: less important action
- **Link button**: Cancel (always Cancel for back-out, not Close, unless read-only)
- Disable primary until all required inputs have valid values

---

## INPUT BOX DESIGN GUIDELINES
Source: https://developer.blackbaud.com/skyux/components/input-box

### Use input boxes for
- All data entry form elements: `<input>`, `<select>`, `<textarea>`, SKY UX components (lookup, datepicker, etc.)
- Input box provides consistent label, hint text, error display, character count, and help button

### Options
- **Required marker**: red asterisk auto-shown when form control has `required` validator
- **Hint text** (`hintText`): persistent inline help for format, constraints, or context
- **Character count** (`characterLimit`): use when users may realistically exceed limits \u2014 don't use for fields where limits are never approached
- **Stacked** (`[stacked]="true"`): adds bottom margin when input precedes another input; don't use on last input before field group or form end
- **Help inline**: popover help on label \u2014 use when supplemental info is needed but persistent hint text isn't required

### Input label rules
- Use nouns (not verbs or questions): "Email address" not "Enter your email"
- Keep labels succinct and descriptive

---

## LOOKUP DESIGN GUIDELINES
Source: https://developer.blackbaud.com/skyux/components/lookup

### Use lookup when
- List is very long OR unpredictable/unfamiliar
- Users may select multiple options from a long list
- Users may need to add new options during the task

### Don't use lookup when
- 5 or fewer options \u2014 use checkboxes or radio buttons instead
- Options are highly predictable and in expected order (e.g. US states) \u2014 use `<select>` instead
- Selections need interaction or deep detail \u2014 use a Selection Modal button instead

---

## TOOLBAR DESIGN GUIDELINES
Source: https://developer.blackbaud.com/skyux/components/toolbar

### Use toolbars for
- List toolbars: actions manipulating list contents (New, Edit, Save, Columns, Export, Search)
- Container toolbars: actions in boxes/modals \u2014 only most important directly, rest in "More" dropdown

### Don't use toolbars for
- Record page headers (page actions go below record details)
- Action hub headers (buttons go directly on page below title)

### Standard action order (left to right)
1. New / Add
2. Edit
3. Save
4. Sort
5. Columns
6. Share
7. Export
8. More (\u2026 ellipsis) \u2014 for less-frequent or overflow actions

### Rules
- Standard actions must not exceed 50% of toolbar width \u2014 move rightmost into "More" if they do
- View switcher always docks to the right (`sky-toolbar-view-actions`)
- Don't use primary action buttons inside toolbars

---

## DATA GRID / AG GRID DESIGN GUIDELINES
Source: https://developer.blackbaud.com/skyux/components/data-grid

### Use data grids when
- Displaying tabular data with rows and columns
- Combine with Data Manager for sorting, filtering, view switching, column selection

### Data entry grids (editable) \u2014 use when
- Users have spreadsheet experience
- Editing many values simultaneously
- Dataset is large

### Don't use data entry grids when
- Data is view-only (use read-only data grid instead)
- Users need guidance
- Editing only a few values
- Dataset is small

---

## REPEATER DESIGN GUIDELINES
Source: https://developer.blackbaud.com/skyux/components/repeater

### `expandMode` selection
- `'none'` (default): all expanded, non-collapsible \u2014 best when body content is frequently needed
- `'multiple'`: collapsible, many can be open \u2014 best when body is important but not always needed
- `'single'`: only one open at a time \u2014 best when title has key info and body is occasional

### Use repeaters when
- Mobile-intensive contexts requiring compact display
- Alternative to grids when content is heterogeneous

---

## SECTIONED FORM GUIDELINES
Source: https://developer.blackbaud.com/skyux/components/sectioned-form

### Use sectioned forms when
- Users navigate a hierarchy and know what they're looking for (editing pieces of a large record)
- Grouping related but independent forms simplifies UI
- Always use inside **large or full-screen modals** only \u2014 never small/medium

### Don't use sectioned forms when
- Choices on one tab can affect other tabs (changes become invisible)
- Inside small or medium modals (insufficient horizontal space)

---

## FULL FORM PATTERN (Complete standalone component example)

```typescript
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SkyInputBoxModule } from '@skyux/forms';
import { SkyDatepickerModule } from '@skyux/datetime';
import { SkyLookupModule } from '@skyux/lookup';
import { SkyModalModule, SkyModalInstance } from '@skyux/modals';

@Component({
  standalone: true,
  selector: 'app-add-constituent-modal',
  imports: [ReactiveFormsModule, SkyInputBoxModule, SkyDatepickerModule, SkyLookupModule, SkyModalModule],
  template: \`
    <sky-modal [headingText]="'Add constituent'" [isDirty]="form.dirty">
      <sky-modal-content>
        <form [formGroup]="form">
          <sky-input-box labelText="First name" [stacked]="true">
            <input formControlName="firstName" />
          </sky-input-box>
          <sky-input-box labelText="Last name" [stacked]="true">
            <input formControlName="lastName" />
          </sky-input-box>
          <sky-input-box labelText="Date of birth" [stacked]="true">
            <sky-datepicker>
              <input skyDatepickerInput formControlName="dob" [maxDate]="today" />
            </sky-datepicker>
          </sky-input-box>
          <sky-input-box labelText="Fund" [stacked]="true">
            <sky-lookup selectMode="single" descriptorProperty="name"
              (searchAsync)="searchFunds($event)">
            </sky-lookup>
          </sky-input-box>
        </form>
      </sky-modal-content>
      <sky-modal-footer>
        <button class="sky-btn sky-btn-primary" [disabled]="form.invalid" (click)="save()">Save</button>
        <button class="sky-btn sky-btn-link" (click)="cancel()">Cancel</button>
      </sky-modal-footer>
    </sky-modal>
  \`
})
export class AddConstituentModalComponent {
  private fb = inject(FormBuilder);
  private instance = inject(SkyModalInstance);
  today = new Date();

  form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    dob: [null],
    fund: [null, Validators.required],
  });

  save(): void { this.instance.save(this.form.value); }
  cancel(): void { this.instance.cancel(); }

  searchFunds(args: any): void {
    // Set args.result to Observable<SkyAutocompleteSearchAsyncResult>
  }
}
```
