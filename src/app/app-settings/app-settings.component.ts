import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-app-settings',
  imports: [CommonModule, FormsModule, NgbToastModule],
  templateUrl: './app-settings.component.html',
  styleUrls: ['./app-settings.component.scss']
})
export class AppSettingsComponent implements OnInit {
  settings: any[] = [];
  selectedSetting: any = {};
  isEditMode = false;
  showToast = false;
  toastMessage = '';
  toastType = 'success'; // 'success' or 'error'

  @ViewChild('settingModal') modal!: ElementRef;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  showToastMessage(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 5000);
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.apiService.getAppSettings().subscribe({
      next: (data) => {
        this.settings = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showToastMessage('Error loading app settings', 'error');
      }
    });
  }

  openAddModal(): void {
    this.selectedSetting = {};
    this.isEditMode = false;
  }

  editSetting(setting: any): void {
    this.selectedSetting = { ...setting };
    this.isEditMode = true;
  }

  saveSetting(): void {
    if (this.isEditMode) {
      this.apiService.updateAppSetting(this.selectedSetting._id, this.selectedSetting).subscribe({
        next: () => {
          this.loadSettings();
          this.ngZone.run(() => {
            this.closeModal();
            setTimeout(() => {
              this.showToastMessage('Setting updated successfully', 'success');
              this.cdr.detectChanges();
            }, 300);
          });
        },
        error: () => {
          this.showToastMessage('Error updating setting', 'error');
        }
      });
    } else {
      this.apiService.createAppSetting(this.selectedSetting).subscribe({
        next: () => {
          this.loadSettings();
          this.ngZone.run(() => {
            this.closeModal();
            setTimeout(() => {
              this.showToastMessage('Setting created successfully', 'success');
              this.selectedSetting = {};
              this.cdr.detectChanges();
            }, 300);
          });
        },
        error: () => {
          this.showToastMessage('Error creating setting', 'error');
        }
      });
    }
  }

  deleteSetting(id: string): void {
    if (confirm('Are you sure?')) {
      this.apiService.deleteAppSetting(id).subscribe({
        next: () => {
          this.loadSettings();
          this.showToastMessage('Setting deleted successfully', 'success');
        },
        error: () => {
          this.showToastMessage('Error deleting setting', 'error');
        }
      });
    }
  }

  closeModal(): void {
    this.selectedSetting = {};
    this.isEditMode = false;
    // Optionally hide modal if needed
  }
}