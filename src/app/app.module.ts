import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { IndexComponent } from './index/index.component';
import { StatsComponent } from './stats/stats.component';
import { AppRoutingModule } from './/app-routing.module';
import { SidebarComponent } from './index/sidebar/sidebar.component';
import { PlaneService } from './plane.service';
import { CoordsComponent } from './index/sidebar/coords/coords.component'


@NgModule({
  declarations: [
    AppComponent,
    IndexComponent,
    StatsComponent,
    SidebarComponent,
    CoordsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [
    PlaneService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
