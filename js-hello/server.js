

// code to controll RGB Led

'use strict';

const five = require('johnny-five');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

var anglea = 0;
var angleb = 0;

var GestureEnum = {"unavaliable":0, "swipeUp":1, "swipeDown":2,}

let led = null;

var avaliableServoActionNums = 0; // max 4
var currentGesture = GestureEnum.unavaliable;  // 0: inactiev  1: swipe up 2: swipe down

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res, next) {
  res.sendFile(__dirname + '/index.html')
});

five.Board().on('ready', function() {
  console.log('Arduino is ready.');

  var a = new five.Servo(9);
  var b= new five.Servo(10);
  var servos = new five.Servos([a, b]);
  let initialPosition = [90, 40];
  moveToTargetPosition(a, initialPosition[0]);
  moveToTargetPosition(b, initialPosition[1]);
  a.on('move:complete', servoAFinishHandler);
  b.on('move:complete', servoBFinishHandler);

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}

function getTargetPositions(avaliableServoActionNums) {
  // NOTE: return [a_target_position, b_target_position]
  if (currentGesture === GestureEnum.unavaliable) {
    return [0, 0];
  } else if (currentGesture === GestureEnum.swipeUp) {
    switch (avaliableServoActionNums) {
      case 4:
        return [initialPosition[0] + 20, initialPosition[1]];
        break;
      case 3:
        return [initialPosition[0] + 20, initialPosition[1] + 20];
        break;
      case 2:
        return [initialPosition[0], initialPosition[1] + 20];
        break;
      case 1:
        return initialPosition;
        break;
      default:
        return initialPosition;
    }
  } else if (currentGesture === GestureEnum.swipeDown) {
    switch (avaliableServoActionNums) {
      case 4:
        return [initialPosition[0] + 20, initialPosition[1]];
        break;
      case 3:
        return [initialPosition[0] + 20, initialPosition[1] - 20];
        break;
      case 2:
        return [initialPosition[0], initialPosition[1] - 20];
        break;
      case 1:
        return initialPosition;
        break;
      default:
        return initialPosition;
    }
  }
}

function moveToTargetPosition(servor, position) {
  var sevorName = 'unKnown'
  if (servor == a) {
    sevorName = 'a'
  } else if (servor == b) {
    sevorName = 'b'
  }
  console.log(`moving servor`, sevorName, `to position`, position);
  servor.to(position, 500);

  avaliableServoActionNums -=1;
}

function servoAFinishHandler(){
  if (avaliableServoActionNums > 0) {
    let bTargetPosition = getTargetPositions(avaliableServoActionNums)[1];
    moveToTargetPosition(b, bTargetPosition);
  }
}

function servoBFinishHandler() {
  if (avaliableServoActionNums > 0) {
    let aTargetPosition = getTargetPositions(avaliableServoActionNums)[0];
    moveToTargetPosition(a, aTargetPosition);
  }
}

function swipTest(direction) {
  console.log('swipe test');
  avaliableServoActionNums = 4;
  currentGesture = direction;
  let aTargetPosition = getTargetPositions(avaliableServoActionNums)[0];
  moveToTargetPosition(a, aTargetPosition);
}

// Listen to the web socket connection
io.on('connection', function(client) {
  // client.on('triggerservo', function() {
  //   console.log("test success")
  //   servo.sweep({
  //     range: [45, 135],
  //     step: 10
  //   });
  // });
  console.log("client connected");

 // NOTE: can't trigger swipeUp & swipeDown together. need to syncronouse swiping down & up together

 //  swipTest(GestureEnum.swipeUp);
  swipTest(GestureEnum.swipeDown);

  client.on('NoseUp',function(){
    console.log("I am server, Nose Up");
    console.log(anglea);
    // a.to(90, 500);
    // a.to(180, 500);
    // a.to(90, 500);
    a.to(anglea+180, 500);
    switch (anglea) {
      case 0:
        anglea = -180;
        console.log(anglea);
        break;
      case -180:
        anglea = 0
        console.log(anglea);
    }

    // b.to(angleb+20, 500);
    // switch (angleb) {
    //   case 0:
    //     angleb = -20;
    //     break;
    //   case -20:
    //     angleb = 0
    // }



    //a.to(90, 500);
    //a.sweep()

    // servos.min();


    // servo2.to(20);
    // servo1.home();
    // servo2.home();
  });

  //
  // client.on('WristCross',function(){
  //   console.log("I am server, Wrist Cross");
  //   servo.sweep({
  //     range: [45, 135],
  //     step: -10
  //   });
  // });
  //
  // client.on('WristLeft',function(){
  //   console.log("I am server, Wrist Left");
  //   servo.sweep({
  //     range: [45, 135],
  //     step: 10
  //   });
  // });
  //
  // client.on('WristRight',function(){
  //   console.log("I am server, Wrist Right");
  //   servo.sweep({
  //     range: [45, 135],
  //     step: -10
  //   });
  // });

});




  //var servo_tilt = new five.Servo(10);
  //servo_tilt .sweep({
  //range: [45, 135]
 //});
// servo_tilt .sweep({
//  range: [0, 30],
//  interval: 100,
//  });
// servo_tilt .sweep({
//  range: [0, 60],
//  interval: 100,
//  step: 10
// });
// var servo_pan = new five.Servo(9);
// servo_pan.sweep({
//   range: [0, 180],
//   interval: 10000,
//  });



});

const port = process.env.PORT || 3000;

server.listen(port);
console.log(`Server listening on http://localhost:${port}`);
