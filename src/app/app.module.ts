import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { IndexComponent } from './index/index.component';
import { StatsComponent } from './stats/stats.component';
import { AppRoutingModule } from './/app-routing.module';
import { SidebarComponent } from './index/sidebar/sidebar.component';
import { PlaneService } from './plane.service';
import { CoordsComponent } from './index/sidebar/coords/coords.component'
import { CoordsService } from './coords.service';
import { PlaneComponent } from './plane/plane.component';
import { PageheaderComponent } from './pageheader/pageheader.component';
import {TimeAgoPipe} from 'time-ago-pipe';
import { PlanesComponent } from './planes/planes.component';


@NgModule({
  declarations: [
    AppComponent,
    IndexComponent,
    StatsComponent,
    SidebarComponent,
    CoordsComponent,
    PlaneComponent,
    PageheaderComponent,
    TimeAgoPipe,
    PlanesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    PlaneService,
    CoordsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
