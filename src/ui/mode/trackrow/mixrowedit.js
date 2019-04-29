import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { MixMeters } from './mixrow.js';


export const MixRowViewEdit = observer(class MixRowViewEdit extends Component{
    player;
    panvol;
    mixSelection = "Vel";
    bPressed;
  
    componentDidMount(){
      this.applyTransformOffset();
    }
    
    componentWillUnmount(){}

    componentDidUpdate(prevProps){
      if(prevProps.viewLength !== this.props.viewLength){
        this.applyTransformOffset();
      }
    }

    applyTransformOffset = () => {
      let gridContainer = document.getElementById('gridContainer');
      if(gridContainer){
        let transformX = gridContainer.getAttribute('data-x') * -1;
        document.getElementById('trackrowmixedit_' + this.props.track.id).style.transform = 'translateX(' + transformX + 'px)';
      }
    }
  
    selectMixButton = (e) => {
      e.preventDefault();
      e.stopPropagation();
  
      this.mixSelection = e.target.id.split('_')[1];
  
      let btns = e.target.parentElement.children;
      for(let i=0; i<btns.length; i++){
        if(btns[i].id.split('_')[1] !== this.mixSelection){
          btns[i].className = 'btn-mix';
        }
        else{
          btns[i].className = 'btn-mix btnSelected';
        }
      }
  
      this.forceUpdate();
    }
  
    changeSlider = (e) => {
      e.preventDefault();
      e.stopPropagation();
  
      if(this.mixSelection === "Vel"){
        this.props.note.setVelocity(parseFloat(e.target.value));
      }
      else if(this.mixSelection === "Prb"){
        this.props.note.setProbability(parseFloat(e.target.value));
      }
      else if(this.mixSelection === "Dur"){
        if(this.props.track.type === "audio"){
          this.props.note.setDuration(parseFloat(e.target.value));
          this.props.noteChanged();
        }
        else{
          let noteDelta = Tone.Time(this.props.note.getPattern().getLength()) - Tone.Time(this.props.note.time);
          let notation = Tone.Time(noteDelta * parseFloat(e.target.value)).toBarsBeatsSixteenths();
          let offsetTime = this.props.note.offset * Tone.Time(this.props.note.getPattern().resolution + 'n');
  
          if(Tone.Time(notation) - Tone.Time(offsetTime) > 0){
            this.props.note.setDuration(notation);
            this.props.noteChanged();
          }
        }
      }
      else if(this.mixSelection === "Dly"){
        let offsetTime = this.props.note.offset * Tone.Time(this.props.note.getPattern().resolution + 'n');
  
        if(Tone.Time(this.props.note.duration) > Tone.Time(offsetTime)){
          this.props.note.setOffset(parseFloat(e.target.value));
          this.props.noteChanged();
        }
      }
  
      let btn = document.getElementById("btnMixNote_" + this.mixSelection);
  
      if(this.bPressed)
        btn.innerHTML = e.target.value;
      else
        btn.innerHTML = this.mixSelection;
    }
  
    onPressDown = (e) => {
      e.stopPropagation();
  
      this.bPressed = true;
      let btn = document.getElementById("btnMixNote_" + this.mixSelection);
      btn.innerHTML = e.target.value;
    }
  
    onPressUp = (e) => {
      e.stopPropagation();
  
      this.bPressed = false;
      let btn = document.getElementById("btnMixNote_" + this.mixSelection);
      btn.innerHTML = this.mixSelection;
    }
  
    getSlider = () => {
      let eleSlider = null;
  
      //TODO: 1 slider, change attributes on selection
      switch (this.mixSelection) {
        case "Vel":
          if(this.props.track.type === "audio")
            eleSlider = <input type="range" min="-40" max="0" value={this.props.note.velocity} className="trackMixSlider" step="0.05" id={"velSlider" + this.props.trackId} 
                            onChange={this.changeSlider} onInput={this.changeSlider} onMouseDown={this.onPressDown} onMouseUp={this.onPressUp} onTouchStart={this.onPressDown} onTouchEnd={this.onPressUp}/>;
          else
            eleSlider = <input type="range" min="0" max="1" value={this.props.note.velocity} className="trackMixSlider" step="0.01" id={"velSlider" + this.props.trackId} 
                            onChange={this.changeSlider} onInput={this.changeSlider} onMouseDown={this.onPressDown} onMouseUp={this.onPressUp} onTouchStart={this.onPressDown} onTouchEnd={this.onPressUp}/>;
          break;
        case "Prb":
          eleSlider = <input type="range" min="0" max="1" value={this.props.note.probability} className="trackMixSlider" step="0.01" id={"velSlider" + this.props.trackId} 
                            onChange={this.changeSlider} onInput={this.changeSlider} onMouseDown={this.onPressDown} onMouseUp={this.onPressUp} onTouchStart={this.onPressDown} onTouchEnd={this.onPressUp}/>;
          break;
        /*
        case "Hum":
          eleSlider = <input type="range" min="0" max="1" value={this.props.note.humanize} className="trackMixSlider" step="0.01" id={"velSlider" + this.props.trackId} 
                            onChange={this.changeSlider} onInput={this.changeSlider} onMouseDown={this.onPressDown} onMouseUp={this.onPressUp} onTouchStart={this.onPressDown} onTouchEnd={this.onPressUp}/>;
          break;
        */
        case "Dur":
          if(this.props.track.type === "audio")
            eleSlider = <input type="range" min="0.01" max="1" value={this.props.note.duration} className="trackMixSlider" step="0.01" id={"velSlider" + this.props.trackId} 
                            onChange={this.changeSlider} onInput={this.changeSlider} onMouseDown={this.onPressDown} onMouseUp={this.onPressUp} onTouchStart={this.onPressDown} onTouchEnd={this.onPressUp}/>;
          else{
            let patternLen = Tone.Time(this.props.note.getPattern().getLength()).toBarsBeatsSixteenths();
            let noteDelta = Tone.Time(patternLen) - Tone.Time(this.props.note.time);
            let stepLen = (1 / (Tone.Time(noteDelta) / Tone.Time("64n"))).toFixed(6);
            let currVal = (Tone.Time(this.props.note.duration) / Tone.Time(noteDelta)).toFixed(6);
            eleSlider = <input type="range" min={stepLen} value={currVal} max="1" className="trackMixSlider" step={stepLen} id={"velSlider" + this.props.trackId} 
                            onChange={this.changeSlider} onInput={this.changeSlider} onMouseDown={this.onPressDown} onMouseUp={this.onPressUp} onTouchStart={this.onPressDown} onTouchEnd={this.onPressUp}/>;
          }
          break;
        case "Dly":
          eleSlider = <input type="range" min="0" max="0.99" value={this.props.note.offset} className="trackMixSlider" step="0.01" id={"velSlider" + this.props.trackId} 
                            onChange={this.changeSlider} onInput={this.changeSlider} onMouseDown={this.onPressDown} onMouseUp={this.onPressUp} onTouchStart={this.onPressDown} onTouchEnd={this.onPressUp}/>;
          break;
        case "Spd":
          eleSlider = <input disabled={true} type="range" min="0.01" max="3" value={1} className="trackMixSlider" step="0.01" id={"velSlider" + this.props.trackId} 
                            onChange={this.changeSlider} onInput={this.changeSlider} onMouseDown={this.onPressDown} onMouseUp={this.onPressUp} onTouchStart={this.onPressDown} onTouchEnd={this.onPressUp}/>
          break;
        default:
          eleSlider = null;
          break;
        /*
        default:
          eleSlider = <input type="range" min="-40" max="10" value={0} className="trackMixSlider" step="0.05" id={"velSlider" + this.props.trackId} 
                            onChange={this.changeSlider} onInput={this.changeSlider} onMouseDown={this.onPressDown} onMouseUp={this.onPressUp} onTouchStart={this.onPressDown} onTouchEnd={this.onPressUp}/>;
        */
        }
  
      return eleSlider;
    }
  
    render(){
      return (
        <div className="track-rowmix" id={'trackrowmixedit_' + this.props.track.id} style={{width: + this.props.store.ui.windowWidth}}>
          <div className="track-rowmix-left">
            <button id="btnMixNote_Vel" className="btn-mix btnSelected" onClick={this.selectMixButton}>Vel</button>
            <button id="btnMixNote_Dur" className="btn-mix" onClick={this.selectMixButton}>Dur</button>
            <button id="btnMixNote_Dly" className="btn-mix" onClick={this.selectMixButton}>Dly</button>
            <button id="btnMixNote_Prb" className="btn-mix" onClick={this.selectMixButton}>Prb</button>
            <button id="btnMixNote_Spd" className="btn-mix" disabled={true} onClick={this.selectMixButton}>Spd</button>
          </div>
          <div className="track-rowmix-right">
            <MixMeters track={this.props.track}/>
            <div style={{marginLeft:'10px', marginRight:'10px'}}>
              { this.getSlider() }
            </div>
          </div>
        </div>
      )
    }
  })
  