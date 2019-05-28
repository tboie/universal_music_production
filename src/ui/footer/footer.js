import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { ToneObjs } from '../../models/models.js';
import { store } from "../../data/store.js";
import { toggleFullScreen } from "../utils.js";


export const FooterView = observer(class FooterView extends Component{
    playing = false;
    tempoMode;
    metronome;
  
    componentDidMount(){
      this.tempoMode = "bpm";
      document.getElementById('lblTempo').innerHTML = this.props.bpm;
      document.getElementById('tempoSlider').value = this.props.bpm;
    }
  
    componentDidUpdate(prevProps, prevState, snapshot){
      this.tempoMode = "bpm";
      document.getElementById('lblTempo').innerHTML = this.props.bpm;
      document.getElementById('tempoSlider').value = this.props.bpm;
    }
    
    toggleRecordMode = () => {
      store.ui.toggleRecordMode();
    }
  
    toggleMixMode = () => {
      store.ui.toggleMixMode();
    }
  
    toggleViewMode = (e) => {
      store.ui.toggleViewMode();
    }
  
    toggleFS = (e) => {
      let icon = document.getElementById('btnFS').children[0]
      if(icon){
        if(icon.innerHTML === "fullscreen")
          icon.innerHTML = "fullscreen_exit"; 
        else
          icon.innerHTML = "fullscreen";
      }
      
      toggleFullScreen();
  
      store.ui.calibrateSizes();
    }
  
    toggleSlider = (e) => {
      if(e.target.innerHTML === "BPM"){
        e.target.innerHTML = "Swng";
        document.getElementById('tempoSlider').setAttribute("min", 0);
        document.getElementById('tempoSlider').setAttribute("max", 100);
        document.getElementById('tempoSlider').setAttribute("step", 1);
  
        let val = parseInt(this.props.store.settings.swing * 100, 10);
        document.getElementById('tempoSlider').value = val;
        document.getElementById('lblTempo').innerHTML = val + '%';
        this.tempoMode = "swing";
      }
      else {
        e.target.innerHTML = "BPM";
        document.getElementById('tempoSlider').setAttribute("min", 60);
        document.getElementById('tempoSlider').setAttribute("max", 180);
        document.getElementById('tempoSlider').setAttribute("step", 0.5);
        document.getElementById('tempoSlider').value = this.props.store.settings.bpm;
        document.getElementById('lblTempo').innerHTML = this.props.store.settings.bpm;
        this.tempoMode = "bpm";
      }
    }
  
    toggleSettings = (e) => {
      this.props.store.ui.toggleSettings();
    }
  
    tempoChange = (e) => {
      if(this.tempoMode === "bpm"){
        let val = Number(e.target.value);
        store.settings.setBPM(val);
        document.getElementById('lblTempo').innerHTML = e.target.value;
      }
      if(this.tempoMode === "swing"){
        let val = Number(e.target.value / 100);
        store.settings.setSwing(val);
        document.getElementById('lblTempo').innerHTML = e.target.value + '%';
      }
    }
  
    togglePlay = (e) => {
      e.stopPropagation();
      let icon = document.getElementById('iconPlay');
  
      if(this.playing === false){
        Tone.Transport.position = this.props.store.settings.loopStart;
        Tone.Transport.start("+0.1");
        icon.innerHTML = "stop";
      }
      else{
        Tone.Transport.stop();
        
        ToneObjs.instruments.forEach(instrument => {
          let name = instrument.id.split('_')[0];
          if(name === "player"){
            instrument.obj.stop();

            //stop gridbutton animations
            if(store.ui.viewMode === 'button'){
              if(store.ui.selectedTrack.id === instrument.track){
                let divGridButton = document.getElementById('divGridButton_' + instrument.track);
      
                if(divGridButton){
                  let divProgress = divGridButton.querySelector('.divGridButtonProgress');
                  
                  if(divProgress){
                      divProgress.style.animation = 'none';
                  }
                }
              }
            }
          }
          else if(name !== "noisesynth" && name !== "plucksynth" && name !== "membranesynth" && name !== "metalsynth"){
            instrument.obj.releaseAll();
          }
          else{
            instrument.obj.triggerRelease();
          }
        })
        ToneObjs.sources.forEach(source => {
          source.obj.stop();
        })
        
        //TODO: effect/components to stop? autofilter etc?
  
        icon.innerHTML = "play_arrow";
      }
  
      this.playing = !this.playing;
    }
  
    endSlider = (e) => {
      //console.log('endSlide');
    }
  
    render(){
      let height = 40;
      let vDisplay = {display:'none'};
      if(this.props.store.ui.settings){
        height = 80;
        vDisplay = {display:'block'};
      }
  
      let iconView;
      if(this.props.viewMode !== "edit")
        (this.props.viewMode === "button") ? iconView = "reorder" : iconView = "view_module";
      else
        (this.props.viewMode === "sequencer") ? iconView = "view_module" : iconView = "reorder";
  
      let iconRed = '';
      if(this.props.store.ui.recordMode)
        iconRed = ' colorRed';
      
      return (
        <div id="divFooter" className="divFooter" style={{height:height + 'px', width: this.props.store.ui.windowWidth + 'px'}}>
          <div className="divTransportControls">
            { /* <button onClick={this.toggleMixMode} style={{position:'absolute', left:0 , height:'100%', backgroundColor:'transparent', border:0}}><i className="material-icons">assessment</i></button> */ }
            <button onClick={this.toggleViewMode} style={{position:'absolute', left:'0px' , height:'100%', backgroundColor:'transparent', border:0}}><i className="material-icons i-36">{iconView}</i></button>
            <button id="btnTransportToggleRecord" onClick={this.toggleRecordMode} style={{height:'100%', width:'50px', backgroundColor:'transparent', border:0}}><i id="iconRecord" className={"material-icons i-36" + iconRed}>fiber_manual_record</i></button>
            <button id="btnTransportTogglePlay" onClick={this.togglePlay} style={{height:'100%', width:'50px', backgroundColor:'transparent', border:0}}><i id="iconPlay" className="material-icons i-36">play_arrow</i></button>
            <button onClick={this.toggleSettings} style={{position:'absolute', right:0 , height:'100%', backgroundColor:'transparent', border:0}}><i className="material-icons i-36">settings_applications</i></button>
          </div>
          <div className="divFooterSettings" style={vDisplay}>
            <button id="btnFS" onClick={this.toggleFS}><i className="material-icons i-36">fullscreen</i></button>
            <label id="lblTempo"/>
            <div style={{position:'relative', marginLeft:'50px', marginRight:'60px'}}> 
              <input type="range" min="60" max="180" id="tempoSlider" step="0.5" onChange={this.tempoChange} onMouseUp={this.endSlide} onTouchEnd={this.endSlide}/>
            </div>
            <button id="btnToggleTempoSlider" onClick={this.toggleSlider}>BPM</button>
          </div>
        </div>
      )
    }
  });