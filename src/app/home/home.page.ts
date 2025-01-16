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
  searchQuery: any;

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
      const contentWrapper = document.createElement('div');
      contentWrapper.classList.add('contentWrapper');

      contentWrapper.style.height = '60vh';
      contentWrapper.style.overflowY = 'auto';

      const gridContainer = document.createElement('div');
      gridContainer.classList.add('gridContainer');
      contentWrapper.appendChild(gridContainer);
      item.childrens.forEach((subItem: any) => {
        const imageUrl = subItem.icon || this.appConfig.defaultImage;

        if (subItem.url) {
          const childCard = document.createElement('ion-card');

          // Add image with fallback
          const popupImage = document.createElement('div');
          popupImage.classList.add('cardImage');
          const img = document.createElement('img');
          img.src = imageUrl;
          img.alt = subItem.title;
          popupImage.appendChild(img);
          document.body.appendChild(popupImage);

          // Show/Hide image on hover
          childCard.addEventListener('mouseenter', () => {
            const cardRect = childCard.getBoundingClientRect();
            popupImage.style.display = 'block';
            popupImage.style.top = `${cardRect.top + window.scrollY}px`;
            popupImage.style.left = `${cardRect.left + cardRect.width - 300}px`;
          });

          childCard.addEventListener('mouseleave', () => {
            popupImage.style.display = 'none';
          });

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

          contentWrapper.appendChild(ionItem);
        }
      });

      parentElement.appendChild(contentWrapper);
    }
  }

  search() {
    const searchInputElement = document.getElementById('searchInput') as HTMLInputElement;

    const searchValue = searchInputElement.value.toLowerCase();


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

    if (matchingItems.length > 0) {
      matchingItems.forEach((item) => {
        const childCard = document.createElement('ion-card');
        childCard.style.marginRight = "2em";

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
        childCardContent.textContent = item.update || '';
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

  goBack() {
    if (this.navigationStack.length > 1) {
      this.forwardStack.push(this.navigationStack.pop()!); // Move the current item to the forward stack
      this.breadcrumbs.pop();
      const previousItem = this.navigationStack[this.navigationStack.length - 1];
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
      this.navigationStack = []; // reset navigation stack
      this.forwardStack = []; // reset forward stack
      this.breadcrumbs = [];
      this.showBackButton = false;
      this.showForwardButton = false;
      this.noItemsFound = false;
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
      this.noItemsFound = false;
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
