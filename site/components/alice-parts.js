// There's lots of stuff in here that isn't used for the
// filmstrip view. It was for different looks. 
// I may play around with them again in the future
// so leaving everything in for now. 

const aliceSheet = new CSSStyleSheet();
aliceSheet.replaceSync(`
:host {
  color: #aaa;
  display: inline-block;
  margin: 0;
}
.audio-player {
  position: relative;
  box-shadow: 0px 0px 3px #999;
  z-index: 2;
}
.hidden {
  opacity: 0;
}
#wrapper {
  color: #aaa;
  display: flex;
  transition: opacity 0.9s ease-in;
}
#wrapper.hidden {
  transition: opacity 0s;
}

#wrapper:not(.audio-player) {
  position: relative;
  box-shadow: 0px 0px 2px #777;
}

/*
#player {
  width: 140px;
}
*/

/*
.top-border {
  box-shadow: 0px -2px 0px #aaa;
}

.bottom-border {
  box-shadow: 0px 2px 0px #aaa;
}

.left-border {
  box-shadow: -2px 0px 0px #aaa;
}

.right-border {
  box-shadow: 2px 0px 0px #aaa;
}
*/




`);
const aliceTemplate = document.createElement('template');
aliceTemplate.innerHTML = `<div id="wrapper" class="hidden"><div id="player"></div></div>`;

const controllerSheet = new CSSStyleSheet();
controllerSheet.replaceSync(`
:host {
  display: block;
  margin: 0;
}
.hidden {
  opacity: 0;
}
#canvas {
  color: #aaa;
  margin-top: 2rem;
  position: relative;
  width: min(calc(100vw - 100px), 900px);
  min-height: 80vh;
  margin-inline: auto;
  background: black;
}

#loader {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 4;
  /*
  background: maroon;
  opacity: 0.4;
  */
  display: flex;
  justify-content: center;
  align-items: center;
}

#players{
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  z-index: 1;
}

#playing {
  transition: opacity 2.7s ease-in;
}

.warning {
  margin-block: 1rem;
}


`);
const controllerTemplate = document.createElement('template');
controllerTemplate.innerHTML = `
<div id="canvas">
  <div id="loader">
    <div>
      <div class="message">
        <div>This page uses a lot of bandwidth.</div>
        <div>Using it on a mobile connection is not recommended.</div>
        <div class="warning">
          <div>The visuals include flashing lights which may</div>
          <div>affect sensitive viewers.</div>
        </div>
      </div>
      <div id="status">Preparing...</div>
    </div>
  </div>
  <div id="players"></div>
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
  }

  connectedCallback() {
    this.audioPlayer = this.getAttribute('audio-player') === 'yes' ? true : false;
    if (this.audioPlayer === true) {
      this.wrapper.classList.add('audio-player');
    } else {
      this.wrapper.classList.remove('audio-player');
    }
    this.width = parseInt(this.getAttribute('width'), 10);
    this.height = parseInt(this.getAttribute('height'), 10);
    this.debugOffset = parseInt(this.getAttribute('debugOffset'), 10);
    this.debug = this.hasAttribute('debug');
    this.borderStyle = this.getAttribute('border-style');
    console.log(this.borderStyle);
    this.wrapper.classList.add(this.borderStyle);

    if (this.debug === true) {
      // console.log("Debugging on");
      this.style.width = `${this.width}px`;
      this.style.height = `${this.height}px`;
      this.style.outline = '1px solid maroon';
      this.wrapper.classList.remove('hidden');
      this.wrapper.innerHTML = this.debugOffset;
    } else {
      this.init();
    }
  }

  fadeVolume() {
    console.log("fade volume");
    const currentVolume = this.player.getVolume();
    const isMuted = this.player.isMuted();
    if (isMuted === false) {
      console.log(currentVolume);
      if (currentVolume > 0) {
        this.player.setVolume(Math.floor(currentVolume / 1.5));
        this.fadeTimeout = setTimeout(() => {this.fadeVolume()}, 400);
      }
    }
  }

  fullVolume() {
    this.player.setVolume(100);
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
    const apiEvent = new CustomEvent('apiLoaded', {
      bubbles: true,
    });
    this.dispatchEvent(apiEvent);
    const videoEl = this.shadowRoot.querySelector(`#player`)
    this.player = await new Promise((resolve) => {
      let player = new YT.Player(videoEl, {
        width: this.width,
        height: this.height,
        videoId: 'jt7AF2RCMhg',
        endSeconds: 162,
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
    // unhide after the youtube ui
    setTimeout(() => {
      this.wrapper.classList.remove('hidden');
    }, 3500);
    this.fadeTimeout = setTimeout(() => { this.fadeVolume() }, (158 * 1000));
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
    this.attachShadow({mode: 'open'})
    this.shadowRoot.adoptedStyleSheets = [ controllerSheet ];
    this.shadowRoot.append(controllerTemplate.content.cloneNode(true));
    this.players = [];
    this.playersReady = 0;
    this.state = "stopped";
    this.debug = true;
    this.debug = false;
    this.playerOffsets = [];
    this.offsetPadding = 34;
  }

  connectedCallback() {
    //this.playerCount = 4;
    // this.playerCount = 42;
    this.getDimensions();
    // this.playerWidth = Math.floor((this.width - 110) / 7);
    const fragment = document.createDocumentFragment();
    for (let count = 0; count < this.playerCount; count += 1) {
      const el = document.createElement('alice-player');
      el.setAttribute('width', this.playerWidth);
      el.setAttribute('height', this.playerHeight);
      if (count === this.audioPlayerIndex) {
        el.setAttribute('audio-player', 'yes');
      } else {
        el.setAttribute('audio-player', 'no');
      }
      let currentColumn = (count % this.playerColumns); 
      let currentRow = Math.floor(count / this.playerColumns);

      if (currentColumn === this.centerColumn && currentRow === 0) {
        el.setAttribute('border-style', 'top-border');
      } else if (currentColumn === this.centerColumn && currentRow === this.playerRows - 1) {
        el.setAttribute('border-style', 'bottom-border');
      } else if (currentRow === this.centerRow && currentColumn === 0) {
        el.setAttribute('border-style', 'left-border');
      } else if (currentRow === this.centerRow && currentColumn === this.playerColumns - 1) {
        el.setAttribute('border-style', 'right-border');
      } else {
        el.setAttribute('border-style', 'no-border');
      }

      const absoluteColumnOffset = Math.abs(this.centerColumn - currentColumn);
      const absoluteRowOffset = Math.abs(this.centerRow - currentRow);
      const absoluteOffset = absoluteColumnOffset + absoluteRowOffset;
      //console.log(`${absoluteColumnOffset} - ${absoluteRowOffset}`);
      // console.log(`${this.playerColumns} ${currentColumn} - ${this.playerRows} ${currentRow}`);
      // console.log(this.playerColumns);
      this.playerOffsets.push(absoluteOffset * this.offsetPadding);
      if (this.debug === true) {
        el.setAttribute('debugOffset', absoluteOffset);
        el.setAttribute('debug', 'on');
      }
      this.players.push(el);
      fragment.appendChild(el);
    }
    this.shadowRoot.querySelector('#players').appendChild(fragment);
    this.shadowRoot.addEventListener('stopped', () => {
      this.state = 'stopped';
    });
    this.shadowRoot.addEventListener('apiLoaded', (event) => {
      this.playersReady += 1;
      this.shadowRoot.querySelector('#status').innerHTML = `Loaded ${this.playersReady} of ${this.playerCount * 2}`;
    });
    this.shadowRoot.addEventListener('playerReady', (event) => {
      this.playersReady += 1;
      if (this.shadowRoot.querySelector('#status')) {
        this.shadowRoot.querySelector('#status').innerHTML = `Loaded ${this.playersReady} of ${this.playerCount * 2}`;
      }
      // console.log(`playersReady: ${this.playersReady}`);
      if (this.playersReady === this.playerCount * 2 ) {
       // this.shadowRoot.querySelector('#playButton').classList.remove('hidden');
        this.shadowRoot.querySelector('#canvas').addEventListener(
          'click', () => { this.handlePlayButtonClick() }
        )
      }
    })
  }

  getDimensions() {
    this.maxCanvasWidth = Math.min(Math.floor(document.documentElement.clientWidth - 110), 900);
    this.maxCanvasHeight = Math.floor(document.documentElement.clientHeight * .8);
    // this.playerWidth = 100;
    // this.playerHeight = 48;
    for (let columns = 1; columns < 100; columns += 2) {
      const checkWidth = Math.floor(this.maxCanvasWidth / columns);
      if (checkWidth < 170) {
        this.playerWidth = checkWidth;
        this.playerHeight = checkWidth * 9 / 16;
        this.playerColumns = columns;
        this.playerRows = Math.min(Math.floor(this.maxCanvasHeight / this.playerHeight), 7);
        this.playerCount = this.playerColumns * this.playerRows;
        if (this.playerRows === 1 || this.playerRows === 2) {
          this.audioPlayerIndex = Math.floor(this.playerColumns / 2);
          this.centerRow = 0;
          this.centerColumn = Math.floor(this.playerColumns /2);
        } else if (this.playerRows === 3 || this.playerRows === 4) {
          this.audioPlayerIndex = Math.floor(this.playerColumns / 2) + this.playerColumns;
          this.centerRow = 1;
          this.centerColumn = Math.floor(this.playerColumns /2);
        } else {
          this.audioPlayerIndex = Math.floor(this.playerColumns / 2) + (this.playerColumns * 2);
          this.centerRow = 2;
          this.centerColumn = Math.floor(this.playerColumns / 2);
        }
        // console.log(`Audio Player Index: ${this.audioPlayerIndex}`);
        break;
      }
    }
  }

  async handlePlayButtonClick() {
    if (this.state === "stopped") {
      this.shadowRoot.querySelector('#loader').innerHTML = `<div id="playing">Playing</div>`;
      setTimeout(() => {
      this.shadowRoot.querySelector('#playing').classList.add('hidden');
      }, 100);
      this.players[this.audioPlayerIndex].unMute();
      this.players[this.audioPlayerIndex].fullVolume()
      for (let count = 0; count < this.players.length; count += 1) {
        setTimeout(() => {
          this.players[count].startVideo();
        }, count * 34);
      }
      this.state = "playing";
    } else {
      this.players[this.audioPlayerIndex].mute();
      for (let count = 0; count < this.players.length; count += 1) {
        setTimeout(() => {
          this.players[count].stopVideo();
        }, count * 34);
      }
      this.state = "stopped";
    }
  }

  // async handlePlayButtonClickStarPatternNotAsGood() {
  //   if (this.state === "stopped") {
  //     this.shadowRoot.querySelector('#loader').innerHTML = `<div id="playing">Playing</div>`;
  //     setTimeout(() => {
  //     this.shadowRoot.querySelector('#playing').classList.add('hidden');
  //     }, 100);
  //     this.players[this.audioPlayerIndex].unMute();
  //     for (let count = 0; count < this.players.length; count += 1) {
  //       setTimeout(() => {
  //         this.players[count].startVideo();
  //       }, this.playerOffsets[count]);
  //     }
  //     this.state = "playing";
  //   } else {
  //     this.players[this.audioPlayerIndex].mute();
  //     for (let count = 0; count < this.players.length; count += 1) {
  //       setTimeout(() => {
  //         this.players[count].stopVideo();
  //       }, this.playerOffsets[count]);
  //     }
  //     this.state = "stopped";
  //   }
  // }

}


customElements.define('page-controller', PageController);

