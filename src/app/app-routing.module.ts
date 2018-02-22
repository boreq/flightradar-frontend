import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndexComponent }      from './index/index.component';
import { StatsComponent }      from './stats/stats.component';
import { PlaneComponent }      from './plane/plane.component';
import { PlanesComponent }      from './planes/planes.component';

const routes: Routes = [
  { path: '', component: IndexComponent },
  { path: 'stats', component: StatsComponent },
  { path: 'plane/:icao', component: PlaneComponent },
  { path: 'planes', component: PlanesComponent },
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ],
})
export class AppRoutingModule {}
