import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ExtensionSettingComponent } from './components/extensions.component';
import { ExtensionDetailComponent } from './extension-detail.component';
import { SharedModule } from 'eo/workbench/browser/src/app/shared/shared.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { EoNgSwitchModule } from 'eo-ng-switch';
import { EoNgTabsModule } from 'eo-ng-tabs';
import { ShadowDomEncapsulationModule } from '../../../modules/eo-ui/shadow/shadow-dom-encapsulation.module';

@NgModule({
  imports: [
    SharedModule,
    FormsModule,
    CommonModule,
    NzAvatarModule,
    NzResultModule,
    NzInputNumberModule,
    NzDescriptionsModule,
    EoNgSwitchModule,
    EoNgTabsModule,
    ShadowDomEncapsulationModule,
  ],
  declarations: [ExtensionSettingComponent, ExtensionDetailComponent],
  schemas: [],
})
export class ExtensionDetailModule {}
