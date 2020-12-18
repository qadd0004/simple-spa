// set branch assign-4 remote tracking

//API api_key=803734898f6659797a0f7e7dc6a24147

//app is for general control over the application
//and connections between the other components

const APP = {
  name: null,
  actor: null,
  actorId: null,
  hash: "#",
  homePage: "/#",
  dataLocal: false,
  init() {
    //this function runs when the page loads

    console.log(history);
    NAV.handleAddress(APP.name);

    window.onpopstate = function (event) {
      console.log("history changed to: " + document.location.href);
    };

    window.addEventListener("hashchange", APP.hashChange);
    console.log("haschange listener added");

    let searchBox = document.querySelector("#search");
    let searchBtn = document.querySelector("#btnSearch");

    searchBox.addEventListener("focus", (ev) => {
      searchBtn.classList.remove("pulse");
    });

    searchBox.addEventListener("blur", (ev) => {
      searchBtn.classList.add("pulse");
    });

    searchBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      let name = searchBox.value.trim();
      searchBtn.style.outline = "none";
      PAGES.switchPage(PAGES["currentPage"], PAGES["actors"]);

      document
        .querySelector(".sort")
        .addEventListener("click", ACTORS.sortActors);

      if (PAGES.actors.classList.contains("active")) {
        MEDIA.actorsBtn.classList.remove("act");
        MEDIA.actorsBtn.removeEventListener("click", MEDIA.showActors);
      }

      if (name !== "") {
        APP["name"] = name;
        APP["actor"] = `${STORAGE.user}-SPA-${name}`;
        searchBox.value = "";

        //check if the DB configuration has already been retrieved, if not fetch it
        if (!SEARCH.config) {
          SEARCH.getConfiguration();
        }

        /*check if the same search was already stored locally, if so, skip the fetch, and get its data from localStorage immediately for faster app response avoiding unnecessary http requests/API calls */
        if (localStorage[APP.actor] == undefined) {
          APP.dataLocal = false;
          //SEARCH.observeContent();
          ACTORS.getActor(name, APP.dataLocal);
          PAGES.switchPage(PAGES["currentPage"], PAGES["actors"]);
        } else {
          console.log("fetch locally - inside app.init");
          APP.dataLocal = true;
          ACTORS.getActor(APP.actor, APP.dataLocal);
          //NAV.handleURL(name, APP.dataLocal);
          PAGES.switchPage(PAGES["currentPage"], PAGES["actors"]);
        }
      } else {
        return;
      }
    });
  },

  hashChange(ev) {
    console.log("hasChange has been called");
    console.log(ev);

    APP.hash = location.hash;
    console.log(APP.hash);

    if (APP.hash) {
      let parts = APP.hash.split("/");
      console.log(parts);
      switch (parts.length) {
        //page details
        case 1:
          var page = PAGES["actors"];
          break;
        case 2:
          page = PAGES["media"];
          break;
        default:
          page = PAGES["instr"];
      }
    }
    NAV.handleAddress();
    //PAGES.switchPage(PAGES["currentPage"], page);
  },
};

//actors is for changes connected to content in the actors section
const ACTORS = {
  searchResults: null,
  getActor(actor, locally) {
    if (!locally) {
      SEARCH.observeContent();
      let url = `https://api.themoviedb.org/3/search/person?api_key=803734898f6659797a0f7e7dc6a24147&language=en-US&query=${actor}&page=1&include_adult=false`;

      fetch(url)
        .then(function (response) {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error("Bad response", response.status);
          }
        })
        .then(function (data) {
          SEARCH.results[actor] = data.results;
          STORAGE.storeSearch(data.results, APP.actor);
          ACTORS.searchResults = data.results;
          ACTORS.card(ACTORS.searchResults);
        })
        .catch((err) => {
          //handle the error
          alert(err);
        });
    } else {
      console.log("fetch locally- inside get actor");
      console.log(APP.actor);
      ACTORS.searchResults = JSON.parse(localStorage[APP.actor]);
      ACTORS.card(ACTORS.searchResults);
    }
  },

  card(result) {
    console.log(result);
    config = SEARCH.config;
    if (result.length === 0) {
      alert(
        `There is no actor/actress with that name, please check your spelling and try again`
      );
      PAGES.switchPage(PAGES["currentPage"], PAGES["instr"]);
      return;
    }

    let list = document.querySelector("#actorsList");
    list.innerHTML = "";

    result.forEach((actorObject) => {
      let card = document.createElement("div");
      card.classList.add("card");
      card.setAttribute("data-id", actorObject.id);

      let picture = document.createElement("div");
      picture.classList.add("picture");

      let image = document.createElement("img");
      if (actorObject.profile_path) {
        let images = JSON.parse(localStorage[STORAGE.user]);
        image.src = `${images["images"]["secure_base_url"]}${images["images"]["profile_sizes"][2]}${actorObject["profile_path"]}`;
      } else {
        image.src = "img/img-placeholder.png";
      }
      image.alt = actorObject.name;

      picture.append(image);
      card.append(picture);

      let h3 = document.createElement("h3");
      h3.classList.add("name");
      h3.textContent = actorObject.name;
      card.append(h3);

      let popularity = document.createElement("p");
      popularity.classList.add("pop");
      let pop = Math.ceil(actorObject.popularity / 3);
      pop = pop <= 5 ? pop : 5;
      popularity.innerHTML = "<span>&star;</span>".repeat(pop);
      card.append(popularity);

      card.addEventListener("click", (ev) => MEDIA.getMedia(ev, actorObject));
      list.append(card);
    });
  },
  sortActors(ev) {
    if (ev.target.textContent == "Name") {
      ev.preventDefault();
      ev.target.classList.toggle("name-ascend");

      if (ev.target.classList.contains("name-ascend")) {
        ACTORS.searchResults.sort((a, b) => {
          if (a["name"].toLowerCase() > b["name"].toLowerCase()) return 1;
          else if (b["name"].toLowerCase() > a["name"].toLowerCase()) return -1;
          else return 0;
        });
        ACTORS.card(ACTORS.searchResults);
      } else {
        ev.preventDefault();
        ACTORS.searchResults.sort((a, b) => {
          if (a["name"].toLowerCase() < b["name"].toLowerCase()) return 1;
          else if (b["name"].toLowerCase() < a["name"].toLowerCase()) return -1;
          else return 0;
        });
        ACTORS.card(ACTORS.searchResults);
      }
    }
    if (ev.target.textContent == "Popularity") {
      ev.preventDefault();
      ev.target.classList.toggle("pop-ascend");
      if (ev.target.classList.contains("pop-ascend")) {
        ACTORS.searchResults.sort((a, b) => {
          if (a["popularity"] > b["popularity"]) return 1;
          else if (b["popularity"] > a["popularity"]) return -1;
          else return 0;
        });
        ACTORS.card(ACTORS.searchResults);
      } else {
        ev.preventDefault();
        ACTORS.searchResults.sort((a, b) => {
          if (a["popularity"] < b["popularity"]) return 1;
          else if (b["popularity"] < a["popularity"]) return -1;
          else return 0;
        });
        ACTORS.card(ACTORS.searchResults);
      }
    }
  },
};

//search is for anything to do with the fetch api
const SEARCH = {
  config: null,
  getConfiguration() {
    url =
      "https://api.themoviedb.org/3/configuration?api_key=803734898f6659797a0f7e7dc6a24147";

    fetch(url)
      .then(function (response) {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Bad response", response.status);
        }
      })
      .then(function (data) {
        SEARCH.config = data;
        console.log(STORAGE.user, data);
        localStorage.setItem(STORAGE.user, JSON.stringify(data));
      })
      .catch((err) => {
        //handle the error
        alert(err);
      });
  },
  // results contain named objects for easier access.
  results: {},
  observeContent() {
    displayOverlay();
    // Select the DOM node that will be observed for mutations
    const actorsList = document.querySelector("#actorsList");

    function displayOverlay() {
      let overlay = document.querySelector(".overlay");
      overlay.classList.remove("hidden");
      overlay.classList.add("display");
      displayDia();
    }

    function displayDia() {
      let dialog = document.querySelector(".dialog");
      dialog.classList.remove("sleep");
      dialog.classList.add("wake-up");
    }

    function hideDia() {
      let dialog = document.querySelector(".dialog");
      dialog.classList.remove("wake-up");
      dialog.classList.add("sleep");
    }

    function hideOverlay() {
      let overlay = document.querySelector(".overlay");
      overlay.classList.remove("display");
      overlay.classList.add("hidden");
      hideDia();
    }

    // Options for the observer (which mutations to observe)
    const config = { attributes: false, childList: true, subtree: true };

    // observant function to execute when mutations are observed
    const observant = function (mutationsList, observer) {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList") {
          hideOverlay();
        } else {
          return;
        }
      }
    };

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(observant);

    // Start observing the target node for configured mutations
    observer.observe(actorsList, config);
    //observer.disconnect();
  },
};

//media is for changes connected to content in the media section
const MEDIA = {
  media: null,
  actor: APP.name,
  actorsBtn: document.querySelector("#header h1 span"),
  showActors(ev) {
    ev.preventDefault();
    PAGES.switchPage(PAGES["currentPage"], PAGES["actors"]);
    MEDIA.removeActorsListener();
  },
  removeActorsListener() {
    MEDIA.actorsBtn.classList.remove("act");
    MEDIA.actorsBtn.removeEventListener("click", MEDIA.showActors);
  },

  getMedia(ev, actor) {
    ev.preventDefault();
    let h3 = document.querySelector("#media h3");
    let clickedActorId = parseInt(ev.currentTarget.getAttribute("data-id"));
    // checking for Actor ID before retrieving his data
    if (clickedActorId === actor.id) {
      APP.actorId = clickedActorId;
      NAV.handleAddress(APP.name, clickedActorId);
      h3.textContent = `${actor["name"]} is best known for:`;

      MEDIA.media = actor["known_for"];
      if (MEDIA.media.length > 0) {
        MEDIA.addMedia(MEDIA.media);
        PAGES.switchPage(PAGES["actors"], PAGES["media"]);
        MEDIA.setDimensions();

        MEDIA.actorsBtn.classList.add("act");
        MEDIA.actorsBtn.addEventListener("click", MEDIA.showActors);
        document.querySelector(".sort").style.display = "none";
        history.pushState(
          {},
          "Actors",
          `${APP.homePage}${APP.name}/${APP.actorId}`
        );
      } else {
        alert("Actor's media shows/movies not found");
      }
    } else {
      alert("Actor not found");
    }
  },
  addMedia(media) {
    let list = document.querySelector("#titles");
    list.innerHTML = "";

    media.forEach((show) => {
      // show is either a movie with a title property or a TV show with a name property
      let data_id = show["id"];
      let name = show["name"] || show["title"];
      let poster = show["poster_path"];
      let yearShown = show["first_air_date"] || show["release_date"];
      yearShown = yearShown.slice(0, 4);

      let card = document.createElement("div");
      card.classList.add("card");
      card.setAttribute("data-id", data_id);

      let picture = document.createElement("div");
      picture.classList.add("picture");

      let image = document.createElement("img");
      if (poster) {
        image.src = `${SEARCH["config"]["images"]["secure_base_url"]}${SEARCH["config"]["images"]["poster_sizes"][2]}${poster}`;
      } else {
        image.src = "img/img-placeholder.png";
      }
      image.alt = name;

      picture.append(image);
      card.append(picture);

      let cardH3 = document.createElement("h3");
      cardH3.classList.add("name");
      cardH3.textContent = name;
      card.append(cardH3);

      let year = document.createElement("p");
      year.classList.add("pop");
      year.textContent = yearShown;
      card.append(year);
      list.append(card);
    });
  },
  setDimensions() {
    let mediaPage = document.querySelector("#media");
    let header = document.querySelector("#header");
    let headerHeight = header.getBoundingClientRect().height;
    mediaPage.style.top = `${headerHeight + 30}px`;
  },
};

// PAGES is for switching between pages
const PAGES = {
  currentPage: document.querySelector(".active"),
  instr: document.querySelector("#instructions"),
  actors: document.querySelector("#actors"),
  media: document.querySelector("#media"),
  switchPage(prev, next) {
    console.log(prev, next);
    prev.classList.remove("active");
    next.classList.add("active");
    PAGES.currentPage = next;
    history.pushState(null, null, APP.homePage + APP.name);
    APP.currentPage = next;
    if (PAGES.actors.classList.contains("active")) {
      document.querySelector(".sort").style.display = "block";
    }
  },
};

//storage is for working with localstorage
const STORAGE = {
  user: "qadd0004",
  storeSearch(search, actor) {
    console.log(search);
    let objectToStore = JSON.stringify(search);
    localStorage.setItem(actor, objectToStore);
  },
};

//nav is for anything connected to the history api and location
const NAV = {
  handleAddress(name, id = null) {
    console.log("inside NAV object");
    if (id) {
      history.pushState({}, `${name}`, `${APP.homePage}${name}/${id}`);
    } else if (name) {
      //history.replaceState({}, `${name}`, `${APP.homePage}${name}me!`);
      history.pushState({}, `${name}`, `${APP.homePage}${name}`);
    } else {
      //history.replaceState({}, null, `${APP.homePage}`);
      history.pushState({}, null, `${APP.homePage}`);

      APP.hash = location.hash;
      console.log(APP.hash);
    }
  },
};

//Start everything running
APP.init();
