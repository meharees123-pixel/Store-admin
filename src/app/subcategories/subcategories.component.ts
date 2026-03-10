import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-subcategories',
  imports: [CommonModule, FormsModule],
  templateUrl: './subcategories.component.html',
  styleUrls: ['./subcategories.component.scss']
})
export class SubcategoriesComponent implements OnInit {
  subcategories: any[] = [];
  categories: any[] = [];
  selectedSubcategory: any = null;
  isEditMode = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadSubcategories();
    this.loadCategories();
  }

  loadSubcategories(): void {
    this.apiService.getSubcategories().subscribe({
      next: (data) => {
        this.subcategories = data;
      },
      error: (err) => {
        console.error('Error loading subcategories', err);
      }
    });
  }

  loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: (err) => {
        console.error('Error loading categories', err);
      }
    });
  }

  openAddModal(): void {
    this.selectedSubcategory = {};
    this.isEditMode = false;
  }

  editSubcategory(subcategory: any): void {
    this.selectedSubcategory = { ...subcategory };
    this.isEditMode = true;
  }

  saveSubcategory(): void {
    const subcategoryToSave = { ...this.selectedSubcategory };
    if (subcategoryToSave.categoryId && subcategoryToSave.categoryId._id) {
      subcategoryToSave.categoryId = subcategoryToSave.categoryId._id;
    }
    if (this.isEditMode) {
      this.apiService.updateSubcategory(subcategoryToSave._id, subcategoryToSave).subscribe(() => {
        this.loadSubcategories();
        this.closeModal();
      });
    } else {
      this.apiService.createSubcategory(subcategoryToSave).subscribe(() => {
        this.loadSubcategories();
        this.closeModal();
      });
    }
  }

  deleteSubcategory(id: string): void {
    if (confirm('Are you sure?')) {
      this.apiService.deleteSubcategory(id).subscribe(() => {
        this.loadSubcategories();
      });
    }
  }

  closeModal(): void {
    this.selectedSubcategory = null;
  }
}