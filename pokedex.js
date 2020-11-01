/**
 * Name: Tahmin Talukder
 * Date: May 8th, 2019
 * Section: CSE 154 AQ
 * This is the JS that implements functionality to the pokedex.html
 * page and gets data from the PokeDex API
 * to fill the pokedex, but only Squirtle, Charmander, and Bulbasaur are
 * available to choose at the start. The user can choose an available
 * pokemon to battle other pokemon and add them to the pokedex.
 */

(function() {
  "use strict";

  const DEX_API = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/pokedex.php";
  const SPRITE_PATH = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/sprites/";
  const IMG_PATH = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/";
  const GAME_API = "https://courses.cs.washington.edu/courses/cse154/webservices/pokedex/game.php";
  let gameId = "";
  let playerId = "";
  let foundPokemon = ["bulbasaur", "charmander", "squirtle"];
  let playerHp = 0;

  window.addEventListener("load", init);

  /**
   * Once the windows loads, the page
   * fetches data of all of the pokemon from the
   * API and fills the pokedex.
   */
  function init() {
    getRequest();
  }

  /**
   * Takes the URL of the Pokedex API and gets
   * data of all of the pokemon, processes it, then fills
   * the pokedex with their sprite silhouettes
   * except for the three starters. If something goes
   * wrong, the error will be caught.
   */
  function getRequest() {
    let dexUrl = DEX_API + "?pokedex=all";

    fetch(dexUrl)
      .then(checkStatus)
      .then(fillDex)
      .catch(console.error);
  }

  /**
   * Helper function to return the response's result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text
   * @param {object} response - response to check for success/error
   * @returns {object} - valid result text if response was successful, otherwise rejected
   *                     Promise result
   */
  function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
      return response.text();
    } else {
      return Promise.reject(new Error(response.status + ": " + response.statusText));
    }
  }

  /**
   * Takes the plain text returned containing the names of all
   * pokemon and fills the pokedex with their sprite silhouettes
   * except for the three starters. The three starters can be
   * clicked on and information on their stats and moves will be
   * displayed on the card on the left of the pokedex. The other
   * pokemon cannot be clicked until they're added to the pokedex.
   * @param {string} pokemon - the plain text that was returned from the server
   */
  function fillDex(pokemon) {
    let pokemonArray = pokemon.split("\n");

    for (let i = 0; i < pokemonArray.length; i++) {
      let pokemonName = pokemonArray[i].split(":")[1];
      let sprite = document.createElement("img");
      sprite.id = pokemonName;
      sprite.classList.add("sprite");

      if (foundPokemon.includes(pokemonName)) {
        sprite.classList.add("found");
      }

      sprite.src = SPRITE_PATH + pokemonName + ".png";
      sprite.alt = "the pokemon " + pokemonName;
      id("pokedex-view").appendChild(sprite);
    }

    let found = document.getElementsByClassName("found");

    for (let j = 0; j < found.length; j++) {
      found[j].addEventListener("click", function() {
        getCard(found[j].id, "#p1");
      });
    }
  }

  /**
   * When the pokemon is clicked, JSON data is retrieved from the
   * API with the pokemon's short-hand name containing information
   * such as moves, stats, etc. of the pokemon. This data is then
   * parsed and used to create the card of the pokemon. After the
   * card is created, the start button is revealed on the bottom.
   * Errors will be caught if anything goes wrong.
   * @param {string} pokemonName - the short-hand name of the pokemon
   * @param {string} player - the id of the specific player (1 or 2)
   */
  function getCard(pokemonName, player) {
    let pokemonData = DEX_API + "?pokemon=" + pokemonName;

    fetch(pokemonData)
      .then(checkStatus)
      .then(JSON.parse)
      .then(function(parsedJson) {
        createCard(parsedJson, player);
      })
      .then(function() {
        id("start-btn").classList.remove("hidden");
        id("start-btn").addEventListener("click", startGame);
      })
      .catch(console.error);
  }

  /**
   * Takes the JSON returned from the server of the clicked pokemon and
   * adds their picture, type, weakness, moves, and DP for each of their moves
   * to the card on the left. The moves are clickable buttons used for battling
   * other pokemon.
   * @param {object} pokemonJson - the JSON object that was returned from the server
   * @param {string} player - the id of the specific player (1 or 2)
   */
  function createCard(pokemonJson, player) {
    qs(player + " .name").innerText = pokemonJson.name;
    qs(player + " .hp").innerText = pokemonJson.hp + "HP";
    qs(player + " .info").innerText = pokemonJson.info.description;
    qs(player + " .type").src = IMG_PATH + pokemonJson.images.typeIcon;
    qs(player + " .pokepic").src = IMG_PATH + pokemonJson.images.photo;
    qs(player + " .pokepic").id = pokemonJson.shortname;
    qs(player + " .weakness").src = IMG_PATH + pokemonJson.images.weaknessIcon;
    let move = qsa(player + " .move");
    let dp = qsa(player + " .dp");
    let moveType = qsa(player + " button > img");
    let buttons = qsa(player + " .moves button");
    let i = 0;

    for (i; i < pokemonJson.moves.length; i++) {
      buttons[i].classList.remove("hidden");
      move[i].innerText = pokemonJson.moves[i].name;
      dp[i].innerText = pokemonJson.moves[i].dp + " DP";
      moveType[i].src = IMG_PATH + "icons/" + pokemonJson.moves[i].type +".jpg";

      if (!pokemonJson.moves[i].hasOwnProperty("dp")) {
        dp[i].innerText = "";
      }
    }

    for (i; i < move.length; i++) {
      buttons[i].classList.add("hidden");
    }
  }

  /**
   * After the 'Choose This Pokemon' button is clicked,
   * the view changes from the pokedex to the game view
   * with a random opponent. The move buttons on the user's
   * selected pokemon card is enabled and can be used to attack
   * the opponent.
   */
  function setGameView() {
    id("pokedex-view").classList.add("hidden");
    id("p2").classList.remove("hidden");
    qs(".hp-info").classList.remove("hidden");
    id("results-container").classList.remove("hidden");
    id("start-btn").classList.add("hidden");
    id("flee-btn").classList.remove("hidden");
    id("flee-btn").addEventListener("click", flee);
    qs("header > h1").innerText = "Pokemon Battle Mode!";
    let buttons = qsa("#p1 .moves button");

    for (let i = 0; i < buttons.length; i++) {
      if (!buttons[i].classList.contains("hidden")) {
        buttons[i].disabled = false;
        buttons[i].addEventListener("click", function() {
          playMove(buttons[i].firstElementChild.innerText);
        });
      }
    }
  }

  /**
   * After the 'Choose This Pokemon' button is clicked,
   * the view changes from the pokedex to the game view
   * with a random opponent. Takes the URL of the Game API
   * and gets data on the current state of the game such as
   * current hp, buffs, debuffs, etc. Stores the current
   * game id and player id. Creates a random opponent
   * for the user to face. If something goes wrong,
   * the error will be caught.
   */
  function startGame() {
    setGameView();
    let data = new FormData();
    data.append("startgame", true);
    data.append("mypokemon", qs("#p1 .name").innerText.toLowerCase());
    qs("#p1 .buffs").classList.remove("hidden");

    fetch(GAME_API, {method: "POST", body: data})
      .then(checkStatus)
      .then(JSON.parse)
      .then(createOpponent)
      .catch(console.error);
  }

  /**
   * Creates a random opponent for the user to face.
   * The opponent is a pokemon that the user doesn't
   * have in their pokedex. Stores the game id and
   * player id
   * @param {object} gameData - the JSON of the game state returned from the Game API
   */
  function createOpponent(gameData) {
    createCard(gameData.p2, "#p2");
    gameId = gameData.guid;
    playerId = gameData.pid;
  }

  /**
   * After any of the move buttons are clicked,
   * The pokemon's/player's health bars and HPs
   * are updated after damage calculations.
   * Any buffs and debuffs used are applied.
   * The actions are displayed in the center of the
   * game view.
   * If something goes wrong, the error will be caught.
   * @param {string} move - the name of the selected move
   */
  function playMove(move) {
    let data = new FormData();
    move = move.toLowerCase();
    move = move.replace(/\s/g, '');
    data.append("guid", gameId);
    data.append("pid", playerId);
    data.append("movename", move);
    id("loading").classList.remove("hidden");

    fetch(GAME_API, {method: "POST", body: data})
      .then(checkStatus)
      .then(JSON.parse)
      .then(displayMoves)
      .then(function() {
        if (!id("loading").classList.contains("hidden")) {
          id("loading").classList.add("hidden");
        }
      })
      .catch(console.error);
  }

  /**
   * Displays the moves each pokemon/player used in a turn and
   * states if it hit or missed.
   * @param {object} gameData - the JSON of the game state returned from the Game API
   */
  function displayMoves(gameData) {
    id("p1-turn-results").classList.remove("hidden");
    id("p2-turn-results").classList.remove("hidden");

    id("p1-turn-results").innerText = "Player 1 played " + gameData.results["p1-move"] +
                                      " and " + gameData.results["p1-result"] + "!";
    id("p2-turn-results").innerText = "Player 2 played " + gameData.results["p2-move"] +
                                      " and " + gameData.results["p2-result"] + "!";
    updateHealth(gameData);
    updateBuffs(gameData);
  }

  /**
   * Updates the current HP and health bar of each player/pokemon in the game.
   * If the user's health is 0, they lose the game. If they opponent's health
   * is 0, the user wins.
   * @param {object} gameData - the JSON of the game state returned from the Game API
   */
  function updateHealth(gameData) {
    setHealth(gameData, "p1");
    setHealth(gameData, "p2");

    let hp1 = gameData.p1["current-hp"];
    let hp2 = gameData.p2["current-hp"];
    playerHp = gameData.p1.hp;

    if (hp1 === 0) {
      loseGame();
    } else if (hp2 === 0) {
      winGame(gameData);
    }
  }

  /**
   * Updates the current HP and health bar size of each
   * player/pokemon in the game. If any of the pokemon's
   * health reaches 20% or below, the color of the health
   * bar becomes red from green.
   * @param {object} gameData - the JSON of the game state returned from the Game API
   * @param {string} player - the id of the specific player (1 or 2)
   */
  function setHealth(gameData, player) {
    let pct = (gameData[player]["current-hp"] / gameData[player]["hp"]) * 100;
    let healthBar = "#" + player + " .health-bar";
    qs(healthBar).style.width = pct + "%";

    if (pct <= 20) {
      qs(healthBar).classList.add("low-health");
    }

    qs("#" + player + " .hp").innerText = gameData[player]["current-hp"] + "HP";
  }

  /**
   * When the user wins the game by beating the opponent, if the pokemon isn't
   * in the pokedex they beat, they are added in and the user is able to use
   * them in future games. All move buttons are disabled and a button appears
   * below the card that allows you to go back to the pokedex.
   * @param {object} gameData - the JSON of the game state returned from the Game API
   */
  function winGame(gameData) {
    qs("header > h1").innerText = "You won!";
    id("flee-btn").classList.add("hidden");
    id("endgame").classList.remove("hidden");
    id("endgame").addEventListener("click", backToDex);
    let buttons = qsa("#p1 .moves button");

    for (let i = 0; i < buttons.length; i++) {
      if (!buttons[i].classList.contains("hidden")) {
        buttons[i].disabled = true;
      }
    }

    if (gameData.results["p2-move"] === null || gameData.results["p2-result"] === null) {
      id("p2-turn-results").classList.add("hidden");
    }

    let opponent = qs("#p2 .card .pokemon-pic img").id;
    id(opponent).classList.add("found");
    id(opponent).addEventListener("click", function() {
      getCard(opponent, "#p1");
    });
    foundPokemon.push(opponent);
  }

  /**
   * When the user loses the game, all move buttons are disabled and a
   * button appears below the card that allows you to go back to the pokedex.
   * @param {object} gameData - the JSON of the game state returned from the Game API
   */
  function loseGame() {
    qs("header > h1").innerText = "You lost!";
    id("flee-btn").classList.add("hidden");
    id("endgame").classList.remove("hidden");
    id("endgame").addEventListener("click", backToDex);
    let buttons = qsa("#p1 .moves button");

    for (let i = 0; i < buttons.length; i++) {
      if (!buttons[i].classList.contains("hidden")) {
        buttons[i].disabled = true;
      }
    }
  }

  /**
   * The 'Back to PokeDex' button switches from the game view to the pokedex
   * when clicked by the user.
   * @param {object} gameData - the JSON of the game state returned from the Game API
   */
  function backToDex() {
    id("endgame").classList.add("hidden");
    id("p2").classList.add("hidden");
    id("results-container").classList.add("hidden");
    id("start-btn").classList.remove("hidden");
    qs("header > h1").innerText = "Your Pokedex";
    qs("#p1 .hp").innerText = playerHp + "HP";
    qs("#p1 .health-bar").style.width = "100%";
    qs("#p2 .health-bar").style.width = "100%";
    qs("#p1 .hp-info").classList.add("hidden");

    if (qs("#p1 .health-bar").classList.contains("low-health")) {
      qs("#p1 .health-bar").classList.remove("low-health");
      qs("#p2 .health-bar").classList.remove("low-health");
    }

    if (qs("#p2 .health-bar").classList.contains("low-health")) {
      qs("#p2 .health-bar").classList.remove("low-health");
    }

    qs("#p1 .buffs").innerHTML = "";
    qs("#p2 .buffs").innerHTML = "";
    id("pokedex-view").classList.remove("hidden");
  }

  /**
   * Updates the current applied buffs and debuffs of each player/pokemon in the game.
   * @param {object} gameData - the JSON of the game state returned from the Game API
   */
  function updateBuffs(gameData) {
    setBuffs(gameData, "p1");
    setBuffs(gameData, "p2");
  }

  /**
   * Updates the current applied buffs and debuffs of each
   * player/pokemon in the game. Appends images representing
   * the type of buffs and debuffs. The types are attack, defense,
   * and accuracy. Their representative colors are red, blue, and green,
   * respectively. The up arrow is a buff and the down arrow is a debuff.
   * @param {object} gameData - the JSON of the game state returned from the Game API
   * @param {string} player - the id of the specific player (1 or 2)
   */
  function setBuffs(gameData, player) {
    let buffContainer = qs("#" + player + " .buffs");
    let buffs = gameData[player]["buffs"];
    let debuffs = gameData[player]["debuffs"];
    let currBuffs = qsa("#" + player + " .buff");
    let currDebuffs = qsa("#" + player + " .debuff");

    if (buffs.length > currBuffs.length) {
      let newBuff = document.createElement("div");
      newBuff.classList.add(buffs[currBuffs.length]);
      newBuff.classList.add("buff");
      buffContainer.appendChild(newBuff);
    }

    if (debuffs.length > currDebuffs.length) {
      let newDebuff = document.createElement("div");
      newDebuff.classList.add(debuffs[currDebuffs.length]);
      newDebuff.classList.add("debuff");
      buffContainer.appendChild(newDebuff);
    }
  }

  /**
   * The 'Flee' button when clicked ends the current game immediately
   * and the user loses the game.
   */
  function flee() {
    let data = new FormData();
    data.append("guid", gameId);
    data.append("pid", playerId);
    data.append("movename", "flee");

    fetch(GAME_API, {method: "POST", body: data})
      .then(checkStatus)
      .then(JSON.parse)
      .then(afterFleeing)
      .catch(console.error);
  }

  /**
   * The 'Flee' button when clicked ends the current game immediately
   * and the user loses the game. The health bar becomes red
   * and goes to 0% and the HP becomes 0.
   */
  function afterFleeing() {
    id("results-container").innerText = "Player 1 played flee and lost!";
    qs("#p1 .health-bar").style.width = "0%";
    qs("#p1 .health-bar").classList.add("low-health");
    qs("#p1 .hp").innerText = "0HP";
    loseGame();
  }

  /**
   * Returns the element that has the ID attribute with the specified value.
   * @param {string} idName - element ID
   * @returns {object} DOM object associated with id.
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Returns the first element that matches the given CSS selector.
   * @param {string} selector - CSS query selector.
   * @returns {object} The first DOM object matching the query.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns the array of elements that match the given CSS selector.
   * @param {string} selector - CSS query selector
   * @returns {object[]} array of DOM objects matching the query.
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }
})();
