import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndexComponent }      from './index/index.component';
import { StatsComponent }      from './stats/stats.component';

const routes: Routes = [
  { path: '', component: IndexComponent },
  { path: 'stats', component: StatsComponent }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}
