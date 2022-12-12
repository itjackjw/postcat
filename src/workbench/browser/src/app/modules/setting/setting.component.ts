import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { AfterViewInit, Component, ComponentRef, Input, OnDestroy, OnInit, QueryList, ViewChildren, ViewContainerRef } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { WebService } from 'eo/workbench/browser/src/app/core/services';
import { SettingService } from 'eo/workbench/browser/src/app/modules/setting/settings.service';
import { AccountComponent } from 'eo/workbench/browser/src/app/pages/account.component';
import { StoreService } from 'eo/workbench/browser/src/app/shared/store/state.service';
import { debounce, eoDeepCopy } from 'eo/workbench/browser/src/app/utils/index.utils';
import { NzTreeFlatDataSource, NzTreeFlattener } from 'ng-zorro-antd/tree-view';

import { AboutComponent, DataStorageComponent, LanguageSwticherComponent, SelectThemeComponent } from './common';

interface TreeNode {
  name: string;
  moduleID?: string;
  ifShow?: () => boolean;
  disabled?: boolean;
  children?: TreeNode[];
  configuration?: any[];
}

interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
  disabled: boolean;
}

@Component({
  selector: 'eo-setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss']
})
export class SettingComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() selectedModule: string;
  @ViewChildren('options', { read: ViewContainerRef }) options: QueryList<ViewContainerRef>;
  componentRefs: Array<ComponentRef<any>>;
  extensitonConfigurations: any[];
  objectKeys = Object.keys;
  isClick = false;
  private transformer = (node: TreeNode, level: number): FlatNode & TreeNode => ({
    ...node,
    expandable: !!node.children && node.children.length > 0,
    name: node.name,
    level,
    disabled: !!node.disabled
  });
  selectListSelection = new SelectionModel<FlatNode & TreeNode>();
  treeControl: any = new FlatTreeControl<FlatNode & TreeNode>(
    node => node.level,
    node => node.expandable
  );

  treeFlattener = new NzTreeFlattener(
    this.transformer,
    node => node.level,
    node => node.expandable,
    node => node.children
  );

  dataSource = new NzTreeFlatDataSource(this.treeControl, this.treeFlattener);
  /** current configuration */
  currentConfiguration = [];
  /** current active configure */
  /** all configure */
  $settings = {};

  set settings(val) {
    this.$settings = val;
    this.handleSave();
  }

  get settings() {
    return this.$settings;
  }
  treeNodes = [
    {
      name: $localize`:@@Account:Account`,
      moduleID: 'eoapi-account',
      ifShow: () => this.store.isLogin,
      comp: AccountComponent,
      children: [
        {
          name: $localize`:@@Account:Username`,
          moduleID: 'eoapi-account-username'
        },
        {
          name: $localize`Password`,
          moduleID: 'eoapi-account-password'
        }
      ]
    },
    {
      name: $localize`:@@Theme:Theme`,
      moduleID: 'eoapi-theme',
      comp: SelectThemeComponent
    },
    {
      name: $localize`:@@Cloud:Cloud Storage`,
      moduleID: 'eoapi-common',
      comp: DataStorageComponent,
      ifShow: () => !this.webService.isWeb
    },
    {
      name: $localize`:@@Language:Language`,
      moduleID: 'eoapi-language',
      comp: LanguageSwticherComponent
    },
    {
      name: $localize`About`,
      moduleID: 'eoapi-about',
      comp: AboutComponent
    }
  ];
  /** local configure */
  localSettings = {};
  validateForm!: FormGroup;
  get selected() {
    return this.selectListSelection.selected.at(0)?.moduleID;
  }

  constructor(private settingService: SettingService, public store: StoreService, public webService: WebService) {}

  ngOnInit(): void {
    this.init();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const options = this.options.toArray();
      this.componentRefs = this.treeNodes
        .filter(item => !item.ifShow || item.ifShow?.())
        .map((item, index) => {
          const componentRef = options[index]?.createComponent<any>(item.comp as any);
          componentRef.location.nativeElement.id = item.moduleID;
          componentRef.instance.model = this.settings;
          componentRef.instance.modelChange?.subscribe(data => {
            Object.assign(this.settings, data);
            this.handleSave();
          });
          // console.log('componentRef', componentRef);
          return componentRef;
        });
    });
  }

  ngOnDestroy(): void {
    this.componentRefs.forEach(item => item.destroy());
  }

  hasChild = (_: number, node: FlatNode): boolean => node.expandable;

  /**
   * Get the title of the module
   *
   * @param module
   * @returns
   */
  getModuleTitle(module: any): string {
    const title = module?.moduleName ?? module?.title;
    return title;
  }

  handleScroll = debounce((e: Event) => {
    if (this.isClick) {
      return;
    }
    const target = e.target as HTMLDivElement;
    const treeNodes = this.dataSource._flattenedData.value;
    treeNodes.some(node => {
      const el = target.querySelector(`#${node.moduleID}`) as HTMLDivElement;
      if (el && el.offsetTop > target.scrollTop) {
        this.selectListSelection.select(node);
        return true;
      }
    });
  }, 50);
  selectModule(node) {
    this.isClick = true;
    this.currentConfiguration = node.configuration || [];
    // console.log('this.currentConfiguration', this.currentConfiguration);
    this.selectListSelection.select(node);
    const target = document.querySelector(`#${node.moduleID}`);
    target?.scrollIntoView();
    setTimeout(() => {
      this.isClick = false;
    }, 800);
  }
  private initTree() {
    // Recursively generate the setup tree
    const generateTreeData = (configurations = []) =>
      [].concat(configurations).reduce<TreeNode[]>((prev, curr) => {
        if (Array.isArray(curr)) {
          return prev.concat(generateTreeData(curr));
        }
        const treeItem: TreeNode = {
          name: curr.title,
          moduleID: curr.moduleID,
          configuration: [].concat(curr)
        };
        return prev.concat(treeItem);
      }, []);
    // All settings
    const treeData = eoDeepCopy(
      this.treeNodes
        .map(({ comp, ifShow, ...rest }) => rest)
        .filter(val => {
          switch (val.moduleID) {
            case 'eoapi-account': {
              if (!this.store.isLogin) {
                return false;
              }
            }
          }
          return true;
        })
    );
    this.dataSource.setData(treeData);
    this.treeControl.expandAll();

    // The first item is selected by default
    const nodeIndex = this.treeControl.dataNodes.findIndex(node => node.moduleID === this.selectedModule);
    if (this.selectedModule && nodeIndex === -1) {
      console.error(`EO_ERROR[eo-setting]: The selected module [${this.selectModule}] does not exist`);
    }
    //!After view init for scrollIntoView
    setTimeout(() => {
      this.selectModule(this.treeControl.dataNodes.at(nodeIndex === -1 ? 0 : nodeIndex));
    }, 0);
  }
  /**
   * Parse the configuration information of all modules
   */
  private init() {
    this.settings = this.localSettings = this.settingService.getSettings();
    const modules = window.eo?.getModules?.() || new Map([]);
    this.extensitonConfigurations = [...modules.values()]
      .filter(n => n.features?.configuration)
      .map(n => {
        const configuration = n.features.configuration;
        if (Array.isArray(configuration)) {
          configuration.forEach(m => (m.moduleID ??= n.moduleID));
        } else {
          configuration.moduleID ??= n.moduleID;
        }
        return configuration;
      });

    this.initTree();
  }

  handleSave = () => {
    this.settingService.saveSetting(this.settings);
    window.eo?.saveSettings?.({ ...this.settings });
  };
}
