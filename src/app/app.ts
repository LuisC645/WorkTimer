import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TimerComponent } from './timer/timer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TimerComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  title = signal('work');
}
