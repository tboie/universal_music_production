
import { store } from '../data/store.js';
import interact from 'interactjs';
import Tone from 'tone';
import Microphone from 'recorder-js/src/microphone.js';
import { toneObjNames } from '../data/tonenames.js';
import { ToneObjs } from '../models/models.js';
import { select } from 'd3-selection';
import { saveAs } from 'file-saver';
import { Scale } from 'tonal';
import JSZip from 'jszip';
import newfileTree from '../data/newfiletree.json';
import { initMidi } from "../midi/midi.js";
import * as debounce from 'lodash/debounce';



export function hex_to_ascii(str1){
	let hex  = str1.toString();
	let str = '';
	for (let n = 0; n < hex.length; n += 2) {
		str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
	}
	return str;
}

export function mapVal (num, in_min, in_max, out_min, out_max) {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

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

  store.ui.calibrateSizes();
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
      ignoreFrom: '.track-rowmix',
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

      //sequencer mixmode or all other views
      if(store.ui.mixMode || store.ui.viewMode === 'button' || store.ui.viewMode === 'edit'){
        //all views except edit bars view
        if(store.ui.viewMode !== 'edit' || (store.ui.viewMode === 'edit' && store.ui.views.edit.mode !== 'bar')){
          let elements = document.getElementsByClassName('track-rowmix');
          if (elements.length > 0) {
            for (let i = 0; i < elements.length; i++){
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

export function renderWaveform(data, id, width, height) {
  return new Promise(function (resolve, reject) {
    let worker = new Worker(process.env.PUBLIC_URL + "/Worker_DrawBuffer.js");

    worker.onmessage = function (e) {
      let summary = e.data, multiplier = height;
      let canvas = select(id).append("canvas").attr("width", width).attr("height", height);
      
      if(canvas){
        if(canvas.node()){
          if(canvas.node().getContext("2d")){
            let ctx = canvas.node().getContext("2d");
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#ff6000';
            
            ctx.beginPath();
            [...Array(summary.length).keys()].forEach(i => {
              let h = multiplier * (summary[i][1] - summary[i][0]);
              let y = (height / 2) - h;

              ctx.moveTo(i, y);
              ctx.lineTo(i, y + (h * 2));
            });
            ctx.stroke();
          }
        }
      }

      resolve();
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
          trackConns.filter(c => c.dest === c.track.getPanVol.id).forEach(c => {
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

  Object.keys(tObjs).filter(prop => !(tObjs[prop] instanceof Function)).forEach(toneClass => {
    if(toneClass !== "parts" && toneClass !== "custom" && toneClass !== "metronome"){
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


export const exportSong = () => {
  const folderAddAudioFile = (resolve, reject, id, songFolder) => {
    store.DBLoadAudioFile(id).then(result => {
  
      if(result){
        if(result.data){
          let buffer = new Tone.Buffer();
      
          let strName = id;
          if(strName.split('_')[0] === "region" || strName.split('_')[0] === "sample")
            strName = id + '.wav';
              
          if (Array.isArray(result.data) || result.data instanceof Float32Array) {
            buffer.fromArray(result.data);
            audioBufferToWav(buffer.get()).then(blob => {
              songFolder.file(strName, blob);
      
              buffer.dispose();
      
              resolve(true);
            });
          }
          else{
            let blobUrl = window.URL.createObjectURL(result.data);
            buffer.load(blobUrl, () => {
              audioBufferToWav(buffer.get()).then(blob => {
                songFolder.file(strName, blob);
          
                window.URL.revokeObjectURL(blobUrl);
                buffer.dispose();

                resolve(true);
              });
            });
          }
        }
        else{
          reject('no audio data found in DB')
        }
      }
      else{
        reject('no id found in DB')
       }
    })
  }

  let zip = new JSZip();

  let songFolder = zip.folder(store.settings.title);
  songFolder.file("song.json", JSON.stringify(store));

  let promiseArray = [];
  store.getAllSamples().forEach(s => {
      promiseArray.push(new Promise((resolve, reject) => { folderAddAudioFile(resolve, reject, s.id, songFolder) } ))
      
      s.regions.forEach(r => {
          promiseArray.push(new Promise((resolve, reject) => { folderAddAudioFile(resolve, reject, r.id, songFolder) } ))
      })
  })

  Promise.all(promiseArray).then(() => { 
      zip.generateAsync({type:'blob'}).then(content => {
          saveAs(content, store.settings.title + '.zip')
      });
  });
}

export const saveSong = () => {
  store.DBGetAllSongs().then(list => {
    if(list.find(song => song.id === store.id)){
      store.settings.setModified(Date.now());
      store.DBSaveStore(true);
    } else {
      //show popup if not saved yet
      store.ui.toolbar.browser.setAction('Save');
    }
  })
}

export const setTransport = () => {
  Tone.Transport.position = "0:0:0";
  Tone.Transport.bpm.value = store.settings.bpm;
  Tone.Transport.swing = store.settings.swing;
  Tone.Transport.swingSubdivision = store.settings.swingSubdivision;
  Tone.Transport.loopStart = store.settings.loopStart;
  Tone.Transport.loopEnd = store.settings.loopEnd;
}


export const resizeFunction = () => {
  store.ui.setWindowWidthHeight(window.innerWidth || document.body.clientWidth,
    window.innerHeight || document.body.clientHeight);
};


export const firstPageLoad = () => {
  if(!Tone.supported){
    alert("Sorry, but this app is not supported by your browser.  Please update to a better option."); 
  }

  // not sure how reliable Tone.start() in mount is for all cases... so use this too
  document.documentElement.addEventListener('mousedown', () => {
    if(Tone.initialized){
      if(Tone.context.state !== 'running')
        Tone.start();
    }
  })

  //disable right click menu - this fixes the touch hold menu on some touch screens
  document.addEventListener('contextmenu', e => e.preventDefault());

  //online offline event handlers
  window.addEventListener('load', () => {
    function updateOnlineStatus(event){
      if (navigator.onLine) {
        //console.log('online');
      } else {
        //console.log('offline');
      }
    }
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  });

  //tab/window in background
  document.addEventListener('visibilitychange', function(){
    //console.log('hidden: ' + document.hidden);
  });

  //resize
  window.addEventListener('resize', debounce(resizeFunction, 75));
  resizeFunction();

  //set transport and device
  setTransport();
  store.ui.setDevice();

  initMidi();

  //add scales to browser JSON
  newfileTree['/Song/Scale'].files.push.apply(newfileTree['/Song/Scale'].files, Scale.names());

  /*  enable persistent storage
  if (navigator.storage && navigator.storage.persist)
    navigator.storage.persist().then(function(persistent) {
      if (persistent)
        console.log("Storage will not be cleared except by explicit user action");
      else
        console.log("Storage may be cleared by the UA under storage pressure.");
    });
  */
}