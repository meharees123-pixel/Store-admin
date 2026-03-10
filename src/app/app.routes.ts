import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProductsComponent } from './products/products.component';
import { StoresComponent } from './stores/stores.component';
import { CategoriesComponent } from './categories/categories.component';
import { SubcategoriesComponent } from './subcategories/subcategories.component';
import { OrdersComponent } from './orders/orders.component';
import { CartsComponent } from './carts/carts.component';
import { DeliveryLocationsComponent } from './delivery-locations/delivery-locations.component';
import { UserAddressesComponent } from './user-addresses/user-addresses.component';
import { AppSettingsComponent } from './app-settings/app-settings.component';
import { UsersComponent } from './users/users.component';
import { LoginComponent } from './login/login.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, children: [
    { path: '', redirectTo: 'products', pathMatch: 'full' },
    { path: 'products', component: ProductsComponent },
    { path: 'stores', component: StoresComponent },
    { path: 'categories', component: CategoriesComponent },
    { path: 'subcategories', component: SubcategoriesComponent },
    { path: 'orders', component: OrdersComponent },
    { path: 'carts', component: CartsComponent },
    { path: 'delivery-locations', component: DeliveryLocationsComponent },
    { path: 'users', component: UsersComponent },
    { path: 'user-addresses', component: UserAddressesComponent },
    { path: 'app-settings', component: AppSettingsComponent }
  ], canActivate: [authGuard] },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
