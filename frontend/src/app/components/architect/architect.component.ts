import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SseAgentService } from '../../services/sse-agent.service';

@Component({
  standalone: true,
  selector: 'app-architect',
  imports: [CommonModule, FormsModule],
  templateUrl: './architect.component.html',
  styleUrls: ['./architect.component.scss']
})
export class ArchitectComponent implements OnDestroy {

  prompt = '';
  output = '';
  isStreaming = false;
  hasError = false;
  errorMessage = '';

  // Demo prompts for the hackathon presentation
  readonly demoPrompts = [
    'Create a SKY UX standalone Angular component showing a paginated donor list with name, amount, and date columns, plus a search bar at the top.',
    'Build a SKY UX form component for adding a new constituent with first name, last name, email, and phone fields. Include validation.',
    'Generate a SKY UX card-based summary view showing key fundraising metrics: total raised, donor count, and average gift size.'
  ];

  private sub?: Subscription;

  constructor(private agentService: SseAgentService) {}

  generate(): void {
    if (!this.prompt.trim() || this.isStreaming) return;

    this.output = '';
    this.hasError = false;
    this.errorMessage = '';
    this.isStreaming = true;

    this.sub = this.agentService.stream('architect', this.prompt).subscribe({
      next: (token) => this.output += token,
      complete: () => { this.isStreaming = false; },
      error: (err) => {
        this.isStreaming = false;
        this.hasError = true;
        this.errorMessage = 'Failed to reach the backend. Is the Spring Boot server running on port 8080?';
        console.error('Architect stream error:', err);
      }
    });
  }

  useDemo(prompt: string): void {
    this.prompt = prompt;
  }

  stop(): void {
    this.sub?.unsubscribe();
    this.isStreaming = false;
  }

  clear(): void {
    this.stop();
    this.prompt = '';
    this.output = '';
    this.hasError = false;
  }

  copyOutput(): void {
    navigator.clipboard.writeText(this.output).catch(() => {
      // Fallback for non-secure contexts
      const el = document.createElement('textarea');
      el.value = this.output;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
