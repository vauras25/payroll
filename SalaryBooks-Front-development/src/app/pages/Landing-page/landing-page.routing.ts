import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { MembershipComponent } from './membership/membership.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { TestimonialsComponent } from './testimonials/testimonials.component';
import { ContactUsComponent } from './contact-us/contact-us.component';
import { LandingPageComponent } from './landing-page.component';

const routes: Routes = [
  { path:'', component:LandingPageComponent, children:[
    
    { path: '',  pathMatch:"full",component: HomeComponent },
    { path: 'membership', component: MembershipComponent },
    { path: 'about', component: AboutUsComponent },
    { path: 'testimonials', component: TestimonialsComponent },
    { path: 'contact', component: ContactUsComponent },
  ] }
];

export const LandingPageRoutes = RouterModule.forChild(routes);
