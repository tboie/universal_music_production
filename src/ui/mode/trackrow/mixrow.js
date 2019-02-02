import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from "../../../data/store.js";
import interact from 'interactjs';

const MixMeters = observer(props =>
    <div>
      <canvas id={"canvas-L-" + props.trackId} className="canvasMeterL"></canvas>
      <canvas id={"canvas-R-" + props.trackId} className="canvasMeterR"></canvas>
    </div>
  )
  
export const MixRowView = observer(class MixRowView extends Component{
    player;
    panvol;
    solo;
    editView;
    muteColor;
    soloColor;
    groupColor;
    bPressed;
    mixSelection = "Vol";
  
    componentDidMount(){
      let self = this;
  
      interact('#btnMixEdit_' + this.props.trackId)
        .on('tap', function (event) { self.toggleEditView(event) });
      
      interact('#btnMixMute_' + this.props.trackId)
        .on('tap', function (event) { self.toggleMute(event) });
  
      interact('#btnMixSolo_' + this.props.trackId)
        .on('tap', function (event) { self.toggleSolo(event) });
  
      interact('#btnMixDelTrack_' + this.props.trackId)
        .on('tap', function (event) { self.deleteTrack(event) });
  
      interact('#btnMixToggleRes_' + this.props.trackId)
        .on('tap', function (event) { self.toggleResolution(event) });
      
      interact('#btnMixToggleGroup_' + this.props.trackId)
        .on('tap', function (event) { self.toggleGroup(event) });
  
      interact("#btnMixLevel_" + this.props.trackId)
        .on('tap', function (event) { self.toggleMixButton(event) });
    }
  
    componentWillUnmount(){
      interact('#btnMixEdit_' + this.props.trackId).unset();
      interact('#btnMixMute_' + this.props.trackId).unset();
      interact('#btnMixSolo_' + this.props.trackId).unset();
      interact('#btnMixDelTrack_' + this.props.trackId).unset();
      interact('#btnMixToggleRes_' + this.props.trackId).unset();
      interact('#btnMixToggleGroup_' + this.props.trackId).unset();
      interact("#btnMixLevel_" + this.props.trackId).unset();
    }
  
    changeSlider = (e) => {
      e.preventDefault();
      e.stopPropagation();
  
      if(this.mixSelection === "Vol")
        this.panvol.setPropVal('volume', parseFloat(e.target.value), true);
      else if(this.mixSelection === "Pan")
        this.panvol.setPropVal('pan', parseFloat(e.target.value), true);
      else if(this.mixSelection === "Spd")
        this.player.setPropVal('playbackRate', parseFloat(e.target.value));
  
      let btn = document.getElementById("btnMixLevel_" + this.props.trackId);
  
      if(this.bPressed)
        btn.innerHTML = e.target.value;
      else
        btn.innerHTML = this.mixSelection;
    }
  
    onPressDown = (e) => {
      e.stopPropagation();
  
      this.bPressed = true;
      let btn = document.getElementById("btnMixLevel_" + this.props.trackId);
      btn.innerHTML = e.target.value;
    }
  
    onPressUp = (e) => {
      e.stopPropagation();
  
      this.bPressed = false;
      let btn = document.getElementById("btnMixLevel_" + this.props.trackId);
      btn.innerHTML = this.mixSelection;
    }
  
    toggleEditView = (e) => {
      e.preventDefault();
      e.stopPropagation();
  
      store.ui.selectTrack(this.props.trackId);
      store.ui.toggleViewMode('edit');
    }
  
    toggleMute = (e) => {
      e.preventDefault();
      e.stopPropagation();
  
      this.props.track.toggleMute();
      this.panvol.setPropVal('mute', this.props.track.mute);
  
      let ele = document.getElementById('btnMixMute_' + this.props.trackId);
      (this.panvol.mute) ? ele.style.backgroundColor = '#2671ea' : ele.style.backgroundColor = '';
    }
  
    toggleSolo = (e) => {
      e.preventDefault();
      e.stopPropagation();
  
      let ele = document.getElementById('btnMixSolo_' + this.props.trackId);
      if(this.props.track.type === "master"){
        this.solo.setPropVal('solo', !this.solo.solo);
        (this.solo.solo) ? ele.style.backgroundColor = '#2671ea' : ele.style.backgroundColor = '';
      }
      else{
        this.props.track.toggleSolo();
        this.solo = this.props.track.solo;
        
        (this.solo) ? ele.style.backgroundColor = '#2671ea' : ele.style.backgroundColor = '';
      }
    }
  
    toggleMixButton = (e) => {
      e.preventDefault();
      e.stopPropagation();
    
      if(e.target.innerHTML === "Vol"){
        e.target.innerHTML = "Pan";
        this.mixSelection = "Pan";
      }
      else if(e.target.innerHTML === "Pan"){
        let text = "Vol";
  
        if(this.props.track.type === "audio")
          text = "Spd";
  
        e.target.innerHTML = text;
        this.mixSelection = text;
      }
      else if(e.target.innerHTML === "Spd"){
        e.target.innerHTML = "Vol";
        this.mixSelection = "Vol";
      }
  
      this.forceUpdate();
    }
  
    toggleResolution = (e) => {
      e.preventDefault();
      e.stopPropagation();
  
      let ele = document.getElementById(e.target.id);
      let pattern;
  
      if(this.props.store.ui.selectedScene){
        pattern = store.getPatternByTrackScene(this.props.trackId, this.props.store.ui.selectedScene.id);
      }
      else if(this.props.store.ui.selectedPattern){
        if(this.props.store.ui.selectedPattern.track.id === this.props.trackId){
          pattern = this.props.store.ui.selectedPattern;
        }
      }
      
      if(ele.innerHTML === "16"){
        ele.innerHTML = "32";
      }
      else if(ele.innerHTML === "32"){
        ele.innerHTML = "64";
      }
      else if(ele.innerHTML === "64"){
        ele.innerHTML = "16";
      }
  
      if(pattern)
        pattern.setResolution(parseInt(ele.innerHTML, 10));
      else
        this.props.track.setResolution(parseInt(ele.innerHTML, 10));
  
      this.props.toggleRes();
    }
  
    toggleGroup = (e) => {
      e.preventDefault();
      e.stopPropagation();
  
      store.ui.selectGroup(e.target.innerHTML);
    }
  
    deleteTrack = (e) => {
      e.preventDefault();
      e.stopPropagation();
  
      store.ui.toggleViewMode();
      store.delTrack(this.props.trackId);
    }
  
    render(){
      if(!this.player && this.props.track.type === "audio")
        this.player = store.instruments.getPlayerByTrack(this.props.trackId);
  
      if(!this.panvol){
        if(this.props.track.type === "master" && this.props.track.group !== "M")
          this.panvol = store.components.getComponentByTypeId('panvol','panvol_' + this.props.track.group + '_out');
        else
          this.panvol = store.components.getAllByTrack(this.props.trackId).find(c => c.id.split('_')[0] === 'panvol');
      }
      
      this.panvol.setPropVal('mute', this.props.mute);
      this.props.mute ? this.muteColor = {'backgroundColor' : '#2671ea'} : this.muteColor = null;
  
      let altButton;
      if(this.props.track.type === "master"){
        if(this.props.track.group !== "M"){
          if(!this.solo)
            this.solo = store.getObjsByTrackObj(store.getTrack(this.props.trackId)).find(o => o.id.split('_')[1] === 'solo')
          else
            (this.solo.solo) ? this.soloColor = {'backgroundColor' : '#2671ea'} : this.soloColor = null;
  
          altButton = <button id={"btnMixSolo_" + this.props.trackId} className="btn-mix" style={this.soloColor}>S</button>;
        }
        else{
          altButton = <button id={"btnMixSolo_" + this.props.trackId} className="btn-mix" style={this.soloColor} disabled>S</button>
        }
      }
      else if(this.props.track.type === "audio" || this.props.track.type === "instrument"){
        this.solo = this.props.solo;
        (this.solo) ? this.soloColor = {'backgroundColor' : '#2671ea'} : this.soloColor = null;
        altButton = <button id={"btnMixSolo_" + this.props.trackId} className="btn-mix" style={this.soloColor}>S</button>
      }
  
      let toggleButton = <button id={'btnMixEdit_' + this.props.trackId} className="btn-mix">Edt</button>
      if(this.props.store.ui.viewMode === "edit"){
        //TODO: what should replace del button with for master?
        if(this.props.track.type === "master")
          toggleButton = <button id={'btnMixDelTrack_' + this.props.trackId} className="btn-mix" style={{color:'red'}} disabled>Del</button>;
        else
          toggleButton = <button id={'btnMixDelTrack_' + this.props.trackId} className="btn-mix" style={{color:'red'}}>Del</button>;
      } 
  
      let sliderVal = 0, sliderEle;
  
      if(this.mixSelection === "Vol"){
        sliderVal = this.panvol.volume;
        sliderEle = <input type="range" min="-40" max="10" value={sliderVal} className="trackMixSlider" step="0.05" id={"volSlider" + this.props.trackId} 
                      onChange={this.changeSlider} onInput={this.changeSlider} onMouseDown={this.onPressDown} onMouseUp={this.onPressUp} onTouchStart={this.onPressDown} onTouchEnd={this.onPressUp}/>
      }
      else if(this.mixSelection === "Pan"){
        sliderVal = this.panvol.pan;
        sliderEle = <input type="range" min="-1" max="1" value={sliderVal} className="trackMixSlider" step="0.01" id={"volSlider" + this.props.trackId} 
                      onChange={this.changeSlider} onInput={this.changeSlider} onMouseDown={this.onPressDown} onMouseUp={this.onPressUp} onTouchStart={this.onPressDown} onTouchEnd={this.onPressUp}/>
      }
      else if(this.mixSelection === "Spd"){
        sliderVal = this.player.playbackRate;
        sliderEle = <input type="range" min="0.01" max="3" value={sliderVal} className="trackMixSlider" step="0.01" id={"volSlider" + this.props.trackId} 
                      onChange={this.changeSlider} onInput={this.changeSlider} onMouseDown={this.onPressDown} onMouseUp={this.onPressUp} onTouchStart={this.onPressDown} onTouchEnd={this.onPressUp}/>
      }
  
      //let disabledQ = true;
      let textRes = this.props.track.resolution;
      if(this.props.store.ui.selectedScene){
        let pattern = this.props.store.getPatternByTrackScene(this.props.trackId, this.props.store.ui.selectedScene.id);
        if(pattern){
          textRes = pattern.resolution;
        }
      }
      else if(this.props.store.ui.selectedPattern){
        if(this.props.store.ui.selectedPattern.track.id === this.props.trackId){
          textRes = this.props.store.ui.selectedPattern.resolution;
        }
      }
      
      //either res toggle or group toggle
      let resButton = <button id={"btnMixToggleRes_" + this.props.trackId} className="btn-mix">{textRes}</button>
      if(this.props.track.type === "master"){
        resButton = <button id={"btnMixToggleGroup_" + this.props.trackId} className="btn-mix" disabled={false}>{this.props.track.group}</button>
      }
  
      return (
        <div className="track-rowmix" style={{width: + this.props.store.ui.windowWidth}}>
          <div className="track-rowmix-left">
            { toggleButton }
            { resButton }
            <button id={"btnMixMute_" + this.props.trackId} className="btn-mix" style={this.muteColor}>M</button>
            { altButton }
            <button id={"btnMixLevel_" + this.props.trackId} className="btn-mix">Vol</button>
          </div>
          <div className="track-rowmix-right">
            <MixMeters trackId={this.props.trackId}/>
            <div style={{marginLeft:'10px', marginRight:'28px'}}>
              { sliderEle }
            </div>
          </div>
        </div>
      )
    }
  })