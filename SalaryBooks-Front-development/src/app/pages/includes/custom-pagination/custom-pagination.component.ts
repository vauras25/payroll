import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import PaginationOptions from 'src/app/models/PaginationOptions';
import * as Global from 'src/app/globals';

@Component({
    selector: 'app-custom-pagination',
    templateUrl: './custom-pagination.component.html',
    styleUrls: ['./custom-pagination.component.css']
})
export class CustomPaginationComponent implements OnInit {
    Global = Global;
    @Input() rows: any[] = [];

    @Input() paginationOptions: PaginationOptions = {
        hasNextPage: false,
        hasPrevPage: false,
        limit: Global.DataTableLength,
        nextPage: null,
        page: 1,
        pagingCounter: 1,
        prevPage: null,
        totalDocs: 0,
        totalPages: 1,
    };

    @Output() onPageClicked: EventEmitter<any> = new EventEmitter<any>();
    @Output() onPerPageChange: EventEmitter<any> = new EventEmitter<any>();

    constructor() { }

    ngOnInit(): void {
    }    
}
