import { Routes, RouterModule } from '@angular/router';
import { SADClientpackagesComponent } from './clientpackages/clientpackages.component';
import { SADHomeComponent } from './home/home.component';
import { SADProfileComponent } from './profile/profile.component';
import { SADRolesComponent } from './roles/roles.component';
import { SADSubadminsComponent } from './subadmins/subadmins.component';
import { SADSubscriptionPlansComponent } from './subscription/subscription-plans/subscription-plans.component';
import { SADSubscriptionUsersComponent } from './subscription/subscription-users/subscription-users.component';

const routes: Routes = [
      { path: '', component: SADHomeComponent },

      { path: 'profile', component: SADProfileComponent },

      { path: 'role-access/manage-roles', component: SADRolesComponent },

      { path: 'subadmins/manage', component: SADSubadminsComponent },

      { path: 'client-package', component: SADClientpackagesComponent },

      { path: 'subscription-management/plans', component: SADSubscriptionPlansComponent },
      { path: 'subscription-management/users', component: SADSubscriptionUsersComponent },
];

export const SubAdminRoutes = RouterModule.forChild(routes);
