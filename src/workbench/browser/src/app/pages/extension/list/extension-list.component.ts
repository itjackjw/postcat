import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ElectronService } from 'eo/workbench/browser/src/app/core/services';
import { autorun, observable, makeObservable } from 'mobx';

import { ExtensionGroupType } from '../extension.model';
import { ExtensionService } from '../extension.service';

const extensionSearch = list => keyword => list.filter(it => it.name.includes(keyword) || it.keywords?.includes(keyword));

@Component({
  selector: 'eo-extension-list',
  templateUrl: './extension-list.component.html',
  styleUrls: ['./extension-list.component.scss']
})
export class ExtensionListComponent implements OnInit {
  @Input() @observable type: string = ExtensionGroupType.all;
  @Input() @observable keyword = '';
  @Output() readonly selectChange: EventEmitter<any> = new EventEmitter<any>();
  renderList = [];
  loading = false;
  constructor(public extensionService: ExtensionService, public electron: ElectronService) {}
  async ngOnInit() {
    makeObservable(this);
    autorun(async () => {
      this.renderList = await this.searchPlugin(this.type, this.keyword);
    });
  }
  clickExtension(event, item) {
    this.selectChange.emit(item.name);
  }
  async searchPlugin(groupType, keyword = '') {
    const timer = setTimeout(() => (this.loading = true), 80);
    const timeStart = Date.now();
    const func = {
      installed: () => {
        const list = this.extensionService.getInstalledList();
        return extensionSearch(list)(keyword).map(({ isEnable, name, ...it }) => ({
          ...it,
          name,
          isEnable: this.extensionService.isEnable(name)
        }));
      },
      official: async () => {
        const { data }: any = await this.extensionService.requestList();
        return extensionSearch(data.filter(it => it.author === 'Eoapi'))(keyword);
      },
      all: async () => {
        const { data }: any = await this.extensionService.requestList();
        return extensionSearch(data)(keyword);
      }
    };
    try {
      return func[groupType]();
    } catch (error) {
    } finally {
      clearTimeout(timer);
      const timeout = Date.now() - timeStart > 300 ? 0 : 300;
      setTimeout(() => (this.loading = false), timeout);
    }
  }

  handleEnableExtension(isEnable, item) {
    if (isEnable) {
      this.extensionService.enableExtension(item.name);
    } else {
      this.extensionService.disableExtension(item.name);
    }
  }
}
