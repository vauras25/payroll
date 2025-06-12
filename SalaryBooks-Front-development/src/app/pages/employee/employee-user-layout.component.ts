import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import * as Global from 'src/app/globals';

@Component({
    selector: 'app-employee-user-layout',
    templateUrl: './employee-user-layout.component.html',
    styleUrls: ['./employee-user-layout.component.css']
})
export class EmployeeUserLayoutComponent implements OnInit {
    PageMainTitle = Global.AppName;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private titleService: Title,
    ) { }

    ngOnInit() {
        this.shufflePageTitle();
        
        this.router.events.subscribe(event => {
            if (event instanceof NavigationEnd) {
                this.shufflePageTitle()
            }
        });
    }

    shufflePageTitle() {
        const rt = this.getActivatedRouteChild(this.activatedRoute);
        rt.data.subscribe((data: any) => {
            if (data.pageTitle) {
                this.titleService.setTitle(data.pageTitle + ' - ' + this.PageMainTitle)
            } else {
                this.titleService.setTitle('Employee Panel - ' + this.PageMainTitle)
            }
        });
    }

    getActivatedRouteChild(activatedRoute: ActivatedRoute): ActivatedRoute {
        if (activatedRoute.firstChild) {
            return this.getActivatedRouteChild(activatedRoute.firstChild);
        } else {
            return activatedRoute;
        }
    }
}