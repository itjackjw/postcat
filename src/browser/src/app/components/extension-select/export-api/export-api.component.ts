import { Component, OnInit } from '@angular/core';
import { has } from 'lodash-es';
import { ExtensionService } from 'pc/browser/src/app/services/extensions/extension.service';
import { ApiService } from 'pc/browser/src/app/services/storage/api.service';
import { TraceService } from 'pc/browser/src/app/services/trace.service';
import { EXPORT_API } from 'pc/browser/src/app/shared/constans/featureName';
import { ExtensionChange } from 'pc/browser/src/app/shared/decorators';
import { FeatureInfo } from 'pc/browser/src/app/shared/models/extension-manager';
import { StoreService } from 'pc/browser/src/app/shared/store/state.service';
import StorageUtil from 'pc/browser/src/app/shared/utils/storage/storage.utils';

import pkgInfo from '../../../../../../../package.json';

@Component({
  selector: 'eo-export-api',
  template: `<extension-select
    [(extension)]="currentExtension"
    tipsType="exportAPI"
    [extensionList]="supportList"
    (extensionChange)="selectChange($event)"
  ></extension-select> `
})
export class ExportApiComponent implements OnInit {
  currentExtension = StorageUtil.get('export_api_modal');
  supportList: any[] = [];
  isValid = true;
  featureMap: Map<string, FeatureInfo>;
  constructor(
    private extensionService: ExtensionService,
    private apiService: ApiService,
    private trace: TraceService,
    private store: StoreService
  ) {}
  ngOnInit(): void {
    this.initData();
  }
  @ExtensionChange(EXPORT_API, true)
  initData() {
    this.featureMap = this.extensionService.getValidExtensionsByFature(EXPORT_API);
    this.supportList = [];
    this.featureMap?.forEach((data: FeatureInfo, key: string) => {
      this.supportList.push({
        key,
        ...data
      });
    });
    if (!this.supportList.length) return;
    const { key } = this.supportList.at(0);
    if (!(this.currentExtension && this.supportList.find(val => val.key === this.currentExtension))) {
      this.currentExtension = key || '';
    }
  }
  selectChange($event) {
    StorageUtil.set('export_api_modal', this.currentExtension);
  }
  submit(callback: () => boolean) {
    this.export(callback);
  }
  private transferTextToFile(fileName: string, exportData: any) {
    const file = new Blob([JSON.stringify(exportData)], { type: 'data:text/plain;charset=utf-8' });
    const element = document.createElement('a');
    const url = URL.createObjectURL(file);
    element.href = url;
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    Promise.resolve().then(() => {
      document.body.removeChild(element);
      window.URL.revokeObjectURL(url);
    });
  }
  /**
   * Module export
   * TODO callback show support specific error tips
   *
   * @param callback
   */
  private async export(callback) {
    const feature = this.featureMap.get(this.currentExtension);
    const action = feature.action || null;
    const filename = feature.filename || 'export.json';
    const module = await this.extensionService.getExtensionPackage(this.currentExtension);
    if (action && module?.[action] && typeof module[action] === 'function') {
      const [data] = await this.apiService.api_projectExportProject({});
      if (data) {
        console.log('projectExport result', data);
        try {
          data.postcat = pkgInfo.version;
          let output = module[action]({ data: data || {} });
          //Change format
          if (has(output, 'status') && output.status === 0) {
            output = output.data;
          }
          if (filename) {
            this.transferTextToFile(filename, output);
          }
          const workspace_type = this.store.isLocal ? 'local' : 'remote';
          this.trace.report('export_project_success', { sync_platform: this.currentExtension, workspace_type });
          callback(true);
        } catch (e) {
          console.error(e);
          callback(false);
        }
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  }
}
