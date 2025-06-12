import { Component, Injectable, Input, OnInit } from '@angular/core';

@Component({
    selector: 'companyuser-app-salary-template-details-modal',
    templateUrl: './salary-template-details-modal.component.html',
})

export class CMPSalaryTemplateDetailsModalComponent implements OnInit {
    @Input() salaryTempateDetails: any = null;

    constructor() {

    }

    ngOnInit(): void {
    }
}