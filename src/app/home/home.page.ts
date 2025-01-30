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
  public sisenseDashboards: any[] = [];
  public filteredSisenseDashboards: any[] = [];
  public date: string = '';

  public appConfig : any = {
    "appTitle": "",
    "headerImage": "",
    "defaultLanguage": "",
    "sisenseBasePath": []
  }

  // State Variables
  noItemsFound: boolean = false;
  showBackButton: boolean = false;
  showForwardButton: boolean = false;

  // Data Management
  public menuData: any[] = [];
  public filteredData: any[] = [];
  public filteredMenuData: any[] = [];
  public currentContent: any[] = [];

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

      this.FillContent(item); // Restore the last content
    }

    setTimeout(() => {
      this.initialMainContentElements = Array.from(this.mainContent.nativeElement.children);
    }, 0);
  }

  applyAppConfig() {
    document.title = this.appConfig.appTitle || 'Default App Title';

    // Set the header image
    const headerImageElement = document.querySelector('ion-toolbar img.headerLogo');
    if (headerImageElement && this.appConfig.headerImage) {
      headerImageElement.setAttribute('src', this.appConfig.headerImage);
    }
  }

  // Retrieve the saved language from localStorage
  setInitialLanguage() {
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'pt';
    this.translate.use(savedLanguage);
  }

  handleItemClick(subItem: any) {
    console.log(subItem);
    let sItem = subItem.url.split(':');

    if (subItem.url) {
      if (sItem[0] == 'sisense') {
        let conf = this.appConfig.sisenseBasePath.find((config: any) => config.base == sItem[1]);
        let base = conf.base;
        let path = conf.path;
        let dash = this.sisenseDashboards.find(db => db.title == sItem[2]);
        
        subItem.url = `${base}/${path}/${dash.base._id}`;
        console.log(subItem.url);
      }

      window.open(subItem.url, '_blank');
    } else if (subItem.childrens && subItem.childrens.length > 0) {
      this.FillContent(subItem);
    }
  }

  // Right Menu Controls
  openEndMenu() {
    this.menuCtrl.open('end');
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
    this.mainContent.nativeElement.innerHTML = '';
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
    if (this.navigationStack.length === 0 && this.breadcrumbs.length === 0) {
  
    }
  
    this.currentContent = item.childrens || [];
  
    if (!this.breadcrumbs.includes(item.title)) {
      this.navigationStack.push(item);
      this.breadcrumbs.push(item.title);
    }
  
    this.showBackButton = this.navigationStack.length > 1;
    this.showForwardButton = this.forwardStack.length > 0;
  }
  
  navigateToItem(item: any) {
    if (item.isHome) {
      this.resetToHome();
      return;
    }
  

    if (item.url) {
      window.open(item.url, '_blank');
    } else {
      this.renderItem(item);
    }
  }
  
  resetToHome() {
    this.currentContent = [];
    this.navigationStack = [];
    this.breadcrumbs = [];
    this.forwardStack = [];
    this.showBackButton = false;
    this.showForwardButton = false;
    this.mainContent.nativeElement.innerHTML = '';
  }
  
  
  search() {
    const searchInputElement = document.getElementById('searchInput') as HTMLInputElement;

    const searchValue = searchInputElement.value.toLowerCase();

    if (this.navigationStack.length > 0) {
      const contentWrappers = document.querySelectorAll('.contentWrapper');

      let anyVisible = false;
      let secondLevelTriggered = false;

      contentWrappers.forEach((wrapper) => {
        let wrapperVisible = false;

        const childElements = wrapper.querySelectorAll('.cardTitle, .listTitle');
        childElements.forEach((element) => {
          secondLevelTriggered = true;

          const txtValue = (element as HTMLElement).textContent || '';
          if (txtValue.toLowerCase().includes(searchValue)) {
            (element.closest('ion-card, ion-item') as HTMLElement)!.style.display = '';
            wrapperVisible = true;
            anyVisible = true;
          } else {
            (element.closest('ion-card, ion-item') as HTMLElement)!.style.display = 'none';
          }
        });

        (wrapper as HTMLElement).style.display = wrapperVisible ? '' : 'none';
      });

      this.noItemsFound = secondLevelTriggered && !anyVisible;
      return;
    }

    // Function to recursively search for items with URLs
    const searchRecursive = (items: any[], matchingItems: any[]) => {
      items.forEach((item) => {
        if (item.url && item.title.toLowerCase().includes(searchValue)) {
          matchingItems.push(item);
        }
        if (item.childrens && item.childrens.length > 0) {
          searchRecursive(item.childrens, matchingItems);
        }
      });
    };

    const matchingItems: any[] = [];
    this.menuData.forEach((topLevelItem) => {
      if (topLevelItem.childrens && topLevelItem.childrens.length > 0) {
        searchRecursive(topLevelItem.childrens, matchingItems);
      }

    });

    this.mainContent.nativeElement.innerHTML = '';
    const searchResultsContainer = document.createElement('div');
    searchResultsContainer.classList.add('generalGridContanier');

    if (searchValue.trim() === '') {
      this.mainContent.nativeElement.innerHTML = '';

      this.initialMainContentElements.forEach((element) => {
        this.renderer.appendChild(this.mainContent.nativeElement, element);
      });
      return;
    }

    if (matchingItems.length > 0) {
      matchingItems.forEach((item) => {
        const title = document.createElement('p');
        title.classList.add('levelTitle');
        title.textContent = item.title;

        const childCard = document.createElement('ion-card');

        // Check for icon existence
        const imageUrl = item.icon;
        if (imageUrl) {
          const popoverButton = document.createElement('ion-button');
          popoverButton.classList.add('popoverButton');
          popoverButton.textContent = 'View Image';
          popoverButton.fill = 'clear'; 
          popoverButton.innerHTML = '<ion-icon name="image-outline"></ion-icon>'; 
        
          const popover = document.createElement('ion-popover');
        
          let popoverContent = document.createElement('div');
          popoverContent.classList.add('popoverContent');
        
          const popoverImage = document.createElement('img');
          popoverImage.src = imageUrl;
          popoverImage.alt = item.title;
        
          const popoverTitle = document.createElement('p');
          popoverTitle.textContent = item.title;

          popoverButton.addEventListener('click', async (event) => {
            event.stopPropagation(); 
            await popover.present();
          });
        
          popoverContent.appendChild(popoverImage);
          popoverContent.appendChild(popoverTitle);
          popover.appendChild(popoverContent);
        
          document.body.appendChild(popover);
        
          popoverButton.addEventListener('click', async () => {
            await popover.present();
          });
        
          childCard.appendChild(popoverButton);
        }
        

        const childCardHeader = document.createElement('ion-card-header');
        const childCardTitle = document.createElement('ion-card-title');
        childCardTitle.classList.add('cardTitle');
        childCardTitle.textContent = item.title;

        const childCardSubtitle = document.createElement('ion-card-subtitle');
        childCardSubtitle.classList.add('cardSubtitle');
        childCardSubtitle.textContent = item.description || '';

        childCardHeader.appendChild(childCardTitle);
        childCardHeader.appendChild(childCardSubtitle);
        childCard.appendChild(childCardHeader);

        const childCardContent = document.createElement('ion-card-content');
        childCardContent.classList.add('cardContent');

        if (item.time) {
          const updateFrequencyText = this.translate.instant('home.update');
          const timePeriodText = this.translate.instant(`time.${item.time}`);
          const updateText = `${updateFrequencyText} ${timePeriodText}`;

          const updateTextElement = document.createElement('p');
          updateTextElement.classList.add('updateText');
          updateTextElement.textContent = updateText;
          childCardContent.appendChild(updateTextElement);
        }
        childCard.appendChild(childCardContent);

        childCard.addEventListener('click', () => {
          window.open(item.url, '_blank');
        });

        searchResultsContainer.appendChild(childCard);
      });
    } else {
      searchResultsContainer.style.display = 'none';

      const noResultsMessage = document.createElement('p');
      noResultsMessage.classList.add('generalErrorMessage');
      this.translate.get('home.noItemFound').subscribe((translatedText: string) => {
        noResultsMessage.textContent = translatedText;
      });

      this.mainContent.nativeElement.innerHTML = '';
      this.mainContent.nativeElement.appendChild(noResultsMessage);
    }
    this.mainContent.nativeElement.appendChild(searchResultsContainer);
  }

  // Navigation Controls

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
    this.currentContent = [];
    this.breadcrumbs = [];
    this.noItemsFound = false;
    this.filteredData = [];
  }

  goBack() {
    if (this.navigationStack.length > 1) {
      this.forwardStack.push(this.navigationStack.pop()!); // Move the current item to the forward stack
      this.breadcrumbs.pop();
      const previousItem = this.navigationStack[this.navigationStack.length - 1];
      this.mainContent.nativeElement.innerHTML = '';
      this.renderItem(previousItem);
      this.showBackButton = this.navigationStack.length > 1;
      this.showBackButton = true;
      this.showForwardButton = true;
    } else {
      this.mainContent.nativeElement.innerHTML = '';

      this.initialMainContentElements.forEach((element) => {
        this.renderer.appendChild(this.mainContent.nativeElement, element);
      });
      this.navigationStack = []; 
      this.forwardStack = [];
      this.breadcrumbs = [];
      this.showBackButton = false;
      this.currentContent = [];
      this.showForwardButton = false;
      this.noItemsFound = false;
    }
  }

  goForward() {
    if (this.forwardStack.length > 0) {
      const nextItem = this.forwardStack.pop()!;
      this.navigationStack.push(nextItem);
      this.mainContent.nativeElement.innerHTML = '';
      this.renderItem(nextItem);
      this.showBackButton = true;
      this.showForwardButton = this.forwardStack.length > 0;
      this.breadcrumbs.push(nextItem.title);
      this.noItemsFound = false;
    }
  }

  navigateToBreadcrumb(index: number) {
    this.navigationStack = this.navigationStack.slice(0, index + 1);
    this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);

    this.mainContent.nativeElement.innerHTML = '';

    const selectedItem = this.navigationStack[this.navigationStack.length - 1];
    this.renderItem(selectedItem);

    
    this.showBackButton = true;
    this.showForwardButton = false; 
    this.forwardStack = [];
  }

}
