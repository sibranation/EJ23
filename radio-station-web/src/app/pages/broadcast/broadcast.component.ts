import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AudioWebrtcService } from '../../services/audio-webrtc.service';

@Component({
  selector: 'app-broadcast',
  standalone: true,
  imports: [],
  template: `
    <section class="hero">
      <div class="art"></div>
      <div>
        <h1>On Air: {{ roomId }}</h1>
        <p class="muted">Your microphone is live. Share the Room ID with your listeners.</p>
      </div>
    </section>
    <div class="grid" style="margin-top:24px">
      <div class="col-8">
        <div class="player">
          <span class="dot"></span>
          <div>
            <div>LIVE</div>
            <div class="muted">Streaming audio to connected listeners</div>
          </div>
          <div style="flex:1"></div>
          <button class="btn secondary" (click)="end()">End Broadcast</button>
        </div>
      </div>
      <div class="col-4">
        <div class="card">
          <h3>Share this Room</h3>
          <p class="muted">Room ID</p>
          <div class="input" style="user-select: all">{{ roomId }}</div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .btn { background:#e91e63;color:white;padding:8px 12px;border-radius:6px;text-decoration:none;border:0;cursor:pointer }
  `
})
export class BroadcastComponent implements OnInit, OnDestroy {
  roomId = '';
  private password: string | null = null;
  constructor(private route: ActivatedRoute, private rtc: AudioWebrtcService) {}
  async ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
    const pw = this.route.snapshot.queryParamMap.get('pw');
    this.password = pw;
    await this.rtc.initAsSpeaker(this.roomId, this.password);
  }
  end() {
    this.rtc.endRoom();
    window.location.href = '/';
  }
  ngOnDestroy() {
    this.rtc.cleanup();
  }
}
