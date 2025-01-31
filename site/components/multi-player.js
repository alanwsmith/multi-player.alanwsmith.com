// There's lots of stuff in here that isn't used for the
// filmstrip view. It was for different looks. 
// I may play around with them again in the future
// so leaving everything in for now. 

function debounce(callback, wait) {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
}

const aliceSheet = new CSSStyleSheet();
aliceSheet.replaceSync(`
:host {
  color: #aaa;
  display: inline-block;
  margin: 0;
  pointer-events: none;
}
.hidden {
  opacity: 0;
}
#wrapper {
  color: #aaa;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 0.9s ease-in;
  overflow: hidden;
}
#wrapper.hidden {
  transition: opacity 0s;
}
#player {
  position: relative;
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
  font-size: 1.1rem;
}
a {
  text-decoration: none;
  color: var(--accent-color-2);
}
a:hover, a:focus {
  color: var(--accent-color-3);
}
#canvas {
  position: relative;
  color: #aaa;
  margin-top: 1rem;
  position: relative;
  width: calc(100vw - 40px);
  min-height: 96vh;
  margin-inline: auto;
}
#canvas.debug {
  background: maroon;
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
.footer {
  margin-top: var(--xlarge-margin);
  margin-bottom: var(--medium-margin);
  font-size: var(--small-font-size);
  text-align: center;
}
h1 {
  font-size: 1.3rem;
  font-weight: 900;
  margin-top: 0;
}
h2 {
  font-size: 1.1rem;
  font-weight: 900;
  margin-top: 0;
}
.hidden {
  opacity: 0;
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
  gap: 0;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  z-index: 2;
  pointer-events: none;
  transition: opacity 0.5s ease-in;
}
#playing {
  position: absolute;
  top: 0;
  left: 0;
  width: 98%;
  height: 60%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  z-index: 3;
  pointer-events: none;
  transition: opacity 0s;
}
#playing.hidden {
  transition: opacity 2.7s ease-in;
}
.ratios {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}
#url {
  width: 90%;
}
#status {
  text-align: right;
  padding-bottom: 1rem;
  line-height: 1.8;
}
#status button {
  font-size: var(--medium-font-size);
}
strong {
  color: #faa;
}
`);

const controllerTemplate = document.createElement('template');
controllerTemplate.innerHTML = `
<div id="canvas">
  <div id="players" class="hidden"></div>
  <div id="click-layer"><div>
  <div id="playing" class="hidden"><div>Playing</div></div>
  <div id="message" class="flow">
    <h1>Multi-Player</h1>
    <p>
      This page uses a lot of bandwidth. <strong>It will load
      <span id="playerCount">##</span> videos at its current size.</strong> 
      See warnings below.
    </p>
    <hr />
    <p>
      Choose an example or use your own YouTube link
    </p>
    <div id="example-buttons" class="flex">
      <button class="example-button" data-id="REPPgPcw4hk" aria-label="Select">CDK</button>
      <button class="example-button" data-id="12zJw9varYE" aria-label="Select">OK Go</button>
      <button class="example-button" data-id="jt7AF2RCMhg" aria-label="Select">Pogo</button>
      <button class="example-button" data-id="8bOtuoNFzB0" aria-label="Select">Queen</button>
      <button class="example-button" data-id="5IsSpAOD6K8" aria-label="Select">Talking Heads</button>
      <button class="example-button" data-id="q3zqJs7JUCQ" aria-label="Select">Taylor Swift</button>
    </div>
    <div>
      <fieldset>
        <legend>YouTube link</legend>
        <input type="text" id="url" placeholder="Pick a video or paste a link" />
      </fieldset>
      <fieldset class="ratios">
        <legend>Aspect Ratio</legend>
        <div>
          <input id="ratio16x9" type="radio" name="ratio" value="16x9" data-width="16" data-height="9" checked />
          <label for="ratio16x9">16x9</label>
        </div>
        <div>
          <input id="ratio239x100" type="radio" name="ratio" value="239x100" data-width="239" data-height="100" />
          <label for="ratio239x100">2.39:1</label>
        </div>
        <div>
          <input id="ratio4x3" type="radio" name="ratio" value="4x3" data-width="4" data-height="3" />
          <label for="ratio4x3">4x3</label>
        </div>
        <!--
        <div>
          <input type="radio" name="ratio" value="custom" />
          <input type="text" id="ratio-width" size="2" value="16" />x<input type="text" id="ratio-height" size="2" value="9" />
        </div>
        -->
      </fieldset>
    </div>
    <div id="status">waiting for video...</div>
    <hr />

    <h2>Warnings</h2>
    <p>
      The visuals can include flashing lights and motion 
      which may affect sensitive viewers.
    </p>
    <p>
      The page won't work well without a good network connection 
      or a newer device. Using it on a mobile 
      network is not recommended. 
    </p>
    <p>
      I used the player heavily during development without 
      issue. That said, it sends
      a lot of requests to YouTube from your connection at the
      same time. Use at your own risk. 
    </p>
    <p>
      Videos with ads won't work well. If the videos
      don't sync well you can try reloading the page.
    </p>
  </div>
  <div class="footer">
    <div>
      made by <a href="https://www.alanwsmith.com">alan w smith</a>
    </div>
    <div>
      <a href="/about/">about</a> ~
      <a href="https://github.com/alanwsmith/multi-player.alanwsmith.com">source code</a> ~
      <a href="https://links.alanwsmith.com">other projects</a> ~
      <a href="https://socials.alanwsmith.com">socials</a>
    </div>
  </div>
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

    // if (this.audioPlayer === true) {
    //   this.wrapper.classList.add('audio-player');
    // } else {
    //   this.wrapper.classList.remove('audio-player');
    // }

    // width here is the iframe width
    this.width = parseInt(this.getAttribute('iframe-width'), 10);
    this.height = parseInt(this.getAttribute('iframe-height'), 10);
    // wrapper width is what is labled as playerwidth
    // in the controller until a rename can
    // take place

    this.wrapperWidth = parseInt(this.getAttribute('wrapper-width'), 10);
    this.wrapperHeight = parseInt(this.getAttribute('wrapper-height'), 10);
    this.wrapper.style.width = `${this.wrapperWidth}px`;
    this.wrapper.style.height = `${this.wrapperHeight}px`;

    //console.log(this.wrapperWidth);


    // testing for 4:3
    // this.wrapper.style.width = `${Math.round(this.height * 4 / 3) - 1}px`;

    // const p = this.shadowRoot.querySelector('#player');
    // p.style.left = `-10px`;
    


    // this.debugOffset = parseInt(this.getAttribute('debugOffset'), 10);
    this.debug = this.getAttribute('debug') === 'false' ? false : true;
    // this.borderStyle = this.getAttribute('border-style');
    // this.wrapper.classList.add(this.borderStyle);
    this.videoId = this.getAttribute('video-id');
    // console.log(this.borderStyle);
    if (this.debug === true) {
      this.log("Debugging on");
      // this.style.width = `${this.width}px`;
      // this.style.height = `${this.height}px`;
      // this.style.width = `${this.wrapperWidth}px`;
      // this.style.height = `${this.wrapperHeight}px`;
      // this.style.outline = '1px solid purple';
      this.wrapper.classList.remove('hidden');
      this.wrapper.style.outline = `1px solid blue`;
      // this.wrapper.innerHTML = this.debugOffset;
      const playerEl = this.shadowRoot.querySelector('#player');
      playerEl.innerHTML = "x";
      playerEl.style.width = `${this.width}px`;
      playerEl.style.height = `${this.height}px`;
      playerEl.style.outline = `3px solid maroon`;
    } else {
      this.log("Initializing player");
      this.init();
    }
  }

  //fadeVolume() {
  //  //console.log("fade volume");
  //  const currentVolume = this.player.getVolume();
  //  const isMuted = this.player.isMuted();
  //  if (isMuted === false) {
  //    // console.log(currentVolume);
  //    if (currentVolume > 0) {
  //      this.player.setVolume(Math.floor(currentVolume / 1.5));
  //      this.fadeTimeout = setTimeout(() => {this.fadeVolume()}, 400);
  //    }
  //  }
  //}

  // fullVolume() {
  //   this.player.setVolume(100);
  // }

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

  log(message) {
    if (this.debug === true) {
      console.log(message);
    }
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
    this.apisReady = 0;
  }

  confirmVideo() {
    this.log('Confirming Video');
    const urlInput = this.shadowRoot.querySelector('#url').value;
    if (urlInput) {
      try {
      const url = new URL(urlInput);
      if (url) {
        const urlParams = new URL(urlInput).searchParams;
        this.videoId = urlParams.get('v');
        if (this.videoId && this.videoId.length === 11) {
          this.showPlayButton();
        } else {
          this.state = 'invalid';
          this.updateStatus();
        }
      }
      } catch (error) {
        this.state = 'invalid';
        this.updateStatus();
      }
    }
  }

  connectedCallback() {
    if (this.debug === true) {
      this.shadowRoot.querySelector('#players').classList.remove('hidden');
    }

    this.input = this.shadowRoot.querySelector('#url');
    this.shadowRoot.querySelector('#url').addEventListener('input', (event) => {
      // this.state = 'changed';
      // this.updateStatus();
      this.confirmVideo();
      // this.prepVideo();
    });

    if (this.debug === true) {
      const el = document.createElement('button');
      el.classList.add('example-button');
      el.dataset['dataId'] = 'm8vOrXIys6o';
      // TODO: Figure out how to add the aria label
      el.innerHTML = '10s Test';
      this.shadowRoot.querySelector('#example-buttons').appendChild(el);
      this.shadowRoot.querySelector('#canvas').style.outline = '3px solid green';
    }

    const buttons = this.shadowRoot.querySelectorAll('.example-button');
    buttons.forEach((button) => {
      button.addEventListener('click', (event) => {
        this.handleExampleButtonClick(event)
      });
    });

    let clickLayer = this.shadowRoot.querySelector('#click-layer');
    clickLayer.addEventListener('click', this.handleCanvasClick.bind(this, event));

    const radioButtons = this.shadowRoot.querySelectorAll('input[name="ratio"]');
    radioButtons.forEach((radioButton) => {
      radioButton.addEventListener('change', () => {
        this.handleRatioButtonChange();
      });
    });

    this.shadowRoot.addEventListener('apiLoaded', (event) => {
      this.apisReady += 1;
      this.updateStatus();
    });

    this.shadowRoot.addEventListener('playerReady', (event) => {
      this.playersReady += 1;
      this.updateStatus();
    });

    this.shadowRoot.addEventListener('ended', () => {
      this.handleEnded();
    });

    this.updateMessageCount();

    window.addEventListener("resize", () => {
      debounce(this.updateMessageCount(), 50);
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
    const videoId = event.target.dataset.id;
    const ratiosOf239x100 = [
      '8bOtuoNFzB0'
    ]
    const ratiosOf4x3 = [
      'jt7AF2RCMhg',
      '5IsSpAOD6K8'
    ];
    if (ratiosOf4x3.includes(videoId)) {
      this.shadowRoot.querySelector('#ratio4x3').checked = true;
    } else if (ratiosOf239x100.includes(videoId)) {
      this.shadowRoot.querySelector('#ratio239x100').checked = true;
    } else {
      this.shadowRoot.querySelector('#ratio16x9').checked = true;
    }
    this.input.value = `https://www.youtube.com/watch?v=${videoId}`;
    this.updateMessageCount();
    this.confirmVideo();
  }

  handleRatioButtonChange(event) {
    this.log("handleRarioButtonChange");
    this.updateMessageCount();
  }

  showPlayButton() {
    this.state = 'ready-to-play';
    this.updateStatus();
  }

  updateMessageCount() {
    this.getDimensions();
    this.shadowRoot.querySelector('#playerCount').innerHTML = this.playerCount;
  }

  updateStatus() {
    if (this.playersReady === this.playerCount) {
      this.shadowRoot.querySelector('#status').innerHTML = `Loading: ${this.playersReady} of ${this.playerCount}`;
      this.state = "stopped";
      setTimeout(() => { this.handleDoPlay() }, 1800);
    } else if (this.state === 'loading') {
      if (this.playersReady === 0) {
        this.shadowRoot.querySelector('#status').innerHTML = `Preparing: ${this.apisReady} of ${this.playerCount}`;
      } else {
        this.shadowRoot.querySelector('#status').innerHTML = `Loading: ${this.playersReady} of ${this.playerCount}`;
      }
    } else if (this.state === 'invalid') {
      this.shadowRoot.querySelector('#status').innerHTML = `Link is not a valid YouTube video`;
    } else if (this.state === 'ready-to-play') {
      this.doReadyToPlay();
      // this.shadowRoot.querySelector('#status').innerHTML = `Ready to play`;
    } else {
      this.shadowRoot.querySelector('#status').innerHTML = `...`;
    }
  }

  doReadyToPlay() {
    this.log("doReadyToPlay");
    this.state = "stopped";
    this.readyToPlay = true;
    this.shadowRoot.querySelector('#status').innerHTML = '<button id="play-button" aria-label="Play">Load and Play</button>';
    this.shadowRoot.querySelector('#play-button').addEventListener(
      'click', 
      this.handlePlayButtonClick.bind(this, event)
    );
  }

  getDimensions() {
    this.log("getDimensions");
    this.maxCanvasWidth = Math.floor(document.documentElement.clientWidth - 50);
    this.maxCanvasHeight = Math.floor(document.documentElement.clientHeight * .96);

    const ratio = this.shadowRoot.querySelector('input[name="ratio"]:checked');
    this.ratioWidth = parseInt(ratio.dataset.width);
    this.ratioHeight = parseInt(ratio.dataset.height);

    if (this.ratioWidth === 239) {
      this.maxWrapperWidth = 310;
    } else if (this.ratioWidth === 4) {
      this.maxWrapperWidth = 190;
    } else {
      this.maxWrapperWidth = 210;
    }

    for (let columns = 3; columns < 20; columns += 2) {
      // const checkWidth = Math.round(this.maxCanvasWidth / columns);
      const checkWidth = Math.round(this.maxCanvasWidth / columns);
      if (checkWidth < this.maxWrapperWidth) {
        // NOTE: These are called playerWidth and playerHeight
        // but they are really the wrapper. The iframe is
        // iframeWidth and iframeHeight. 
        // TODO: rename those to make more sense 
        // once dev is done.
        this.playerWidth = checkWidth; // drop one pixel to prevent occasional line
        this.playerHeight = Math.round(checkWidth * this.ratioHeight / this.ratioWidth); 

        const baseRatio = 16/9;
        const currentRatio = this.ratioWidth / this.ratioHeight;

        // one of these checks against 16 is unnecessary
        // but I'm too tired to figure out which and it's
        // not hurting anything so it gets to hang out 
        // for a while. 
        if (baseRatio >= currentRatio) {
          this.iframeHeight = this.playerHeight;
          if (this.ratioWidth !== 16) {
            this.iframeWidth = Math.round(this.iframeHeight / 9 * 16);
          } else {
            this.iframeWidth = this.playerWidth;
          }
        } else {
          this.iframeWidth = this.playerWidth;
          if (this.ratioWidth !== 16) {
            this.iframeHeight = Math.round(this.iframeWidth * 9 / 16);
          } else {
            this.iframeHeight = this.playerHeight;
          }
        }

        // attempt to prevent single pixel off errors
        this.iframeWidth += 4;
        this.iframeHeight += 4;


        // attempt to file 1px horizongal line 
        // TODO: Figure out which one of the above
        // this should go to
        // this.playerHeight = this.playerHeight - 1



        // this.iframeHeight = this.playerHeight;
        // if (this.ratioWidth !== 16) {
        //   this.iframeWidth = Math.round(this.iframeHeight / 9 * 16);
        // } else {
        //   this.iframeWidth = this.playerWidth;
        // }


        this.log(`${this.playerWidth} - ${this.playerHeight}`);
        this.log(`${this.iframeWidth} - ${this.iframeHeight}`);

        // original
        // this.playerWidth = checkWidth;
        // this.playerHeight = Math.round(checkWidth * 9 / 16);

        this.playerColumns = columns;
        // this one caps the player rows at 7. turning off for now 
        // since I think it'll naturally limit to about 7 on 
        // widescreens and letting it go longer on phone is cool
        //this.playerRows = Math.min(Math.floor(this.maxCanvasHeight / this.playerHeight), 7);
        this.playerRows = Math.floor(this.maxCanvasHeight / this.playerHeight);
        //
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
      this.apisReady = 0;
      this.playersReady = 0;
      this.shadowRoot.querySelector('#message').classList.remove('hidden');
      this.shadowRoot.querySelector('#players').classList.add('hidden');
      this.endedState = true;
      this.state = "stopped";
      this.confirmVideo();
    }
  }

  async handlePlayButtonClick() {
    this.prepVideo();
  }

  handleDoPlay() {
    this.log("handleDoPlay");
    if (this.state === "stopped") {
      this.log("state is stopped");
      this.shadowRoot.querySelector('#message').classList.add('hidden');
      this.shadowRoot.querySelector('#players').classList.remove('hidden');
      this.log(this.players.length);
      const playingEl = this.shadowRoot.querySelector('#playing');
      playingEl.classList.remove('hidden');
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
        playingEl.classList.add('hidden');
      }, 200);
    }
  }

  async handleCanvasClick() {
    this.log('handleCanvasClick');
    if (this.state === "playing") {
      this.log('state: playing');
      this.apisReady = 0;
      this.playersReady = 0;
      this.shadowRoot.querySelector('#message').classList.remove('hidden');
      this.shadowRoot.querySelector('#players').classList.add('hidden');
      this.players[this.audioPlayerIndex].mute();
      for (let count = 0; count < this.players.length; count += 1) {
        setTimeout(() => {
          this.players[count].stopVideo();
        }, count * 34);
      }
      this.state = "stopped";
      this.endedState = true;
      this.confirmVideo();
    }
  }

  log(message) {
    if (this.debug === true || this.showLogs === true) {
      console.log(message);
    }
  }

  prepVideo() {
    this.log('prepVideo');
    const urlInput = this.shadowRoot.querySelector('#url').value;
    if (urlInput) {
      this.state = 'loading';
      this.updateStatus();
      this.players = [];
      this.getDimensions();
      this.log(`Number of players: ${this.playerCount}`);
      const urlParams = new URL(urlInput).searchParams;
      this.videoId = urlParams.get('v');
      if (this.videoId && this.videoId.length === 11) {
        this.playersReady = 0;
        this.state = 'loading';
        const fragment = document.createDocumentFragment();
        for (let count = 0; count < this.playerCount; count += 1) {
          const el = document.createElement('alice-player');
          el.setAttribute('wrapper-width', this.playerWidth);
          el.setAttribute('wrapper-height', this.playerHeight);
          el.setAttribute('iframe-width', this.iframeWidth);
          el.setAttribute('iframe-height', this.iframeHeight);
          el.setAttribute('video-id', this.videoId);
          el.setAttribute('debug', this.debug);
          fragment.appendChild(el);
          this.players.push(el);
        }
        this.shadowRoot.querySelector('#players').replaceChildren(fragment);
      }
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

