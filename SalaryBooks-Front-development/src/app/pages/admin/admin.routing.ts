import { Routes, RouterModule } from '@angular/router';
import { AdminLayoutComponent } from '../layouts/admin/admin.component';
import { ADClientpackagesComponent } from './clientpackages/clientpackages.component';
import { ADArrearslipTemplateComponent } from './companyrules/arrearslip-template/arrearslip-template.component';
import { ADAttendancePolicyComponent } from './companyrules/attendance-policy/attendance-policy.component';
import { ADBonusPolicyComponent } from './companyrules/bonus-policy/bonus-policy.component';
import { ADBonusslipTemplateComponent } from './companyrules/bonusslip-template/bonusslip-template.component';
import { ADIncentivePolicyComponent } from './companyrules/incentive-policy/incentive-policy.component';
import { ADLeaveRuleComponent } from './companyrules/leave-rule/leave-rule.component';
import { ADLwfRuleComponent } from './companyrules/lwf-rule/lwf-rule.component';
import { ADOvertimePolicyComponent } from './companyrules/overtime-policy/overtime-policy.component';
import { ADPayslipTemplateComponent } from './companyrules/payslip-template/payslip-template.component';
import { ADPtaxRuleComponent } from './companyrules/ptax-rule/ptax-rule.component';
import { ADSalaryTemplateComponent } from './companyrules/salary-template/salary-template.component';
import { ADTdsRuleComponent } from './companyrules/tds-rule/tds-rule.component';
import { ADBonusRulesComponent } from './govtrules/bonus-rules/bonus-rules.component';
import { ADEpfoRulesComponent } from './govtrules/epfo-rules/epfo-rules.component';
import { ADEsicRulesComponent } from './govtrules/esic-rules/esic-rules.component';
import { ADGratuityRulesComponent } from './govtrules/gratuity-rules/gratuity-rules.component';
import { ADItaxCategoriesComponent } from './govtrules/itax-categories/itax-categories.component';
import { ADItaxSlabsComponent } from './govtrules/itax-slabs/itax-slabs.component';
import { ADHomeComponent } from './home/home.component';
import { ADBranchComponent } from './master/branch/branch.component';
import { ADCreditInvoiceComponent } from './master/credit-invoice/credit-invoice.component';
import { ADDepartmentComponent } from './master/department/department.component';
import { ADDesignationComponent } from './master/designation/designation.component';
import { ADResellerComponent } from './master/reseller/reseller.component';
import { ADProfileComponent } from './profile/profile.component';
import { ADPromotionManagementComponent } from './promotion-management/promotion-management.component';
import { ADRolesComponent } from './roles/roles.component';
import { ADSubadminsComponent } from './subadmins/subadmins.component';
import { ADSubscriptionCreditComponent } from './subscription/subscription-credit/subscription-credit.component';
import { ADSubscriptionPlansComponent } from './subscription/subscription-plans/subscription-plans.component';
import { ADSubscriptionUsersComponent } from './subscription/subscription-users/subscription-users.component';
import { ADLPageConfigComponent } from './landing-page-config/L-page-config/L-page-config.component';
import { ADLPostsComponent } from './landing-page-config/L-posts/L-posts.component';
import { ADLSettingsComponent } from './landing-page-config/L-settings/L-settings.component';
import { ADLMembershipComponent } from './landing-page-config/L-membership/L-membership.component';
import { SmtpComponent } from './smtp/smtp.component';
import { InvoiceComponent } from './invoice/invoice/invoice.component';
import { CompanyLedgerComponent } from './company-ledger/company-ledger.component';
import { CreditUsageComponent } from './credit-usage/credit-usage.component';
import { SalesLedgerComponent } from './sales-ledger/sales-ledger.component';
import { TdsRulesComponent } from './tds-rules/tds-rules.component';
import { TdsRuleDeclarationComponent } from './tds-rule-declaration/tds-rule-declaration.component';

const routes: Routes = [
  { path: '', component: ADHomeComponent },

  { path: 'profile', component: ADProfileComponent },

  //Team Management
  { path: 'team-management/sub-admin', component: ADSubadminsComponent },
  { path: 'team-management/role-access', component: ADRolesComponent },
  // { path: 'role-access/manage-roles', component: ADRolesComponent },
  // { path: 'sub-admin/manage', component: ADSubadminsComponent },

  // {
  //   path: 'subscription-management/users',
  //   component: ADSubscriptionUsersComponent,
  // },
  {
    path: 'user-management',
    component: ADSubscriptionUsersComponent,
  },

  { path: 'master/department', component: ADDepartmentComponent },
  { path: 'master/designation', component: ADDesignationComponent },
  { path: 'master/branch', component: ADBranchComponent },
  { path: 'master/reseller', component: ADResellerComponent },
  { path: 'master/credit-invoice', component: ADCreditInvoiceComponent },

  { path: 'govt-rules/epfo-rules', component: ADEpfoRulesComponent },
  { path: 'govt-rules/esic-rules', component: ADEsicRulesComponent },
  { path: 'govt-rules/bonus-rules', component: ADBonusRulesComponent },
  {
    path: 'govt-rules/gratuity-rules',
    component: ADGratuityRulesComponent,
  },
  { path: 'govt-rules/itax-slabs', component: ADItaxSlabsComponent },
  {
    path: 'govt-rules/itax-categories',
    component: ADItaxCategoriesComponent,
  },
  {
    path:'govt-rules/tds-rule',
    component:TdsRulesComponent
  },
  {
    path:'smtp',
    component:SmtpComponent
  },

  {
    path: 'company-rules/attendance-policy',
    component: ADAttendancePolicyComponent,
  },
  {
    path: 'company-rules/incentive-policy',
    component: ADIncentivePolicyComponent,
  },
  { path: 'company-rules/bonus-policy', component: ADBonusPolicyComponent },
  {
    path: 'company-rules/overtime-policy',
    component: ADOvertimePolicyComponent,
  },
  {
    path: 'company-rules/payslip-template',
    component: ADPayslipTemplateComponent,
  },
  {
    path: 'company-rules/bonusslip-template',
    component: ADBonusslipTemplateComponent,
  },
  {
    path: 'company-rules/arrearslip-template',
    component: ADArrearslipTemplateComponent,
  },
  { path: 'company-rules/tds-rule', component: ADTdsRuleComponent },
  { path: 'company-rules/ptax-rule', component: ADPtaxRuleComponent },
  { path: 'company-rules/lwf-rule', component: ADLwfRuleComponent },
  {
    path: 'company-rules/salary-template',
    component: ADSalaryTemplateComponent,
  },
  { path: 'company-rules/leave-rule', component: ADLeaveRuleComponent },

  { path: 'client-package', component: ADClientpackagesComponent },

  {
    path: 'subscription-management/plans',
    component: ADSubscriptionPlansComponent,
  },

  {
    path: 'invoice',
    component: InvoiceComponent,
  },
  {
    path: 'ledger-report',
    component: CompanyLedgerComponent,
  },
  {
    path: 'credit-usage',
    component: CreditUsageComponent,
  },
  {
    path: 'sales-ledger',
    component: SalesLedgerComponent,
  },
  
  {
    path: 'subscription-management/credit',
    component: ADSubscriptionCreditComponent,
  },

  {
    path: 'promotion-management',
    component: ADPromotionManagementComponent,
  },

  {
    path:'landing/page',
    component:ADLPageConfigComponent
  },
  {
    path:'landing/posts',
    component:ADLPostsComponent
  },
  {
    path:'landing/settings',
    component:ADLSettingsComponent
  },
  {
    path:'landing/membership',
    component:ADLMembershipComponent
  },
 
  {
    path:'tds-rule/declaration',
    component:TdsRuleDeclarationComponent
  },

];

export const AdminRoutes = RouterModule.forChild(routes);
