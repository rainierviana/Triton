import { Component, ViewChild, ElementRef, ViewEncapsulation, Renderer2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MenuController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HomePage {
  @ViewChild('description') description!: ElementRef<HTMLDivElement>;

  private initialdescriptionElements: any[] = [];
  public sisenseDashboards: any[] = [];
  public filteredSisenseDashboards: any[] = [];
  public date: string = '';
  public appConfig: any = {
    "appTitle": "",
    "headerImage": "",
    "defaultLanguage": "",
    "sisenseBasePath": []
  }

  // State Variables
  notFoundMessage: boolean = false;
  showBackButton: boolean = false;
  showForwardButton: boolean = false;
  popoverOpen: any = null;
  popoverEvent: any = null;

  // Data Management
  public menumodel: any[] = [];
  public filteredData: any[] = [];
  public filteredmenumodel: any[] = [];
  public childContent: any[] = [];
  selectedFilters: string[] = ['title'];

  // Navigation Management
  private navigationStack: any[] = [];
  private forwardStack: any[] = [];
  public breadcrumbs: string[] = [];
  searchQuery: any;

  constructor(
    public http: HttpClient,
    private menuCtrl: MenuController,
    private translate: TranslateService,
    private renderer: Renderer2
  ) {
    translate.setDefaultLang('pt');
  }

  // Data Initialization

  Initialize() {
    this.http.get('assets/data/menumodel.json').subscribe(
      (data: any) => {
        this.menumodel = data;
        this.filteredmenumodel = data;
      },
      (err) => {
        console.error(
          `status: ${err.status}, Status text: ${err.statusText}, Message: ${err.message}`
        );
      }
    );
    this.http.get('assets/data/sisensedashboards.json').subscribe(
      (sisense: any) => {
        this.sisenseDashboards = sisense;
        this.filteredSisenseDashboards = sisense;
      },
      (err) => {
        console.error(
          `status: ${err.status}, Status text: ${err.statusText}, Message: ${err.message}`
        );
      }
    );
    this.http.get('assets/data/appconfig.json').subscribe((config: any) => {
      this.appConfig = config;
      this.applyAppConfig();
    });
  }

  applyAppConfig() {
    document.title = this.appConfig.appTitle || 'Default App Title';

    const headerImageElement = document.querySelector('ion-toolbar img.headerLogo');
    if (headerImageElement && this.appConfig.headerImage) {
      headerImageElement.setAttribute('src', this.appConfig.headerImage);
    }
  }

  ngOnInit() {
    this.Initialize();
    this.setInitialLanguage();

    // Restore the saved state
    const savedItem = localStorage.getItem('lastSelectedItem');
    const savedBreadcrumbs = localStorage.getItem('breadcrumbs');
    const savedNavigationStack = localStorage.getItem('navigationStack');

    if (savedItem && savedBreadcrumbs && savedNavigationStack) {
      const item = JSON.parse(savedItem);
      this.breadcrumbs = JSON.parse(savedBreadcrumbs);
      this.navigationStack = JSON.parse(savedNavigationStack);

      this.FillContent(item);
    }

    setTimeout(() => {
      this.initialdescriptionElements = Array.from(this.description.nativeElement.children);
    }, 0);
  }

  // Retrieve the saved language from localStorage
  setInitialLanguage() {
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'pt';
    this.translate.use(savedLanguage);
  }

  navigation(item: any) {
    if (item.isHome) {
      this.home();
      return;
    }

    if (item.url) {
      let sItem = item.url.split(':');

      if (sItem[0] === 'sisense') {
        let conf = this.appConfig.sisenseBasePath.find((config: any) => config.base === sItem[1]);
        let base = conf.base;
        let path = conf.path;
        let dash = this.sisenseDashboards.find(db => db.title === sItem[2]);

        console.log('Title:', item.title);
        console.log('Base:', base);
        console.log('Path:', path);

        let sisenseUrl = `${path}/${dash.oid}`;
        console.log('Sisense URL:', sisenseUrl);
        window.open(sisenseUrl, '_blank');
      } else {
        console.log('URL:', item.url);
        window.open(item.url, '_blank');
      }
    } else if (item.childrens && item.childrens.length > 0) {
      this.FillContent(item);
    } else {
      this.renderItem(item);
    }
  }

  // Right Menu Controls
  openEndMenu() {
    this.menuCtrl.open('end');
  }

  //Popover Controls
  openPopover(event: Event, item: any) {
    event.stopPropagation();
    this.popoverEvent = event;
    this.popoverOpen = item;
  }

  openFilter() {
    const filterSelect = document.querySelector('ion-select.hiddenSelect') as any;
    if (filterSelect) {
      filterSelect.open();
    }
  }

  closePopover() {
    this.popoverOpen = null;
  }

  // Language Management
  toggleLanguage(language: string) {
    this.translate.use(language);
    localStorage.setItem('selectedLanguage', language);
  }

  // Save language preference
  handleLanguageChange(language: string) {
    localStorage.setItem('selectedLanguage', language);
    this.translate.use(language);
  }

  FillContent(item: any) {
    this.navigationStack.push(item);
    this.forwardStack = [];
    this.description.nativeElement.innerHTML = '';
    this.renderItem(item);
    this.showBackButton = true;
    this.showForwardButton = false;
    this.breadcrumbs.push(item.title);

    const existingIndex = this.breadcrumbs.indexOf(item.title);
    if (existingIndex !== -1) {
      this.breadcrumbs = this.breadcrumbs.slice(0, existingIndex + 1);
      this.navigationStack = this.navigationStack.slice(0, existingIndex + 1);
    } else {
      this.breadcrumbs.push(item.title);
      this.navigationStack.push(item);
    }

    // Close the side menu after an option is selected
    this.menuCtrl.close();
  }

  renderItem(item: any) {
    this.childContent = item.childrens || [];

    if (this.navigationStack[this.navigationStack.length - 1]?.title !== item.title) {
      this.navigationStack.push(item);
      this.breadcrumbs.push(item.title);
    }

    this.showBackButton = this.navigationStack.length > 0;
    this.showForwardButton = this.forwardStack.length > 0;
  }

  search() {
    const searchInputElement = document.getElementById('searchInput') as HTMLInputElement;
    const searchValue = searchInputElement.value.toLowerCase().trim();
  
    if (searchValue === '') {
      this.childContent.forEach((item) => (item.hidden = false));
      this.filteredData = [];
      
      if (this.navigationStack.length === 0) {
        this.description.nativeElement.innerHTML = `<p class="description">${this.translate.instant('home.description')}</p>`;
        this.notFoundMessage = false; 
      }
      return;
    }
  
    const matchingItems: any[] = [];
    const parentChildMap = new Map<string, any[]>(); // Store parent-child relationships
  
    // Determine active filters (default to title and description if none selected)
    const activeFilters = this.selectedFilters.length ? this.selectedFilters : ['title', 'description'];
  
    // ** Home Screen Search: Structured Search **
    const homeSearch = (items: any[], parentTitle: string | null) => {
      items.forEach((item) => {
        let matches = false;
  
        if (activeFilters.includes('title') && item.title.toLowerCase().includes(searchValue)) {
          matches = true;
        }
        if (activeFilters.includes('description') && item.description && item.description.toLowerCase().includes(searchValue)) {
          matches = true;
        }
  
        // If item matches and has a URL, add it to results with its full path
        if (matches && item.url) {
          if (parentTitle) {
            if (!parentChildMap.has(parentTitle)) {
              parentChildMap.set(parentTitle, []);
            }
  
            if (!parentChildMap.get(parentTitle)?.some((existing) => existing.title === item.title)) {
              parentChildMap.get(parentTitle)?.push({
                ...item,
                displayTitle: `${parentTitle} > ${item.title}`,
              });
            }
          } else {
            if (!matchingItems.some((existing) => existing.title === item.title)) {
              matchingItems.push({
                ...item,
                displayTitle: item.title,
              });
            }
          }
        }
  
        // If item matches but has children with URLs, include the children
        if (matches && item.childrens) {
          const childrenWithUrls = item.childrens.filter((child: { url: any; }) => child.url);
          if (childrenWithUrls.length > 0) {
            if (!parentChildMap.has(item.title)) {
              parentChildMap.set(item.title, []);
            }
            childrenWithUrls.forEach((child: { title: any; }) => {
              if (!parentChildMap.get(item.title)?.some((existing) => existing.title === child.title)) {
                parentChildMap.get(item.title)?.push({
                  ...child,
                  displayTitle: `${item.title} > ${child.title}`,
                });
              }
            });
          }
        }
  
        // Continue searching within children
        if (item.childrens && item.childrens.length > 0) {
          homeSearch(item.childrens, item.title);
        }
      });
    };
  
    // ** Navigation Level Search: Only Searches within Current Level **
    const navigationSearch = (items: any[], matchingItems: any[]) => {
      items.forEach((item) => {
        let matches = false;
  
        if (activeFilters.includes('title') && item.title.toLowerCase().includes(searchValue)) {
          matches = true;
        }
        if (activeFilters.includes('description') && item.description && item.description.toLowerCase().includes(searchValue)) {
          matches = true;
        }
  
        if (matches) {
          matchingItems.push(item);
        }
  
        if (item.childrens && item.childrens.length > 0) {
          navigationSearch(item.childrens, matchingItems);
        }
      });
    };
  
    // ** Execute Search Based on Navigation State **
    if (this.navigationStack.length === 0) {
      // Home screen search
      this.description.nativeElement.innerHTML = '';
      this.menumodel.forEach((topLevelItem) => {
        if (topLevelItem.childrens && topLevelItem.childrens.length > 0) {
          homeSearch(topLevelItem.childrens, topLevelItem.title);
        }
      });
  
      this.filteredData = Array.from(parentChildMap.entries());
    } else {
      // Navigation level search (only within current level)
      const topItem = this.navigationStack[this.navigationStack.length - 1];
      if (topItem.childrens && topItem.childrens.length > 0) {
        navigationSearch(topItem.childrens, matchingItems);
      }
  
      this.childContent.forEach((item) => {
        item.hidden = !matchingItems.includes(item);
      });
    }
  
    // ** Show "Not Found" Message Only if No Results Exist **
    setTimeout(() => {
      this.notFoundMessage = this.filteredData.length === 0 && matchingItems.length === 0;
    }, 0);
  }
  

  // Navigation Controls

  home() {
    this.menuCtrl.close();

    this.initialdescriptionElements.forEach((element) => {
      this.renderer.appendChild(this.description.nativeElement, element);
    });

    this.navigationStack = [];
    this.forwardStack = [];
    this.showBackButton = false;
    this.showForwardButton = false;
    this.childContent = [];
    this.breadcrumbs = [];
    this.notFoundMessage = false;
    this.filteredData = [];

    const searchInputElement = document.getElementById('searchInput') as HTMLInputElement;
    if (searchInputElement) {
      searchInputElement.value = '';
    }
  }

  backButton() {
    if (this.navigationStack.length > 1) {
      const searchInputElement = document.getElementById('searchInput') as HTMLInputElement;
      if (searchInputElement) {
        searchInputElement.value = '';
      }

      this.notFoundMessage = false;

      this.forwardStack.push(this.navigationStack.pop()!);
      this.breadcrumbs.pop();

      const previousItem = this.navigationStack[this.navigationStack.length - 1];
      this.description.nativeElement.innerHTML = '';
      this.renderItem(previousItem);
      this.showBackButton = true;
      this.showForwardButton = true;

    } else {
      this.description.nativeElement.innerHTML = '';
      this.initialdescriptionElements.forEach((element) => {
        this.renderer.appendChild(this.description.nativeElement, element);
      });

      const searchInputElement = document.getElementById('searchInput') as HTMLInputElement;
      if (searchInputElement) {
        searchInputElement.value = '';
      }

      this.navigationStack = [];
      this.forwardStack = [];
      this.breadcrumbs = [];
      this.showBackButton = false;
      this.childContent = [];
      this.showForwardButton = false;
      this.notFoundMessage = false;
    }
  }

  forwardButton() {
    if (this.forwardStack.length > 0) {
      const nextItem = this.forwardStack.shift();

      if (nextItem) {
        this.navigationStack.push(nextItem);
        this.breadcrumbs.push(nextItem.title);
        this.renderItem(nextItem);
      }
    }

    this.showBackButton = this.navigationStack.length > 0;
    this.showForwardButton = this.forwardStack.length > 0;
  }

  breadcrumbNavigation(index: number) {
    if (index < this.navigationStack.length - 1) {
      this.forwardStack = [...this.navigationStack.slice(index + 1)];
    } else {
      this.forwardStack = [];
    }

    this.navigationStack = this.navigationStack.slice(0, index + 1);
    this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);

    const selectedItem = this.navigationStack[this.navigationStack.length - 1];
    this.renderItem(selectedItem);

    this.showBackButton = this.navigationStack.length > 0;
    this.showForwardButton = this.forwardStack.length > 0;
  }

  searchBackButton() {
    this.filteredData = [];
    this.notFoundMessage = false;

    this.initialdescriptionElements.forEach((element) => {
      this.renderer.appendChild(this.description.nativeElement, element);
    });

    const searchInputElement = document.getElementById('searchInput') as HTMLInputElement;
    if (searchInputElement) {
      searchInputElement.value = '';
    }
  }
}
