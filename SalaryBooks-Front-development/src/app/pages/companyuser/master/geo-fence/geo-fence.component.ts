import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { CompanyuserService } from 'src/app/services/companyuser.service';
import * as Global from 'src/app/globals';
import PaginationOptions from 'src/app/models/PaginationOptions';
import TableFilterOptions from 'src/app/models/TableFiilterOptions';

@Component({
  selector: 'app-geo-fence',
  templateUrl: './geo-fence.component.html',
  styleUrls: ['./geo-fence.component.css'],
})
export class CMPGeoFenceComponent implements OnInit {
  editActionId: any;
  locationMaster:any = {};
  isLocationViewing:boolean = false
  locationListing: any[] = [];
  GeoFenceForm: FormGroup = new FormGroup({
    location: new FormControl('', Validators.required),
    description: new FormControl(''),
    // googleData: new FormControl('', Validators.required),
    address: new FormControl('', Validators.required),
    radius: new FormControl('', Validators.required),
    latitude: new FormControl(0, Validators.required),
    longitude: new FormControl(0, Validators.required),
  });
  reportPaginationOptions: PaginationOptions = Global.resetPaginationOption();
  reportTableFilterOptions: TableFilterOptions =
    Global.resetTableFilterOptions();
  constructor(
    private toastr: ToastrService,
    private companyuserService: CompanyuserService,
    private spinner: NgxSpinnerService
  ) {
    this.fetchLocationList();
  }

  ngOnInit() {
    // this.GeoFenceForm.get("address")?.valueChanges.subscribe(v => {
    // // console.log(v);
    //   if(v && !v.latitude ){
    //     this.GeoFenceForm.get('latitude')?.markAsTouched() 
    //     this.GeoFenceForm.get('latitude')?.markAsDirty() 
    //     this.GeoFenceForm.get('longitude')?.markAsTouched() 
    //     this.GeoFenceForm.get('longitude')?.markAsDirty() 
    //   }
    // })
  }

  async create(e: any) {
    try {
      // e.classList.add('loading');
      let payload = this.GeoFenceForm.value;
      let res = await this.companyuserService
        .createCompanyLocation(payload)
        .toPromise();
      if (res.status !== 'success') throw res;
      this.cancelEdit();
      this.toastr.success(res.message);
    } catch (err: any) {
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  }

  async fetchLocationList(ev:any='') {
    try {
      console.log(ev,'evvvvvvvvvv');
      console.log(this.reportTableFilterOptions,'repottttt');
      
      let res = await this.companyuserService
        .listCompanyLocation({
          pageno: 1,
          perpage: this.reportPaginationOptions.limit || 20,
          searchkey: this.reportTableFilterOptions.searchkey || '',
          checked_row_ids: JSON.stringify([]),
          row_checked_all: false,
          unchecked_row_ids: JSON.stringify([]),
        })
        .toPromise();
      if (res.status !== 'success') throw res;
      this.locationListing = res?.data?.docs ?? [];
      // this.toastr.success(res.message);
    } catch (err: any) {
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  }

  async update(location:any) {
    try {
      let payload = this.GeoFenceForm.value;
      payload.location_id = this.editActionId;
      let res = await this.companyuserService
        .createCompanyLocation(payload)
        .toPromise();
      if (res.status !== 'success') throw res;
      this.toastr.success(res.message);
      this.cancelEdit()
    } catch (err: any) {
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  }

  async updateStatus(location: any) {
    try {
      let res = await this.companyuserService
        .changeLocationStatus({
          location_id: location?._id,
          status: location.status == 'active' ? 'inactive' : 'active' ,
        })
        .toPromise();
      if (res.status !== 'success') throw res;
      this.cancelEdit()
      this.toastr.success(res.message);
    } catch (err: any) {
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  }

  async deleteLocation(location_id:any) {
    try {
      if(!location_id) return
      let res = await this.companyuserService.deleteCompanyLocation({location_id}).toPromise();
      if(res.status !== 'success') throw res
      this.toastr.success(res.message);
      this.cancelEdit()
    } catch (err:any) {
      if (err.status == 'val_err') {
        this.toastr.error(Global.showValidationMessage(err.val_msg));
      } else {
        this.toastr.error(Global.showServerErrorMessage(err));
        this.toastr.error(err.message);
      }
    }
  }

  handleAddressChange(address: any) {
    if(!address) return
    this.GeoFenceForm.get('address')?.setValue(address.formatted_address) 
    this.GeoFenceForm.get('latitude')?.setValue(address.geometry.location.lat())
    this.GeoFenceForm.get('longitude')?.setValue(address.geometry.location.lng())
  }

  patchFormValues(location: any) {
    this.editActionId = location?._id;
    this.GeoFenceForm.patchValue({
      location: location.location,
      address: location.address,
      radius: location.radius,
      latitude: location.latitude,
      longitude: location.longitude,
      description: location.description,
    });
  }

  cancelEdit() {
    this.editActionId = null;
    this.GeoFenceForm.reset();
    this.fetchLocationList();
  }
  
  viewLocation(location:any){
    try {
      if(!location) return
      this.locationMaster = location;
      this.isLocationViewing = true
      $('#viewLocation').click()
    } catch (err) {
      
    }
  }
}
