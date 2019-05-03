
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
  let mStartPos = {}, origData = {};
  let bFlag = false, bMoving = false;

  if(!interact.isSet(document.querySelector('body'))){
    interact(document.querySelector('body'))
      .on('down', e => {
        mStartPos = { x: e.x, y: e.y };
      })
      .on('move', e => {
        if(mStartPos && bMoving){
          let mDragDist = Math.sqrt(Math.pow(e.x - mStartPos.x, 2) + Math.pow(e.y - mStartPos.y, 2) | 0).toFixed(3);
          if(mDragDist > 60)
            bFlag = true;
        }
      });
  }

  interact('#gridContainer')
    .draggable({
      inertia: true,
      restrict: {
        restriction: "parent",
        endOnly: true,
        elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
      },
      autoScroll: false,
      ignoreFrom: 'input',
      onmove: e => {
        dragMoveListener(e)
      },
      onstart: e => {
        origData.x = parseFloat(e.target.getAttribute('data-x')) || 0;
        origData.y = parseFloat(e.target.getAttribute('data-y')) || 0;
        bMoving = true;
      },
      onend: e => {
        dragMoveListener(e, true);

        bMoving = false;
        bFlag = false;
        mStartPos = undefined;
      }
    })

  function dragMoveListener(event, end) {
    let target = event.target;

    let x = parseFloat(target.getAttribute('data-x')) || 0;
    let y = parseFloat(target.getAttribute('data-y')) || 0;

    if(event.dx)
      x += event.dx;
    if(event.dy && (store.ui.viewMode === "sequencer" || (store.ui.viewMode === "edit" && store.ui.views.edit.mode === "bar")))
      y += event.dy;

    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);

    //interact.fire called manually
    if(event.dx === undefined && event.dy === undefined)
      bFlag = true;

    if(bFlag){
      target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

      if(store.ui.mixMode){
        let elements = document.getElementsByClassName('track-rowmix');
        if (elements.length > 0) {
          for (let i = 0; i < elements.length; i++) {
            if(store.ui.viewMode !== 'edit' || (store.ui.viewMode === 'edit' && store.ui.views.edit.mode !== 'bar')){
              elements[i].style.webkitTransform = elements[i].style.transform = 'translate(' + (x * -1) + 'px)';
            }
          }
        }
      }

      //keep timeline in position
      let fixedTop = 40;
      if(store.ui.viewMode === 'edit' && store.ui.views.edit.mode === 'bar')
        fixedTop = 80;
      
      let timeline = document.getElementById("divGridTimeline");
      if (timeline) {
        let top = parseInt(document.getElementById('gridParent').style.top.replace('px', ''), 10);

        if (!isNaN(top)) {
          if (top === fixedTop) {
            timeline.style.webkitTransform = timeline.style.transform = 'translateY(' + (y * -1) + 'px)';
          }
          else {
            let diff = fixedTop - top - y;
            timeline.style.webkitTransform = timeline.style.transform = 'translateY(' + diff + 'px)';
          }
        } else {
          timeline.style.webkitTransform = timeline.style.transform = 'translateY(' + (y * -1) + 'px)';
        }
      }
    
    }
    else if(end && !bFlag){
      target.setAttribute('data-x', origData.x);
      target.setAttribute('data-y', origData.y);
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

    let worker = new Worker(process.env.PUBLIC_URL + "/Worker_RenderBuffer.js");

    worker.onmessage = function (e) {
      let blob = new Blob([e.data], { type: "audio/wav" });
      resolve(blob);
    };

    worker.postMessage({ result: result, format: format, sampleRate: sampleRate, numChannels: numChannels, bitDepth: bitDepth });
  });
}

export function renderSVG(data, id, width, height) {
  return new Promise(function (resolve, reject) {
    let worker = new Worker(process.env.PUBLIC_URL + "/Worker_DrawBuffer.js");

    worker.onmessage = function (e) {
      let summary = e.data;
      let multiplier = 50;
      let w = 1;

      resolve(d3.select(id)
        .append('svg')
        .attr('xmlns', 'http://www.w3.org/2000/svg')
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
        })
      );
    }

    worker.postMessage({ buffer: data, width: width });
  })
}

export async function renderSong(track, pattern){
  console.time('renderSong');

  let tLength, player, playerPart;
  if(pattern){
    player = ToneObjs.parts.find(row => row.id === pattern.id).player;
    playerPart = ToneObjs.parts.find(row => row.id === pattern.id).playerPart;
    tLength = store.getSceneLength(pattern.scene.id);
  }
  else{
    tLength = store.getSongLength();
  }

  await Tone.Offline(function(Transport){

      Transport.bpm.value = store.settings.bpm;
      Transport.swing = store.settings.swing;
      Transport.swingSubdivision = store.settings.swingSubdivision;

      let offlineToneObjs = {
          instruments: [],
          effects: [],
          components: [],
          sources: [],
          parts: [],
          custom: []
      }

      setToneObjs(store, offlineToneObjs, track);
      
      let patterns = [];
      if(track){
        if(pattern){
          //all track connections except ones going to track panvol and split/meters
          let trackConns = store.getConnectionsByTrack(track.id).filter(c => c.dest.split('_')[1] !== 'split' && c.dest.split('_')[1] !== 'meter');

          trackConns.filter(c => c.dest !== c.track.getPanVol.id).forEach(c => c.addConnection(offlineToneObjs));

          //trackObj -> master instead of track panvol
          trackConns.filter(c => c.dest === c.track.getPanVol().id).forEach(c => {
                                            offlineToneObjs[c.srcType + 's'].find(o => o.id === c.src).obj.connect(Tone.Master) 
                                          });
                                          
          patterns.push(pattern);
        }
        else{
          //ALL track connections
          store.connections.filter(c => (c.track.id === track.id || c.track.id === 'track_master'
                                      //master group connections
                                      || (c.track.group === track.group && c.track.type === 'master'))
                                      && c.dest.split('_')[1] !== 'split' && c.dest.split('_')[1] !== 'meter')
                                          .forEach(c => c.addConnection(offlineToneObjs));
          
          patterns = store.getPatternsByTrack(track.id);
        }
      }
      else{
        store.connections.forEach(c => c.addConnection(offlineToneObjs))
        patterns = store.getAllPatterns();
      }
      
      patterns.forEach(p => {
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

      /* set reverb buffers */
      offlineToneObjs.effects.filter(r => r.id.split('_')[0] === 'reverb').forEach(row => { 
        row.obj._convolver.buffer = ToneObjs.effects.find(o => o.id === row.id).obj._convolver.buffer;
      });

      if(pattern){
        Transport.start(undefined, pattern.scene.start);
      }
      else
        Transport.start()
      
  }, tLength).then(function(buffer){
      console.timeEnd('renderSong')
      if(pattern){
        ToneObjs.parts.find(row => row.id === pattern.id).obj.mute = true;

        console.log('setting buffer and starting player')
        player.buffer.set(buffer);
        playerPart.mute = false;
        if(Tone.Transport.state === "started"){
          if(Tone.Time(Tone.Transport.position) >= Tone.Time(pattern.scene.start) && Tone.Time(Tone.Transport.position) < Tone.Time(pattern.scene.end))
            player.start(undefined, Tone.Time(Tone.Transport.position) - Tone.Time(pattern.scene.start));
        }
      }
      else {
        audioBufferToWav(buffer._buffer).then(blob => {
            Microphone.forceDownload(blob, store.settings.title + '.wav');
        });
      }
  })
}

export function setToneObjs(data, offline, selTrack){
  let tObjs; 

  if(offline)
    tObjs = offline;
  else
    tObjs = ToneObjs;

  Object.keys(tObjs).forEach(toneClass => {
    if(toneClass !== "parts" && toneClass !== "custom"){
      let resultObj = data[toneClass];

      Object.keys(resultObj).forEach(oArray => {
        if(resultObj[oArray].length && oArray !== 'splits' && oArray !== 'meters'){
          let itemArray;
          if(selTrack){
            itemArray = resultObj[oArray].filter(o => o.track.id === selTrack.id 
                              || (o.track.group === selTrack.group && o.track.type === 'master') 
                              || o.track.id === 'track_master')
          }
          else{
            itemArray = resultObj[oArray];
          }
                            
          itemArray.forEach(item => {
            let args = {};
          
            Object.keys(item).forEach(key => {
              if(key !== 'track' && key !== 'id' && key !== 'ui')
                args[key] = item[key];
            })

            let type = item.id.split('_')[0];
            if(type === 'mix')
                type = item.id.split('_')[1];
            else if(type === "tinysynth" && toneClass === "components")
                type = item.id.split('_')[1];
            

            if(type !== "tinysynth"){
              toneObjNames.some(function(title){
                  if(title.toLowerCase() === type){
                      type = title;
                      return true;
                  }
                  return false;
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
      })
    }
    else if(toneClass === "custom"){
      let itemArray = data.instruments.tinysynths;
      if(selTrack)
        itemArray = itemArray.filter(o => o.track.id === selTrack.id);
      
      itemArray.forEach(function(row){                               
        let outId = 'tinysynth_panvol_' + row.id.split('_')[1];
        let outObj = tObjs.components.find(c => c.id === outId).obj;

        let trackId = row.track;
        if(offline)
            trackId = row.track.id
        
        tObjs.custom.push({id: row.id, track: trackId, obj: new window.WebAudioTinySynth({internalcontext:0, useReverb:0})})

        let tinySynth = tObjs.custom.find(t => t.id === row.id).obj;
        Tone.connect(tinySynth.setAudioContext(Tone.context), outObj);
        tinySynth.send([0xc0, row.instrument]); 
      })
    }
  })
}