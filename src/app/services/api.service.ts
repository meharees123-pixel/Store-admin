import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TOAST_ERROR_MESSAGE, TOAST_SUCCESS_MESSAGE } from './http-context.tokens';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  private toast(success: string, error?: string) {
    let context = new HttpContext().set(TOAST_SUCCESS_MESSAGE, success);
    if (error) context = context.set(TOAST_ERROR_MESSAGE, error);
    return { context };
  }

  // Users
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/users`);
  }

  getUser(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/users/${id}`);
  }

  createUser(user: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/users`, user, this.toast('User created successfully', 'Error creating user'));
  }

  updateUser(id: string, user: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/users/${id}`, user, this.toast('User updated successfully', 'Error updating user'));
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/users/${id}`, this.toast('User deleted successfully', 'Error deleting user'));
  }

  // Auth
  login(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/firebase-login`, data, this.toast('Logged in successfully', 'Login failed'));
  }

  logout(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/auth/firebase-logout`, data, this.toast('Logged out successfully', 'Logout failed'));
  }

  // Users (assuming CRUD, but from controller it's auth)
  // Add if there are user CRUD endpoints

  // Stores
  getStores(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/stores`);
  }

  createStore(store: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/stores`, store, this.toast('Store created successfully', 'Error creating store'));
  }

  updateStore(id: string, store: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/stores/${id}`, store, this.toast('Store updated successfully', 'Error updating store'));
  }

  deleteStore(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/stores/${id}`, this.toast('Store deleted successfully', 'Error deleting store'));
  }

  // Categories
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/categories`);
  }

  createCategory(category: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/categories`, category, this.toast('Category created successfully', 'Error creating category'));
  }

  updateCategory(id: string, category: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/categories/${id}`, category, this.toast('Category updated successfully', 'Error updating category'));
  }

  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/categories/${id}`, this.toast('Category deleted successfully', 'Error deleting category'));
  }

  uploadCategoryImage(id: string, file: File, replace = false): Observable<any> {
    const form = new FormData();
    form.append('image', file);
    const method = replace ? 'PUT' : 'POST';
    return this.http.request(method, `${this.baseUrl}/categories/${id}/image`, {
      body: form,
      ...this.toast('Category image uploaded', 'Error uploading category image'),
    });
  }

  deleteCategoryImage(id: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/categories/${id}/image`,
      this.toast('Category image deleted', 'Error deleting category image'),
    );
  }

  // Subcategories
  getSubcategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/subcategories`);
  }

  createSubcategory(subcategory: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/subcategories`, subcategory, this.toast('Subcategory created successfully', 'Error creating subcategory'));
  }

  updateSubcategory(id: string, subcategory: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/subcategories/${id}`, subcategory, this.toast('Subcategory updated successfully', 'Error updating subcategory'));
  }

  deleteSubcategory(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/subcategories/${id}`, this.toast('Subcategory deleted successfully', 'Error deleting subcategory'));
  }

  // Products
  getProducts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/products`);
  }

  getProduct(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/products/${id}`);
  }

  getProductsByCategory(categoryId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/products/${categoryId}`);
  }

  createProduct(product: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/products`, product, this.toast('Product created successfully', 'Error creating product'));
  }

  updateProduct(id: string, product: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/products/${id}`, product, this.toast('Product updated successfully', 'Error updating product'));
  }

  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/products/${id}`, this.toast('Product deleted successfully', 'Error deleting product'));
  }

  uploadProductImage(id: string, file: File, replace = false): Observable<any> {
    const form = new FormData();
    form.append('image', file);
    const method = replace ? 'PUT' : 'POST';
    return this.http.request(method, `${this.baseUrl}/products/${id}/image`, {
      body: form,
      ...this.toast('Product image uploaded', 'Error uploading product image'),
    });
  }

  deleteProductImage(id: string): Observable<any> {
    return this.http.delete(
      `${this.baseUrl}/products/${id}/image`,
      this.toast('Product image deleted', 'Error deleting product image'),
    );
  }

  // Orders
  getOrders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/orders`);
  }

  createOrder(order: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/orders`, order, this.toast('Order created successfully', 'Error creating order'));
  }

  updateOrder(id: string, order: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/orders/${id}`, order, this.toast('Order updated successfully', 'Error updating order'));
  }

  deleteOrder(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/orders/${id}`, this.toast('Order deleted successfully', 'Error deleting order'));
  }

  // Carts
  getCarts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/cart`);
  }

  createCart(cart: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/cart`, cart, this.toast('Cart created successfully', 'Error creating cart'));
  }

  updateCart(id: string, cart: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/cart/${id}`, cart, this.toast('Cart updated successfully', 'Error updating cart'));
  }

  deleteCart(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/cart/${id}`, this.toast('Cart deleted successfully', 'Error deleting cart'));
  }

  // Delivery Locations
  getDeliveryLocations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/delivery-locations`);
  }

  createDeliveryLocation(location: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/delivery-locations`, location, this.toast('Location created successfully', 'Error creating location'));
  }

  updateDeliveryLocation(id: string, location: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/delivery-locations/${id}`, location, this.toast('Location updated successfully', 'Error updating location'));
  }

  deleteDeliveryLocation(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delivery-locations/${id}`, this.toast('Location deleted successfully', 'Error deleting location'));
  }

  // User Addresses
  getUserAddresses(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/user-addresses`);
  }

  createUserAddress(address: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/user-addresses`, address, this.toast('Address created successfully', 'Error creating address'));
  }

  updateUserAddress(id: string, address: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/user-addresses/${id}`, address, this.toast('Address updated successfully', 'Error updating address'));
  }

  deleteUserAddress(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/user-addresses/${id}`, this.toast('Address deleted successfully', 'Error deleting address'));
  }

  // App Settings
  getAppSettings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/app-settings`);
  }

  createAppSetting(setting: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/app-settings`, setting, this.toast('Setting created successfully', 'Error creating setting'));
  }

  updateAppSetting(id: string, setting: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/app-settings/${id}`, setting, this.toast('Setting updated successfully', 'Error updating setting'));
  }

  deleteAppSetting(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/app-settings/${id}`, this.toast('Setting deleted successfully', 'Error deleting setting'));
  }
}
