import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'eo/workbench/browser/src/app/shared/shared.module';

import { EoTableProModule } from '../../modules/eo-ui/table-pro/table-pro.module';
import { EnvEditComponent } from './env-edit/env-edit.component';
import { EnvListComponent } from './env-list/env.component';
import { EnvSelectComponent } from './env-select/env-select.component';

const ANTDMODULES = [EoTableProModule];
const COMPONENTA = [EnvListComponent, EnvSelectComponent];
@NgModule({
  declarations: [...COMPONENTA, EnvEditComponent],
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: EnvEditComponent
      }
    ]),
    FormsModule,
    CommonModule,
    SharedModule,
    ...ANTDMODULES
  ],
  exports: [...COMPONENTA]
})
export class EnvModule {}
