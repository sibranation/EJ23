import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { SpeakerLoginComponent } from './pages/speaker-login/speaker-login.component';
import { BroadcastComponent } from './pages/broadcast/broadcast.component';
import { ListenComponent } from './pages/listen/listen.component';

export const routes: Routes = [
	{ path: '', component: HomeComponent },
	{ path: 'speaker', component: SpeakerLoginComponent },
	{ path: 'broadcast/:roomId', component: BroadcastComponent },
	{ path: 'listen/:roomId', component: ListenComponent },
	{ path: '**', redirectTo: '' }
];
