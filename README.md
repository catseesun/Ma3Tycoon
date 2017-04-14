# Ma3Tycoon
Ma3Tycoon is a prototype web app app aiming at updating Nairobi's complex and dynamic informal transit ("matatu") system, improving navigation and accessibility of the system. The goal of the project is to crowdsource updates by tapping into the expertise of riders, drivers, and others who use the system everyday. This prototype is developed at Crowdsourced City (Sprint 2016) course by three MIT graduate students in collaboration with ma3route, Kenya's go-to source for traffic and commuting information.

# Prototype and Functions
In this prototype, we have built the core function of the full concept - the route segments verification, including the development of the route question database, randomizing route segments, routes registration for users, storage of user inputs, and visualization of user’s responses. Modules include:

- Home page of the project. It describes the goals, the full concept of the game, the business strategy, the client, and the project team.

- The log-in module of the game. People can either enter the game as a guest (one-time player) or log-in with a chosen username. Players who enter through their username can track their responses from previous visits in the results map.

- The route selection module of the game page. Players are asked to choose three routes they are most familiar with by typing the route short name (e.g., 11A). The subsequent questions will be based on their selections. The text box has autocomplete function. Players can also pick random routes to explore new areas. By clicking on the Twitter icon, people can share our app with their friends.

- Route verification module of the game page. Randomly selected route segments are shown on the map. The player can choose “yes”, “no”, or “skip” to verify the accuracy of the segments.

- Each round contains three questions and this is the second question of the round. The player can click on the stop to get more detailed information (e.g., stop name, route direction, etc)

- After one round of the game, the game end module will appear, showing responses from other users as well as the player’s contributions. The module also summarizes the total submissions of the player. The player can opt to play another round or select different routes to play.

- People can also directly access the result map through the menu.The web-app is also compatible with mobile phone and tablet browsers.

# App Tool
- Homapge using bootstrap template
- Web mapping and game function realized by Javascript (game2.js; result.js)
- Back-end database using CartoDB

# People
This web app is developed by Jintai Li, Emily Long, and Menghan Li at a MIT course Crowdsource City (Sprint 2016) taughted by Sarah Williams. The existing matatu routes and stops database is provided by Digial Matatu.