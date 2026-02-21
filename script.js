let currentsong = new Audio();
let songs;
let currFolder;
function secondsToMMSS(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00"
    }
    seconds = Math.floor(seconds);

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
async function getSongs(folder) {
    currFolder = folder;
    const a = await fetch(`/${folder}/`)
    const response = await a.text();
    const div = document.createElement("div")
    div.innerHTML = response;
    const as = div.getElementsByTagName("a")
    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        const hrefAttr = element.getAttribute('href') || element.href || '';
        if (!hrefAttr) continue;
        const decoded = decodeURIComponent(hrefAttr);
        if (decoded.toLowerCase().endsWith('.mp3')) {
            const filename = decoded.split('/').pop().split('\\').pop();
            songs.push(filename);
        }
    }


    //Show all the songs in the playlist

    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0]
    songUL.innerHTML = ""
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `<li data-track="${song}">
                        <img class = "invert" src="music.svg" alt="">
                        <div class="info">

                            <div>${song.replaceAll("-", " ").replace(/\s\d+(?=\.mp3)/, "").replace(/\b\w/g, char => char.toUpperCase())} </div>

                            <div>Harry</div>

                        </div>
                        <div class="playnow">
                            <span>Play Now</span>
                            <img class = "invert" src="play.svg" alt=""></li>`;
    }
    //Attaching Event Listener to each song
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.dataset.track.trim())
        })
    })
    return songs;
}

const playMusic = (track, pause = false) => {
    currentsong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentsong.play();
        play.src = "pause.svg"
    }
    document.querySelector(".songinfo").innerHTML = track.replaceAll("-", " ").replace(/\s\d+(?=\.mp3)/, "").replace(/\b\w/g, char => char.toUpperCase())
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00"
}

async function displayAlbums() {
    const a = await fetch(`/songs/`)
    const response = await a.text();
    const div = document.createElement("div")
    div.innerHTML = response;
    const anchors = div.getElementsByTagName("a")
    const cardContainer = document.querySelector(".cardContainer")
    const array = Array.from(anchors);
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        const hrefAttr = e.getAttribute('href') || e.href || '';
        const decoded = decodeURIComponent(hrefAttr);
        const m = decoded.match(/songs[\/\\]([^\/\\]+)/i);
        if (m) {
            const folder = m[1];
            try {
                const infoResp = await fetch(`/songs/${folder}/info.json`)
                const meta = await infoResp.json();
                const cover = meta.cover || 'cover.jpeg';
                cardContainer.innerHTML = cardContainer.innerHTML + `<div data-folder="${folder}" class="card">
                        <div class="play">
                            <svg width="40" height="40" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="100" cy="100" r="100" fill="#1ed760" />
                                <polygon points="70,50 70,150 155,100" fill="black" />
                            </svg>
                        </div>

                        <img src="/songs/${folder}/${cover}" alt="">
                        <h2>${meta.title || folder}</h2>
                        <p>${meta.description || ''}</p>
                    </div>`
            } catch (err) {
                // ignore folders without info.json
            }
        }
    }

    //Load the playlist whenever the card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0])
        })
    })
}

async function main() {

    //get the list of all the song
    await getSongs("songs/ncs");
    playMusic(songs[0], true)

    //Display the albums on the page
    displayAlbums();
    //Attach an EventListener to play next and previous
    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play()
            play.src = "pause.svg"
        } else {
            currentsong.pause()
            play.src = "play.svg"
        }
    })

    //Listen for timeupdate event
    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMMSS(currentsong.currentTime)} / ${secondsToMMSS(currentsong.duration)}
        `
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%"

    })
    //Add an Event Listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100
        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = ((currentsong.duration) * percent) / 100
    })

    // Add an event Listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%"
    })

    // Add an eventListener to previous and next
    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    })

    next.addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {     //length is always 0
            playMusic(songs[index + 1])
        }
    })
    //Add an event to volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentsong.volume = parseInt(e.target.value) / 100;
    })

    //Add an event listener to mute the track
    document.querySelector(".volume > img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentsong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentsong.volume = .10
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })
}

main();

