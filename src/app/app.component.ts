import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SearchComponent } from './search/search.component';
import { CommonModule } from '@angular/common';  // Import CommonModule here
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [RouterOutlet, SearchComponent, CommonModule, BrowserAnimationsModule],  // Include CommonModule in the imports
})
export class AppComponent {
  title = 'my-search-app';
}
