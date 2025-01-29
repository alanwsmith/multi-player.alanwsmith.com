const aliceSheet = new CSSStyleSheet();
aliceSheet.replaceSync(`
  :host {
    display: inline-block;
  }
`);

const aliceTemplate = document.createElement('template');
aliceTemplate.innerHTML = `<div id="player">Player</div>`;

const youtubeScript = `
      // 2. This code loads the IFrame Player API code asynchronously.
      // var tag = document.createElement('script');

      // tag.src = "https://www.youtube.com/iframe_api";
      // var firstScriptTag = document.getElementsByTagName('script')[0];
      // firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      // 3. This function creates an <iframe> (and YouTube player)
      //    after the API code downloads.
      var player;
      function onYouTubeIframeAPIReady() {
        player = new YT.Player('player', {
          height: '390',
          width: '640',
          videoId: 'M7lc1UVf-VE',
          playerVars: {
            'playsinline': 1
          },
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
          }
        });
      }

      // 4. The API will call this function when the video player is ready.
      function onPlayerReady(event) {
        event.target.playVideo();
      }

      // 5. The API calls this function when the player's state changes.
      //    The function indicates that when playing a video (state=1),
      //    the player should play for six seconds and then stop.
      var done = false;
      function onPlayerStateChange(event) {
        if (event.data == YT.PlayerState.PLAYING && !done) {
          setTimeout(stopVideo, 6000);
          done = true;
        }
      }
      function stopVideo() {
        player.stopVideo();
      }
      console.log("eeee");
`


// class AlicePlayer extends HTMLElement {
//   constructor() {
//     super();
//     this.uuid = self.crypto.randomUUID();
//     this.attachShadow({mode: 'open'});
//   }
//   connectedCallback() {
//     console.log(this.uuid);
//     this.shadowRoot.appendChild(aliceTemplate.content.cloneNode(true));
//     this.shadowRoot.adoptedStyleSheets = [ aliceSheet ];
//     const scriptEl = document.createElement('script')
//     scriptEl.innerText = aliceScript;
//     this.shadowRoot.appendChild(scriptEl);
//   }
// }
//
// customElements.define('alice-player', AlicePlayer)

class PageController extends HTMLElement {
  constructor() {
    super()
    this.width = document.documentElement.clientWidth;
    this.height = document.documentElement.clientHeight;
    this.attachShadow({mode: 'open'})
    this.players = []
    this.playerCount = 2;
  }


  connectedCallback() {
    const fragment = new DocumentFragment();
    for (let count = 0; count < this.playerCount; count += 1) {
      const el = document.createElement('div');
      el.id = `player${count}`;
      fragment.appendChild(el);
    }
    this.shadowRoot.appendChild(fragment);
    this.init();

    // const script = document.createElement('script')
    // script.innerHTML = youtubeScript;
    // this.shadowRoot.appendChild(script);
    // const iframeScript = document.createElement('script');
    // iframeScript.src = 'https://www.youtube.com/iframe_api';
    // this.shadowRoot.appendChild(iframeScript);

  }

  async init() {
    this.loadApi()
    await this.apiLoader
    for (let count = 0; count < this.playerCount; count += 1) {
      const videoEl = this.shadowRoot.querySelector(`#player${count}`)
      this.player = await new Promise((resolve) => {
        let player = new YT.Player(videoEl, {
          width: '200',
          height: '200',
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

      const player = this.shadowRoot.querySelector(`#player${count}`);
      this.players.push(player);
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

customElements.define('page-controller', PageController)



