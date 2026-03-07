
import { Routes } from '@angular/router';
import { EmployeeListComponent } from './pages/employee-list/employee-list.component';
import { EmployeeCreateComponent } from './pages/employee-create/employee-create.component';

export const EMPLOYEE_ROUTES: Routes = [
    {
        path: '',
        redirectTo: 'list',
        pathMatch: 'full'
    },
    {
        path: 'list',
        loadComponent: () => import('./pages/employee-list/employee-list.component').then(m => m.EmployeeListComponent),
        data: { title: 'Employee List' }
    },
    {
        path: 'create',
        loadComponent: () => import('./pages/employee-create/employee-create.component').then(m => m.EmployeeCreateComponent),
        data: { title: 'Create Employee' }
    },
    {
        path: 'edit/:id',
        loadComponent: () => import('./pages/employee-create/employee-create.component').then(m => m.EmployeeCreateComponent),
        data: { title: 'Edit Employee' }
    },
    {
        path: 'detail/:id',
        loadComponent: () => import('./pages/employee-detail/employee-detail.component').then(m => m.EmployeeDetailComponent),
        data: { title: 'Employee Details' }
    }
];
