import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import interact from 'interactjs';
import { ToneObjs } from '../../../models/models.js';
import { store } from '../../../data/store.js';
import { renderSVG } from "../../utils.js";
import { MixRowView } from "./mixrow.js";
import { MixRowViewEdit } from "./mixrowedit.js";


export const TrackRowView = observer(class TrackRowView extends Component {
  player;
  canvasHeight = 40;
  c;
  ctx;
  img;
  mStartPos;
  mStopPos;
  mouseHold;
  id;

  componentDidMount(){
    if(this.props.track.type !== "master"){
      if(this.props.track.type === "audio"){
        this.player = ToneObjs.instruments.find(inst => inst.track === this.props.track.id).obj;

        //force draw on first load
        this.ensureBufferIsLoaded(this.player.buffer).then(() => {
          this.init(true)
        });
      }
      else if(this.props.track.type === "instrument"){
        this.init();
      }
    }

    //update waveforms on zoom in out
    document.getElementById("gridContainer").addEventListener("transitionend", () => { 
      this.init(true) 
    });

    interact("#canvas" + this.id).on('hold', event => {
      this.mouseHold = true;
      event.preventDefault();
      store.ui.selectNote(undefined);
    });
  }

  ensureBufferIsLoaded = (buffer) => {
    return new Promise(function (resolve, reject) {
      let waitForBuffer = () => {
        if (buffer.loaded) 
          return resolve();
        setTimeout(waitForBuffer, 5);
      };
      waitForBuffer();
    });
  }

  componentDidUpdate(prevProps){
    //console.log('trackrowview updated')
    if(this.props.track.type !== "master"){
      if(this.props.track.type === "audio"){

        //region was updated
        //update all views or only 1st bar in edit view bars (limit async renderSVG to be called once)
        if(!this.props.bar || this.props.bar === 1){
          if(prevProps.region && this.props.region){
            if(prevProps.region.start !== this.props.region.start || prevProps.region.end !== this.props.region.end){
              this.init(true);
              return;
            }
          }
        }
      }
      
      /*
      if(this.props.store.ui.viewMode === 'sequencer'){
        //perform individual prop checks here to only re-draw updated tracks?
        //is this necessary?
      }
      */

      this.init();
    }
  }

  init = (update) => {
    //console.log('init ' + this.props.track.id)
    this.c = document.getElementById("canvas" + this.id);

    if(this.c && this.props.track.type !== "master"){
      this.ctx = this.c.getContext("2d");

      if(this.props.track.type === "audio"){
        if(this.player){
          if(this.player.buffer.loaded)
            this.drawTrack(update);
        }
      }
      else if(this.props.track.type === "instrument"){
        this.drawTrack();
      }
    }
  }

  componentWillUnmount(){
    interact("#canvas" + this.id).unset();
    document.getElementById("gridContainer").removeEventListener("transitionend", () => { this.init(true) });
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

    store.ui.selectTrack(this.props.track.id)

    if(hold)
      e.preventDefault();

    let distance = 0, clickX;

    if(this.mStartPos){
      if(this.mStopPos){
        let a, b;
        a = this.mStartPos.x - this.mStopPos.x;
        b = this.mStartPos.y - this.mStopPos.y;

        distance = Math.sqrt(a*a + b*b);

        let gridOffset = document.getElementById('gridContainer').getAttribute('data-x');
        clickX = this.mStopPos.x - gridOffset;
      }
    }
  
    if(distance <= 60 && clickX){
      //Get click Seconds and also Tone time of click
      let clickSecs = (clickX / this.props.windowWidth) * Tone.Time(this.props.viewLength).toSeconds();
    
      if(this.props.selectedScene){
        let scene = this.props.selectedScene;
        let pattern = store.getPatternByTrackScene(this.props.track.id, scene.id)
        let sceneStart = 0;
        let sceneEnd;
        
        if(this.props.bar){
          sceneStart = Tone.Time(this.props.bar-1 + ':0:0');
          sceneEnd = sceneStart + Tone.Time('1:0:0');
          clickSecs = (clickX / this.props.windowWidth) * Tone.Time(this.props.viewLength).toSeconds();
          clickSecs += sceneStart;
        }
        else{
          sceneEnd = Tone.Time(store.getSceneLength(scene.id));
        }

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
              if(!note.mute && note !== this.props.selectedNote){
                store.ui.selectNote(note);
              }
              else if(note.mute && note !== this.props.selectedNote){
                store.ui.selectNote(note);
                note.toggle();
              }
              else{
                store.ui.selectNote(undefined);
                note.getPattern().deleteNote(note);
              }
            }
            else if(pattern.track.type === "instrument"){
              if(note.mute && note !== this.props.selectedNote){
                note.toggle();
                store.ui.selectNote(note);
              }
              else if(this.props.selectedNote === note){
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
    }
  }

  drawTrack = (update) => {
    this.c.width = document.getElementById('gridContainer').style.width.replace('px','');
    this.c.height = this.canvasHeight;
    this.ctx.clearRect(0, 0, this.c.width, this.c.height);

    if(this.props.selectedScene){
      let scene = this.props.selectedScene;
      let pattern = store.getPatternByTrackScene(this.props.track.id, scene.id);

      this.drawGridLines(this.ctx, pattern, scene, this.props.viewLength);
      if(this.props.track.type === "audio"){
        this.drawAudioNotes(pattern, this.props.viewLength, update);
      }
      else if(this.props.track.type === "instrument"){
        this.drawInstNotes(pattern, this.props.viewLength);
      }
    }
  }

  drawInstNotes = (pattern, viewLength) => {
    let ctx = this.ctx;
    let height = this.canvasHeight;
    let windowWidth = this.props.windowWidth;
    let viewSquares = Tone.Time(viewLength).toBarsBeatsSixteenths();
    viewSquares = parseInt(viewSquares.split(":")[0] * pattern.resolution, 10) + parseInt(viewSquares.split(":")[1] * (pattern.resolution/4), 10);
    let squareWidth = windowWidth / viewSquares;

    let sorted = pattern.getSortedNotesAsc();

    let currBar = this.props.bar-1 + ':0:0';
    let nextBar = this.props.bar + ':0:0';
    if(this.props.bar){
      sorted = sorted.filter(n => Tone.Time(n.time) >= Tone.Time(currBar) && Tone.Time(n.time) < Tone.Time(nextBar));
    }

    sorted.forEach(note => {
      if(!note.mute && note.note){
        if(note.note[0] !== '' || this.props.selectedNote === note){
          let x;
          if(this.props.bar){
            let barOffset = Tone.Time(note.time) - Tone.Time(currBar);
            x = barOffset / Tone.Time(viewLength) * windowWidth;
          }
          else{
            x = Tone.Time(note.time) / Tone.Time(viewLength) * windowWidth;
          }

          let noteWidth = Tone.Time(note.duration) / Tone.Time(viewLength) * windowWidth;
          let offsetWidth = squareWidth * note.offset;
          
          ctx.fillStyle = '#133e83';
          if(this.props.selectedNote)
            if(note.id === this.props.selectedNote.id)
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

  drawAudioNotes = (pattern, viewLength, update) => {
    let svgId = 'svgimg' + this.id;
    let trackId = this.id;
    let buffer = this.player.buffer;
    let duration = buffer.duration / this.props.playbackRate;
    let imgWidth = (duration/Tone.Time(viewLength)) * this.props.windowWidth;

    let viewSquares = Tone.Time(viewLength).toBarsBeatsSixteenths();
    viewSquares = parseInt(viewSquares.split(":")[0] * pattern.resolution, 10) + parseInt(viewSquares.split(":")[1] * (pattern.resolution/4), 10);
    let squareWidth = this.props.windowWidth / viewSquares;

    if(!this.img)
      this.img = new Image();

    if(!this.img.src || update || (this.props.bar && this.props.strSVG !== this.img.src)){
      if(!this.props.bar || this.props.bar === 1){
        renderSVG(buffer.toArray(0), '#' + svgId, imgWidth, this.canvasHeight).then(() => {
          let svgDiv = document.getElementById('svgimg' + trackId);
          if(svgDiv){
            let svgImg = svgDiv.childNodes[0];
            let svgData = (new XMLSerializer()).serializeToString(svgImg);
            svgDiv.removeChild(svgImg);
            this.img.src = "data:image/svg+xml;base64," + btoa(svgData);
          }
        });
      }
      else if(this.props.strSVG !== this.img.src){
        this.img.src = this.props.strSVG;
      }
    }
    else if(this.img.complete){
      this.drawAudioNote(this.img, buffer, duration, pattern, viewLength, squareWidth, imgWidth);
    }

    this.img.onload = () => {
      if(this.props.bar === 1){
        this.props.setSVG(this.img.src)
      }
      else{
        this.drawAudioNote(this.img, buffer, duration, pattern, viewLength, squareWidth, imgWidth);
      }
    }
  }

  drawAudioNote = (img, buffer, duration, pattern, viewLength, squareWidth, imgWidth) => {
    let ctx = this.ctx;
    let height = this.canvasHeight;
    let sorted = pattern.getSortedNotesAsc();

    let currBar = this.props.bar-1 + ':0:0';
    let nextBar= this.props.bar + ':0:0';
    if(this.props.bar){
      sorted = sorted.filter(n => Tone.Time(n.time) >= Tone.Time(currBar) && Tone.Time(n.time) < Tone.Time(nextBar));
    }

    sorted.forEach(note => {
      //console.log('track: ' + this.id + ' dealing with note: ' + Tone.Time(note.time).toBarsBeatsSixteenths())
      if(!note.mute){
        let noteOffset = Tone.Time(pattern.resolution + 'n') * note.offset;
        let x, xOffset;
        
        if(this.props.bar){
          let barOffset = Tone.Time(note.time) - Tone.Time(currBar);
          x = barOffset / Tone.Time(viewLength) * this.props.windowWidth;
          xOffset = (barOffset + noteOffset) / Tone.Time(viewLength) * this.props.windowWidth;
        }
        else{
          x = Tone.Time(note.time) / Tone.Time(viewLength) * this.props.windowWidth;
          xOffset = (Tone.Time(note.time) + noteOffset) / Tone.Time(viewLength) * this.props.windowWidth;
        }

        //Draw square
        if(this.props.selectedNote === note)
          ctx.fillStyle = '#065ae0';
        else 
          ctx.fillStyle = '#133e83';
        
        ctx.fillRect(x, 0, squareWidth, height);

        //draw border separator lines
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(xOffset, 0, 1, height);
        //ctx.fillRect(x + noteWidth, 0, 1, height);
        
        let widthDelta = 0;
        let noteTimeDelta = 0;
        let cutDuration = (buffer.duration * note.duration) / this.props.playbackRate;

        sorted.some(n2 => {
          if(Tone.Time(n2.time) > Tone.Time(note.time) && !n2.mute){
            //seconds between notes
            let n2Offset = Tone.Time(pattern.resolution + 'n') * n2.offset;
            noteTimeDelta = (Tone.Time(n2.time) - Tone.Time(note.time)) - noteOffset + n2Offset;
            if(cutDuration >= noteTimeDelta){
              //sample seconds - note delta seconds to pixels
              widthDelta = ((duration - noteTimeDelta) / Tone.Time(viewLength)) * this.props.windowWidth;
              return true;
            }
          }
          return false;
        })

        if(cutDuration > noteTimeDelta && noteTimeDelta !== 0){
          let percent = noteTimeDelta / duration;
          ctx.drawImage(img, 0, 0, img.width * percent, height, xOffset, 0, imgWidth - widthDelta, height);
        }
        else{
          if(note.duration < 1){
            widthDelta = ((duration - cutDuration) / Tone.Time(viewLength)) * this.props.windowWidth;
            ctx.drawImage(img, 0, 0, img.width * note.duration, height, xOffset, 0, imgWidth - widthDelta, height);
          }
          else{
            ctx.drawImage(img, xOffset, 0, imgWidth, height);
          }
        }
      }
    })
  }

  drawGridLines = (ctx, pattern, scene, viewLength) => {
    let res = pattern.resolution;
    let sceneStart = 0;
    let sceneEnd;

    if(this.props.bar)
      sceneEnd = (Tone.Time('1:0:0') / Tone.Time(viewLength)) * this.props.windowWidth;
    else
      sceneEnd = (store.getSceneLength(scene.id) / Tone.Time(viewLength)) * this.props.windowWidth;

    ctx.fillStyle = '#12121e';
    ctx.fillRect(sceneStart, 0, sceneEnd - sceneStart, this.canvasHeight);
    
    let viewSquares = Tone.Time(viewLength).toBarsBeatsSixteenths();
    viewSquares = parseInt(viewSquares.split(":")[0] * res, 10) + parseInt(viewSquares.split(":")[1] * (res/4), 10);
    let w = this.props.windowWidth / viewSquares;

    let squares;
    if(this.props.bar){
      squares = (1*res) + ':0:0';
    }
    else{
      squares = Tone.Time(store.getSceneLength(scene.id)) * res;
      squares = Tone.Time(squares).toBarsBeatsSixteenths();
    }

    let total = parseInt(squares.split(":")[0], 10) + parseInt(squares.split(":")[1], 10);

    ctx.strokeStyle = "#133e83";
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    for(let k=0; k<=total; k++){
      ctx.moveTo((k * w) + sceneStart, 0);
      ctx.lineTo((k * w) + sceneStart, this.canvasHeight); 
    }

    ctx.stroke();
  }

  render(){
    let sDisplay = {display:'block'};
    if((this.props.store.ui.viewMode === "sequencer" && this.props.mixMode)
        || this.props.track.type === "master")
      sDisplay = {display:'none'}

    let mixView = null;

    if((store.ui.viewMode === "edit" || store.ui.viewMode === 'button') && this.props.track.type !== "master"){
      if(store.ui.views.edit.mode === 'graph'){
        if(this.props.selectedNote)
          if(this.props.selectedNote.getPattern().track.id === this.props.track.id)
            mixView = <MixRowViewEdit trackId={this.props.track.id} store={this.props.store} track={this.props.track} note={this.props.selectedNote} viewLength={this.props.viewLength}/>
          else
            mixView = <MixRowView store={this.props.store}  track={this.props.track} viewLength={this.props.viewLength}/>
        else
          mixView = <MixRowView store={this.props.store} track={this.props.track} viewLength={this.props.viewLength}/>
      }
    }
    else if(this.props.mixMode || this.props.track.type === "master"){
      mixView = <MixRowView store={this.props.store} track={this.props.track} viewLength={this.props.viewLength}/>
    }

    let strSelected = "";
    if(this.props.selectedTrack && this.props.store.ui.viewMode === "sequencer"){
      if(this.props.selectedTrack.id === this.props.track.id){
        strSelected = "trackSelected";
      }
    }

    if(this.props.bar)
      this.id = this.props.track.id + '_' + this.props.bar;
    else
      this.id = this.props.track.id;

    let playhead = null;
    if(this.props.bar)
      playhead = <div className="progressLine" id={'playhead_' + this.id} style={{display:'none'}}></div>

    return (
      <div className="track-row">
        { playhead }
        <canvas id={"canvas" + this.id} className={"canvasTrack " + strSelected} onTouchStart={this.handleMouseDown} onTouchEnd={this.handleMouseUp} 
        onMouseDown={this.handleMouseDown} onMouseUp={this.handleMouseUp}  style={sDisplay}></canvas>
        { mixView }
        <div id={"svgimg" + this.id} className="svgdiv"></div>
      </div>
    )
  }
});