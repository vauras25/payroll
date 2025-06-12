import { Injectable } from '@angular/core';
import { WebService } from './web.service';

@Injectable({
  providedIn: 'root'
})
export class LandingPageService {

constructor(private webService: WebService) { }

generatePageSlug(payload:any){
  return this.webService.postFormData('landing-page/generate-page-slug', payload)
}
createPage(payload:any){
  return this.webService.postFormData('landing-page/create-landing-page', payload)
}
updatePage(payload:any){
  return this.webService.postFormData('landing-page/update-landing-page', payload)
}
createPost(payload:any){
  return this.webService.postFormData('landing-page/create-page-post', payload)
}
updatePost(payload:any){
  return this.webService.postFormData('landing-page/update-page-post', payload)
}
createMembershipPlan(payload:any){
  return this.webService.postFormData('landing-page/create-membership-plan', payload)
}
updateMembershipPlan(payload:any){
  return this.webService.postFormData('landing-page/update-membership-plan', payload)
}

fetchLandingPages(payload:any){
  return this.webService.postFormData('landing-page/get-landing-pages', payload)
}
fetchPagePosts(payload:any){
  return this.webService.postFormData('landing-page/get-page-posts', payload)
}
updateSettings(payload:any){
  return this.webService.postFormData('landing-page/update-settings', payload)
}
getSettings(payload:any){
  return this.webService.postFormData('landing-page/get-settings', payload)
}
getMembershipPlans(payload:any){
  return this.webService.postFormData('landing-page/get-membership-plans', payload)
}

}
