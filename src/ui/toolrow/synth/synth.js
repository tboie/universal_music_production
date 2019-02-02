import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from "../../../data/store.js";
import { Note, Scale, Chord } from "tonal";
import { ToneObjs } from "../../../models/models.js";
import noUiSlider from 'nouislider';

export const ToolSynth = observer(class ToolSynth extends Component {
    arrayOctave;
    mouseDown;
    bTouched;
    selectedElement; // used for touch events
    selectedKey;
    arrayChords;
    selectedChord;
    slider;
  
    componentDidMount(){
      this.mouseDown = false;
      this.setupKeys();
      this.setupSlider();
    }
  
    componentDidUpdate(prevProps, prevState, snapshot){
      this.setupKeys();
  
      //don't update if the height changed
      if(prevProps.height === this.props.height)
        this.setupSlider();
    }
    componentWillUnmount(){
      if(this.slider)
        this.slider.noUiSlider.destroy();
    }
  
    setupKeys = (keys) => {
      let rows = document.getElementsByClassName('divSynthRow');
  
      for(let k=0; k<rows.length; k++){
  
        let eles = rows[k].getElementsByClassName('divSynthKey');
        for(let i=0; i< eles.length; i++){
          eles[i].innerHTML = eles[i].id; 
  
          if(Chord.notes(eles[i].id, this.selectedChord).length > 0 || !this.selectedChord){
            eles[i].style.visibility = 'visible';
  
            if(store.ui.selectedKey === eles[i].id){
              eles[i].style.backgroundColor = '#181f87';
            }
            else if(this.arrayOctave[i].length >= 2){
              eles[i].style.backgroundColor = 'black';
            }
            else{
              eles[i].style.backgroundColor = 'white';
            }
          }
          else{
            eles[i].style.visibility = 'hidden';
          }
        }
      }
    }
  
    keyDown = (e, dragged) => {
      //e.stopPropagation();
      e.preventDefault();
  
      let self = this;
      let ele = e.target;
      
      if(!dragged){
        if(e.type === "touchstart"){
          this.selectedElement = e.target;
          this.bTouched = true;
        }
        else{
          this.mouseDown = true;
        }
      }
      else {
        if(this.bTouched){
          ele = this.selectedElement;
        }
      }
      
      //console.log('keydown ' + ele.id)
      let notes = [];
      
      if(!this.selectedChord)
        notes[0] = ele.id;
      else
        notes = ele.dataset.notes.split(',');
  
      if(this.props.selectedTrack){
        ToneObjs.instruments.filter(o => o.track === this.props.selectedTrack.id).forEach(function(row){
          if(row.obj){
            let type = row.id.split('_')[0];
  
            if(type === 'metalsynth'){
              row.obj.frequency.setValueAtTime(notes[0], undefined, Math.random()*0.5 + 0.5);
              row.obj.triggerAttack(undefined, 1);
            }
            else if(type === 'noisesynth'){
              row.obj.triggerAttack();
            }
            else if(type === 'plucksynth' || type === 'membranesynth'){
              row.obj.triggerAttack(Note.freq(notes[0]));
            }
            else if(type !== 'player'){
              row.obj.triggerAttack(notes.map(n => Note.freq(n)));
            }
          }
        });
        ToneObjs.sources.filter(o => o.track === this.props.selectedTrack.id).forEach(function(row){
          if(row.obj){
            if(row.id.split('_')[0] !== 'noise')
              row.obj.frequency.value = Note.freq(notes[0]);
  
            row.obj.start();
          }
        });
        ToneObjs.custom.filter(o => o.track === this.props.selectedTrack.id).forEach(function(row){
          if(row.obj){
            let ch = store.instruments.getInstrumentByTypeId("tinysynth", row.id).channel;
  
            if(!self.selectedChord){
              let noteNum = Note.midi(notes[0]); //C4 is 60
              row.obj.send([0x90 + ch, noteNum, 100], Tone.context.currentTime)
            }
            else{
              notes.forEach(n => {
                let midi = Note.midi(n)
                if(midi)
                  row.obj.send([0x90 + ch, midi, 100], Tone.context.currentTime)
              })
            }
          }
        });
      }
  
      ele.style.backgroundColor = '#2671ea';//'#181f87';
  
      //reset previous selectedkey color
      if(store.ui.selectedKey){
        if(store.ui.selectedKey !== e.target.id){
          let key = document.getElementById(store.ui.selectedKey);
          if(key){
            if(key.id.length > 2)
              key.style.backgroundColor = 'black';
            else
              key.style.backgroundColor = 'white';
          }
        }
      }
  
      if(store.ui.selectedNote){
        store.ui.selectedNote.setNote(notes)
      }
      
      //hacky way to trigger when same key is set to trackview
      if(store.ui.selectedKey === notes[0])
        store.ui.selectKey('');
  
      store.ui.selectKey(notes[0]);
    }
    
    keyUp = (e, dragged) => {
      //e.stopPropagation();
      e.preventDefault();
  
      let self = this;
      let ele = e.target;
  
      if(!dragged){
        if(e.type === "touchend"){
          this.bTouched = false;
  
          //touchend always called, setting final element
          if(this.selectedElement)
            ele = this.selectedElement;
        }
        else{
          this.mouseDown = false;
        }
      }
      else if(this.bTouched){
        ele = this.selectedElement;
      }
  
      //console.log('keyup ' + ele.id)
  
      let notes = [];
    
      if(!this.selectedChord)
        notes[0] = ele.id;
      else
        notes = ele.dataset.notes.split(',');
      
      if(this.props.selectedTrack){
        ToneObjs.instruments.filter(o => o.track === this.props.selectedTrack.id).forEach(function(row){
          if(row.obj){
            let type = row.id.split('_')[0];
  
            if(type === "metalsynth" || type === "membranesynth" || type === "noisesynth"){
              row.obj.triggerRelease();
            }
            else if(type !== "player" && type !== "plucksynth"){
              row.obj.releaseAll();
            }
          }
        });
        ToneObjs.sources.filter(o => o.track === this.props.selectedTrack.id).forEach(function(row){
          if(row.obj){
            row.obj.stop();
          }
        });
        ToneObjs.custom.filter(o => o.track === this.props.selectedTrack.id).forEach(function(row){
          if(row.obj){ 
            let ch = store.instruments.getInstrumentByTypeId("tinysynth", row.id).channel;
  
            if(!self.selectedChord){
              let noteNum = Note.midi(notes[0]); //C4 is 60
              row.obj.send([0x80 + ch, noteNum, 0], Tone.context.currentTime)
            }
            else{
              notes.forEach(n => {
                let midi = Note.midi(n)
                if(midi)
                  row.obj.send([0x80 + ch, midi, 0], Tone.context.currentTime)
              })
            }
          }
        });
      }
  
      //reset color
      if(dragged){
        if(ele.id.length > 2)
          ele.style.backgroundColor = 'black';
        else
          ele.style.backgroundColor = 'white';
      }
      else{
        if(store.ui.selectedKey === ele.id)
          ele.style.backgroundColor = '#181f87';
      }
    }
  
    mouseLeaveKey = (e) => {
      //e.stopPropagation();
      //e.preventDefault();
  
      if(this.mouseDown && !this.bTouched)
        this.keyUp(e, true);
    }
  
    mouseLeaveContainer = (e) => {
      //e.stopPropagation();
      //e.preventDefault();
  
      if(this.mouseDown && !this.bTouched){
        this.keyUp(e, true);
        this.mouseDown = false;
      }
    }
  
    mouseEnterKey = (e) => {
      //e.stopPropagation();
      //e.preventDefault();
    
      if(this.mouseDown && !this.bTouched){
        this.keyDown(e, true);
      }
    }
  
    touchMove = (e) => {
      //e.stopPropagation();
      e.preventDefault(); //prevents offset on ios safari
  
      if(!this.selectedElement)
        this.selectedElement = e.target;
  
      let hoverKey = document.elementFromPoint(e.touches[0].pageX, e.touches[0].pageY);
  
      if(this.selectedElement && hoverKey){
        if(this.selectedElement.id !== hoverKey.id && hoverKey.parentNode.className === "divSynthRow"){
          this.keyUp(e, true);
          this.selectedElement = hoverKey;
          this.keyDown(e, true);
        }
      }
    }
  
    setupSlider = () => {
      let self = this;
  
      if(!this.slider){
        this.slider = document.getElementById('sliderToolChorus');
  
        let chordIdx = this.arrayChords.indexOf(store.ui.selectedChord);
        if(chordIdx > -1)
          self.selectedChord = this.arrayChords[chordIdx]
        else
          self.selectedChord = 'none';
  
        let maxChords = 1;
        if(this.arrayChords.length > 0){
          maxChords = this.arrayChords.length;
          this.slider.disabled = false;
        }
        else {
          this.slider.disabled = true;
        }
      
        noUiSlider.create(this.slider, {
          start: self.selectedChord,
          step: 1,
          range: {
              'min': 0,
              'max': maxChords
          },
          /*
          pips: {
            mode: 'steps',
            density: 100/maxChords
          },
          */
          tooltips: true,
          format: {
            to: function (value) {
              let val = parseInt(value, 10)
              if(val) 
                return self.arrayChords[val-1]
              else
                return 'none'
            },
            from: function (value) {
              return self.arrayChords.indexOf(value) + 1;
            }
        }
        });
  
        this.slider.noUiSlider.on('update', function ( values, handle ) {
          let val = values[handle];
          if(val === "none")
            val = undefined;
  
          if(self.selectedChord !== val){
            self.selectedChord = val;
  
            if(store.ui.selectedChord !== self.selectedChord)
              store.ui.selectChord(self.selectedChord);
          }
        });

        //move tooltip up & down on start/end
        let eleToolTip = document.querySelector('#sliderToolChorus .noUi-tooltip');

        this.slider.noUiSlider.on('start', () => {
          eleToolTip.style.bottom = '34px';
        })
        this.slider.noUiSlider.on('end', () => {
          eleToolTip.style.bottom = '3px';
        })
      }
      else{
          let maxChords = 1;
          if(this.arrayChords.length > 0){
            maxChords = this.arrayChords.length;
            this.slider.disabled = false;
          }
          else {
            this.slider.disabled = true;
          }
  
          this.slider.noUiSlider.updateOptions({range: {'min': 0,'max': maxChords}});
      }
    }
  
    render(){
      let self =  this;
      
      if(this.arrayOctave !== Scale.notes(this.props.scaleKey, this.props.scale))
        this.arrayOctave = Scale.notes(this.props.scaleKey, this.props.scale);
      
      //TODO: 64 chord notes don't contain key note in array...
      if(this.arrayChords !== Scale.chords(this.props.scale).filter(c => c !== "64"))
        this.arrayChords = Scale.chords(this.props.scale).filter(c => c !== "64");
      
      let height = this.props.height.replace('px','');
      let numRows = Math.floor(height / 50);
  
      //TODO: only update if rows change?
      if(numRows === 0)
        numRows = 1;
      else if(numRows > 8)
        numRows = 8;
  
      let rows = [];
  
      //this could be improved
      let startRow = 3;
      if(numRows >= 2)
        startRow = 2;
      if(numRows >= 4)
        startRow = 1;
      if(numRows >= 6)
        startRow = 0;
      
      for(let i=0; i<numRows; i++){
        rows.push(
            Scale.notes(this.props.scaleKey + (i + startRow), this.props.scale).map((note, index) => 
            <div key={index} id={note} className="divSynthKey" data-notes={Chord.notes(note, this.selectedChord)} style={{touchAction: 'manipulation', width: (100 / self.arrayOctave.length) + '%', color:'gray',  textAlign:'center'}}
              onMouseDown={this.keyDown} onMouseUp={this.keyUp} 
              onTouchStart={this.keyDown} onTouchEnd={this.keyUp} 
              onMouseEnter={this.mouseEnterKey} onMouseLeave={this.mouseLeaveKey} >
            </div>
          ) 
        )
      }
  
      return(
        <div id="divSynthContainer" style={{width:'100%', height:'100%'}}>
          <div id="divToolSynthHeader" style={{height:'30px', width:'100%', backgroundColor:'darkgray'}}>
            <div id='sliderToolChorus'></div>
          </div>
          <div id="divSynthContainerKeys" onTouchMove={this.touchMove} onMouseLeave={this.mouseLeaveContainer} style={{width:'100%', height:'calc(100% - 30px)'}}>
            { rows.map((row, index) => <div key={index} className="divSynthRow" style={{height: (100/numRows) + '%', width:'100%'}}>{row}</div>) }
          </div>
        </div>
      )
    }
  })