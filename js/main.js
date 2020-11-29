//app is for general control over the application
//and connections between the other components
// My API api_key=803734898f6659797a0f7e7dc6a24147
//Example request https://api.themoviedb.org/3/movie/550?api_key=803734898f6659797a0f7e7dc6a24147
// image request  https://api.themoviedb.org/3/configuration?api_key={apikey}
const APP = {
  init() {
    //this function runs when the page loads
    let searchBox = document.querySelector("#search");
    let searchBtn = document.querySelector("#btnSearch");

    searchBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      name = searchBox.value;
      if (name) {
        ACTORS.getActor(name);
        PAGES.switchPage(PAGES.instr, PAGES.actors);
        searchBox.value = "";
      }
    });
  },
};

//search is for anything to do with the fetch api
const SEARCH = {
  results: [],
};

//console.log(actors);
//actors is for changes connected to content in the actors section
const ACTORS = {
  getActor(actor) {
    let url = `https://api.themoviedb.org/3/search/person?api_key=803734898f6659797a0f7e7dc6a24147&language=en-US&query=${actor}&page=1&include_adult=false`;

    //open(url);

    fetch(url)
      .then(function (response) {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Bad response", response.status);
        }
      })
      .then(function (data) {
        ACTORS.card(data);
        SEARCH.results.push(data);
      })
      .catch((err) => {
        //handle the error
        alert(err);
      });
  },

  card(result) {
    if (result["total_results"] === 0) {
      alert(
        "There is no actor with that name, please check your spelling and try again"
      );
      PAGES.switchPage(PAGES.actors, PAGES.instr);
      return;
    }

    let list = document.querySelector("#actorsList");
    list.innerHTML = "";

    result.results.forEach((actor) => {
      let card = document.createElement("div");
      card.classList.add("card");
      card.setAttribute("data-id", actor.id);

      let picture = document.createElement("div");
      picture.classList.add("picture");

      let image = document.createElement("img");
      image.src = "https://image.tmdb.org/t/p/w185/" + actor.profile_path;
      image.alt = actor.name;

      picture.append(image);
      card.append(picture);

      let h3 = document.createElement("h3");
      h3.classList.add("name");
      h3.textContent = actor.name;
      card.append(h3);

      let popularity = document.createElement("p");
      popularity.classList.add("pop");
      let pop = Math.ceil(actor.popularity / 3);
      pop = pop <= 5 ? pop : 5;
      popularity.innerHTML = "<span>&star;</span>".repeat(pop);
      card.append(popularity);

      list.append(card);
    });
  },
};

//media is for changes connected to content in the media section
const MEDIA = {};

//storage is for working with localstorage
const STORAGE = {
  //this will be used in Assign 4
};

//nav is for anything connected to the history api and location
const NAV = {
  //this will be used in Assign 4
};

const PAGES = {
  instr: document.querySelector("#instructions"),
  actors: document.querySelector("#actors"),
  media: document.querySelector("#actors"),
  switchPage(prev, next) {
    prev.classList.remove("active");
    next.classList.add("active");
  },
};

//Start everything running

document.addEventListener("DOMContentLoaded", APP.init);
