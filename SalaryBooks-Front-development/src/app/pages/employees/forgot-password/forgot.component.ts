import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-forgot',
  templateUrl: './forgot.component.html',
  styleUrls: ['./forgot.component.css'],
})
export class ForgotComponent implements OnInit {
  loginForm: FormGroup;
  emailId: string | null = null;
  staff: string | null = null;
  super: string | null = null;

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      corporate_id: ['', Validators.required],
      userid: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.emailId = null;
    this.staff = null;
    this.super = null;

    const formData = this.loginForm.value;

    this.http.post('http://localhost:8080/findCompanyByCorporateId', formData).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          console.log('Company found:', res.data);
          // this.emailId = res.data.email_id; 
          this.emailId = res.email; 
          this.staff = res.staff._id;
          this.super = res.super;
          
          // You can route or display success message
        } else {
          console.error(res.message);
        }
      },
      error: (err) => {
        console.error('Error occurred:', err);
      },
    });

  }
}
