import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AudioWebrtcService } from '../../services/audio-webrtc.service';

@Component({
  selector: 'app-listen',
  standalone: true,
  imports: [],
  template: `
    <section class="hero">
      <div class="art"></div>
      <div>
        <h1>Now Playing: {{ roomId }}</h1>
        <p class="muted">You are tuned in to the live session.</p>
      </div>
    </section>
    <div class="grid" style="margin-top:24px">
      <div class="col-8">
        <div class="player">
          <span class="dot"></span>
          <div>
            <div>LIVE</div>
            <div class="muted">Audio from the speaker</div>
          </div>
          <div style="flex:1"></div>
          <audio controls autoplay [srcObject]="remoteStream"></audio>
        </div>
      </div>
      <div class="col-4">
        <div class="card">
          <h3>Want to host?</h3>
          <p class="muted">Create your own room from the Speaker page.</p>
        </div>
      </div>
    </div>
  `,
  styles: ``
})
export class ListenComponent implements OnInit, OnDestroy {
  roomId = '';
  remoteStream?: MediaStream;
  constructor(private route: ActivatedRoute, private rtc: AudioWebrtcService) {}
  async ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
    const pw = this.route.snapshot.queryParamMap.get('pw');
    await this.rtc.initAsGuest(this.roomId, pw, (s) => this.remoteStream = s);
  }
  ngOnDestroy() {
    this.rtc.cleanup();
  }
}
