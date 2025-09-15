import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <section class="hero">
      <div class="art"></div>
      <div>
        <h1>Live Podcasts, made simple</h1>
        <p class="muted">Start an audio-only room as a speaker. Share the room ID for listeners to tune in instantly.</p>
        <div style="margin-top:16px;display:flex;gap:12px;flex-wrap:wrap">
          <a class="btn" routerLink="/speaker">Start a Room</a>
        </div>
      </div>
    </section>

    <div class="grid" style="margin-top:24px">
      <div class="col-8">
        <div class="card">
          <h3>Join a live room</h3>
          <p class="muted">Ask the host for the Room ID and start listening.</p>
          <form (submit)="goListen(listenRoomId); $event.preventDefault()" style="display:flex;gap:8px;margin-top:12px">
            <input class="input" placeholder="Enter Room ID" [(ngModel)]="listenRoomId" name="room" />
            <button class="btn" type="submit">Listen</button>
          </form>
        </div>
      </div>
      <div class="col-4">
        <div class="card">
          <h3>How it works</h3>
          <ul class="muted" style="margin:8px 0 0 16px">
            <li>Speaker starts a room with a Room ID.</li>
            <li>Share the ID with listeners.</li>
            <li>Listeners join and hear the live audio.</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: `
    .btn { background:#3f51b5;color:white;padding:8px 12px;border-radius:6px;text-decoration:none;border:0;cursor:pointer }
    input { border:1px solid #ccc;border-radius:6px }
  `
})
export class HomeComponent {
  listenRoomId = '';
  goListen(id: string) {
    if (!id) return;
    window.location.href = `/listen/${encodeURIComponent(id)}`;
  }
}
