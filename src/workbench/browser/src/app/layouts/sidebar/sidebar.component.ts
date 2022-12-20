import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { ExtensionService } from 'eo/workbench/browser/src/app/pages/extension/extension.service';
import { ModuleInfo } from 'eo/workbench/browser/src/app/shared/models/extension-manager';
import { Message, MessageService } from 'eo/workbench/browser/src/app/shared/services/message';
import { StoreService } from 'eo/workbench/browser/src/app/shared/store/state.service';
import { Subscription } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { SidebarModuleInfo } from './sidebar.model';
import { SidebarService } from './sidebar.service';

@Component({
  selector: 'eo-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  modules: Array<ModuleInfo | SidebarModuleInfo | any>;
  routerSubscribe: Subscription;
  constructor(
    private router: Router,
    public sidebar: SidebarService,
    private messageService: MessageService,
    private extension: ExtensionService,
    private store: StoreService
  ) {}
  toggleCollapsed(): void {
    this.sidebar.toggleCollapsed();
  }

  ngOnInit(): void {
    this.getModules();
    this.getIDFromRoute();
    this.watchRouterChange();
    this.watchWorkspaceChange();
    this.watchInstalledExtensionsChange();
    this.initSidebarViews();
  }

  async initSidebarViews() {
    const sidebarViews = await this.extension.getSidebarViews();
    sidebarViews?.forEach(item => {
      const moduleIndex = this.modules.findIndex(n => n.id === item.extensionID);
      const validExtension = this.extension.isEnable(item.extensionID);
      if (moduleIndex !== -1 && !validExtension) {
        this.modules.splice(moduleIndex, 1);
        return;
      }
      if (moduleIndex === -1 && validExtension) {
        this.modules.splice(-1, 0, {
          title: item.title,
          id: item.extensionID,
          isShare: false,
          isOffical: false,
          icon: item.icon,
          activeRoute: `home/extensionSidebarView/${item.extensionID}`,
          route: `home/extensionSidebarView/${item.extensionID}`
        });
      }
    });
    sidebarViews?.length && this.getIDFromRoute();
  }

  watchInstalledExtensionsChange() {
    this.messageService.get().subscribe((inArg: Message) => {
      if (inArg.type === 'installedExtensionsChange') {
        const extensionIDs = Array.isArray(inArg.data) ? inArg.data.map(n => n.name) : [...inArg.data.keys()];
        this.modules = this.modules.filter(n => n.id.startsWith('@eo-core') || extensionIDs.includes(n.id));
        this.initSidebarViews();
        if (!this.modules.some(val => this.router.url.includes(val.activeRoute))) {
          this.router.navigate(['/home/workspace/project/api']);
        }
      }
    });
  }

  watchWorkspaceChange() {
    this.messageService.get().subscribe((inArg: Message) => {
      if (inArg.type === 'workspaceChange') {
        this.getModules();
      }
    });
  }

  watchRouterChange() {
    this.routerSubscribe = this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe((res: any) => {
      this.getIDFromRoute();
    });
  }
  async clickModule(module) {
    this.sidebar.currentModule = module;
    const nextApp = this.modules.find(val => val.id === module.id);
    const route = (nextApp as SidebarModuleInfo).route || '/home/blank';
    this.router.navigate([route]);
  }
  ngOnDestroy(): void {
    this.routerSubscribe?.unsubscribe();
  }
  private getModules() {
    const defaultModule = [
      {
        title: 'API',
        id: '@eo-core-share',
        isShare: true,
        isOffical: true,
        icon: 'api',
        activeRoute: 'home/share',
        route: 'home/share/http/test'
      },
      {
        title: 'API',
        id: '@eo-core-apimanger',
        isOffical: true,
        icon: 'api',
        activeRoute: 'home/workspace/project/api',
        route: 'home/workspace/project/api/http/test'
      },
      ...(!this.store.isLocal
        ? [
            {
              title: $localize`Member`,
              id: '@eo-core-member',
              isOffical: true,
              icon: 'peoples',
              activeRoute: 'home/workspace/project/member',
              route: 'home/workspace/project/member'
            }
          ]
        : []),
      {
        title: $localize`Setting`,
        id: '@eo-core-setting',
        isOffical: true,
        icon: 'setting',
        activeRoute: 'home/workspace/project/setting',
        route: 'home/workspace/project/setting'
      }
    ];
    const isShare = this.store.isShare;
    this.modules = defaultModule.filter((it: any) => (isShare ? it?.isShare : it?.isShare ? it?.isShare === isShare : true));
  }

  private getIDFromRoute() {
    if (!this.sidebar.visible) return;
    const urlArr = new URL(this.router.url, 'http://localhost').pathname.split('/');
    const currentModule = this.modules.find(val => val.activeRoute.split('/').every(n => urlArr.includes(n)));
    if (!currentModule) {
      //route error
      // this.clickModule(this.modules[0]);
      pcConsole.warn(`[sidebarComponent]: route error,currentModule is [${currentModule}]`, currentModule, urlArr);
      return;
    }
    this.sidebar.currentModule = currentModule;
  }
}
