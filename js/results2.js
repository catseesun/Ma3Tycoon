/************************************************************
This script visualizes the up-to-date verification results 
on an interactive map, from both this player and all other players
*************************************************************/

var cartoDBUserName = "ma3tycoon";
var feedbackTable="user_feedback2"

// load login username to select the points
function loadData() {
   var account = localStorage.getItem('_account');
   if (!account) return false;
   localStorage.removeItem('_account');
   //decodes a string data encoded using base-64
   account = atob(account);
   //parses to Object the JSON string
   account = JSON.parse(account);
   //do what you need with the Object
   return account.User;
   // return true;
}

var user = loadData()



console.log(user)

var sqlQuerygroup = "SELECT g.the_geom, s.route_short_name, g.groups, g.center_lat, g.center_lon, n.num_stop_1g, SUM(f.feedback_yes)/n.num_stop_1g AS num_yes, SUM(f.feedback_no)/n.num_stop_1g AS num_no, CASE WHEN SUM(f.feedback_no) <>0 THEN (SUM(f.feedback_yes)/SUM(f.feedback_no) ) ELSE 5 END AS ryes From "+ feedbackTable +" f, stop_group_1d_copy g, stops_routes2 s, num_stop_1g n WHERE f.groupid=g.groups AND s.groups = g.groups AND s.groups = n.groups GROUP BY s.route_short_name, g.the_geom, g.groups, g.center_lat, g.center_lon, n.num_stop_1g HAVING SUM(f.feedback_yes)  > 0 OR SUM(f.feedback_no)  > 0 "

var sqlQueryinputs = "SELECT g.* FROM stop_group_1d g, "+ feedbackTable +" f WHERE f.groupid=g.groups AND f.username = '" + user + "' AND f.feedback_skip = 0"

var sqlQueryallroutes = "SELECT l.* FROM matatu_routes l"


 var lineStyle = {
   "color": "#827B60",
   "weight": 1.5, //3,
   "opacity": 0.6 //0.4
 };

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

// show the map
function init(){
  map = new L.map('mapresult',{ center: [-1.27559675, 36.822872], zoom: 12});
 //var map = L.map('map',{ center: [-1.27559675, 36.822872], zoom: 13});

 // Add Tile Layer basemap
 L.tileLayer('http://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
   attribution: '&copy; <a href="https://cartodb.com/attributions/">CartoDB</a>'
 }).addTo(map);

 // add scale
 L.control.scale({position: 'bottomleft'}).addTo(map);

 // Create Leaflet Control Object for Legend
  var legend = L.control({position: 'topright'});
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
  };

  // Add Legend to Map
  legend.addTo(map);

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
};

function showInputs(){
 $.getJSON("https://"+cartoDBUserName+".cartodb.com/api/v2/sql?format=GeoJSON&q="+sqlQueryinputs, function(inputs) {
   Buffer_locations = L.geoJson(inputs,{
     onEachFeature: function (feature, layer) {
       layer.bindPopup('<p><em>' + "Your awesome inputs!" +'</em></p>');
       layer.cartodb_id=feature.properties.cartodb_id;
     },
   }).addTo(map);
 });
};


function showAllRoutes(){
 $.getJSON("https://"+cartoDBUserName+".cartodb.com/api/v2/sql?format=GeoJSON&q="+sqlQueryallroutes, function(routes) {
   Routes_locations = L.geoJson(routes,{
     onEachFeature: function (feature, layer) {
       layer.bindPopup('<p><b>' + "Route: " + feature.properties.rt_shrt_nm + '</em></p>');
       layer.cartodb_id=feature.properties.cartodb_id;
     },
     style:lineStyle
   }).addTo(map);
 });
};

// Run showAll function automatically when document loads
 init();
$( document ).ready(function() {

 showAllRoutes()
// showCorrect()
// showWrong()
 showGroups()
 showInputs()


});





//https://ma3tycoon.cartodb.com/api/v2/sql?q=SELECT g.the_geom, g.groups, g.center_lat, g.center_lon, SUM(f.feedback_yes) AS num_yes, SUM(f.feedback_no) AS num_no, CASE WHEN SUM(f.feedback_no) <>0 THEN (SUM(f.feedback_yes)/SUM(f.feedback_no)) ELSE 0 END AS ryes From user_feedback2 f, stop_group_1d_copy g WHERE f.groupid=g.groups GROUP BY g.the_geom, g.groups, g.center_lat, g.center_lon
