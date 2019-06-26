import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { ToneObjs } from '../../models/models.js';
import { store } from "../../data/store.js";


export const FooterView = observer(class FooterView extends Component{
    playing = false;
    tempoMode;
    metronome;
  
    componentDidMount(){
      this.tempoMode = "bpm";
      document.getElementById('lblTempo').innerHTML = this.props.bpm;
      document.getElementById('tempoSlider').value = this.props.bpm;

      document.getElementById('iViewMode').innerHTML = this.props.viewMode === 'button' ? 'reorder' : 'view_module';
    }
  
    componentDidUpdate(prevProps, prevState, snapshot){
      this.tempoMode = "bpm";
      document.getElementById('lblTempo').innerHTML = this.props.bpm;
      document.getElementById('tempoSlider').value = this.props.bpm;


      let eleIcon = document.getElementById('iViewMode');
      if(this.props.viewMode === 'manager' && prevProps.viewMode !== 'manager' 
        || this.props.viewMode === 'edit' && prevProps.viewMode !== 'edit'){

          if(prevProps.viewMode === 'button')
            eleIcon.innerHTML = 'view_module';
          else if(prevProps.viewMode === 'sequencer')
            eleIcon.innerHTML = 'reorder';
      }
      else if(this.props.viewMode === 'button')
        eleIcon.innerHTML = 'reorder';
      else if(this.props.viewMode === 'sequencer')
        eleIcon.innerHTML = 'view_module';
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
      this.props.store.ui.toggleSettings(true);
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
        if(store.ui.recordMode){
          Tone.Transport.start("+0.1", Tone.Time(store.settings.loopStart) - Tone.Time('1:0:0'));
        }
        else{
          Tone.Transport.start("+0.1", store.settings.loopStart);
        }

        icon.innerHTML = "stop";
      }
      else{
        Tone.Transport.stop();
        
        ToneObjs.instruments.forEach(instrument => {
          let name = instrument.id.split('_')[0];
          if(name === "player"){
            instrument.obj.stop();

            //delay stopping gridbutton animation for better results
            setTimeout(() => {
              if(store.ui.viewMode === 'button'){
                if(store.getTrack(instrument.track).group === store.ui.selectedGroup){
                  let divGridButton = document.getElementById('divGridButton_' + instrument.track);
        
                  if(divGridButton){
                    let divProgress = divGridButton.querySelector('.divGridButtonProgress');
                    
                    if(divProgress){
                        divProgress.style.animation = 'none';
                    }
                  }
                }
              }
            }, 100)
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

    hideBPMFooter = (e) => {
      store.ui.toggleSettings(false);
    }
  
    render(){
      let height = 40, vDisplay = {display:'none'};
      if(this.props.settings){
        height = 80;
        vDisplay = {display:'block'};
      }
  
      let iconRed = '';
      if(this.props.store.ui.recordMode)
        iconRed = ' colorRed';
      
      return (
        <div id="divFooter" className="divFooter" style={{height:height + 'px', width: this.props.store.ui.windowWidth + 'px'}}>
          <div className="divTransportControls">
            { /* <button onClick={this.toggleMixMode} style={{position:'absolute', left:0 , height:'100%', backgroundColor:'transparent', border:0}}><i className="material-icons">assessment</i></button> */ }
            <button onClick={this.toggleViewMode} style={{position:'absolute', left:'0px' , height:'100%', backgroundColor:'transparent', border:0}}><i id='iViewMode' className="material-icons i-36"></i></button>
            <button id="btnTransportToggleRecord" onClick={this.toggleRecordMode} style={{height:'100%', width:'50px', backgroundColor:'transparent', border:0}}><i id="iconRecord" className={"material-icons i-36" + iconRed}>fiber_manual_record</i></button>
            <button id="btnTransportTogglePlay" onClick={this.togglePlay} style={{height:'100%', width:'50px', backgroundColor:'transparent', border:0}}><i id="iconPlay" className="material-icons i-36">play_arrow</i></button>
            <button onClick={this.toggleSettings} style={{position:'absolute', right:0 , height:'100%', backgroundColor:'transparent', border:0}}><i className="material-icons i-36">settings_applications</i></button>
          </div>
          <div className="divFooterSettings" style={vDisplay}>
            <button id="btnToggleTempoSlider" onClick={this.toggleSlider}>BPM</button>
            <label id="lblTempo"/>
            <div style={{position:'relative', marginLeft:'55px', marginRight:'50px'}}> 
              <input type="range" min="60" max="180" id="tempoSlider" step="0.5" onChange={this.tempoChange} onMouseUp={this.endSlide} onTouchEnd={this.endSlide}/>
            </div>
            <button id="btnHideFooter" onClick={this.hideBPMFooter}><i className="material-icons i-36">arrow_drop_down_circle</i></button>
          </div>
        </div>
      )
    }
  });