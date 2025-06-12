import { Component, OnInit } from '@angular/core';
import { DragToggleService } from 'src/app/services/drag-toggle.service';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-home-edit',
  templateUrl: './home-edit.component.html',
  styleUrls: ['./home-edit.component.css']
})
export class HomeEditComponent implements OnInit {
  isEnabled1 = false;
  isEnabled2 = false;
  isEnabled3 = false;

  constructor(
    private dragToggleService: DragToggleService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      // Add Authorization token if required
      // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
    });

    this.http.post<any>('http://127.0.0.1:8080/company/get_dashboard_content?corporate_id=VBL', { headers })
      .subscribe({
        next: (res) => {
          this.isEnabled1 = res.content_visible;
          this.isEnabled2 = res.content_credit;
          this.isEnabled3 = res.datarange;
          this.dragToggleService.setDragEnabled(this.isEnabled1);
        },
        error: (err) => {
          console.error('Failed to fetch dashboard content:', err);
        }
      });
  }

  // toggle() {
  //   this.isEnabled1 = !this.isEnabled1;
  //   this.dragToggleService.setDragEnabled(this.isEnabled1);
  //   this.isEnabled2 = !this.isEnabled2;
  //   this.dragToggleService.setDragEnabled(this.isEnabled2);

  //   const body = {
  //     content_visible: this.isEnabled1,
  //     content_credit: this.isEnabled1,
  //     corporate_id: 'VBL'
  //   };

  //   const headers = new HttpHeaders({
  //     'Content-Type': 'application/json',
  //     // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
  //   });

  //   this.http.post('http://127.0.0.1:8080/company/edit_dashboard_content', body, { headers })
  //     .subscribe({
  //       next: (response) => console.log('API success:', response),
  //       error: (error) => console.error('API error:', error)
  //     });
  // }


  toggleEnabled1() {
    this.isEnabled1 = !this.isEnabled1;
    this.dragToggleService.setDragEnabled(this.isEnabled1);
    this.saveDashboardContent();
  }
  
  toggleEnabled2() {
    this.isEnabled2 = !this.isEnabled2;
    this.dragToggleService.setDragEnabled(this.isEnabled2);
    this.saveDashboardContent();
  }
  toggleEnabled3() {
    this.isEnabled3 = !this.isEnabled3;
    this.dragToggleService.setDragEnabled(this.isEnabled3);
    this.saveDashboardContent();
  }

  saveDashboardContent() {
    const body = {
      content_visible: this.isEnabled1,
      content_credit: this.isEnabled2,
      datarange: this.isEnabled3,
      corporate_id: 'VBL'
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
    });
  
    this.http.post('http://127.0.0.1:8080/company/edit_dashboard_content', body, { headers })
      .subscribe({
        next: (response) => console.log('API success:', response),
        error: (error) => console.error('API error:', error)
      });
  }

  navigateToHomeEdit() {
    this.router.navigate(['/company']);
  }
}
