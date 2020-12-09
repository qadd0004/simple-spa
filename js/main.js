// set branch assign-4 remote tracking

//API api_key=803734898f6659797a0f7e7dc6a24147

//app is for general control over the application
//and connections between the other components

const APP = {
  name: null,
  init() {
    //this function runs when the page loads
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
      name = searchBox.value.trim();
      searchBtn.style.outline = "none";
      PAGES.switchPage(PAGES["currentPage"], PAGES["actors"]);

      if (PAGES.actors.classList.contains("active")) {
        MEDIA.actorsBtn.classList.remove("act");
        MEDIA.actorsBtn.removeEventListener("click", MEDIA.showActors);
      }

      if (name) {
        APP["name"] = name;
        searchBox.value = "";

        //check if the DB configuration has already been retrieved, if not fetch it
        if (!SEARCH.config) {
          SEARCH.getConfiguration();
        }

        /*check if the same search was already stored locally, if so, skip the fetch, and get its data from SEARCH.results immediately for faster app response avoiding unnecessary http requests/API calls */
        if (SEARCH.results.name == undefined) {
          ACTORS.getActor(name, (locally = false));
          PAGES.switchPage(PAGES["currentPage"], PAGES["actors"]);
        } else {
          ACTORS.getActor(name, (locally = true));
          PAGES.switchPage(PAGES["currentPage"], PAGES["actors"]);
        }
      } else {
        return;
      }
    });
  },
};

//actors is for changes connected to content in the actors section
const ACTORS = {
  getActor(actor, locally) {
    if (!locally) {
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
          STORAGE.storeSearch(data.results, actor);
          ACTORS.card(SEARCH.results[actor]);
        })
        .catch((err) => {
          //handle the error
          alert(err);
        });
    } else {
      let actor = `${STORAGE.user}-SPA-${actor}`;
      //ACTORS.card(localStorage[actor]);
      ACTORS.card(localStorage[actor]);
    }
  },

  card(result, config) {
    console.log(result[0]);
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
        image.src = `${config["images"]["secure_base_url"]}${config["images"]["profile_sizes"][2]}${actorObject["profile_path"]}`;
      } else {
        image.src = "";
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

      // check for image existence before appending card
      if (actorObject.id && actorObject.profile_path) {
        list.append(card);
        PAGES.switchPage(PAGES["currentPage"], PAGES["actors"]);
      } else if (!actorObject.profile_path && list.children.length == 0) {
        h3.textContent = `There are ${
          SEARCH["results"][APP["name"]].length
        } result(s) for '${
          APP.name
        }' search term, only those with profile/poster pictures are shown here if any`;
        list.append(h3);
        PAGES.switchPage(PAGES["currentPage"], PAGES["actors"]);
      } else {
        h3.innerHTML = "";
      }

      card.addEventListener("click", (ev) => MEDIA.getMedia(ev, actorObject));
    });
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
      })
      .catch((err) => {
        //handle the error
        alert(err);
      });
  },
  // results contain named objects for easier access.
  results: {},
};

//media is for changes connected to content in the media section
const MEDIA = {
  media: null,
  actorsBtn: document.querySelector("#header h1 span"),
  showActors() {
    PAGES.switchPage(PAGES["currentPage"], PAGES["actors"]);
    MEDIA.removeActorsListener();
  },
  removeActorsListener() {
    MEDIA.actorsBtn.classList.remove("act");
    MEDIA.actorsBtn.removeEventListener("click", MEDIA.showActors);
  },

  getMedia(ev, actor) {
    let h3 = document.querySelector("#media h3");
    let clickedActorId = ev.currentTarget.getAttribute("data-id");
    // checking for Actor ID before retrieving his data
    if (parseInt(clickedActorId) === actor.id) {
      h3.textContent = `${actor["name"]} is best known for:`;

      MEDIA.media = actor["known_for"];
      if (MEDIA.media.length > 0) {
        MEDIA.addMedia(MEDIA.media);
        PAGES.switchPage(PAGES["actors"], PAGES["media"]);
        MEDIA.setDimensions();

        MEDIA.actorsBtn.classList.add("act");
        MEDIA.actorsBtn.addEventListener("click", MEDIA.showActors);
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
      if (poster) {
        list.append(card);
      }
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
    prev.classList.remove("active");
    next.classList.add("active");
    PAGES.currentPage = next;
  },
};

//storage is for working with localstorage
const STORAGE = {
  user: "qadd0004",
  storeSearch(search, actor) {
    //console.log(actor);
    actor = `${STORAGE.user}-SPA-${actor}`;
    let objectToStore = JSON.stringify({ [actor]: search });
    localStorage.setItem(actor, objectToStore);
  },
};

//nav is for anything connected to the history api and location
const NAV = {
  //this will be used in Assign 4
};

//Start everything running
APP.init();
