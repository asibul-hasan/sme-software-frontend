import { Routes } from '@angular/router';

export const HR_ROUTES: Routes = [
    {
        path: 'employees',
        loadChildren: () => import('./employee/employee.routes').then(m => m.EMPLOYEE_ROUTES)
    },
    // Placeholders for other modules
    {
        path: 'attendance',
        loadComponent: () => import('./pages/attendance/attendance.component').then(m => m.AttendanceComponent)
    },
    {
        path: 'leave',
        loadComponent: () => import('./pages/leave/leave.component').then(m => m.LeaveComponent)
    }
];