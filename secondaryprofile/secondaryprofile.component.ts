import { Component, OnInit, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { Floor, IGetUser, ISPDoctor, ISPDepartment, ISPLevel, IUserResponse, ISPProfile } from '../_model/IUsers';
import { UsersService } from '../_service/users.service';
import { ActionType, AlertMessageService } from '../../_services/alertMessageService';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-secondaryprofile',
  templateUrl: './secondaryprofile.component.html',
  styleUrls: ['./secondaryprofile.component.scss']
})
export class SecondaryProfileComponent implements OnInit {

  usersForm: FormGroup;
  totalLevels: ISPLevel[] = [];
  doctorsList: ISPDoctor[] = [];
  newDoctorsList: ISPDoctor[] = [];
  totalDepartements: ISPDepartment[] = [];
  _doctorAction = false;
  filterFloorGroup = [];
  filterDeptGroup = [];
  loading: boolean = false;
  _editProfile:ISPProfile[]=[];
  constructor(public dialogRef: MatDialogRef<SecondaryProfileComponent>, @Inject(MAT_DIALOG_DATA) public userdata: IGetUser, private alertMessage: AlertMessageService, private router: Router, private translate: TranslateService, private fb: FormBuilder,
    private profileService: UsersService) { }

  ngOnInit() {
    this.usersForm = this.fb.group({
      department: [null],
      level: [null,],
      doctor: [null],
    })
    this.getFloorsWithDeptsAndDoctorsByFacilitateId();
  }
  showAlert(error: any, action: ActionType, status: number = 0) {
    if (status == 401)
      this.router.navigate(['401']);
    else setTimeout(() => this.alertMessage.showAlert(error, action));
  }
  getFloorsWithDeptsAndDoctorsByFacilitateId() {
    this.loading = true;
    console.log("getFloorsWithDeptsAndDoctorsByFacilitateId_Request=>");

    this.profileService.getFloorsWithDeptsAndDoctorsByFacilitateId().subscribe((result: ISPLevel[]) => {
      console.log("getFloorsWithDeptsAndDoctorsByFacilitateId_Response=>", result);
      if (result.length != 0) {
        this.totalLevels = result;

        console.log("totalLevels=>", this.totalLevels);


        this.totalLevels.forEach(levelObj => {
          levelObj.departments.forEach(deptObj => {
            deptObj.doctors.forEach(dObj => {
              dObj.buildId = levelObj.buildId;
              dObj.floorId = levelObj.floorId;
              dObj.floorName = levelObj.floorName;
              dObj.deptId = deptObj.deptId;
              dObj.deptName = deptObj.deptName;
              dObj.drId = dObj.userId;
              dObj.nurseId = this.userdata.userId;
            });
            deptObj.floorName = levelObj.floorName;
          })
        });
        console.log("totalLevels after iteration=>", this.totalLevels);

        this.getProfileByNurse();
      }
      else {
        this.totalLevels = [];
        this.alertMessage.showAlert(this.translate.instant('usersModule.createuser.noDataLevelError'), ActionType.FAILED);
      }
      this.loading = false;
    }, err => {
      this.totalLevels = [];
      let message = err.error.messages as string
      let errorMessage = err.status == 404 ? this.translate.instant('ActionNames.errorResponse') : message ? message : err.message;
      console.log("Failed :: ", JSON.stringify(err));
      this.showAlert(errorMessage, ActionType.ERROR, err.status);
      this.loading = false;
    });
  }
  levelSelection(floors: any,action?:boolean) {
    console.log('sel floors=>', floors);
    this.totalDepartements = [];
    this.filterFloorGroup = [];

    if (floors.length > 0) {
      this.usersForm.get('department').setValidators(Validators.required);
      this.usersForm.get('department').updateValueAndValidity();

      this.usersForm.get('doctor').setValidators(Validators.required);
      this.usersForm.get('doctor').updateValueAndValidity();


      this.filterFloorGroup = this.totalLevels.filter(x => floors.findIndex(y => y.floorId == x.floorId) != -1);
      console.log('filterFloorGroup=>', this.filterFloorGroup);

      // this.totalDepartements= this.totalLevels.filter(x =>floors.findIndex(y => y == x.floorId) != -1)[0].departments;
      floors.forEach(element => {
        let arr = this.totalLevels.filter(x => x.floorId == element.floorId)[0].departments;
        this.totalDepartements = this.totalDepartements.concat(arr);
      });
      console.log('this.totalDepartements=>', this.totalDepartements);
      console.log('this.usersForm.value.department=>', this.usersForm.value.department);

      if (this.usersForm.value.department != null) {
        let depts: ISPDepartment[] = this.usersForm.value.department;
        depts = depts.filter(x => this.totalDepartements.findIndex(y => y.deptId == x.deptId) != -1);
        this.usersForm.get('department').setValue(depts.length > 0 ? depts : null);

        this.selectDepartMent(this.usersForm.value.department, false);
      }
      if(!action){
        this.selectDepartMent(, false);
      }
    } else {
      this.usersForm.get('level').setValue(null);
      this.usersForm.get('department').setValue(null);
      this.usersForm.get('doctor').setValue(null);
      this.usersForm.get('department').clearValidators();
      this.usersForm.get('doctor').clearValidators();
      this.usersForm.get('department').updateValueAndValidity();
      this.usersForm.get('doctor').updateValueAndValidity();
      this.doctorsList = [];
      this.filterFloorGroup = [];
      this.filterDeptGroup = [];
    }
  }
  selectDepartMent(depts: any, action: boolean) {
    console.log('depts=>', depts);

    this.doctorsList = [];
    if (depts.length > 0) {
      this.usersForm.get('doctor').setValidators(Validators.required);
      this.usersForm.get('doctor').updateValueAndValidity();
      console.log('this.totalDepartements=>', this.totalDepartements);


      this.filterDeptGroup = this.totalDepartements.filter(x => depts.findIndex(y => y == x) != -1);
      console.log('filterDeptGroup=>', this.filterDeptGroup);

      depts.forEach(element => {
        let arr = this.totalDepartements.filter(x => x == element)[0].doctors;
        this.doctorsList = this.doctorsList.concat(arr);
      });
      console.log('doctorsList=>', this.doctorsList);

      if (!action) {
        if (this.usersForm.value.doctor) {
          let doctors: ISPDoctor[] = this.usersForm.value.doctor;
          doctors = doctors.filter(x => this.doctorsList.findIndex(y => y == x) != -1);
          this.usersForm.get('doctor').setValue(doctors.length > 0 ? doctors : null);
        }
      }
    } else {
      this.usersForm.get('department').setValue(null);
      this.usersForm.get('doctor').setValue(null);
      this.usersForm.get('doctor').clearValidators();
      this.usersForm.get('doctor').updateValueAndValidity();
      this.filterDeptGroup = [];
    }
  }
  createSecondaryProfile() {
    console.log('result=>', this.usersForm.value);
    let profileData = [];
    this.usersForm.value.doctor.forEach(element => {
      profileData.push({
        "buildId": element.buildId,
        "deptId": element.deptId,
        "drId": element.drId,
        "floorId": element.floorId,
        "nurseId": element.nurseId
      })
    });


    let reqData = {
      "nurseId": this.userdata.userId,
      "profileInfo": profileData//this.usersForm.value.doctor
    };
    console.log('createSecondaryProfile_Request=>', reqData);

    this.profileService.createSecondaryProfile(reqData).subscribe((response: IUserResponse) => {
      console.log('createSecondaryProfile_Response=>', response);
      if (response) {
        this.alertMessage.showAlert(response.messages, ActionType.SUCCESS);
        this.dialogRef.close();
      } else {
        this.alertMessage.showAlert(response.messages, ActionType.FAILED);
      }
      this.loading = false;
    }, error => {
      let message = error.error.messages as string
      let errorMessage = error.status == 404 ? this.translate.instant('ActionNames.errorResponse') : message ? message : error.message;
      console.log("Failed :: ", JSON.stringify(error));
      this.showAlert(errorMessage, ActionType.ERROR, error.status);
      this.loading = false;
    });
  }
  getProfileByNurse(){
    this.profileService.getProfileByNurse(this.userdata.userId).subscribe((response: ISPProfile[]) => {
      console.log('createSecondaryProfile_Response=>', response);
      if (response) {
        this._editProfile = response;
       this.usersForm.get('level').setValue(this.totalLevels.filter(x=>x.floorId==this._editProfile.floorId)[0]);
       this.levelSelection(this.usersForm.value.level,false);
      } else {

      }
      this.loading = false;
    }, error => {
      let message = error.error.messages as string
      let errorMessage = error.status == 404 ? this.translate.instant('ActionNames.errorResponse') : message ? message : error.message;
      console.log("Failed :: ", JSON.stringify(error));
      this.showAlert(errorMessage, ActionType.ERROR, error.status);
      this.loading = false;
    });
  }
}
