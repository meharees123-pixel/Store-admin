import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="app-footer">
      <div class="container-fluid py-3 d-flex flex-column flex-md-row gap-2 align-items-start align-items-md-center justify-content-between">
        <div class="d-flex align-items-center gap-2">
          <span class="footer-badge" aria-label="Store Admin logo"></span>
          <div>
            <div class="footer-title">Store Admin</div>
            <div class="footer-subtitle">Operations dashboard</div>
          </div>
        </div>

        <div class="footer-meta small">
          <span class="me-2">© {{ year }}</span>
          <span class="dot">•</span>
          <span class="ms-2 text-nowrap">Built with Angular</span>
        </div>
      </div>
    </footer>
  `,
  styles: [
    `
      .app-footer {
        position: sticky;
        bottom: 0;
        z-index: 150;
        border-top: 1px solid rgba(15, 23, 42, 0.08);
        background: rgba(255, 255, 255, 0.86);
        backdrop-filter: blur(10px);
      }

      .footer-badge {
        width: 85px;
        height: 50px;
        border-radius: 14px;
        background-color: rgba(59, 130, 246, 0.12);
        background-image: url('/logo.png');
        background-repeat: no-repeat;
        background-position: center;
        background-size: contain;
      }

      .footer-title {
        font-weight: 700;
        line-height: 1.1;
      }

      .footer-subtitle {
        font-size: 12px;
        color: rgba(15, 23, 42, 0.6);
      }

      .footer-meta {
        color: rgba(15, 23, 42, 0.62);
      }

      .dot {
        color: rgba(15, 23, 42, 0.28);
      }
    `,
  ],
})
export class FooterComponent {
  year = new Date().getFullYear();
}
