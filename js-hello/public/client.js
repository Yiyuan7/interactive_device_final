// (function() {
//     var test = document.getElementById('test');
//     test.addEventListener('click', function(){
//       socket.emit('triggerservo')
//     });
//     var red = document.getElementById('red');
//     var green = document.getElementById('green');
//     var blue = document.getElementById('blue');
//
//
//     var video = document.getElementById('video');
//     var canvas = document.getElementById('canvas');
//     var context = canvas.getContext('2d');
//     if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
//     // Not adding `{ audio: true }` since we only want video now
//     navigator.mediaDevices.getUserMedia({ video: true }).then(function(stream) {
//         //video.src = window.URL.createObjectURL(stream);
//         video.srcObject = stream;
//         video.play();
//     });
//    }
//
//
//    // Trigger photo take
//     document.getElementById("snap").addEventListener("click", function() {
// 	  context.drawImage(video, 0, 0, 640, 480);
//     });
//
//
//
//     function emitValue(color, e) {
//         socket.emit('rgb', {
//             color: color,
//             value: e.target.value
//         });
//     }
//     var test = document.getElementById("test")
//     test.addEventListener('click', function(){
//       console.log("test click success.")
//     });
//
//     red.addEventListener('change', emitValue.bind(null, 'red'));
//     blue.addEventListener('change', emitValue.bind(null, 'blue'));
//     green.addEventListener('change', emitValue.bind(null, 'green'));
//
//     socket.on('connect', function(data) {
//         socket.emit('join', 'Client is connected!');
//     });
//
//     socket.on('rgb', function(data) {
//         var color = data.color;
//         document.getElementById(color).value = data.value;
//     });
// }());

/* Server Parameter */
var socket = io.connect(window.location.hostname + ':' + 3000);

/* Pose Detect And Show Video */
let video;
let poseNet;
let poses = [];
let count = 0;

/* Pose Part Parameter */
var prevNose;
var prevleftKnee;
var prevrightKnee;
var prevLeft;
var prevRight;

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(video, modelReady);

  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected
  poseNet.on('pose', function(results) {
    poses = results;
    count++;
    let pose = poses[0].pose;
    if (prevNose && prevleftKnee && prevLeft && prevRight && prevrightKnee&&count%5==0) {
         if (pose.keypoints[0].position.y < prevNose.y-8) {
           console.log("I am client, Nose Up");
           socket.emit('NoseUp');
         } else if ((pose.keypoints[9].position.x - pose.keypoints[10].position.x)<100) {
           console.log("I am client, Wrist Cross");
           socket.emit('WristCross');
         } else if (pose.keypoints[9].position.x > prevLeft.x+10) {
           console.log("I am client, Wrist Left");
           socket.emit('WristLeft');
         } else if (pose.keypoints[10].position.x < prevRight.x-10) {
           console.log("I am client, Wrist Right");
           socket.emit('WristRight');
         }
    }
    prevNose = pose.keypoints[0].position;
    prevLeft = pose.keypoints[9].position;
    prevRight = pose.keypoints[10].position;
    prevleftKnee = pose.keypoints[13].position;
    prevrightKnee = pose.keypoints[14].position;

  });
  // Hide the video element, and just show the canvas
  video.hide();
}

/* Show Pose Detection on HTML */
function modelReady() {
  select('#status').html('Model Loaded');
}

function draw() {
  image(video, 0, 0, width, height);

  // We can call both functions to draw all keypoints and the skeletons
  drawKeypoints();
  drawSkeleton();
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints()  {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        fill(255, 0, 0);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }
}

// A function to draw the skeletons
function drawSkeleton() {
  // Loop through all the skeletons detected
  for (let i = 0; i < poses.length; i++) {
    let skeleton = poses[i].skeleton;
    // For every skeleton, loop through all body connections
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];
      stroke(255, 0, 0);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
}
