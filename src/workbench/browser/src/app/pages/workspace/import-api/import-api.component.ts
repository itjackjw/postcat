import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EoNgFeedbackMessageService } from 'eo-ng-feedback';
import { ExtensionService } from 'eo/workbench/browser/src/app/pages/extension/extension.service';
import { FeatureInfo } from 'eo/workbench/browser/src/app/shared/models/extension-manager';
import { StorageRes, StorageResStatus } from 'eo/workbench/browser/src/app/shared/services/storage/index.model';
import { StorageService } from 'eo/workbench/browser/src/app/shared/services/storage/storage.service';
import { WebExtensionService } from 'eo/workbench/browser/src/app/shared/services/web-extension/webExtension.service';
import { StoreService } from 'eo/workbench/browser/src/app/shared/store/state.service';
import StorageUtil from '../../../utils/storage/Storage';

// const optionList = [
//   {
//     value: 'import',
//     type: 'string',
//     default: '',
//     label: '直接导入',
//     description: '直接导入',
//   },
//   {
//     value: 'add',
//     type: 'string',
//     default: true,
//     label: '增量更新[推荐]',
//     description: '增量更新',
//   },
//   {
//     value: 'all',
//     type: 'string',
//     default: '',
//     label: '全量更新[慎用]',
//     description: '全量更新',
//   },
//   {
//     value: 'new',
//     type: 'string',
//     default: '',
//     label: '仅添加新 API',
//     description: '仅添加新 API',
//   },
// ];

@Component({
  selector: 'eo-import-api',
  template: `<extension-select
    [allowDrag]="true"
    [(extension)]="currentExtension"
    [extensionList]="supportList"
    (uploadChange)="uploadChange($event)"
  ></extension-select>`
})
export class ImportApiComponent implements OnInit {
  supportList: any[] = [];
  currentExtension = StorageUtil.get('import_api_modal');
  uploadData = null;
  featureMap = this.webExtensionService.getFeatures('importAPI') || this.webExtensionService.getFeatures('apimanage.import');
  constructor(
    private router: Router,
    private storage: StorageService,
    private eoMessage: EoNgFeedbackMessageService,
    public extensionService: ExtensionService,
    public webExtensionService: WebExtensionService,
    private store: StoreService
  ) {}
  ngOnInit(): void {
    this.featureMap?.forEach((data: FeatureInfo, key: string) => {
      if (this.webExtensionService.isEnable(key)) {
        this.supportList.push({
          key,
          ...data
        });
      }
    });
    {
      const { key } = this.supportList.at(0);
      if (!(this.currentExtension && this.supportList.find(val => val.key === this.currentExtension))) {
        this.currentExtension = key || '';
      }
    }
  }
  uploadChange(data) {
    this.uploadData = data;
  }
  async submit(callback) {
    StorageUtil.set('import_api_modal', this.currentExtension);
    if (!this.uploadData) {
      this.eoMessage.error($localize`Please import the file first`);
      return;
    }
    // * this.currentExtension is extension's key, like 'eoapi-import-openapi'
    const feature = this.featureMap.get(this.currentExtension);
    const action = feature.action || null;
    const module = await window.eo?.loadFeatureModule?.(this.currentExtension);
    const { name, content } = this.uploadData;
    const [data, err] = module[action](content);
    // console.log('import data', structuredClone?.(data));
    if (err) {
      console.error(err.msg);
      callback(false);
      return;
    }
    // The datastructure may has circular reference,decycle by reset object;
    const decycle = (obj, parent?) => {
      const parentArr = parent || [obj];
      for (const i in obj) {
        if (typeof obj[i] === 'object') {
          parentArr.forEach(pObj => {
            if (pObj === obj[i]) {
              obj[i] = {
                description: $localize`Same as the parent's field ${obj[i].name}`,
                example: '',
                name: obj[i].name,
                required: true,
                type: obj[i].type
              };
            }
          });
          decycle(obj[i], [...parentArr, obj[i]]);
        }
      }
      return obj;
    };
    const params = [this.store.getCurrentProjectID, decycle(data)];
    this.storage.run('projectImport', params, (result: StorageRes) => {
      if (result.status !== StorageResStatus.success) {
        callback(false);
        console.error('EO_ERROR: Import Error', result.error);
        return;
      }
      callback(true);
      this.router.navigate(['home/api']);
    });
  }
}
