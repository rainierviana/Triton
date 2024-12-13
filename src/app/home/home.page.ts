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
  @ViewChild('mainContent') mainContent!: ElementRef<HTMLDivElement>;

  private initialMainContentElements: any[] = [];
  public appConfig: any = {};
  public sisenseDashboards: any[] = [];
  public filteredSisenseDashboards: any[] = [];
  public headerColor: string = ''; 
  public date: string = '';
  private currentSearchScope: any[] = []; // Holds the current scope of items to search
  private allItems: any[] = []; // Holds all items from the JSON (second level and beyond)

  // State Variables
  noItemsFound: boolean = false;
  showBackButton: boolean = false;
  showForwardButton: boolean = false;

  // Data Management
  public menuData: any[] = [];
  public filteredData: any[] = [];
  public filteredMenuData: any[] = [];

  // Navigation Management
  private navigationStack: any[] = [];
  private forwardStack: any[] = [];
  public breadcrumbs: string[] = [];

  constructor(
    public http: HttpClient,
    private menuCtrl: MenuController,
    private translate: TranslateService,
    private renderer: Renderer2
  ) {
    translate.setDefaultLang('pt');
  }

  Initialize() {
    this.http.get('assets/data/menumodel.json').subscribe(
      (data: any) => {
        this.menuData = data;
        this.filteredMenuData = data; 
      },
      (err) => {
        console.error(
          `status: ${err.status}, Status text: ${err.statusText}, Message: ${err.message}`
        );
      }
    );
    this.http.get('assets/data/sisensedashboards.json').subscribe(
      (dash: any) => {
        this.sisenseDashboards = dash;
        this.filteredSisenseDashboards = dash;
      },
      (err) => {
        console.error(
          `status: ${err.status}, Status text: ${err.statusText}, Message: ${err.message}`
        );
      }
    );
  }

  ngOnInit() {
    this.loadAppConfig();
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

      this.FillContent(item); // Restore the last content
    } 

    setTimeout(() => {
      this.initialMainContentElements = Array.from(this.mainContent.nativeElement.children);
    }, 0);
  }

  // Data Initialization
  loadAppConfig() {
    this.http.get('assets/data/appconfig.json').subscribe((config: any) => {
      this.appConfig = config;
      this.applyAppConfig();
    });
  }

  applyAppConfig() {
    // Set the app title
    document.title = this.appConfig.appTitle || 'Default App Title';

    // Set the header image
    const headerImageElement = document.querySelector('ion-toolbar img.headerLogo');
    if (headerImageElement && this.appConfig.headerImage) {
      headerImageElement.setAttribute('src', this.appConfig.headerImage);
    } 

    // Set header background color
    if (this.appConfig.headerColor) {
      this.headerColor = this.appConfig.headerColor;
      this.applyHeaderBackgroundColor();
    }

    // Set the default language
    const language = this.appConfig.defaultLanguage || 'en';
    this.translate.use(language);

    // Set the footer text
    const footerElement = document.querySelector('ion-footer p');
    if (footerElement && this.appConfig.footerText) {
      footerElement.textContent = this.appConfig.footerText;
    }
  }

  applyHeaderBackgroundColor() {
    const headerElement = document.querySelector('ion-header');
    if (headerElement) {
      this.renderer.setStyle(headerElement, 'background-color', this.headerColor);
    }
  }

  handleItemClick(item: any) {
    let sItem = item.url.split(':');
     
    if (item.url) {
      // Convert a dash:title entry in a dashboard url
      if (sItem[0] == 'dash') {
        let dash = this.sisenseDashboards.find(db => db.title == sItem[1]);
        item.url = this.appConfig.sisenseBasePath + dash._id;
      }

      // Open the external link in a new browser tab
      window.open(item.url, '_blank');
    } else if (item.childrens && item.childrens.length > 0) {
      // If there is no URL, load the child content
      this.FillContent(item);
    }
  }

  // Right Menu Controls
  openEndMenu() {
    this.menuCtrl.open('end');
  }

  // Language Management
  toggleLanguage(language: string) {
    this.translate.use(language);
    localStorage.setItem('selectedLanguage', language); // Save the selected language to localStorage
  }

  // Retrieve the saved language from localStorage
  setInitialLanguage() {
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'pt';
    this.translate.use(savedLanguage);
  }

  // Save language preference
  handleLanguageChange(language: string) {
    localStorage.setItem('selectedLanguage', language);
    this.translate.use(language);
  }

  navigateToBreadcrumb(index: number) {
    // Update the navigation stack and breadcrumbs to the selected index
    this.navigationStack = this.navigationStack.slice(0, index + 1);
    this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);

    // Clear the main content area
    this.mainContent.nativeElement.innerHTML = '';

    // Render the selected breadcrumb's content
    const selectedItem = this.navigationStack[this.navigationStack.length - 1];
    this.renderItem(selectedItem, this.mainContent.nativeElement);

    // Update navigation buttons visibility
    this.showBackButton = true;
    this.showForwardButton = false; // Clear the forward stack
    this.forwardStack = [];
  }
  // Search Bar

  // Content Management
  FillContent(item: any) {
    this.navigationStack.push(item);
    this.forwardStack = [];
    this.mainContent.nativeElement.innerHTML = '';
    this.renderItem(item, this.mainContent.nativeElement);
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

  renderItem(item: any, parentElement: HTMLElement) {
    const newContent = document.createElement('div');
  
    const title = document.createElement('p');
    title.classList.add('levelTitle');
    title.textContent = item.title;
    newContent.appendChild(title);
  
    parentElement.appendChild(newContent);

    if (item.childrens && item.childrens.length > 0) {
        const tableWrapper = document.createElement('div');
        tableWrapper.classList.add('contentWrapper');
        
        tableWrapper.style.height = '60vh'; 
        tableWrapper.style.overflowY = 'auto';

        const gridContainer = document.createElement('div');
        gridContainer.classList.add('grid-container');
        tableWrapper.appendChild(gridContainer);

        item.childrens.forEach((subItem: any) => {
            if (subItem.url) {
                const childCard = document.createElement('ion-card');

                if (subItem.icon) {
                    const childCardImage = document.createElement('img');
                    childCardImage.src = subItem.icon; 
                    childCardImage.alt = subItem.title;
                    childCardImage.classList.add('cardImage');
                    childCard.appendChild(childCardImage);
                }

                const childCardHeader = document.createElement('ion-card-header');
                const childCardTitle = document.createElement('ion-card-title');
                childCardTitle.classList.add('cardTitle');
                childCardTitle.textContent = subItem.title;

                const childCardSubtitle = document.createElement('ion-card-subtitle');
                childCardSubtitle.classList.add('cardSubtitle');
                childCardSubtitle.textContent = subItem.description;

                childCardHeader.appendChild(childCardTitle);
                childCardHeader.appendChild(childCardSubtitle);
                childCard.appendChild(childCardHeader);

                const childCardContent = document.createElement('ion-card-content');
                childCardContent.classList.add('cardContent');
                childCardContent.textContent = subItem.update;
                childCard.appendChild(childCardContent);

                childCard.addEventListener('click', () => {
                    window.open(subItem.url, '_blank');
                });

                gridContainer.appendChild(childCard); 
            } else {
                const ionItem = document.createElement('ion-item');
                const ionLabel = document.createElement('ion-label');

                const h1 = document.createElement('h1');
                h1.classList.add('listTitle');
                h1.textContent = subItem.title;

                ionLabel.appendChild(h1);
                ionItem.appendChild(ionLabel);

                ionItem.addEventListener('click', (event) => {
                    event.preventDefault();
                    this.FillContent(subItem);
                });

                tableWrapper.appendChild(ionItem); 
            }
        });

        parentElement.appendChild(tableWrapper);
    }
}

  // Navigation Controls

  goBack() {
    if (this.navigationStack.length > 1) {
      this.forwardStack.push(this.navigationStack.pop()!); // Move the current item to the forward stack
      this.breadcrumbs.pop();
      const previousItem =
        this.navigationStack[this.navigationStack.length - 1];
      this.mainContent.nativeElement.innerHTML = '';
      this.renderItem(previousItem, this.mainContent.nativeElement);
      this.showBackButton = this.navigationStack.length > 1; 
      this.showBackButton = true;
      this.showForwardButton = true;
    } else {
      // If the navigation stack is empty or has only one item, show the initial content
      this.mainContent.nativeElement.innerHTML = '';

      // Restore the initial content elements
      this.initialMainContentElements.forEach((element) => {
        this.renderer.appendChild(this.mainContent.nativeElement, element);
      });
      this.navigationStack = []; // Reset the navigation stack
      this.forwardStack = []; // Clear the forward stack
      this.breadcrumbs = [];
      this.showBackButton = false;
      this.showForwardButton = false;
    }
  }

  goForward() {
    if (this.forwardStack.length > 0) {
      const nextItem = this.forwardStack.pop()!;
      this.navigationStack.push(nextItem);
      this.mainContent.nativeElement.innerHTML = '';
      this.renderItem(nextItem, this.mainContent.nativeElement);
      this.showBackButton = true;
      this.showForwardButton = this.forwardStack.length > 0;
      this.breadcrumbs.push(nextItem.title);
    }
  }

  homeButtonClicked() {
    this.menuCtrl.close();
    this.mainContent.nativeElement.innerHTML = '';

    // Restore the initial content elements
    this.initialMainContentElements.forEach((element) => {
      this.renderer.appendChild(this.mainContent.nativeElement, element);
    });

    this.navigationStack = [];
    this.forwardStack = [];
    this.showBackButton = false;
    this.showForwardButton = false;
    this.breadcrumbs = [];
    this.noItemsFound = false;
    this.filteredData = [];
  }

}
