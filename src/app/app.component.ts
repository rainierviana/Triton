import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  public menuData: any[] = [];
  menuitem: any;
  constructor(public http:HttpClient) {}
  ngOnInit() {
    this.Initialize();
  }

  Initialize() {
    this.http.get('assets/data/menumodel.json').subscribe((data:any) => {
      this.menuData = data;
    },
    err => {
      console.log('status: '+ err.status + '<br />Status text: ' + err.statusText + '<br />Message: ' + err.message, 'danger');
    });
  }

  FillContent(item:any) {
    console.log(JSON.stringify('item'))
  }
}

