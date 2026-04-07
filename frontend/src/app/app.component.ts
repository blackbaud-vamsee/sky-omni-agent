import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArchitectComponent } from './components/architect/architect.component';
import { MedicComponent } from './components/medic/medic.component';

type Tab = 'architect' | 'medic';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, ArchitectComponent, MedicComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  activeTab: Tab = 'architect';

  setTab(tab: Tab): void {
    this.activeTab = tab;
  }
}
