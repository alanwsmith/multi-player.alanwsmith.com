const aliceSheet = new CSSStyleSheet();
aliceSheet.replaceSync(`
:host {
  display: inline-block;
}
.hidden {
  opacity: 0.2;
}
`);
const aliceTemplate = document.createElement('template');
aliceTemplate.innerHTML = `<div id="wrapper" class="hidden"><div id="player"></div></div>`;

const controllerSheet = new CSSStyleSheet();
controllerSheet.replaceSync(`
:host {
  display: inline-block;
}
.hidden {
  opacity: 0.2;
}
#canvas {
  position: relative;
  width: 98vw;
  height: 98vh;
}
#loader {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 2;
}
#players{
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
}

`);
const controllerTemplate = document.createElement('template');
controllerTemplate.innerHTML = `
<div id="canvas">
  <div id="players"></div>
  <div id="loader">Preparing...</div>
  <!--
  <div><button id="playButton" class="hidden">Play</button></div>
  -->
</div>
`

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class AlicePlayer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.shadowRoot.adoptedStyleSheets = [ aliceSheet ];
    this.shadowRoot.append(aliceTemplate.content.cloneNode(true));
    this.wrapper = this.shadowRoot.querySelector('#wrapper');
    this.bufferCount = 0;
    this.init();
  }

  handlePlayerStateChange(event) {
    const playerState = event.target.getPlayerState();
    if (playerState == -1) {
      if (this.bufferCount > 0) {
        const event = new CustomEvent('playerReady', {
          bubbles: true
        });
        this.dispatchEvent(event);
      }
    } else if (playerState == YT.PlayerState.BUFFERING) {
      this.bufferCount += 1;
    } else if (playerState == YT.PlayerState.ENDED) {
      this.wrapper.classList.add('hidden');
      const stopEvent = new CustomEvent('stopped', {
          bubbles: true
      });
      this.dispatchEvent(stopEvent);
    }
  }

  async init() {
    this.loadApi()
    await this.apiLoader
    const videoEl = this.shadowRoot.querySelector(`#player`)
    this.player = await new Promise((resolve) => {
      let player = new YT.Player(videoEl, {
        width: '180',
        height: '112',
        videoId: 'jt7AF2RCMhg',
        playerVars: {
          controls: 0,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            resolve(player)
          },
          onStateChange: (event) => {
            this.handlePlayerStateChange.call(this, event)
          },
        },
      })
    }).then((value) => {
      return value
      // TODO: Figure out how to handle errors here.
    })
    this.player.mute();
    this.player.playVideo();
    this.player.pauseVideo();
  }

  loadApi() {
    // this if is from Paul Irish's embed, not sure why
    // the OR condition with window.YT.Player is there since
    // it seems like the window.YT would always hit first
    if (window.YT || (window.YT && window.YT.Player)) {
      return
    }
    this.apiLoader = new Promise((res, rej) => {
      var el = document.createElement('script')
      el.src = 'https://www.youtube.com/iframe_api'
      el.async = true
      el.onload = (_) => {
        YT.ready(res)
      }
      el.onerror = rej
      this.shadowRoot.append(el)
    })
  }

  startVideo() {
    this.player.playVideo();
    // unhide after the youtube scroller
    setTimeout(() => {
      this.wrapper.classList.remove('hidden');
    }, 3500);
  }

  stopVideo() {
    this.wrapper.classList.add('hidden');
    this.player.stopVideo();
  }
  
  unMute() {
    this.player.unMute();
  }

  mute() {
    this.player.mute();
  }
}

customElements.define('alice-player', AlicePlayer);

class PageController extends HTMLElement {
  constructor() {
    super()
    this.width = document.documentElement.clientWidth;
    this.height = document.documentElement.clientHeight;
    this.attachShadow({mode: 'open'})
    this.shadowRoot.adoptedStyleSheets = [ controllerSheet ];
    this.shadowRoot.append(controllerTemplate.content.cloneNode(true));
    this.players = []
    this.playerCount = 42;
    this.playersReady = 0;
    this.state = "stopped";
  }

  connectedCallback() {
    const fragment = document.createDocumentFragment();
    for (let count = 0; count < this.playerCount; count += 1) {
      const el = document.createElement('alice-player');
      this.players.push(el);
      fragment.appendChild(el);
    }
    // this.shadowRoot.querySelector('#playButton').addEventListener('click', () => {
    //   this.handlePlayButtonClick()
    // })
    this.shadowRoot.querySelector('#players').appendChild(fragment);
    this.shadowRoot.addEventListener('stopped', () => {
      this.state = 'stopped';
    });
    this.shadowRoot.addEventListener('playerReady', (event) => {
      this.playersReady += 1;
      this.shadowRoot.querySelector('#loader').innerHTML = `Loaded ${this.playersReady} of ${this.playerCount}`;
      console.log(`playersReady: ${this.playersReady}`);
      if (this.playersReady === this.playerCount) {
       // this.shadowRoot.querySelector('#playButton').classList.remove('hidden');
        this.shadowRoot.querySelector('#canvas').addEventListener(
          'click',
          () => {
            this.handlePlayButtonClick()
          }
        )
      }
    })
  }

  async handlePlayButtonClick() {
    if (this.state === "stopped") {
      if (this.players.length > 18) {
        this.players[17].unMute();
      }
      for (let count = 0; count < this.players.length; count += 1) {
        setTimeout(() => {
          this.players[count].startVideo();
        }, count * 34);
      }
      this.state = "playing";
    } else {
      if (this.players.length > 18) {
        this.players[17].mute();
      }
      for (let count = 0; count < this.players.length; count += 1) {
        setTimeout(() => {
          this.players[count].stopVideo();
        }, count * 34);
      }
      this.state = "stopped";
    }
  }
}

customElements.define('page-controller', PageController);

