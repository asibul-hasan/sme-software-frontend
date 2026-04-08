import { Component, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { SharedModule } from '../../../../shared';
import { ToastrService } from 'ngx-toastr';
// Removed BranchRow interface

@Component({
  selector: 'app-sys1001',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './sys1001.component.html',
  styleUrls: ['./sys1001.component.scss'],
})
export class Sys1001Component implements OnInit {
  formdata: FormGroup = new FormGroup({});

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.formdata = new FormGroup({
      companyName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      companyAddress: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      companyPhone: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      companyEmail: new FormControl(''),
      companyWebsite: new FormControl(''),
      companyLogo: new FormControl(''),
      companySuffix: new FormControl(''),
      systemId: new FormControl(''),
      vendorType: new FormControl(''),
      regNo: new FormControl(''),
      regDate: new FormControl(''),
      countryCode: new FormControl(''),
      fiscalYear: new FormControl(''),
      companyStatus: new FormControl('active'),
    });
  }

  // ── Company actions ─────────────────────────────────────────────────
  onNew(): void {
    this.formdata.reset();
    this.toastr.info('Action: NEW');
  }
  onSave(): void {
    this.toastr.success('Record saved successfully.');
  }
  onReset(): void {
    this.formdata.reset();
    this.toastr.info('Action: RESET');
  }
  onDelete(): void {
    this.toastr.warning('Action: DELETE');
  }
}
