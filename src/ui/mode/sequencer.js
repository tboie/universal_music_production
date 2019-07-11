import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from "../../data/store.js";
import interact from 'interactjs';
import { ToneObjs } from '../../models/models.js';
import { applyDraggableGrid } from '../utils.js';
import { TrackRowView } from './trackrow/trackrow.js';
import { GridTimeline } from './timeline/timeline.js';

export const SequencerView = observer(class SequencerView extends Component {

    componentDidMount(){
      applyDraggableGrid();
      this.props.store.ui.calibrateSizes();
      document.addEventListener('keydown', this.keyDown);
    }
  
    keyDown = (event) => {
      const keysA = ['1','2','3','4','5','6','7','8','9','0','-','='];
      const keysB = ['q','w','e','r','t','y','u','i','o','p','[',']'];
      const keysC = ['a','s','d','f','g','h','j','k','l',';','\''];
      const keysD = ['z','x','c','v','b','n','m',',','.','/',',','.','/'];
  
      let idx, group;
      let key = event.key.toString().toLowerCase();
  
      if(keysA.some(function(item, index) { idx = index; return item === key }))
        group = 'A';
      else if(keysB.some(function(item, index) { idx = index; return item === key }) )
        group = 'B';
      else if(keysC.some(function(item, index) { idx = index; return item === key }) )
        group = 'C';
      else if(keysD.some(function(item, index) { idx = index; return item === key }) )
        group = 'D';
      else{
        idx = null;
        group = null;
      }
  
      //very careful with null checks here to avoid errors
      if(!isNaN(idx) && group){
        let tracks = this.props.store.tracks.filter(t => t.group === group && t.type === 'audio');
        let track = tracks[idx];
  
        tracks.forEach(function(t) {
          let toneInst = ToneObjs.instruments.find(o => o.track === t.id);
          
          if(toneInst){
            let player = toneInst.obj;
  
            if(player)
              player.stop();
          }
        })
  
        if(track){
          let toneInst = ToneObjs.instruments.find(inst => inst.track === track.id);
  
          if(toneInst){
            let player = toneInst.obj;
  
            if(player)
              player.start(Tone.context.currentTime);
  
            store.ui.selectTrack(track.id);
          }
        }
      }
    }
  
    componentWillUnmount(){
      interact(document.querySelector('body')).unset();
      interact('#gridContainer').unset();
      document.removeEventListener('keydown', this.keyDown);
    }
  
    componentDidUpdate(prevProps, prevState, snapshot){
     // if(this.props.mixMode)
        //interact('#gridContainer').fire({type: 'dragmove', target: document.getElementById('gridContainer')});
  
      if(prevProps.numTracks !== this.props.numTracks || prevProps.windowHeight !== this.props.windowHeight){
        store.ui.calibrateSizes(true);
      }
      //console.log('sequencerview updated')
      //interact('#divGridButton_' + self.props.keyValue).fire({type: 'dragmove', target: eleButton});
    }

    
    render() {
      let tracks;
      if(this.props.selectedGroup === "M"){
        tracks = this.props.store.tracks.filter(t => t.type === 'master')
      }
      else{
        //tracks = this.props.store.tracks.filter(t => (t.group === this.props.selectedGroup && t.type !== 'master'));
        tracks = this.props.store.getTracksByGroup(this.props.selectedGroup);
      }
  
      let sizes = store.ui.getGridSizes();
      return (
        <div id="gridParent" style={{width: sizes.parent.width, left: sizes.parent.left}}>
          <div className="divBody" id="gridContainer" style={{width: sizes.container.width, left: sizes.container.left}}>
            <GridTimeline selectedScene={this.props.store.ui.selectedScene} ui={this.props.store.ui} windowWidth={this.props.store.ui.windowWidth}/>
            <div className="progressLine" id="playhead"></div>
              { tracks.map((track, index) => <TrackRowView key={track.id} keyValue={track.id} 
                  store={this.props.store} 
                  sample={track.sample} 
                  region={track.returnRegion()} 
                  patterns={this.props.store.getPatternsByTrack(track.id)} 
                  scenes={this.props.store.getScenesAsc()} 
                  rowIndex={index} 
                  mixMode={this.props.store.ui.mixMode} 
                  viewLength={this.props.store.ui.viewLength} 
                  songLength={this.props.store.getSongLength()} 
                  bpm={this.props.store.settings.bpm} 
                  selectedScene={this.props.store.ui.selectedScene} 
                  /*notes={this.props.store.getNotesByTrack(track.id)}*/ 
                  track={track} 
                  selectedGroup={this.props.selectedGroup} 
                  playbackRate={track.getPlaybackRate} 
                  selectedTrack={this.props.store.ui.selectedTrack} 
                  selectedNote={this.props.store.ui.selectedNote} 
                  selectedNoteValue={this.props.store.ui.getSelectedNoteValue()} 
                  selectedNoteVelocity={this.props.store.ui.getSelectedNoteVelocity}
                  selectedPattern={this.props.store.ui.selectedPattern} 
                  selectedPatternRes={this.props.store.ui.getSelectedPatternProp('resolution', track)} 
                  selectedPatternNotesLen={this.props.store.ui.getSelectedPatternProp('notes', track)}
                  selectedKey={this.props.store.ui.selectedKey}
                  windowWidth={this.props.store.ui.windowWidth}
                  />) 
              }
          </div>
        </div>
      )
    }
  })