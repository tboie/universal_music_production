import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from "../../data/store.js";
import interact from 'interactjs';
import { ToneObjs } from '../../models/models.js';
import { applyDraggableGrid } from '../utils.js';
import { TrackRowView } from './trackrow/trackrow.js';
import { GridTimeline } from './timeline/timeline.js';
import { renderSVG } from '../utils.js';

export const GridButtonView = observer(class ButtonView extends Component {
    componentDidMount(){
      applyDraggableGrid();
      this.props.store.ui.calibrateSizes();
    }
  
    componentWillUnmount(){
      interact(document.querySelector('body')).unset();
      interact('#gridContainer').unset();
    }
  
    componentDidUpdate(prevProps){
      //store.ui.calibrateSizes();
    }
  
    noteEdited = (note) => {
      this.forceUpdate();
    }
    
    render() {
      if(!this.props.selectedTrack){
        let firstTrack = this.props.store.tracks.find(t => t.group === this.props.selectedGroup);
        if(firstTrack)
          store.ui.selectTrack(firstTrack.id)
      }
      
      let trackRow = null;
      if(this.props.selectedTrack){
        if(this.props.selectedTrack.group === this.props.store.ui.selectedGroup){
          if(!this.props.store.ui.mixMode)
            this.props.store.ui.toggleMixMode();
  
          let track = this.props.selectedTrack;
          trackRow = <TrackRowView key={track.id} keyValue={track.id} 
            store={this.props.store} sample={track.sample} 
            region={track.returnRegion()} 
            patterns={this.props.store.getPatternsByTrack(track.id)} 
            scenes={this.props.store.getScenesAsc()} 
            mixMode={this.props.store.ui.mixMode} 
            viewLength={this.props.store.ui.viewLength} 
            songLength={this.props.store.getSongLength()} 
            bpm={this.props.store.settings.bpm} 
            /* notes={this.props.store.getNotesByTrack(track.id)} */ 
            selectedScene={this.props.store.ui.selectedScene} 
            track={track} 
            selectedGroup={this.props.store.ui.selectedGroup}
            playbackRate={track.getPlaybackRate()} 
            selectedTrack={this.props.store.ui.selectedTrack} 
            selectedNote={this.props.store.ui.selectedNote} 
            selectedNoteValue={this.props.store.ui.getSelectedNoteValue()} 
            selectedPattern={this.props.store.ui.selectedPattern} 
            selectedPatternRes={this.props.store.ui.getSelectedPatternProp('resolution')} 
            selectedPatternNotes={this.props.store.ui.getSelectedPatternProp('notes')}
            selectedKey={this.props.store.ui.selectedKey}
            windowWidth={this.props.store.ui.windowWidth}
            />
        }
      }
  
      let tracks = this.props.store.tracks.filter(t => t.group === this.props.store.ui.selectedGroup && t.type !== "master" && t.type !== "instrument");
      let sizes = store.ui.getGridSizes();
      return (
        <div id="gridParent" style={{width: sizes.parent.width, left: sizes.parent.left}}>
          <div className="divBody" id="gridContainer" style={{width: sizes.container.width, left: sizes.container.left}}>
            <GridTimeline selectedScene={this.props.store.ui.selectedScene} ui={this.props.store.ui} windowWidth={this.props.store.ui.windowWidth}/>
            <div className="progressLine" id="playhead"></div>
            {  trackRow }
          </div>
          <div id="divGridButtonViewBG">
            { tracks.map((track, index) => <GridButton key={track.id} keyValue={track.id} store={this.props.store} sample={track.sample} region={track.returnRegion(track.region)}
              patterns={this.props.store.getPatternsByTrack(track.id)} scenes={this.props.store.scenes} rowIndex={index} mixMode={this.props.store.ui.mixMode}
              viewLength={this.props.store.ui.viewLength} bpm={this.props.store.settings.bpm} editNote={this.noteEdited} selectedTrack={this.props.selectedTrack}
              editMode={this.props.editMode}/>)
            }
         </div>
        </div>
      )
    }
  })

  const GridButton = observer(class GridButton extends Component {
    player;
    track;
    divProgress;
    tStart;
  
    componentDidMount(){
      this.track = store.getTrack(this.props.keyValue);
      let playerId = store.instruments.getPlayerByTrack(this.props.keyValue).id;
      this.player = ToneObjs.instruments.find(i => i.id === playerId).obj;
      let player = this.player;
      let self = this;

      this.drawWave();

      let divGridButton = document.getElementById('divGridButton_' + this.props.keyValue);
      this.divProgress = divGridButton.querySelector('.divGridButtonProgress');
      this.divProgress.addEventListener('animationend', this.animationEnded); 

      interact('#divGridButton_' + this.props.keyValue)
        .draggable({
          onmove: event => {
            let dx = (event.dx === undefined) ? 0 : event.dx;
            let dy = (event.dy === undefined) ? 0 : event.dy;
  
            let target = event.target,
                x = (parseFloat(target.getAttribute('data-x')) || 0) + dx,
                y = (parseFloat(target.getAttribute('data-y')) || 0) + dy;
  
            target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
  
            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
          },
          restrict: {
            restriction: 'parent',
            elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
          },
        })
        .on('down', event => {
          if(player && !this.props.store.ui.editMode){
            player.start(Tone.context.currentTime);

            let tNow = new Date().getTime(), percent = 0;
            let tDelta = ((this.tStart - tNow) / 1000) * -1;
            
            if(tDelta < player.buffer.duration)
              percent = (tDelta / player.buffer.duration) * 100

            this.tStart = new Date().getTime();

            //restarting animation after % played of duration seems to fix problems with animations not starting after ~80% complete
            if(player.state === 'started' || (percent > 80 && percent < 99)){
              this.divProgress.style.animation = 'none';
              window.requestAnimationFrame(time => {
                window.requestAnimationFrame(time => {
                  this.divProgress.style.animation = 'progressWidth ' + player.buffer.duration + 's linear';
                });
              });
            }
            else{
              this.divProgress.style.animation = 'progressWidth ' + player.buffer.duration + 's linear';
            }

            
          }
  
          //testing recording shizzzz.  check latencyHint for responsiveness?
          if(Tone.Transport.state === "started" && self.props.store.ui.recordMode){
            let currScene = store.getSceneByTime(Tone.Transport.position);
            if(currScene){
              let pattern = store.getPatternByTrackScene(self.track.id, currScene.id);
              if(pattern){
                //is this affected by transport start offset?
                let t = Tone.Time(Tone.Transport.position).quantize(pattern.resolution + "n");
                t = Tone.Time(t).toBarsBeatsSixteenths();
                
                if(!pattern.getNote(t))
                  pattern.addNote(t, false);
                else
                  pattern.getNote(t).toggle();
  
                self.props.editNote();
              }
            }
          }
        

          if(self.props.store.ui.selectedTrack !== self.track)
            self.props.store.ui.selectTrack(self.props.keyValue);
  
          event.preventDefault();
        });

        interact('#divGridButton_' + this.props.keyValue).draggable(this.props.editMode);
    }
  
    componentDidUpdate(prevProps){
      if(prevProps.region && this.props.region){
        if(prevProps.region.start !== this.props.region.start 
          || prevProps.region.end !== this.props.region.end){
          this.drawWave();
        }
      }
  
      if(prevProps.editMode !== this.props.editMode)
        interact('#divGridButton_' + this.props.keyValue).draggable(this.props.editMode);
    }

    componentWillUnmount(){
      interact('#divGridButton_' + this.props.keyValue).unset();
      this.divProgress.removeEventListener('animationend', this.animationEnded);
    }

    animationEnded = (e) => {
      e.target.style.animation = 'none';
      //browsePlayer.stop();
    }
  
    drawWave = () => {
      let eleButton = document.getElementById('divGridButton_' + this.props.keyValue);
      
      this.ensureBufferIsLoaded(this.player.buffer).then(() => {
        interact('#divGridButton_' + this.props.keyValue).fire({type: 'dragmove', target: eleButton});
        renderSVG(this.player.buffer.toArray(0), eleButton, 100, 100);
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

    /*
    handleClick = (e) => {
      if(this.player)
        this.player.start(Tone.context.currentTime);
      
        //e.stopPropagation();
        //e.preventDefault();
    }
    */

    render() {
      let strClass = "divGridButton";
      if(this.props.selectedTrack){
        if(this.props.selectedTrack.id === this.props.keyValue)
          strClass = "divGridButtonSelected";
      }
  
      return(
        <div id={'divGridButton_' + this.props.keyValue} className={strClass}>
          <div className={'divGridButtonProgress'}></div>
        </div>
      )
    }
  })
  