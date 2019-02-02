import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import interact from 'interactjs';
import { ToneObjs } from '../../../models/models.js';
import { store } from '../../../data/store.js';
import { renderSVG } from "../../utils.js";
import { MixRowView } from "./mixrow.js";
import { MixRowViewEdit } from "./mixrowedit.js";
import * as debounce from 'lodash/debounce';


export const TrackRowView = observer(class TrackRowView extends Component {
    player;
    canvasHeight = 40;
    c;
    ctx;
    img;
    regionUpdated;
    mStartPos;
    mStopPos;
    mouseHold;
    bSelectedNote;
  
    componentDidMount(){
        let self = this;
  
        if(this.props.track.type !== "master" && this.props.track.type === "audio"){
            this.player = ToneObjs.instruments.find(inst => inst.track === this.props.keyValue).obj;
    
            //force draw on first load
            this.regionUpdated = true;
            this.ensureBufferIsLoaded(this.player.buffer).then(function(){
                self.init();
            });
        }
        else if(this.props.track.type === "instrument"){
            this.init();
        }
    
        window.addEventListener("resize", debounce(this.init, 75));
    
        interact("#canvas" + this.props.keyValue)
            .on('hold', function (event) {
            self.mouseHold = true;
            event.preventDefault();
            
            store.ui.selectNote(undefined);
            //self.handleClick(event, true);
            });
    }
  
    ensureBufferIsLoaded = (buffer) => {
        return new Promise(function (resolve, reject) {
            (function waitForBuffer(){
                if (buffer.loaded) return resolve();
                setTimeout(waitForBuffer, 30);
            })();
        });
    }
  
    componentDidUpdate(prevProps, prevState){
      //TODO: deal with updating sequencerview independtly?  if(viewMode === sequencer) (check mixmode too)
      //lots of prop checks here so we don't update all trackrows in sequencerview
      //console.log('trackrowview updated')
  
      if(this.props.track.type !== "master"){
  
        if(this.props.track.type === "audio"){
  
          //Region was added
          if(!prevProps.region && this.props.region){
            this.regionUpdated = true;
            this.init();
          }
  
          //Region was modified
          if(prevProps.region && this.props.region){
            if(prevProps.region.start !== this.props.region.start 
              || prevProps.region.end !== this.props.region.end){
              this.regionUpdated = true;
              this.init();
            } else {
              this.regionUpdated = false;
            }
          }
  
          if(prevProps.playbackRate !== this.props.playbackRate){
            this.init();
          }
  
          if(prevProps.bpm !== this.props.bpm){
            this.init();
          }
  
          this.regionUpdated = false;
        }
  
        if(prevProps.songLength !== this.props.songLength){
          this.init();
          return;
        }
  
        if(prevProps.viewLength !== this.props.viewLength){
          this.init();
          return;
        }
        
        //updated blank selectednote to same selectedkey (select key, create new note, select same key)
        if(prevProps.selectedNote && this.props.selectedNote){
          if(prevProps.selectedNote.id === this.props.selectedNote.id){
            if(prevProps.selectedNoteValue !== this.props.selectedNoteValue && prevProps.selectedKey === this.props.selectedKey){
              this.init();
              return;
            }
          }
        }
  
        //update previous/current track containing selectednote
        if(prevProps.selectedNote !== this.props.selectedNote){
          if(this.props.selectedNote){
            if(this.props.selectedNote.getPattern().track.id === this.props.track.id){
              this.bSelectedNote = true;
              //console.log('selected note this track '  + this.props.track.id)
              this.init();
              return;
            }
            else if(this.bSelectedNote){
              //console.log('selected note was in this track, but not anymore: ' + this.props.track.id)
              this.bSelectedNote = false;
              this.init();
              return;
            }
          }
          //note was de-selected
          else{
            //console.log('no selected note right now and note was in this track prev: ' + this.props.track.id)
            this.bSelectedNote = false;
            this.init();
            return;
          }
        }
        
        if(prevProps.selectedKey !== this.props.selectedKey){
          if(this.props.selectedNote){
            if(this.props.selectedNote.getPattern().track.id === this.props.track.id){
              this.init();
              return;
            }
          }
        }
  
        if(prevProps.selectedPattern !== this.props.selectedPattern){
          if(prevProps.selectedPattern){
            if(prevProps.selectedPattern.track.id === this.props.track.id){
              this.init();
              return;
            }
          }
  
          if(this.props.selectedPattern){
            if(this.props.selectedPattern.track.id === this.props.track.id){
              this.init();
              return;
            }
          }
        }
        //update quantization(resolution) change for this track's selected pattern
        else if(prevProps.selectedPattern && this.props.selectedPattern){
          if(this.props.selectedPattern.track.id === this.props.track.id){
            if(prevProps.selectedPatternRes !== this.props.selectedPatternRes){
              this.init();
              return;
            }
            else if(prevProps.selectedPatternNotes !== this.props.selectedPatternNotes){
              this.init();
              return;
            }
          }
        }
  
        /*      
        if(prevProps.notes !== this.props.notes){
          console.log('notes changed for track; ' + this.props.track.id)
          this.init();
        }
        */
  
  
        
        if(prevProps.selectedScene !== this.props.selectedScene){
          this.init();
          return;
        }
      
        if(prevProps.selectedGroup !== this.props.selectedGroup){
          this.init();
          return;
        }
      }
    }
  
    init = () => {
      //console.log('init called for track: ' + this.props.track.id)
      this.c = document.getElementById("canvas" + this.props.keyValue);
  
      // init seems to get called when canvas is null  (unmount probmem?)
      if(this.c && this.props.track.type !== "master"){
        this.ctx = this.c.getContext("2d");
        this.drawTrack();
      }
    }
  
    componentWillUnmount(){
      interact("#canvas" + this.props.keyValue).unset();
     // if(this.player) ???
     //   this.player.dispose();
    }
    
    handleMouseUp = (e) => {
      //e.stopPropagation();
      //prevents consecutive actions ... (mouseup) on touchend
      e.preventDefault();
  
      if(e.changedTouches){
        if(e.changedTouches.length > 0){
          this.mStopPos = {x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY};
        }
      }
      else{
        this.mStopPos = {x: e.clientX, y: e.clientY};
      }
  
      if(!this.mouseHold)
        this.handleClick(null, false)
      else
        this.mouseHold = false;
    }
    
    handleMouseDown = (e) => {
      //e.stopPropagation();
      if(e.touches){
        if(e.touches.length > 0){
          this.mStartPos = {x: e.touches[0].clientX, y: e.touches[0].clientY};
        }
      }
      else{
        this.mStartPos = {x: e.clientX, y: e.clientY};
      }
    }
  
    handleClick = (e, hold) => {
      //e.stopPropagation();
      if(hold)
        e.preventDefault();
  
      let distance = 0;
  
      if(this.mStartPos){
        if(this.mStopPos){
          let a, b;
          a = this.mStartPos.x - this.mStopPos.x;
          b = this.mStartPos.y - this.mStopPos.y;
  
          distance = Math.sqrt(a*a + b*b);
        }
      }
  
      //Get click Seconds and also Tone time of click
      let pos = getMousePos(this.c, this.mStartPos);
  
      if(distance <= 30 && pos){
        let clickSecs = (pos.x / store.ui.windowWidth) * Tone.Time(store.ui.viewLength).toSeconds();
      
        if(store.ui.selectedScene){
          let scene = store.ui.selectedScene;
          let pattern = store.getPatternByTrackScene(this.props.track.id, scene.id)
          let sceneStart = 0;
          let sceneEnd = Tone.Time(store.getSceneLength(scene.id));
  
          if(clickSecs >= sceneStart && clickSecs < sceneEnd){
            //Each part aka pattern starts at time 0 no matter where in transport timeline
            let tSplit = Tone.Time(clickSecs).toBarsBeatsSixteenths().split(":");
            let sixteenths = tSplit[2];
  
            if(pattern.resolution === 16){
              sixteenths = Math.floor(sixteenths);
            }
            else if(pattern.resolution === 32){
              // extract decimal from x.xxx
              if(parseFloat(sixteenths).toFixed(3).split(".")[1] >= 500)
                sixteenths = sixteenths.split(".")[0] + "." + 500;
              else
                sixteenths = Math.floor(sixteenths);
            }
            else if(pattern.resolution === 64){
              let decimal = parseFloat(sixteenths).toFixed(3).split(".")[1];
              if(decimal >= 0 && decimal < 250)
                sixteenths = Math.floor(sixteenths);
              else if(decimal >= 250 && decimal < 500)
                sixteenths = sixteenths.split(".")[0] + "." + 250;
              else if(decimal >= 500 && decimal < 750)
                sixteenths = sixteenths.split(".")[0] + "." + 500;
              else if(decimal >= 750)
                sixteenths = sixteenths.split(".")[0] + "." + 750;
            }
  
            let nTime = tSplit[0] + ":" + tSplit[1] + ":" + sixteenths;          
            let note = pattern.getNote(nTime);
  
            if(!note){  
              if(pattern.track.type === "audio"){
                pattern.addNote(nTime, false, undefined, 1);
                note = pattern.getNote(nTime);
                store.ui.selectNote(note);
              }
              else if(pattern.track.type === "instrument"){
                pattern.addNote(nTime, false, [''], pattern.resolution + 'n');
                note = pattern.getNote(nTime);
                store.ui.selectNote(note);
              }
            } 
            else{
              if(pattern.track.type === "audio"){
                if(!note.mute && note !== store.ui.selectedNote){
                  store.ui.selectNote(note);
                }
                else if(note.mute && note !== store.ui.selectedNote){
                  store.ui.selectNote(note);
                  note.toggle();
                }
                else{
                  store.ui.selectNote(undefined);
                  note.getPattern().deleteNote(note);
                }
              }
              else if(pattern.track.type === "instrument"){
                /* don't need this anymore?
                if(hold){
                  if(!note.mute){
                    note.toggle();
                    note.setNote('');
                    store.ui.selectNote(undefined);
                  }
                }*/
                if(note.mute && note !== store.ui.selectedNote){
                  note.toggle();
                  store.ui.selectNote(note);
                }
                else if(store.ui.selectedNote === note){
                  store.ui.selectNote(undefined);
                  note.getPattern().deleteNote(note);
                }
                else{
                  store.ui.selectNote(note);
                }
              }
            }
          }
        }
  
        this.drawTrack();
      }
    }
  
    drawTrack = () => {
      this.c.width = document.getElementById('gridContainer').style.width.replace('px','');
      this.c.height = this.canvasHeight;
      this.ctx.clearRect(0, 0, this.c.width, this.c.height);
  
      if(store.ui.selectedScene){
        let scene = store.ui.selectedScene;
        let pattern = store.getPatternByTrackScene(this.props.track.id, scene.id);
  
        this.drawGridLines(this.ctx, pattern, scene, store.ui.viewLength, 0);
        if(this.props.track.type === "audio"){
          this.drawNotes(this.ctx,  pattern, scene, store.ui.viewLength, 0);
        }
        else if(this.props.track.type === "instrument"){
          this.drawInstNotes(this.ctx, pattern, scene, store.ui.viewLength, 0);
        }
      }
      
    }
  
    drawInstNotes = (ctx, pattern, scene, viewLength) => {
      let self = this;
      let height = this.canvasHeight;
      let windowWidth = this.props.store.ui.windowWidth;
      let viewSquares = Tone.Time(viewLength).toBarsBeatsSixteenths();
      viewSquares = parseInt(viewSquares.split(":")[0] * pattern.resolution, 10) + parseInt(viewSquares.split(":")[1] * (pattern.resolution/4), 10);
      let squareWidth = windowWidth / viewSquares;
  
      let sorted = pattern.getSortedNotesAsc();
      sorted.forEach(function(note){
        if(!note.mute && note.note){
          if(note.note[0] !== '' || self.props.selectedNote === note){
            let x = Tone.Time(note.time) / Tone.Time(viewLength) * windowWidth;
            let noteWidth = Tone.Time(note.duration) / Tone.Time(viewLength) * windowWidth;
            let offsetWidth = squareWidth * note.offset;
            
            ctx.fillStyle = '#133e83';
            if(store.ui.selectedNote)
              if(note.id === store.ui.selectedNote.id)
                ctx.fillStyle = '#065ae0'
            
            ctx.fillRect((x+1) + offsetWidth, 0, (noteWidth - offsetWidth) - 1, height);
  
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x + offsetWidth, 0, 1, height);
            ctx.fillRect(x + noteWidth, 0, 1, height);
  
            ctx.font="12px Arial";
            let count = 0;
            note.note.forEach(n => {
              ctx.fillText(n, (x + 1) + offsetWidth, 10 * (count + 1), noteWidth - 2);
              count += 1;            
            })
          }
        }
      })
    }
  
    drawNotes = (ctx, pattern, scene, viewLength) => {
      // TODO: refactor
      //       caching images might not working correctly
      //       just use 1 draw function of sorted notes
      //       image quality (initial image size scaling etc)
      let self = this;
      let el = '#svgimg' + this.props.keyValue;
      let key = this.props.keyValue;
      let buffer = this.player.buffer;
      let height = this.canvasHeight;
      let duration = buffer.duration / this.props.playbackRate;
      let w = (duration/Tone.Time(this.props.store.ui.viewLength)) * this.props.store.ui.windowWidth;
  
      if(!this.img || this.regionUpdated){
        renderSVG(buffer.getChannelData(0), el, w, height);
        let svg = (new XMLSerializer()).serializeToString(document.getElementById('svgimg' + this.props.keyValue).childNodes[0]);
        this.img = new Image();
        this.img.src = "data:image/svg+xml;base64," + btoa(svg);
      }
  
      let windowWidth = this.props.store.ui.windowWidth;
      let viewSquares = Tone.Time(viewLength).toBarsBeatsSixteenths();
      viewSquares = parseInt(viewSquares.split(":")[0] * pattern.resolution, 10) + parseInt(viewSquares.split(":")[1] * (pattern.resolution/4), 10);
      let squareWidth = windowWidth / viewSquares;
  
      // double check these are functioning properly
      if(!this.img.complete || this.regionUpdated){
        this.img.onload = function() {
          let img = this;
  
          let sorted = pattern.getSortedNotesAsc();
          sorted.forEach(function(note){
            if(!note.mute){
              let noteOffset = Tone.Time(pattern.resolution + 'n') * note.offset;
              let x = Tone.Time(note.time) / Tone.Time(viewLength) * windowWidth;
              let xOffset = (Tone.Time(note.time) + noteOffset) / Tone.Time(viewLength) * windowWidth;
  
              //Draw square
              if(store.ui.selectedNote === note){
                ctx.fillStyle = '#065ae0';
              }
              else {
                ctx.fillStyle = '#133e83';
              }
              ctx.fillRect(x, 0, squareWidth, height);
              
              let widthDelta = 0;
              let noteTimeDelta = 0;
              let cutDuration = (buffer.duration * note.duration) / self.props.playbackRate;
  
              sorted.some(function(n2){
                if(Tone.Time(n2.time) > Tone.Time(note.time) && !n2.mute){
                  //seconds between notes
                  let n2Offset = Tone.Time(pattern.resolution + 'n') * n2.offset;
                  noteTimeDelta = (Tone.Time(n2.time) - Tone.Time(note.time)) - noteOffset + n2Offset;
                  if(cutDuration >= noteTimeDelta){
                    //sample seconds - note delta seconds to pixels
                    widthDelta = ((duration - noteTimeDelta) / Tone.Time(viewLength)) * windowWidth;
                    return true;
                  }
                }
                //return false;
              })
  
              ctx.globalAlpha = 0.8;
              if(cutDuration > noteTimeDelta && noteTimeDelta !== 0){
                let percent = noteTimeDelta / duration;
                ctx.drawImage(img, 0, 0, img.width * percent, height, xOffset, 0, w - widthDelta,height);
              }
              else{
                if(note.duration < 1){
                  widthDelta = ((duration - cutDuration) / Tone.Time(viewLength)) * windowWidth;
                  //ctx.drawImage(img, 0, 0, w - widthDelta, height, xOffset, 0, (w - widthDelta) / self.props.playbackRate, height);
                  ctx.drawImage(img, 0, 0, img.width * note.duration, height, xOffset, 0, w - widthDelta, height);
                }
                else
                  ctx.drawImage(img, xOffset, 0, w, height);
              }
    
              ctx.globalAlpha = 1;
            }
          })
        }
      } else {
        let img = this.img;
        let sorted = pattern.getSortedNotesAsc();
        sorted.forEach(function(note){
          if(!note.mute){
            let noteOffset = Tone.Time(pattern.resolution + 'n') * note.offset;
            let x = Tone.Time(note.time) / Tone.Time(viewLength) * windowWidth;
            let xOffset = (Tone.Time(note.time) + noteOffset) / Tone.Time(viewLength) * windowWidth;
  
            //Draw square
            if(store.ui.selectedNote === note){
              ctx.fillStyle = '#065ae0';
            }
            else{
              ctx.fillStyle = '#133e83';
            }
            ctx.fillRect(x, 0, squareWidth, height);
            
            let widthDelta = 0;
            let noteTimeDelta = 0;
            let cutDuration = (buffer.duration * note.duration) / self.props.playbackRate;
  
            sorted.some(function(n2){
              if(Tone.Time(n2.time) > Tone.Time(note.time) && !n2.mute){
                //seconds between notes
                let n2Offset = Tone.Time(pattern.resolution + 'n') * n2.offset;
                noteTimeDelta = (Tone.Time(n2.time) - Tone.Time(note.time)) - noteOffset + n2Offset;
                if(cutDuration >= noteTimeDelta){
                  //sample seconds - note delta seconds to pixels
                  widthDelta = ((duration - noteTimeDelta) / Tone.Time(viewLength)) * windowWidth;
                  return true;
                }
              }
              //return false;
            })
  
            ctx.globalAlpha = 0.8;
            if(cutDuration > noteTimeDelta && noteTimeDelta !== 0){
              let percent = noteTimeDelta / duration;
              ctx.drawImage(img, 0, 0, img.width * percent, height, xOffset, 0, w - widthDelta,height);
            }
            else{
              if(note.duration < 1){
                widthDelta = ((duration - cutDuration) / Tone.Time(viewLength)) * windowWidth;
                //ctx.drawImage(img, 0, 0, w - widthDelta, height, xOffset, 0, (w - widthDelta) / self.props.playbackRate, height);
                ctx.drawImage(img, 0, 0, img.width * note.duration, height, xOffset, 0, w - widthDelta, height);
              }
              else
                ctx.drawImage(img, xOffset, 0, w, height);
            }
  
            ctx.globalAlpha = 1;
          }
        })
      }
      
      //Remove SVG from DOM
      if(document.getElementById('svgimg' + key).childNodes[0])
        document.getElementById('svgimg' + key).removeChild(document.getElementById('svgimg' + key).childNodes[0]);
    }
  
    drawGridLines = (ctx, pattern, scene, viewLength, i) => {
      let res = pattern.resolution;
      //let sceneStart = Tone.Time(scene.start) / Tone.Time(viewLength) * this.props.store.ui.windowWidth;
      //let sceneEnd = Tone.Time(scene.end) / Tone.Time(viewLength) * this.props.store.ui.windowWidth;
      let sceneStart = 0;
      let sceneEnd = (store.getSceneLength(scene.id) / Tone.Time(viewLength)) * store.ui.windowWidth;
  
      if(this.props.selectedScene){
        if(this.props.selectedScene.id === scene.id){
          //ctx.fillStyle = '#121616';
          //ctx.fillRect(sceneStart, 0, sceneEnd - sceneStart, this.canvasHeight);
        }
        else if(i%2 === 0){
          ctx.fillStyle = '#12121e';
          ctx.fillRect(sceneStart, 0, sceneEnd - sceneStart, this.canvasHeight);
        }
      }
      else if(this.props.selectedPattern){
        if(this.props.selectedPattern.id === pattern.id){
          //ctx.fillStyle = '#121616';
          //ctx.fillRect(sceneStart, 0, sceneEnd - sceneStart, this.canvasHeight);
        }
        else if(i%2 === 0){
          ctx.fillStyle = '#12121e';
          ctx.fillRect(sceneStart, 0, sceneEnd - sceneStart, this.canvasHeight);
        }
      }
      //alternating scene bg's
      else if(i%2 === 0){
        ctx.fillStyle = '#12121e';
        ctx.fillRect(sceneStart, 0, sceneEnd - sceneStart, this.canvasHeight);
      }
  
      let viewSquares = Tone.Time(viewLength).toBarsBeatsSixteenths();
      viewSquares = parseInt(viewSquares.split(":")[0] * res, 10) + parseInt(viewSquares.split(":")[1] * (res/4), 10);
      let w = this.props.store.ui.windowWidth / viewSquares;
      
      let squares = Tone.Time(this.props.store.getSceneLength(scene.id)) * res;
      squares = Tone.Time(squares).toBarsBeatsSixteenths();
  
      let total = parseInt(squares.split(":")[0], 10) + parseInt(squares.split(":")[1], 10)
      
      for(let k=0; k<=total; k++){
        if(!(k % 4))
          ctx.lineWidth = 2;
        else
          ctx.lineWidth = 1;
  
        //beginpath could be moved to start of drawing for better perf
        ctx.beginPath();
        ctx.moveTo((k * w) + sceneStart, 0);
        ctx.lineTo((k * w) + sceneStart, this.canvasHeight);
        ctx.strokeStyle = "#133e83";
        ctx.stroke();
      }
    }
  
    resToggled = () => {
      this.init();
    }
  
    noteChanged = () => {
      this.init();
    }
  
    render(){
      let sDisplay = {display:'block'};
      if((this.props.store.ui.viewMode === "sequencer" && this.props.store.ui.mixMode)
          || this.props.track.type === "master")
        sDisplay = {display:'none'}
  
      let mixView = null;
      if(store.ui.viewMode === "edit" && this.props.track.type !== "master"){
        if(store.ui.selectedNote)
          if(store.ui.selectedNote.getPattern().track.id === this.props.track.id)
            mixView = <MixRowViewEdit trackId={this.props.keyValue} store={this.props.store} track={this.props.track} note={store.ui.selectedNote} noteChanged={this.noteChanged}/>
          else
            mixView = <MixRowView trackId={this.props.keyValue} store={this.props.store} toggleRes={this.resToggled} track={this.props.track} mute={this.props.track.mute} solo={this.props.track.solo}/>
        else
          mixView = <MixRowView trackId={this.props.keyValue} store={this.props.store} toggleRes={this.resToggled} track={this.props.track} mute={this.props.track.mute} solo={this.props.track.solo}/>
      }
      else if(this.props.mixMode || this.props.track.type === "master"){
        mixView = <MixRowView trackId={this.props.keyValue} store={this.props.store} toggleRes={this.resToggled} track={this.props.track} mute={this.props.track.mute} solo={this.props.track.solo}/>
      }
  
      let strSelected = "";
      if(this.props.selectedTrack && this.props.store.ui.viewMode === "sequencer"){
        if(this.props.selectedTrack.id === this.props.track.id){
          strSelected = "trackSelected";
        }
      }
  
      return (
        <div className="track-row">
          <canvas id={"canvas" + this.props.keyValue} className={"canvasTrack " + strSelected} onTouchStart={this.handleMouseDown} onTouchEnd={this.handleMouseUp} 
          onMouseDown={this.handleMouseDown} onMouseUp={this.handleMouseUp}  style={sDisplay}></canvas>
          { mixView }
          <div id={"svgimg" + this.props.keyValue} className="svgdiv"></div>
        </div>
      )
    }
});

function getMousePos(canvas, pos) {
    let rect = canvas.getBoundingClientRect();
    if(pos && rect){
        return {
            x: pos.x - rect.left,
            y: pos.y - rect.top
        }
    }
}