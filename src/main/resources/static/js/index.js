var canvas = document.getElementById("map");
var width = 1000;
var currWidth = 1000;
var height = 500;
var currHeight = 500;
canvas.width  = width;
canvas.height = height;
var isDown = false;
var x = 0;
var y = 0;
var tempTLX;
var currMouseX;
var currMouseY;
var tempTLY;
var returnedObject;
var z = 1;
var botLeft = [0,0];
var dragged = false;
var lastDownTarget;
var scale = 1;
var scale2 = 1;
var maxScale = 10;
var minScale = 0.07;

var maxLineWidth = 5;
var minLineWidth = 1;
var lineWidth = maxLineWidth;


var center = [41.8268,-71.4022];
var topLPoint = [center[0] + 0.0011, center[1] - 0.0022];
var botRPoint = [center[0] - 0.0011, center[1] + 0.0022];
var currTLCoord = topLPoint;
var currBRCoord = botRPoint;
var coordHeight = topLPoint[0] - botRPoint[0];
var currCoordHeight = topLPoint[0] - botRPoint[0];
var coordWidth = botRPoint[1] - topLPoint[1];
var currCoordWidth = botRPoint[1] - topLPoint[1];
var tileSize = 0.002;
var cache = [];
var delta = 0.0004; // has to be smaller than tileSize
var cacheArr = [];
var toGet = new Object();
var xChange;
var yChange;
var zoom = 1;
var posn1 = null;
var posn2 = null;

var path = null;

var ctx = canvas.getContext("2d");


$(document).ready(function() {
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	getTiles();
	document.addEventListener("mousedown", down, false);
	document.addEventListener("mousemove", move, false);
	document.addEventListener("mouseup", up, false);
	document.addEventListener("mousewheel", wheel, false);
});

function wheel(event) {
  event.preventDefault();
    var wheel = event.wheelDelta/120;//n or -n

    zoom = 1 + wheel/2;
    var oldScale = scale;
    scale *= zoom;
    if(scale > maxScale) {
     scale = maxScale;
   }
   if(scale < minScale) {
     scale = minScale;
   }
   if (scale < 1) {
     lineWidth = maxLineWidth - (maxLineWidth - minLineWidth) * ((1-scale)/(1-minScale));
   } else {
     lineWidth = maxLineWidth;
   }
   scaleMap();
 }


 function down(event) {
   lastDownTarget = event.target;
   console.log("hello");
   isDown = true;
   x = event.clientX; 
   y = event.clientY;
 }

 function move(event) {
  if (isDown && lastDownTarget == canvas) {
   xChange = event.clientX - x;
   yChange = event.clientY - y;
   var xOffset = xChange;
   var yOffset = yChange;
   ctx.clearRect(0,0,canvas.width,canvas.height);
   drawPath(xOffset, yOffset);
   drawCache(xOffset, yOffset);
   drawDots(xOffset, yOffset);
   dragged = true;
 }
 currMouseX = event.clientX;
 currMouseY = event.clientY;
}


function up(event) {
  if (isDown)
  {   
    isDown = false;
    if (dragged){ 
      moveMap((event.clientX - x), (event.clientY - y));
      dragged = false;
    } else {
    	makeDots();
    	drawDots(0,0);
    }
  }
}

function mouseToLatLong(xy){
  var lat = currTLCoord[0] - (xy[1] - canvas.offsetTop)/height * currCoordHeight;
  var lng = (xy[0] - canvas.offsetLeft)/width * currCoordWidth + currTLCoord[1];
  return [lat,lng];
}

function makeDots(){
  var coord = mouseToLatLong([currMouseX, currMouseY]);
  var lat = coord[0];
  var lng = coord[1];
  if (posn1 == null) {
   posn1 = {lat: lat, lng: lng, x: currMouseX - canvas.offsetLeft - 7, y: currMouseY - canvas.offsetTop - 7};
 } else if (posn2 == null) {
   posn2 = {lat: lat, lng: lng, x: currMouseX - canvas.offsetLeft - 7, y: currMouseY - canvas.offsetTop - 7};
   getPath();
   drawPath(0,0);
 } 
}

function toLatLong(xy) {
  var ll = [];
  ll[0] = xy[1]/height * currCoordHeight;
  ll[1] = xy[0]/width * currCoordWidth;
  return ll;
}

function moveMap(x, y) {
  var llDiff = toLatLong([x,y]);
  center[0] += llDiff[0];
  center[1] -= llDiff[1];
  currTLCoord[0] += llDiff[0];
  currTLCoord[1] -= llDiff[1];
  currBRCoord[0] += llDiff[0];
  currBRCoord[1] -= llDiff[1];
  if (posn1 != null) {
    posn1.x += x;
    posn1.y += y;
    if (posn2 != null) {
      posn2.x += x;
      posn2.y += y;
    }
  }
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawPath(0, 0);
  drawCache(0, 0);
  drawDots(0,0);
  getTiles();
}

function scaleMap() {
  currCoordHeight = coordHeight/scale;
  currCoordWidth = coordWidth/scale;
  currTLCoord[0] = center[0] + currCoordHeight/2;
  currTLCoord[1] = center[1] - currCoordWidth/2;
  currBRCoord[0] = center[0] - currCoordHeight/2;
  currBRCoord[1] = center[1] + currCoordWidth/2;
  
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawPath(0,0);
  drawCache(0,0);
  drawDots(0,0);
  getTiles();
} 

function drawCache(xOffset, yOffset) {
  console.log('drawing');
  var curBRLat = currBRCoord[0];
  var curTLLng = currTLCoord[1];
  ctx.strokeStyle = "#000000";
  ctx.lineWidth=lineWidth;
  for(j = 0; j < cacheArr.length; j++){
    var roads = cacheArr[j];
    ctx.beginPath();
    for(i = 0; i < roads.length; i++) {
      var startx = Math.floor((roads[i].long1 - currTLCoord[1])/currCoordWidth * width);
      var starty = height - Math.floor((roads[i].lat1 - currBRCoord[0])/currCoordHeight * height);
      var endx = Math.floor((roads[i].long2 - currTLCoord[1])/currCoordWidth * width);
      var endy = height - Math.floor((roads[i].lat2 - currBRCoord[0])/currCoordHeight * height);
      ctx.moveTo(startx + xOffset, starty + yOffset);
      ctx.lineTo(endx + xOffset, endy + yOffset);
    }
    ctx.stroke();
  }

}

function drawDots(xOffset, yOffset) {
  if (posn1 != null) {
    var x = Math.floor((posn1.lng - currTLCoord[1])/currCoordWidth * width);
    var y = height - Math.floor((posn1.lat - currBRCoord[0])/currCoordHeight * height);
    ctx.fillStyle="#0000FF";
    ctx.fillRect(x + xOffset - 7, y + yOffset - 7,10,10);
    if (posn2 != null) {
      var x = Math.floor((posn2.lng - currTLCoord[1])/currCoordWidth * width);
      var y = height - Math.floor((posn2.lat - currBRCoord[0])/currCoordHeight * height);
      ctx.fillStyle="#FF0000";
      ctx.fillRect(x + xOffset - 7, y + yOffset - 7, 10, 10);
    }
  }
}

function drawTile(tile) {
  var curBRLat = currBRCoord[0];
  var curTLLng = currTLCoord[1];
  ctx.strokeStyle = "#000000";
  ctx.lineWidth=lineWidth;
  var roads = tile;
  ctx.beginPath();
  for(i = 0; i < roads.length; i++) {
    var startx = Math.floor((roads[i].long1 - currTLCoord[1])/currCoordWidth * width);
    var starty = height - Math.floor((roads[i].lat1 - currBRCoord[0])/currCoordHeight * height);
    var endx = Math.floor((roads[i].long2 - currTLCoord[1])/currCoordWidth * width);
    var endy = height - Math.floor((roads[i].lat2 - currBRCoord[0])/currCoordHeight * height);
    ctx.moveTo(startx, starty);
    ctx.lineTo(endx, endy);
  }
  ctx.stroke();
}

function getTiles() {
 var latDiff = currTLCoord[0] - topLPoint[0];
 if (latDiff > 0) {
  latOffset = Math.floor(latDiff / tileSize + 1) * tileSize;
} else {
  latOffset = Math.floor(latDiff / tileSize - 1) * tileSize;
}

var lngDiff = currTLCoord[1] - topLPoint[1];
if (lngDiff > 0) {
  lngOffset = Math.floor(lngDiff / tileSize + 1) * tileSize;
} else {
  lngOffset = Math.floor(lngDiff / tileSize - 1) * tileSize;
}

var cornerTLLat = topLPoint[0] - latOffset;
var cornerTLLong = topLPoint[1] + lngOffset;
var curBRLng = currBRCoord[1];
var curBRLat = currBRCoord[0];

var tile = [];
var toGet = [];
var toGetStr = "";
var cachedTiles = [];
var cachedTilesCounter = 0;
var toGetCounter = 0;
console.log("tileSize: " + tileSize);
console.log("cornerTLLong: " + cornerTLLong);
console.log("cornerTLLat: " + cornerTLLat);
console.log("curBRLat: " + curBRLat);
console.log("curBRLng: " + curBRLng);
for(i = cornerTLLong; i < curBRLng; i = i + tileSize){
  for(j = cornerTLLat; j > curBRLat; j = j - tileSize){
    console.log('tile stuff: ' + i + "," + j);
    var isCached = false;
    for(k = 0; k < cache.length; k++) {
     if (Math.abs(cache[k].i-i) < delta && Math.abs(cache[k].j-j) < delta) {
       isCached = true;
       break;
     }
   }

   cache.push({i:i,j:j});
   var postParameters = {lat: j, long: i, tileSize: tileSize};
   $.post("/update", postParameters,  function(responseJSON){
    returnedObject = (JSON.parse(responseJSON));
    tile = returnedObject.tile;
    drawTile(tile);
    cacheArr.push(tile);
  });
 }
}
}
function getPath() {
  if (posn1 != null && posn2 != null){
    var postParameters = {lat1:posn1.lat, long1:posn1.lng,lat2:posn2.lat, long2:posn2.lng};
    var nodes = [];
    $.post("/shortestPath", postParameters,  function(responseJSON){
      returnedObject = (JSON.parse(responseJSON));
      nodes = returnedObject;
      console.log(nodes);
      drawPath(0,0);
    });
  }
  path = [{lat:41.8272677,lon:-71.4037957},{lat:41.8272624,lon:-71.4038652},{lat:41.827204,lon:-71.4037869},{lat:41.8272055,lon:-71.4037677}];
}

function drawPath(xOffset, yOffset) {
  if (path != null) {
    ctx.strokeStyle = "#72E5BE";
    ctx.lineWidth=lineWidth + 5;
    var posn1x = Math.floor((posn1.lng - currTLCoord[1])/currCoordWidth * width);
    var posn1y = height - Math.floor((posn1.lat - currBRCoord[0])/currCoordHeight * height);
    ctx.beginPath();
    ctx.moveTo(posn1x + xOffset, posn1y + yOffset);
    for (i = 0; i < path.length; i++){
      var x = Math.floor((path[i].lon - currTLCoord[1])/currCoordWidth * width);
      var y = height - Math.floor((path[i].lat - currBRCoord[0])/currCoordHeight * height);
      ctx.lineTo(x + xOffset, y + yOffset);
    }
    var posn2x = Math.floor((posn2.lng - currTLCoord[1])/currCoordWidth * width);
    var posn2y = height - Math.floor((posn2.lat - currBRCoord[0])/currCoordHeight * height);
    ctx.lineTo(posn2x + xOffset, posn2y + yOffset);
    ctx.stroke();
  }
}
