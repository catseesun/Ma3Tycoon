/******************************************************************
This script realizes the game function:
1) randomly pick up stops for verification and visualize them on the map
2) writie users' verification info into cartodb database
*******************************************************************/

// Create variable to hold map element, give initial settings to map
 // var map = L.map('mapscreen',{ center: [-1.292651, 36.820464], zoom: 13})
// Add OpenStreetMap tile layer to map element
 // L.tileLayer('http://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', { attribution: '&copy; <a href="http://maps.stamen.com/#toner/12/37.7706/-122.3782">Stamen</a>' }).addTo(map);

// <script src="//code.jquery.com/ui/1.11.4/jquery-ui.js"></script> <!-- jQueryUI v1.11.4 JS -->

// define random map center to show different stops
$('#route_input').hide();
$('#startbutton').hide();
$("#mapscreen").hide();
$("#mapresult").hide();
$("#qa").hide();
$("#qabuttons").hide();
$("#right").hide();
$('#restartbutton').hide();
$('#reselectbutton').hide();

var login;
var userDevice;
var ipadd;

function login_fun(){
  userDevice = navigator.userAgent;
  $.getJSON("https://api.ipify.org?format=json",
    function(json) {
      ipadd = json.ip;
    }
  );
  login = document.getElementById("login_input").value;
  login = $.map(login.split('\n'), function(value, index) {
      return value.toLowerCase().replace(/\s+/g, '');
  }).toString();

  if (login == "") {
    alert("Please enter your user name!");
  } else {
    saveData(login)
    $('#login_cred').hide();
    $('#route_input').show();
    $('#startbutton').show();
  };

}

function guest(){
  userDevice = navigator.userAgent;
  $.getJSON("https://api.ipify.org?format=json",
    function(json) {
      ipadd = json.ip;
    }
  ); 
  login = "temp" + new Date().getTime();
  $('#login_cred').hide();
  $('#route_input').show();
  $('#startbutton').show();
  saveData(login)
}

function saveData(login) {
   var account = {
     User: login
   };
   //converts to JSON string the Object
   account = JSON.stringify(account);
   //creates a base-64 encoded ASCII string
   account = btoa(account);
   //save the encoded accout to web storage
   localStorage.setItem('_account', account);
}

var Tstart;
var Tload;
var route_name1;
var route_name2;
var route_name3;
var nrow;
var rand1;
var numGroup;
var center_lon;
var center_lat;
var zoomlevel=14;

var sqlQuerycenters;
var sqlQueryroutes;
var sqlQuerystops;
var userPack;

var Buffer_locations = null
var legend_q = null


// Set CartoDB Username
var cartoDBUserName = "ma3tycoon";
var data_user = null

var availableRoutes = [];
var RoutesPack;
//var RoutesPack1;

$.get( "https://"+cartoDBUserName+".cartodb.com/api/v2/sql?format=JSON&q=SELECT rt_shrt_nm FROM matatu_routes" ).done(function(data) {
  RoutesPack = data.rows;
  var n = RoutesPack.length;
  for (var prop in RoutesPack) {
    availableRoutes.push(RoutesPack[prop].rt_shrt_nm);
  }
})
.fail(function(){
  window.alert("Whoops database connection problem! Please try again later.");
});

$(function() {

  $( "#route1_input" ).autocomplete({
    source: availableRoutes
  });  
  $( "#route2_input" ).autocomplete({
    source: availableRoutes
  });  
  $( "#route3_input" ).autocomplete({
    source: availableRoutes
  });
   $("#cover").hide();
});

function randomroute(num) {
  var n = Math.floor((Math.random() * availableRoutes.length));
  document.getElementById("route"+num+"_input").value = availableRoutes[n];
}

function checkStart(){
  document.getElementById('route1_input').style.borderColor = "#CCCCCC";
  document.getElementById('route2_input').style.borderColor = "#CCCCCC";
  document.getElementById('route3_input').style.borderColor = "#CCCCCC";

  route_name1 = document.getElementById("route1_input").value;
  route_name2 = document.getElementById("route2_input").value;
  route_name3 = document.getElementById("route3_input").value;

  if ( $.inArray(route_name1, availableRoutes) < 0 ) {
    alert("The first route you entered is not valid! Please select from suggestions!");
    document.getElementById('route1_input').style.borderColor = "red";
  } else {
    if ( $.inArray(route_name2, availableRoutes) < 0 ) {
      alert("The second route you entered is not valid! Please select from suggestions!");
          document.getElementById('route2_input').style.borderColor = "red";
    } else {
      if ( $.inArray(route_name3, availableRoutes) < 0 ) {
        alert("The third route you entered is not valid! Please select from suggestions!");
            document.getElementById('route3_input').style.borderColor = "red";
    } else {
        sqlQuerycenters = "SELECT r_route_id, groups, AVG(stop_lon) AS center_lon, AVG(stop_lat) AS center_lat FROM stops_routes2 WHERE Route_short_name = '" + route_name1 +"' OR Route_short_name = '" + route_name2 +"' OR Route_short_name = '" + route_name3 +"' GROUP BY groups, r_route_id"

        startGame();
    }
  }
}
}

function determineGroup() {
  Tload = new Date().getTime();
   $.ajax(
   {
     //url: "https://"+cartoDBUserName+".cartodb.com/api/v2/sql?q="+sqlQuerycenters,
     url: "https://"+cartoDBUserName+".cartodb.com/api/v2/sql?q="+sqlQuerycenters,
     // https://ma3tycoon.cartodb.com/api/v2/sql?q=SELECT S2.* FROM Routes R, Trips_1d T, Stop_times_1d_labeled S1, Stop_group_1d S2 WHERE R.Route_id = T.Route_id AND T.Trip_id = S1.Trip_id AND S1.groups = S2.groups AND R.Route_short_name = '1'
   
     dataType: "json",
     async: false,
     success: function(data)
     {
       nrow = data.rows.length
       rand1 = Math.floor((Math.random() * nrow));
       center_lon = data.rows[rand1].center_lon;
       center_lat = data.rows[rand1].center_lat;
       numGroup = data.rows[rand1].groups;
       route = data.rows[rand1].r_route_id;
       sqlQueryroutes = "SELECT l.* FROM matatu_routes l, stops_routes2 s WHERE l.route_id = s.r_route_id AND l.route_id = '" + route + "'";
       // matatu_routes l, stops_routes2 s WHERE l.route_id = s.route_id
       // nairobi_gtfs_lines_v5

       sqlQuerystops = "SELECT * FROM stops_routes2 WHERE groups = '" + numGroup +"'";

       // console.log("Group:", numGroup)
       // console.log("route:", route)
       // console.log("random:",rand1)
       // console.log("long:", center_lon)
       // console.log("lat:", center_lat)
       
     }
   });

 }

   // show the map
   var map;
   function init(){
     map = L.map('mapscreen',{ center: [center_lat, center_lon], zoom: zoomlevel});
     //var map = L.map('map',{ center: [-1.27559675, 36.822872], zoom: 13});
   
     // Add Tile Layer basemap
     L.tileLayer('http://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
       attribution: '&copy; <a href="https://cartodb.com/attributions/">CartoDB</a>'
     }).addTo(map);

     L.control.scale({position: 'bottomleft'}).addTo(map);
   }
   
  var lineStyle1 = {
    "color": "#18bc9c"
  };

var dispRoute;
var dispStops;
       // Function to add call coffee shops
   // Get CartoDB selection as GeoJSON and Add to Map
   function showRoutes(){
     $.getJSON("https://"+cartoDBUserName+".cartodb.com/api/v2/sql?format=GeoJSON&q="+sqlQueryroutes, function(routes) {
       Routes_locations = L.geoJson(routes,{
         onEachFeature: function (feature, layer) {
           layer.bindPopup('<p><b>' + "Route: " + feature.properties.rt_shrt_nm + '</em></p>');
           layer.cartodb_id=feature.properties.cartodb_id;
         },
         style: lineStyle1
       }).addTo(map);
      dispRoute = routes.features[0].properties.rt_shrt_nm;
      document.getElementById('qatext').innerHTML = "Are these " + dispStops + " stops shown on Route " + dispRoute + " correct?";
     });
   };
   
   function showStops(){
     $.getJSON("https://"+cartoDBUserName+".cartodb.com/api/v2/sql?format=GeoJSON&q="+sqlQuerystops, function(stops) {
       // https://ma3tycoon.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT S2.stop_name, R.Route_short_name FROM stops2 S2, stop_times_1d_labeled S1, Trips_1d T, Routes R WHERE R.Route_id = T.Route_id AND T.Trip_id = S1.Trip_id AND S1.Stop_id = S2.Stop_id
   
       Stops_locations = L.geoJson(stops,{
         onEachFeature: function (feature, layer) {
           layer.bindPopup('<p><b>' + feature.properties.stop_name + '</b><br /><em>' + "Route " + feature.properties.route_short_name + ': ' +feature.properties.route_desc + '</em></p>');
           layer.cartodb_id=feature.properties.cartodb_id;
         }
       }).addTo(map);
      dispStops = stops.features.length;
      document.getElementById('qatext').innerHTML = "Are these " + dispStops + " stops shown on Route " + dispRoute + " correct?";
     });
   };
   
   // Run showAll function automatically when document loads

var numRound = 3;
var i;
   
function startGame(){
  i = numRound;
  $("#route_input").fadeOut(fadeTime);
  $("#startbutton").fadeOut(fadeTime);
  setTimeout(function(){

    $("#mapscreen").show();
    $("#right").show();
    $("#qa").show();
    $("#qabuttons").show();

    $("#bottom").show();
    $("#confirmFeedback").hide();

    determineGroup();
    init();
    addlegend_q();
    showRoutes();
    showStops();
    document.getElementById("numQa").innerHTML = "Question " + (numRound-i+1) + "/" + numRound;
    Tstart = new Date().getTime();

  },
  1000)

}


var feedbackTable="user_feedback2"
var apiKey="85b095b690a9ac514199e4532882c295636dbd0d"
var restartDelay = 1000
var fadeTime = "slow"

function sendYes() {
  $("#qa").hide();
  $("#nobutton").fadeOut(fadeTime);
  $("#skipbutton").fadeOut(fadeTime);
  $("#confirmFeedback").fadeIn(fadeTime);
  document.getElementById("yesbutton").disabled = true;
  document.getElementById("nobutton").disabled = true;
  document.getElementById("skipbutton").disabled = true;
	
  $.get( "https://ma3tycoon.cartodb.com/api/v2/sql?q=INSERT INTO "+feedbackTable+" (time,t_round,t_load,feedback_yes,feedback_no,feedback_skip,groupid,username,device,ip_add) VALUES ('"+new Date().getTime()+"',"+(new Date().getTime()-Tstart)+","+(Tstart-Tload)+",1, 0, 0, '"+numGroup+"','"+login+"','"+userDevice+"','"+ipadd+"')&api_key="+apiKey );

	setTimeout(function() {
    determineStop();
    document.getElementById("yesbutton").disabled = false;
    document.getElementById("nobutton").disabled = false;
    document.getElementById("skipbutton").disabled = false;
  }, restartDelay);

	}

function sendNo() {
  $("#qa").hide();
	$("#yesbutton").fadeOut(fadeTime);
  $("#skipbutton").fadeOut(fadeTime);
  $("#confirmFeedback").fadeIn(fadeTime);
  document.getElementById("yesbutton").disabled = true;
  document.getElementById("nobutton").disabled = true;
  document.getElementById("skipbutton").disabled = true;

  $.get( "https://ma3tycoon.cartodb.com/api/v2/sql?q=INSERT INTO "+feedbackTable+" (time,t_round,t_load,feedback_yes,feedback_no,feedback_skip,groupid,username,device,ip_add) VALUES ('"+new Date().getTime()+"',"+(new Date().getTime()-Tstart)+","+(Tstart-Tload)+",0, 1, 0, '"+numGroup+"','"+login+"','"+userDevice+"','"+ipadd+"')&api_key="+apiKey );

	setTimeout(function() {
    determineStop();
    document.getElementById("yesbutton").disabled = false;
    document.getElementById("nobutton").disabled = false;
    document.getElementById("skipbutton").disabled = false;
  }, restartDelay);

	}

function sendSkip() {
	$("#qa").hide();
  $("#nobutton").fadeOut(fadeTime);
  $("#yesbutton").fadeOut(fadeTime);
  $("#confirmFeedback").fadeIn(fadeTime); 
  document.getElementById("yesbutton").disabled = true;
  document.getElementById("nobutton").disabled = true;
  document.getElementById("skipbutton").disabled = true;

  $.get( "https://ma3tycoon.cartodb.com/api/v2/sql?q=INSERT INTO "+feedbackTable+" (time,t_round,t_load,feedback_yes,feedback_no,feedback_skip,groupid,username,device,ip_add) VALUES ('"+new Date().getTime()+"',"+(new Date().getTime()-Tstart)+","+(Tstart-Tload)+",0, 0, 1, '"+numGroup+"','"+login+"','"+userDevice+"','"+ipadd+"')&api_key="+apiKey );

	setTimeout(function() {
    determineStop();
    document.getElementById("yesbutton").disabled = false;
    document.getElementById("nobutton").disabled = false;
    document.getElementById("skipbutton").disabled = false;
  }, restartDelay);

	}

function restartQa() {
  map.removeLayer(Routes_locations);
  map.removeLayer(Stops_locations);
  if (Buffer_locations){
    map.removeLayer(Buffer_locations);
    map.removeLayer(Inputs_locations);

  }
  if (legend){
    legend.removeFrom(map);
    legend=null;
  }


  determineGroup();
  map.setView(new L.LatLng(center_lat, center_lon), zoom=zoomlevel);
  showRoutes();
  showStops();

  $("#qa").show();
  $("#yesbutton").show();
  $("#nobutton").show();
  $("#skipbutton").show();
  $("#confirmFeedback").hide();
  document.getElementById("numQa").innerHTML = "Question " + (numRound-i+1) + "/" + numRound;
  Tstart = new Date().getTime();


}

function determineStop() {
  i -= 1;

  if (i < 1) {

    summaryUser();

    $("#mapscreen").show();
    $("#right").hide();
    $("#bottom").hide();
    $("#confirmFeedback").hide();
    $("#confirmFeedback").hide();
    $('#numQa').hide();


    $("#restartbutton").show();
    $("#reselectbutton").show();
  } else {
    restartQa();
  }
}

function restartRound() {
  i = numRound;
  map.removeLayer(Routes_locations);
  map.removeLayer(Stops_locations);
  if (Buffer_locations){
    map.removeLayer(Buffer_locations);
    map.removeLayer(Inputs_locations);
  }
  if (legend){
    legend.removeFrom(map);
    legend=null;
  }

  $("#restartbutton").hide();
  $("#reselectbutton").hide();
  $('#numQa').show();
  $("#mapscreen").show();
  $("#right").show();
  $("#qa").show();
  $("#qabuttons").show();
  $("#yesbutton").show();
  $("#nobutton").show();
  $("#skipbutton").show();

  $("#bottom").show();
  $("#confirmFeedback").hide();
  $("#user_summary").hide();

  determineGroup();
  map.setView(new L.LatLng(center_lat, center_lon), zoom=zoomlevel);
  addlegend_q();
  showRoutes();
  showStops();
  document.getElementById("numQa").innerHTML = "Question " + (numRound-i+1) + "/" + numRound;
  Tstart = new Date().getTime();

}

// feedback map

var legend = null;

var sqlQuerygroup = "SELECT g.the_geom, s.route_short_name, g.groups, g.center_lat, g.center_lon, SUM(f.feedback_yes) AS num_yes, SUM(f.feedback_no) AS num_no, CASE WHEN SUM(f.feedback_no) <>0 THEN (SUM(f.feedback_yes)/SUM(f.feedback_no) ) ELSE 5 END AS ryes From " + feedbackTable +" f, stop_group_1d_copy g, stops_routes2 s WHERE f.groupid=g.groups AND s.groups = g.groups GROUP BY s.route_short_name, g.the_geom, g.groups, g.center_lat, g.center_lon HAVING SUM(f.feedback_yes)  > 0 OR SUM(f.feedback_no)  > 0"

// var sqlQueryinputs = "SELECT g.* FROM stop_group_1d g, "+ feedbackTable +" f WHERE f.groupid=g.groups AND f.username = '"+login+ "' AND f.feedback_skip = 0"


// var sqlQueryallroutes = "SELECT l.* FROM matatu_routes l, stops_routes2 s WHERE l.route_id = s.r_route_id"
 var sqlQueryallroutes = "SELECT l.* FROM matatu_routes l";

 var lineStyle_all = {
   "color": "#827B60",
   "weight": 1.5,
   "opacity": 0.6
 };

function summaryUser() {
    $.get( "https://ma3tycoon.cartodb.com/api/v2/sql?q=SELECT feedback_yes,feedback_no,feedback_skip FROM "+feedbackTable+" WHERE username='"+login+"'" ).done(
      function(data){
        userPack = data;
        var nYes = 0;
        var nNo = 0;
        var nSkip = 0;
        for (var prop in userPack.rows) {
          nYes += userPack.rows[prop].feedback_yes;
          nNo += userPack.rows[prop].feedback_no;
          nSkip += userPack.rows[prop].feedback_skip;

        }
        document.getElementById("user_summary").innerHTML = "Questions you answered in total: <b>"+userPack.rows.length+".</b><br>Yes submitted: <b>"+nYes+"</b>; No submitted: <b>"+nNo+"</b>.";
        $("#user_summary").show();

      });
        map.removeLayer(Routes_locations);
        map.removeLayer(Stops_locations);
        if (Buffer_locations){
          map.removeLayer(Buffer_locations);
          map.removeLayer(Inputs_locations);
          //$("#legend").hide();
        }
        if (legend){
          legend.removeFrom(map);
          legend=null;
        }
        if (legend_q){
          legend_q.removeFrom(map);
          legend_q=null;
        }
        map.setView(new L.LatLng(-1.27559675, 36.822872), zoom=12);

        addlegend()
        showAllRoutes();
        showGroups();
        showInputs();

        $("#mapscreen").show();
}


function setColor(density){ // density=ryes
  return density > 8/2 ? '#18bc9c' : // yes > 80% 
         density > 6/4 ? '#8BB381' : //yes > 60%
         density > 4/6 ? '#EDE275' : //yes > 40%
         density > 2/8 ? '#EDDA74' : // yes > 20%
         density >= 0 ? '#FFA62F' : // yes > 0%
                         '#5E7D7E'; 
};

function style(feature) {
    return {
        fillColor: setColor(feature.properties.ryes),
        fillOpacity: 0.7,
        weight: 0,
        opacity: 1,
        color: '#ffffff',
        dashArray: '3'
    };
}


// add legend to the feedback map
function addlegend(){

 // Create Leaflet Control Object for Legend
  legend = L.control({position: 'topright'});
  legend.onAdd = function (map) {

    // Create Div Element and Populate it with HTML
    var div = L.DomUtil.create('div', 'legend');        
    div.innerHTML += '<b>Map Accuracy</b><br />';
    div.innerHTML += 'by Users\' Inputs<br />';
    div.innerHTML += '<br /><img src="img/blue_icon.png"> Your inputs!</br>';
    div.innerHTML += '<b> </b><br />';
    div.innerHTML += '<i style="background: #18bc9c"></i><p>80-100%</p>';
    div.innerHTML += '<i style="background: #8BB381"></i><p>60-80%</p>';
    div.innerHTML += '<i style="background: #EDE275"></i><p>40-60%</p>';
    div.innerHTML += '<i style="background: #EDDA74"></i><p>20-40%</p>';
    div.innerHTML += '<i style="background: #FFA62F"></i><p>0-20%</p>';


    // Return the Legend div containing the HTML content
    return div;
  }
  legend.addTo(map);
}

// add legend to the question map
function addlegend_q(){

 // Create Leaflet Control Object for Legend
  legend_q = L.control({position: 'topright'});
  legend_q.onAdd = function (map) {

    // Create Div Element and Populate it with HTML
    var div = L.DomUtil.create('div', 'legend');        
    div.innerHTML += '<b>Click on me!</b><br />';
    div.innerHTML += '<br /><img src="img/blue_icon.png"> Stop</br>';
    div.innerHTML += '<b> </b><br />';

    // Return the Legend div containing the HTML content
    return div;
  }
  legend_q.addTo(map);
}


// Get CartoDB group selection as GeoJSON and Add to Map
function showGroups(){
 $.getJSON("https://"+cartoDBUserName+".cartodb.com/api/v2/sql?format=GeoJSON&q="+sqlQuerygroup, function(buffer) {
   Buffer_locations = L.geoJson(buffer,{
     onEachFeature: function (feature, layer) {
       layer.bindPopup('<p><b>' + "Route " + feature.properties.route_short_name + " Segments"  + '</b><br /><em>' + "'Yes' Answers: " + feature.properties.num_yes + '<br /><em>' + "'No' Answers: " + feature.properties.num_no + '</em></p>');
       layer.cartodb_id=feature.properties.cartodb_id;
     },
     style: style
   }).addTo(map);
 });
}

function showInputs(){
 $.getJSON("https://"+cartoDBUserName+".cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT g.* FROM stop_group_1d g, "+ feedbackTable +" f WHERE f.groupid=g.groups AND f.username = '"+login+ "' AND f.feedback_skip = 0", function(inputs) {
   Inputs_locations = L.geoJson(inputs,{
     onEachFeature: function (feature, layer) {
       layer.bindPopup('<p><em>' + "Your awesome inputs!" +'</em></p>');
       layer.cartodb_id=feature.properties.cartodb_id;
     },
   }).addTo(map);
 });
}


function showAllRoutes(){
 $.getJSON("https://"+cartoDBUserName+".cartodb.com/api/v2/sql?format=GeoJSON&q="+sqlQueryallroutes, function(routes) {
   Routes_locations = L.geoJson(routes,{
     onEachFeature: function (feature, layer) {
       layer.bindPopup('<p><b>' + "Route: " + feature.properties.rt_shrt_nm + '</em></p>');
       layer.cartodb_id=feature.properties.cartodb_id;
     },
     style:lineStyle_all
   }).addTo(map);
 });
}

// https://ma3tycoon.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT g.* FROM stop_group_1d g, user_feedback2 f WHERE f.groupid=g.groups AND f.username = 'ma3tycoon@gmail.com' AND f.feedback_skip = 0

