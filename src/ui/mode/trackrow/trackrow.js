import React, { Component } from 'react';
import { observer } from "mobx-react";
import { isAlive } from "mobx-state-tree";
import Tone from 'tone';
import interact from 'interactjs';
import { ToneObjs } from '../../../models/models.js';
import { store } from '../../../data/store.js';
import { renderWaveform } from "../../utils.js";
import { MixRowView } from "./mixrow.js";
import { MixRowViewEdit } from "./mixrowedit.js";
import { mapVal } from '../../utils.js';


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
  bSelectedNote;
  waveRedrawTimeout;

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
    document.getElementById("gridContainer").addEventListener("transitionend", this.initRenderWaveform);

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
      
      //only update sequencer tracks that are modified
      if(store.ui.viewMode === 'sequencer'){
        
        //sequencer view uses track instead of selectedPattern
        if(prevProps.selectedPatternRes !== this.props.selectedPatternRes){
          this.init();
          return;
        }
        else if(prevProps.selectedPatternNotesLen !== this.props.selectedPatternNotesLen && store.ui.recordMode){
          this.init();
          return;
        }

        if(!store.ui.mixMode){
          if(prevProps.playbackRate !== this.props.playbackRate){
            clearTimeout(this.waveRedrawTimeout);
            this.waveRedrawTimeout = setTimeout(() => {
              this.init(true);
            }, 1000);

            this.init();
            return;
          }

          if(prevProps.bpm !== this.props.bpm){
            this.init();
            return;
          }

          if(prevProps.songLength !== this.props.songLength){
            this.init();
            return;
          }

          //transition eventlistener calls init
          if(prevProps.viewLength !== this.props.viewLength){
            return;
          }

          if(prevProps.selectedNote && this.props.selectedNote){
            if(isAlive(prevProps.selectedNote)){
              if(prevProps.selectedNote.id === this.props.selectedNote.id){
                if(prevProps.selectedNoteDuration !== this.props.selectedNoteDuration || prevProps.selectedNoteOffset !== this.props.selectedNoteOffset){
                  this.init();
                  return;
                }
                //updated blank selectednote to same selectedkey (select key, create new note, select same key)
                if(prevProps.selectedNoteValue !== this.props.selectedNoteValue && prevProps.selectedKey === this.props.selectedKey){
                  this.init();
                  return;
                }
              }
            }
          }
          
          //update previous/current track containing selectednote
          if(prevProps.selectedNote !== this.props.selectedNote){
            if(this.props.selectedNote){
              if(this.props.selectedNote.getPattern().track.id === this.props.track.id){
                this.bSelectedNote = true;
                this.init();
                return;
              }
              else if(this.bSelectedNote){
                this.bSelectedNote = false;
                this.init();
                return;
              }
            }
            //note was de-selected
            else{
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
            if(isAlive(prevProps.selectedPattern)){
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

          if(prevProps.numSelectedNotes !== this.props.numSelectedNotes){
            this.init();
            return;
          }
        }
      }
      //all other views
      else{
        if(this.props.track.type === 'audio'){
          if(prevProps.playbackRate !== this.props.playbackRate){
            clearTimeout(this.waveRedrawTimeout);
            this.waveRedrawTimeout = setTimeout(() => {
              this.init(true);
            }, 1000);
          }
        }

        this.init();
      }
    }
  }

  //used for eventlisteners (so we can detach the instance when unmounting)
  //triggers audio waveform render
  initRenderWaveform = () => {
    this.init(true);
  }

  init = (update) => {
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
    document.getElementById("gridContainer").removeEventListener("transitionend", this.initRenderWaveform);
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
      //bar view toggle select during edit mode
      if(store.ui.viewMode === 'edit' && store.ui.views.edit.mode === 'bar' && store.ui.editMode){
          store.ui.views.edit.toggleBarSelect(this.props.bar);
          return;
      }
  
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
          let timeQuant = Tone.Time(Tone.Time(clickSecs).quantize(pattern.resolution)).toBarsBeatsSixteenths();

          //quantize will use next note past a certain point
          if(Tone.Time(timeQuant) > Tone.Time(clickSecs)){
            //no negative 1st note
            if(Tone.Time(timeQuant) < Tone.Time(pattern.resolution))
              timeQuant = '0:0:0';
            else
              timeQuant = Tone.Time(Tone.Time(timeQuant) - Tone.Time(pattern.resolution)).toBarsBeatsSixteenths();
          }
          
          //some triplet times resulting in .667
          //breaks note UI functionality - quick fix for now
          let nTime = timeQuant.replace('.667','.666');       
          let note = pattern.getNote(nTime);

          if(!note){  
            if(pattern.track.type === "audio"){
              pattern.addNote(nTime, false, undefined, 1);
              note = pattern.getNote(nTime);
              store.ui.selectNote(note);
            }
            else if(pattern.track.type === "instrument"){
              pattern.addNote(nTime, false, [''], pattern.resolution);
              note = pattern.getNote(nTime);
              store.ui.selectNote(note);
            }

            if(store.ui.views.edit.multiNoteSelect){
              store.ui.views.edit.toggleNote(note.id);
            }
          } 
          else if(note){
            //edit bar view multiple note select 
            if(store.ui.views.edit.multiNoteSelect){
              store.ui.views.edit.toggleNote(note.id);
            }
            else{
              if(pattern.track.type === "audio"){
                if(note !== this.props.selectedNote){
                  store.ui.selectNote(note);
                }
                else{
                  store.ui.selectNote(undefined);
                  note.getPattern().deleteNote(note);
                }
              }
              else if(pattern.track.type === "instrument"){
                //unselect and delete
                if(this.props.selectedNote === note && this.props.selectedNote.getNote()[0]){  
                  store.ui.selectNote(undefined);
                  note.getPattern().deleteNote(note);
                }
                //unselect (selectnote() will delete empty note)
                else if(this.props.selectedNote === note && !this.props.selectedNote.getNote()[0]){  
                  store.ui.selectNote(undefined);
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

      if(store.ui.viewMode === 'edit' && store.ui.views.edit.mode === 'bar' && this.props.editMode){
        if(store.ui.views.edit.isBarSelected(this.props.bar) || store.ui.views.edit.isBarCopied(this.props.bar))
          this.highlightTrack(this.ctx, this.c.width, this.canvasHeight)
      }
    }
  }

  highlightTrack = (ctx, w, h) => {
    let currPattern = store.getPatternByTrackScene(this.props.track.id, this.props.selectedScene.id);

    if(store.ui.views.edit.copiedPattern){
      if(store.ui.views.edit.isBarCopied(this.props.bar) && store.ui.views.edit.copiedPattern.id === currPattern.id){
        ctx.fillStyle = '#19937a';
        ctx.globalAlpha = 0.4;
        ctx.fillRect(0, 0, w, h);
      }
    }
    if(store.ui.views.edit.isBarSelected(this.props.bar)){
      ctx.fillStyle = 'white';
      ctx.globalAlpha = 0.4;
      ctx.fillRect(0, 0, w, h);
    }

  }

  drawInstNotes = (pattern, viewLength) => {
    let ctx = this.ctx;
    let height = this.canvasHeight;
    let windowWidth = this.props.windowWidth;
    let viewSquares = Tone.Time(viewLength).toBarsBeatsSixteenths();
    let res = parseInt(pattern.resolution.slice(0, -1), 10);
    let resType = pattern.resolution.slice(-1);
    if(resType === 't')
      res += (res/2);
    
    viewSquares = parseInt(viewSquares.split(":")[0] * res, 10) + parseInt(viewSquares.split(":")[1] * (res/4), 10);
    let squareWidth = windowWidth / viewSquares;

    let sorted = pattern.getSortedNotesAsc().filter(n => !n.mute);

    let currBar, nextBar;
    if(this.props.bar){
      currBar = (this.props.bar - 1) + ':0:0';
      nextBar = this.props.bar + ':0:0';

      //check if previous bars note extend into current bar
      let prevNote;
      sorted.filter(n => Tone.Time(n.time) < Tone.Time(currBar)).reverse().some(n => {
        if((Tone.Time(n.time) + Tone.Time(n.duration)) > Tone.Time(currBar)){
          prevNote = n;
          return true;
        }
        else{
          return false;
        }
      })

      sorted = sorted.filter(n => Tone.Time(n.time) >= Tone.Time(currBar) && Tone.Time(n.time) < Tone.Time(nextBar));

      //add to beginning of array
      if(prevNote)
        sorted.unshift(prevNote);
    }

    sorted.forEach(note => {
      if(note.note || store.ui.views.edit.multiNoteSelect){
        if(note.note[0] !== '' || this.props.selectedNote === note || store.ui.views.edit.selectedNotes.find(n => n === note.id)){
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
          
          //selected note color
          ctx.fillStyle = '#133e83';
          if(this.props.selectedNote && !store.ui.views.edit.multiNoteSelect){
            if(note.id === this.props.selectedNote.id)
              ctx.fillStyle = '#065ae0'
          }

          if(store.ui.views.edit.multiNoteSelect && store.ui.views.edit.selectedNotes.find(n => n === note.id))
            ctx.fillStyle = '#065ae0'
          
          //draw note
          ctx.globalAlpha = 0.8;
          ctx.fillRect((x+1) + offsetWidth, 0, (noteWidth - offsetWidth) - 1, height);

          //draw velocity
          if(store.ui.selectedNote && this.props.track.mixRow.editSelection === 'Vel'){
            ctx.fillStyle = 'gray';
            
            if(this.props.selectedNote){
              if(note.id === this.props.selectedNote.id)
                ctx.fillStyle = '#19937a';
            }
            
            ctx.fillRect((x+1) + offsetWidth, 40 - (note.velocity * height), (noteWidth - offsetWidth) - 1, note.velocity * height);
          }

          //draw white lines at beginning and end of note
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#ffffff';

          ctx.fillRect(x + offsetWidth, 0, 1, height);
          ctx.fillRect(x + noteWidth, 0, 1, height);

          //note value text
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
    let canvasWaveformId = 'canvasWaveform_' + this.id;
    let trackId = this.id;
    let buffer = this.player.buffer;
    let duration = buffer.duration / this.props.playbackRate;
    let imgWidth = (duration/Tone.Time(viewLength)) * this.props.windowWidth;
    let res = parseInt(pattern.resolution.slice(0, -1), 10);
    let resType = pattern.resolution.slice(-1);
    if(resType === 't')
      res += (res/2);

    let viewSquares = Tone.Time(viewLength).toBarsBeatsSixteenths();
    viewSquares = parseInt(viewSquares.split(":")[0] * res, 10) + parseInt(viewSquares.split(":")[1] * (res/4), 10);
    let squareWidth = this.props.windowWidth / viewSquares;

    if(!this.img)
      this.img = new Image();

    if(!this.img.src || update || (this.props.bar && this.props.strSVG !== this.img.src)){
      if(!this.props.bar || this.props.bar === 1){
        renderWaveform(buffer.toArray(0), '#' + canvasWaveformId, imgWidth, this.canvasHeight).then(() => {
          let divCanvas = document.getElementById('canvasWaveform_' + trackId);
          if(divCanvas){
            let canvasWaveform = divCanvas.childNodes[0];
            if(canvasWaveform){
              this.img.src = canvasWaveform.toDataURL();
              divCanvas.removeChild(canvasWaveform);
            }
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
    let sorted = pattern.getSortedNotesAsc().filter(n => !n.mute);

    let currBar, nextBar;
    if(this.props.bar){
      currBar = (this.props.bar - 1) + ':0:0';
      nextBar = this.props.bar + ':0:0';

      //check if previous bars note extend into current bar
      let prevNote;
      sorted.filter(n => Tone.Time(n.time) < Tone.Time(currBar)).reverse().some(n => {
        if((Tone.Time(n.time) + Tone.Time(this.player.buffer.duration)) > Tone.Time(currBar)){
          prevNote = n;
          return true;
        }
        else{
          return false;
        }
      })

      sorted = sorted.filter(n => Tone.Time(n.time) >= Tone.Time(currBar) && Tone.Time(n.time) < Tone.Time(nextBar));

      //add to beginning of array
      if(prevNote)
        sorted.unshift(prevNote);
    }

    sorted.forEach(note => {
      //console.log('track: ' + this.id + ' dealing with note: ' + Tone.Time(note.time).toBarsBeatsSixteenths())
      let noteOffset = Tone.Time(pattern.resolution) * note.offset;
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
          let n2Offset = Tone.Time(pattern.resolution) * n2.offset;
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

      if(this.props.selectedNote === note){
        ctx.fillStyle = '#065ae0';
        ctx.globalAlpha = 0.4;
        ctx.fillRect(x, 0, squareWidth, height);
        ctx.globalAlpha = 1;
      }

      //draw velocity
      if(store.ui.selectedNote && this.props.track.mixRow.editSelection === 'Vel'){
        ctx.fillStyle = 'white';
        
        if(this.props.selectedNote){
          if(note.id === this.props.selectedNote.id)
            ctx.fillStyle = '#19937a';
        }

        const mappedVal = mapVal(note.velocity, -40, 0, 0, 1);
        ctx.globalAlpha = 0.75;
        ctx.fillRect(x+1, 40 - (mappedVal * height), squareWidth - 1, mappedVal * height);
        ctx.globalAlpha = 1;

      }
    })
  }

  drawGridLines = (ctx, pattern, scene, viewLength) => {
    let res = parseInt(pattern.resolution.slice(0, -1), 10);
    let resType = pattern.resolution.slice(-1);
    if(resType === 't')
      res += (res/2);

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
    let resNum = resType === 'n' ? 4 : 3;

    ctx.strokeStyle = "#133e83";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for(let k=0; k<=total; k++){
      //skip every 4 lines
      if(k % resNum !== 0){
        ctx.moveTo((k * w) + sceneStart, 0);
        ctx.lineTo((k * w) + sceneStart, this.canvasHeight); 
      }
    }
    ctx.stroke();
    
    //every 4(n) or 3(t) lines is a bit thicker
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    for(let k=0; k<=total; k+=resNum){
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
      if(store.ui.views.edit.mode === 'graph' || store.ui.viewMode === 'button'){
        if(this.props.selectedNote)
          if(this.props.selectedNote.getPattern().track.id === this.props.track.id)
            mixView = <MixRowViewEdit trackId={this.props.track.id} store={this.props.store} track={this.props.track} note={this.props.selectedNote} selection={this.props.track.mixRow.editSelection} viewLength={this.props.viewLength}/>
          else
            mixView = <MixRowView store={this.props.store} track={this.props.track} selection={this.props.track.mixRow.mainSelection} viewLength={this.props.viewLength} playbackRate={this.props.playbackRate}/>
        else
          mixView = <MixRowView store={this.props.store} track={this.props.track} selection={this.props.track.mixRow.mainSelection} viewLength={this.props.viewLength} playbackRate={this.props.playbackRate}/>
      }
    }
    else if(this.props.mixMode || this.props.track.type === "master"){
      mixView = <MixRowView store={this.props.store} track={this.props.track} selection={this.props.track.mixRow.mainSelection} viewLength={this.props.viewLength} playbackRate={this.props.playbackRate}/>
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

    let lblBarNum = null;
    if(this.props.bar){
      lblBarNum = <label className='lblTrackBar'>{this.props.bar}</label>
    }
    return (
      <div className="track-row">
        { playhead }
        <canvas id={"canvas" + this.id} className={"canvasTrack " + strSelected} onTouchStart={this.handleMouseDown} onTouchEnd={this.handleMouseUp} 
        onMouseDown={this.handleMouseDown} onMouseUp={this.handleMouseUp}  style={sDisplay}></canvas>
        { lblBarNum }
        { mixView }
        <div id={"canvasWaveform_" + this.id} className="divCanvasWaveformContainer"></div>
      </div>
    )
  }
});