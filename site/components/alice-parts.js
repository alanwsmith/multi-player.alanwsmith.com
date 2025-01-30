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
/*
.audio-player {
  position: relative;
  box-shadow: 0px 0px 3px #999;
  z-index: 2;
}
#wrapper:not(.audio-player) {
  position: relative;
  box-shadow: 0px 0px 2px #777;
}
*/
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
  position: relative;
  color: #aaa;
  margin-top: 2rem;
  position: relative;
  width: min(calc(100vw - 40px), 1300px);
  min-height: 94vh;
  margin-inline: auto;
  outline: 1px solid goldenrod;
}
#click-layer{
  postion: absolute:
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 4;
}
.flow > :where(:not(:first-child)) {
  margin-top: var(--flow-space, 1em);
}
/*
#loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 4;
  background: maroon;
  opacity: 0.4;
  display: flex;
  justify-content: center;
  align-items: center;
}
*/

#message {
  position: relative;
  max-width: 48ch;
  margin-inline: auto;
  z-index: 5;
}
#players{
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  z-index: 2;
  pointer-events: none;
}
#playing {
  transition: opacity 2.7s ease-in;
}
#url {
  width: 90%;
}
`);

const controllerTemplate = document.createElement('template');
controllerTemplate.innerHTML = `
<div id="canvas">
  <div id="players"></div>
  <div id="click-layer"><div>
  <div id="message" class="flow">
    <h1>Multi-Player</h1>
    <div>
      This page uses a lot of bandwidth. It
      won't work well without a good network connection.
      Using it on a mobile network is not recommended.
    </div>
    <div>
      The visuals can include flashing lights and motion which may
      affect sensitive viewers.
    </div>
    <div>
      <label for="url">YouTube URL</label>
      <div>
        <input type="text" id="url" value="" />
      </div>
      <div id="status">&nbsp;</div>
    </div>
    <div>
      Choose an example or use your own YouTube link:
    <ul class="flow">
      <li><button class="example-button" data-id="REPPgPcw4hk" aria-label="Select">CDK - Somebody That I Used To Know</button></li>
      <li><button class="example-button" data-id="jt7AF2RCMhg" aria-label="Select">Pogo - Alice</button></li>
      <li><button class="example-button" data-id="8bOtuoNFzB0" aria-label="Select">Queen/Star Wars</button></li>
      <li><button class="example-button" data-id="q3zqJs7JUCQ" aria-label="Select">Taylor Swift - Fortnight</button></li>
      <li id="debug-button" class="xhidden"><button class="example-button" data-id="m8vOrXIys6o" aria-label="Select">10 Second Test</button></li>
    </ul>
    </div>
  </div>
  <!--
  <div id="loader"></div>
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
    this.hiderTimeout = null;
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
    this.debug = this.getAttribute('debug') === 'false' ? false : true;
    this.borderStyle = this.getAttribute('border-style');
    this.videoId = this.getAttribute('video-id');
    // console.log(this.borderStyle);
    this.wrapper.classList.add(this.borderStyle);
    if (this.debug === true) {
      this.log("Debugging on");
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
    //console.log("fade volume");
    const currentVolume = this.player.getVolume();
    const isMuted = this.player.isMuted();
    if (isMuted === false) {
      // console.log(currentVolume);
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
      if (this.bufferCount === 1) {
        const event = new CustomEvent('playerReady', {
          bubbles: true
        });
        this.dispatchEvent(event);
      }
    } else if (playerState == YT.PlayerState.BUFFERING) {
      this.bufferCount += 1;
    } else if (playerState == YT.PlayerState.ENDED) {
      this.wrapper.classList.add('hidden');
      const endedEvent = new CustomEvent('ended', {
          bubbles: true
      });
      this.dispatchEvent(endedEvent);
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
        // videoId: 'REPPgPcw4hk' // CDK dancing
        // videoId: 'q3zqJs7JUCQ' // taylor 
        //videoId: 'jt7AF2RCMhg', // alice - pogo
        //videoId: '8bOtuoNFzB0', // star wars queen 
        //https://www.youtube.com/watch?v=UR62NYvLqCo // dacers with hats
        //
        // videoId: 'm8vOrXIys6o', // 10 second test
        videoId: this.videoId,
        //endSeconds: 162,
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
    this.hiderTimeout = setTimeout(() => {
      this.wrapper.classList.remove('hidden');
    }, 3500);
    // this.fadeTimeout = setTimeout(() => { this.fadeVolume() }, (158 * 1000));
  }

  stopVideo() {
    clearTimeout(this.hiderTimeout);
    this.hiderTimeout = null;
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
    this.state = "loading";
    this.endedState = true;
    this.debug = true;
    this.debug = false;
    this.playerOffsets = [];
    this.offsetPadding = 34;
    this.readyToPlay = false;
    this.showLogs = true;
  }

  connectedCallback() {
    this.input = this.shadowRoot.querySelector('#url');

    this.shadowRoot.querySelector('#url').addEventListener('input', (event) => {
      this.state = 'changed';
      this.updateStatus();
      this.prepVideo();
    });

    const buttons = this.shadowRoot.querySelectorAll('.example-button');
    buttons.forEach((button) => {
      button.addEventListener('click', (event) => {
        this.handleExampleButtonClick(event)
      });
    });

    let clickLayer = this.shadowRoot.querySelector('#click-layer');
    clickLayer.addEventListener('click', this.handleCanvasClick.bind(this, event));

    this.shadowRoot.addEventListener('playerReady', (event) => {
      this.playersReady += 1;
      this.updateStatus();
    });

    this.shadowRoot.addEventListener('ended', () => {
      this.handleEnded();
    });


    // // this.playerWidth = Math.floor((this.width - 110) / 7);
    // const fragment = document.createDocumentFragment();
    // for (let count = 0; count < this.playerCount; count += 1) {
    //   const el = document.createElement('alice-player');
    //   el.setAttribute('width', this.playerWidth);
    //   el.setAttribute('height', this.playerHeight);
    //   if (count === this.audioPlayerIndex) {
    //     el.setAttribute('audio-player', 'yes');
    //   } else {
    //     el.setAttribute('audio-player', 'no');
    //   }
    //   let currentColumn = (count % this.playerColumns); 
    //   let currentRow = Math.floor(count / this.playerColumns);
    //   if (currentColumn === this.centerColumn && currentRow === 0) {
    //     el.setAttribute('border-style', 'top-border');
    //   } else if (currentColumn === this.centerColumn && currentRow === this.playerRows - 1) {
    //     el.setAttribute('border-style', 'bottom-border');
    //   } else if (currentRow === this.centerRow && currentColumn === 0) {
    //     el.setAttribute('border-style', 'left-border');
    //   } else if (currentRow === this.centerRow && currentColumn === this.playerColumns - 1) {
    //     el.setAttribute('border-style', 'right-border');
    //   } else {
    //     el.setAttribute('border-style', 'no-border');
    //   }
    //   const absoluteColumnOffset = Math.abs(this.centerColumn - currentColumn);
    //   const absoluteRowOffset = Math.abs(this.centerRow - currentRow);
    //   const absoluteOffset = absoluteColumnOffset + absoluteRowOffset;
    //   // console.log(`${absoluteColumnOffset} - ${absoluteRowOffset}`);
    //   // console.log(`${this.playerColumns} ${currentColumn} - ${this.playerRows} ${currentRow}`);
    //   // console.log(this.playerColumns);
    //   this.playerOffsets.push(absoluteOffset * this.offsetPadding);
    //   if (this.debug === true) {
    //     el.setAttribute('debugOffset', absoluteOffset);
    //     el.setAttribute('debug', 'on');
    //   }
    //   this.players.push(el);
    //   fragment.appendChild(el);
    // }
    // this.shadowRoot.querySelector('#url').addEventListener('input', (event) => {
    //   this.prepVideo();
    // });
    // this.shadowRoot.querySelector('#players').appendChild(fragment);
    // this.shadowRoot.addEventListener('ended', () => {
    //   this.handleEnded();
    // });
    // this.shadowRoot.addEventListener('apiLoaded', (event) => {
    //   this.playersReady += 1;
    //   this.shadowRoot.querySelector('#status').innerHTML = `Loaded ${this.playersReady} of ${this.playerCount * 2}`;
    // });
    // this.shadowRoot.addEventListener('playerReady', (event) => {
    //   this.playersReady += 1;
    //   if (this.shadowRoot.querySelector('#status')) {
    //     this.shadowRoot.querySelector('#status').innerHTML = `Loaded ${this.playersReady} of ${this.playerCount * 2}`;
    //   }
    //   if (this.playersReady === this.playerCount * 2 ) {
    //     this.doReadyToPlay();
    //   }
    // });


  }

  handleExampleButtonClick(event) {
    this.log('handleExampleButtonClick');
    this.input.value = `https://www.youtube.com/watch?v=${event.target.dataset.id}`;
    this.updateStatus();
    this.prepVideo();
  }

  updateStatus() {
    if (this.state === 'loading') {
      if (this.playersReady === this.playerCount) {
        setTimeout(() => {this.doReadyToPlay()}, 700);
      } else {
        this.shadowRoot.querySelector('#status').innerHTML = `Loading: ${this.playersReady} of ${this.playerCount}`;
      }
    } else {
      this.shadowRoot.querySelector('#status').innerHTML = `Preparing...`;
    }
  }

  doReadyToPlay() {
    this.log("doReadyToPlay");
    this.state = "stopped";
    this.readyToPlay = true;
    this.shadowRoot.querySelector('#status').innerHTML = '<button id="play-button" aria-label="Play">Play</button>';
    this.shadowRoot.querySelector('#play-button').addEventListener(
      'click', 
      this.handlePlayButtonClick.bind(this, event)
    );
  }

  getDimensions() {
    this.log("getDimensions");
    this.maxCanvasWidth = Math.min(Math.floor(document.documentElement.clientWidth - 50), 1300);
    this.maxCanvasHeight = Math.floor(document.documentElement.clientHeight * .94);
    // this.playerWidth = 100;
    // this.playerHeight = 48;
    for (let columns = 1; columns < 100; columns += 2) {
      const checkWidth = Math.floor(this.maxCanvasWidth / columns);
      if (checkWidth < 190) {
        this.playerWidth = checkWidth;
        this.playerHeight = checkWidth * 9 / 16;
        this.playerColumns = columns;
        this.playerRows = Math.min(Math.floor(this.maxCanvasHeight / this.playerHeight), 7);
        this.playerCount = this.playerColumns * this.playerRows;
        // this sets up to put the audio player in a middle frame
        // up to three rows down
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
        // this moves the audio player to the first cell 
        // to see which I like better; 
        // and yeah, I like this one better for now
        // this.audioPlayerIndex = 0;
        // this.centerRow = 1;
        // this.centerColumn = 1;
        // console.log(`Audio Player Index: ${this.audioPlayerIndex}`);
        break;
      }
    }
  }

  handleEnded() {
    this.log('handleEnded');
    if (this.endedState === false) {
      this.playersReady = 0;
      this.shadowRoot.querySelector('#message').classList.remove('hidden');
      this.endedState = true;
      this.state = "stopped";
    }
  }

  async handlePlayButtonClick() {
    this.log("handlePlayButtonClick");
    if (this.state === "stopped") {
      this.log("state is stopped");
      this.shadowRoot.querySelector('#message').classList.add('hidden');
      this.log(this.players.length);
      // setTimeout(() => {
      // this.shadowRoot.querySelector('#playing').classList.add('hidden');
      // }, 100);
      this.players[this.audioPlayerIndex].unMute();
      // this.players[this.audioPlayerIndex].fullVolume()
      for (let count = 0; count < this.players.length; count += 1) {
        this.log(count);
        setTimeout(() => {
          this.players[count].startVideo();
        }, count * 34);
      }
      setTimeout(() => { 
        this.state = "playing";
        this.endedState = false;
      }, 200);
      //this.shadowRoot.querySelector('#canvas').addEventListener('click', this.handlePlayButtonClick);
    }
  }

  async handleCanvasClick() {
    this.log('handleCanvasClick');
    if (this.state === "playing") {
      this.log('state: playing');
      this.playersReady = 0;
      this.shadowRoot.querySelector('#message').classList.remove('hidden');
      this.players[this.audioPlayerIndex].mute();
      for (let count = 0; count < this.players.length; count += 1) {
        setTimeout(() => {
          this.players[count].stopVideo();
        }, count * 34);
      }
      this.state = "stopped";
      this.endedState = true;
    }
  }

  log(message) {
    if (this.debug === true || this.showLogs === true) {
      console.log(message);
    }
  }


  prepVideo() {
    this.log('prepVideo');
    this.state = 'loading';
    this.players = [];
    this.getDimensions();
    const urlInput = this.shadowRoot.querySelector('#url').value;
    const urlParams = new URL(urlInput).searchParams;
    this.videoId = urlParams.get('v');
    if (this.videoId && this.videoId.length === 11) {
      this.playersReady = 0;
      this.state = 'loading';
      const fragment = document.createDocumentFragment();
      for (let count = 0; count < this.playerCount; count += 1) {
        const el = document.createElement('alice-player');
        el.setAttribute('width', this.playerWidth);
        el.setAttribute('height', this.playerHeight);
        el.setAttribute('video-id', this.videoId);
        el.setAttribute('debug', this.debug);
        fragment.appendChild(el);
        this.players.push(el);
      }
      this.shadowRoot.querySelector('#players').replaceChildren(fragment);
    }


    //   if (count === this.audioPlayerIndex) {
    //     el.setAttribute('audio-player', 'yes');
    //   } else {
    //     el.setAttribute('audio-player', 'no');
    //   }
    //   let currentColumn = (count % this.playerColumns); 
    //   let currentRow = Math.floor(count / this.playerColumns);
    //   if (currentColumn === this.centerColumn && currentRow === 0) {
    //     el.setAttribute('border-style', 'top-border');
    //   } else if (currentColumn === this.centerColumn && currentRow === this.playerRows - 1) {
    //     el.setAttribute('border-style', 'bottom-border');
    //   } else if (currentRow === this.centerRow && currentColumn === 0) {
    //     el.setAttribute('border-style', 'left-border');
    //   } else if (currentRow === this.centerRow && currentColumn === this.playerColumns - 1) {
    //     el.setAttribute('border-style', 'right-border');
    //   } else {
    //     el.setAttribute('border-style', 'no-border');
    //   }
    //   const absoluteColumnOffset = Math.abs(this.centerColumn - currentColumn);
    //   const absoluteRowOffset = Math.abs(this.centerRow - currentRow);
    //   const absoluteOffset = absoluteColumnOffset + absoluteRowOffset;
    //   // console.log(`${absoluteColumnOffset} - ${absoluteRowOffset}`);
    //   // console.log(`${this.playerColumns} ${currentColumn} - ${this.playerRows} ${currentRow}`);
    //   // console.log(this.playerColumns);
    //   this.playerOffsets.push(absoluteOffset * this.offsetPadding);
    //   if (this.debug === true) {
    //     el.setAttribute('debugOffset', absoluteOffset);
    //     el.setAttribute('debug', 'on');
    //   }
    //   this.players.push(el);
    //   fragment.appendChild(el);
    // }
    // this.shadowRoot.querySelector('#url').addEventListener('input', (event) => {
    //   this.prepVideo();
    // });
    // this.shadowRoot.querySelector('#players').appendChild(fragment);
    // this.shadowRoot.addEventListener('ended', () => {
    //   this.handleEnded();
    // });
    // this.shadowRoot.addEventListener('apiLoaded', (event) => {
    //   this.playersReady += 1;
    //   this.shadowRoot.querySelector('#status').innerHTML = `Loaded ${this.playersReady} of ${this.playerCount * 2}`;
    // });
    // this.shadowRoot.addEventListener('playerReady', (event) => {
    //   this.playersReady += 1;
    //   if (this.shadowRoot.querySelector('#status')) {
    //     this.shadowRoot.querySelector('#status').innerHTML = `Loaded ${this.playersReady} of ${this.playerCount * 2}`;
    //   }
    //   if (this.playersReady === this.playerCount * 2 ) {
    //     this.doReadyToPlay();
    //   }
    // });
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

