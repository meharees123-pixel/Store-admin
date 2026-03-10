import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="app-footer border-top bg-white">
      <div class="container-fluid py-2 text-muted small d-flex justify-content-between">
        <div>Store Admin</div>
        <div>&copy; {{ year }}</div>
      </div>
    </footer>
  `,
  styles: [
    `
      .app-footer {
        position: sticky;
        bottom: 0;
        z-index: 100;
      }
    `,
  ],
})
export class FooterComponent {
  year = new Date().getFullYear();
}

