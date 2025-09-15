import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-speaker-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="grid" style="margin-top:24px">
      <div class="col-8">
        <div class="card">
          <h3>Create a Room</h3>
          <p class="muted">Pick a Room ID and an optional password to control access.</p>
          <form (submit)="login(); $event.preventDefault()" style="display:flex;flex-direction:column;gap:12px;margin-top:12px">
            <label>Room ID</label>
            <input class="input" placeholder="e.g. tech-talk-101" [(ngModel)]="roomId" name="room" />
            <label>Room Password (optional)</label>
            <input class="input" placeholder="Password" [(ngModel)]="password" name="password" type="password" />
            <div style="display:flex;gap:8px;margin-top:4px">
              <button class="btn" type="submit">Start Broadcasting</button>
            </div>
          </form>
        </div>
      </div>
      <div class="col-4">
        <div class="card">
          <h3>Tips</h3>
          <ul class="muted" style="margin:8px 0 0 16px">
            <li>Use a headset mic to reduce echo.</li>
            <li>Share the Room ID with your listeners.</li>
            <li>You can end the room anytime.</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: `
    .btn { background:#3f51b5;color:white;padding:8px 12px;border-radius:6px;text-decoration:none;border:0;cursor:pointer }
    input { border:1px solid #ccc;border-radius:6px;padding:8px }
  `
})
export class SpeakerLoginComponent {
  roomId = '';
  password = '';
  constructor(private router: Router) {}
  login() {
    if (!this.roomId) return;
    const url = this.password ? `/broadcast/${encodeURIComponent(this.roomId)}?pw=${encodeURIComponent(this.password)}` : `/broadcast/${encodeURIComponent(this.roomId)}`;
    this.router.navigateByUrl(url);
  }
}
