
import { store } from '../data/store.js';
import * as d3 from 'd3-selection';
import interact from 'interactjs';
import Tone from 'tone';
import Microphone from 'recorder-js/src/microphone.js';
import { toneObjNames } from '../data/tonenames.js';
import { ToneObjs } from '../models/models.js';

export function toggleFullScreen() {
  let doc = window.document;
  let docEl = doc.documentElement;

  let requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
  let cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

  if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
    requestFullScreen.call(docEl);
  }
  else {
    cancelFullScreen.call(doc);
  }
}


export function applyDraggableGrid() {
  let startPos = {x:0, y:0};
  let mouseDown = false, bFlag = false;

  //remember to unset this
  interact(document.querySelector('body'))
    .on('up', e => {
      mouseDown = false;
      startPos = null;
    }).on('move', e => { 
      if(mouseDown){
        if(!startPos){
          startPos = {x: e.x, y: e.y};
        }
        let mDragDist = Math.sqrt(Math.pow(e.x - startPos.x, 2) + Math.pow(e.y - startPos.y, 2) | 0).toFixed(2);
        if(mDragDist > 30){
          bFlag = true;
        }
      }
  });

  interact('#gridContainer')
    .draggable({
      inertia: {
        resistance: 7,
        // minSpeed: 200,
        // endSpeed: 100
      },
      restrict: {
        restriction: "parent",
        endOnly: true,
        elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
      },
      autoScroll: false,
      ignoreFrom: 'input',
      onmove: dragMoveListener,
      onstart: e => {
        mouseDown = true;
        bFlag = false;
      },
      onend: e => {
        bFlag = false;
        dragMoveListener(e);
      }
    })

  function dragMoveListener(event) {
    let target = event.target,
      x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
      y = (parseFloat(target.getAttribute('data-y')) || 0);

    if (store.ui.viewMode === 'sequencer')
      y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

    if(!isNaN(x))
      target.setAttribute('data-x', x);
    if(!isNaN(y))
      target.setAttribute('data-y', y);

    //x,y are NaN when interact fire called manually
    //bflag = drag threshold met in conditions above in mousemove
    if(bFlag || isNaN(x) || isNaN(y)){
      if (!x)
        x = (parseFloat(target.getAttribute('data-x')) || 0);
      if (!y)
        y = (parseFloat(target.getAttribute('data-y')) || 0);

      if(x > 0){
        x = 0;
      }

      //Grid rows
      target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

      //timeline
      let timeline = document.getElementById("divGridTimeline");
      if (timeline) {
        let top = parseInt(document.getElementById('gridParent').style.top.replace('px', ''), 10);

        if (!isNaN(top)) {
          if (top === 40) {
            timeline.style.webkitTransform = timeline.style.transform = 'translateY(' + (y * -1) + 'px)';
          }
          else {
            let diff = 40 - top - y;
            timeline.style.webkitTransform = timeline.style.transform = 'translateY(' + diff + 'px)';
          }
        } else {
          timeline.style.webkitTransform = timeline.style.transform = 'translateY(' + (y * -1) + 'px)';
        }

      }

      //Mix rows
      let elements = document.getElementsByClassName('track-rowmix');
      if (!x) {
        //TODO: mixrows are mounting after this is getting called....
        //console.log('x === NAN   #elements: ' + elements.length);
      }
      if (elements.length > 0) {
        for (let i = 0; i < elements.length; i++) {
          //no Y drag  elements[i].style.webkitTransform = elements[i].style.transform = 'translate(' + (x * -1) + 'px,' + (y * -1) + 'px)';
          elements[i].style.webkitTransform = elements[i].style.transform = 'translate(' + (x * -1) + 'px)';
        }
      }
    }
  }
}

/*========================================= */

//async causes audiopop in chrome?
export function audioBufferToWav(buffer, opt) {
  return new Promise(function (resolve, reject) {
    opt = opt || {}

    let numChannels = buffer.numberOfChannels
    let sampleRate = buffer.sampleRate
    let format = opt.float32 ? 3 : 1
    let bitDepth = format === 3 ? 32 : 16

    let result;
    if (numChannels === 2) {
      result = [buffer.getChannelData(0), buffer.getChannelData(1)];
    } else {
      result = buffer.getChannelData(0)
    }

    let worker = new Worker(process.env.PUBLIC_URL + "/worker.js");

    worker.onmessage = function (e) {
      let blob = new Blob([e.data], { type: "audio/wav" });
      resolve(blob);
    };

    worker.postMessage({ result: result, format: format, sampleRate: sampleRate, numChannels: numChannels, bitDepth: bitDepth });
  });
}

export function renderSVG(data, id, width, height) {
  let summary = summarizeFaster(data, width); //width * 2 when w = 0.5 below
  let multiplier = 50;
  let w = 1; //0.5
  d3.select(id)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .selectAll('circle')
    .data(summary)
    .enter()
    .append('rect')
    .style('fill', '#ff6000')
    .attr('x', function (d, i) {
      return (i * w) /* + 25 */;
    })
    .attr('y', function (d, i) {
      return (height / 2) - (multiplier * d[1]);
    })
    .attr('width', w)
    .attr('height', function (d) {
      let h = multiplier * (d[1] - d[0]);
      if (!isNaN(h))
        return h;
      else
        return 0;
    });
}

//WEB WORKER?
export function summarizeFaster(data, pixels) {
  let pixelLength = Math.round(data.length / pixels);
  let vals = [];

  // Define a minimum sample size per pixel
  let maxSampleSize = 1000;
  let sampleSize = Math.min(pixelLength, maxSampleSize);

  // For each pixel we display
  for (let i = 0; i < pixels; i++) {
    let posSum = 0,
      negSum = 0;

    // Cycle through the data-points relevant to the pixel
    // Don't cycle through more than sampleSize frames per pixel.
    for (let j = 0; j < sampleSize; j++) {
      let val = data[i * pixelLength + j];

      // Keep track of positive and negative values separately
      if (val > 0) {
        posSum += val;
      } else {
        negSum += val;
      }
    }
    vals.push([negSum / sampleSize, posSum / sampleSize]);
  }
  return vals;
}


export function renderSong(){
  Tone.Offline(function(Transport){
      let offlineToneObjs = {
          instruments: [],
          effects: [],
          components: [],
          sources: [],
          parts: [],
          custom: []
      }

      setToneObjs(store, offlineToneObjs)
      
      store.connections.forEach(c => {
          c.addConnection(offlineToneObjs);
      })

      store.patterns.forEach(p => {
          offlineToneObjs.parts.push({
              id: p.id,
              track: p.track.id
          })

          p.initPart(offlineToneObjs);

          let part = offlineToneObjs.parts.find(objPart => objPart.id === p.id);
          p.notes.forEach(n => {
              let event = part.obj.at(n.time, { "mute": n.mute, "note": n.getNote(), "duration": n.duration, "velocity": n.velocity, "offset": n.offset, "time": n.time});
              event.probability = n.probability;
              event.humanize = n.humanize;
          })
      })

      Transport.bpm.value = store.settings.bpm;
      Transport.swing = store.settings.swing;
      Transport.swingSubdivision = store.settings.swingSubdivision;
      Transport.start();
      
  }, store.getSongLength()).then(function(buffer){
      audioBufferToWav(buffer._buffer).then(blob => {
          Microphone.forceDownload(blob, store.settings.title + '.wav');
      });
  })
}

export function setToneObjs(data, offline){
  let tObjs = ToneObjs;

  if(offline)
      tObjs = offline;
  
  for(let toneClass in tObjs){
      if(tObjs.hasOwnProperty(toneClass)){
          if(toneClass !== "parts" && toneClass !== "custom"){
              let resultObj = data[toneClass];

              for(let oArray in resultObj){
                  if (resultObj.hasOwnProperty(oArray)) {
                      if(resultObj[oArray].length > 0){
                          resultObj[oArray].forEach(item => {
                              let args = {};
                      
                              for (let key in item) {
                                  if (item.hasOwnProperty(key)) {
                                      if(key !== 'track' && key !== 'id' && key !== 'ui')
                                          args[key] = item[key];
                                  }
                              }

                              let type = item.id.split('_')[0];
                              if(type === 'mix')
                                  type = item.id.split('_')[1];
                              else if(type === "tinysynth")
                                  if(toneClass === "components")
                                      type = item.id.split('_')[1];

                              if(type !== "tinysynth"){
                                  toneObjNames.some(function(title){
                                      if(title.toLowerCase() === type){
                                          type = title;
                                          return true;
                                      }
                                  })

                                  let trackId = item.track;
                                  if(offline)
                                      trackId = item.track.id
                                  
                                  if(type === "Synth" || type === "AMSynth" || type === "DuoSynth" || type === "Sampler" || type === "FMSynth" || type === "MonoSynth")
                                      tObjs.instruments.push({ id: item.id, track: trackId, obj: new Tone.PolySynth(8, Tone[type]).set(args) });
                                  else
                                      tObjs[toneClass].push({ id: item.id, track: trackId, obj: new Tone[type](args) });

                                  //set player buffer during render
                                  if(offline && type === "Player"){
                                      let srcPlayer = ToneObjs.instruments.find(i => i.id === item.id).obj;
                                      tObjs.instruments.find(p => p.id === item.id).obj.buffer = srcPlayer.buffer;
                                  }
                              }
                          })
                      }
                  }
              }
          }
          else if(toneClass === "custom"){
              //tinysynth only custom obj now... and the panvol it's bundled with should already be loaded
              
              data.instruments.tinysynths.forEach(function(row){                               
                  let outId = 'tinysynth_panvol_' + row.id.split('_')[1];
                  let outObj = tObjs.components.find(c => c.id === outId).obj;

                  let trackId = row.track;
                  if(offline){
                      trackId = row.track.id
                  }
                  
                  tObjs.custom.push({id: row.id, track: trackId, obj: new window.WebAudioTinySynth({internalcontext:0, useReverb:0})})

                  let tinySynth = tObjs.custom.find(t => t.id === row.id).obj;
                  tinySynth.setAudioContext(Tone.context, outObj);
                  tinySynth.send([0xc0, row.instrument]);      
              })
          }
      }
  }
}