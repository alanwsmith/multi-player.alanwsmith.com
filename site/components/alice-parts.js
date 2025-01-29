const aliceSheet = new CSSStyleSheet();
aliceSheet.replaceSync(`
  :host {
    display: inline-block;
  }
`);

const aliceTemplate = document.createElement('template');
aliceTemplate.innerHTML = `<div id="player">Player</div>`;


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// class AlicePlayer extends HTMLElement {

// }

// customElements.define('alice-player', AlicePlayer);

class PageController extends HTMLElement {
  constructor() {
    super()
    this.width = document.documentElement.clientWidth;
    this.height = document.documentElement.clientHeight;
    this.attachShadow({mode: 'open'})
    this.players = []
    this.playerCount = 20;
  }

  connectedCallback() {
    const fragment = new DocumentFragment();
    for (let count = 0; count < this.playerCount; count += 1) {
      const el = document.createElement('div');
      el.id = `player${count}`;
      fragment.appendChild(el);
    }

    const button = document.createElement('button');
    button.addEventListener('click', () => {
      this.handleButtonClick();
    });
    button.innerHTML = "play";
    fragment.appendChild(button);
    this.shadowRoot.appendChild(fragment);
    this.init();

    // const script = document.createElement('script')
    // script.innerHTML = youtubeScript;
    // this.shadowRoot.appendChild(script);
    // const iframeScript = document.createElement('script');
    // iframeScript.src = 'https://www.youtube.com/iframe_api';
    // this.shadowRoot.appendChild(iframeScript);
  }

  async handleButtonClick() {
    for (let count = 0; count <= this.players.length; count += 1) {
      const player = this.players[count].object;
      if (count === 8 ) {
        player.unMute();
      }
      setTimeout(() => {
        player.playVideo();
      }, count * 30);

      // await sleep(count * 20);
      // player.playVideo();
    }
  }


  async init() {
    this.loadApi()
    await this.apiLoader
    for (let count = 0; count < this.playerCount; count += 1) {
      const videoEl = this.shadowRoot.querySelector(`#player${count}`)
      const player = await new Promise((resolve) => {
        let player = new YT.Player(videoEl, {
          width: '180',
          height: '112',
          videoId: 'jt7AF2RCMhg',
          playerVars: {
            playsinline: 1,
          },
          events: {
            onReady: (event) => {
              resolve(player)
            },
            // onStateChange: (event) => {
            //   this.handlePlayerStateChange.call(this, event)
            // },
          },
        })
      }).then((value) => {
        return value
        // TODO: Figure out how to handle errors here.
      })
      const wrapper = this.shadowRoot.querySelector(`#player${count}`);
      player.mute();
      player.playVideo();
      player.pauseVideo();
      this.players.push({ 'object': player, 'wrapper': wrapper });
    }

    // this.cueVideo()
    // this.parts.player = this.shadowRoot.querySelector('#player')
    // this.parts.buttonsMessage.classList.add('hidden')
    // this.parts.buttonsMessage.innerHTML = ""
    // this.parts.buttonsRow.classList.remove('hidden')

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
  
}

customElements.define('page-controller', PageController);



