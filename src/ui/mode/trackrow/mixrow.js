import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { store } from '../../../data/store.js';
import Tone from 'tone';
import { ToneObjs } from '../../../models/models.js';

export const MixRowView = observer(class MixRowView extends Component{
  player;
  panvol;
  mixSelection = 'Vol';

  componentDidMount(){
    this.applyTransformOffset()
  }

  componentDidUpdate(prevProps){
    if(prevProps.viewLength !== this.props.viewLength){
      this.applyTransformOffset();
    }
  }

  applyTransformOffset = () => {
    if(store.ui.viewMode !== 'edit' || (store.ui.viewMode === 'edit' && store.ui.views.edit.mode !== 'bar')){
      let gridContainer = document.getElementById('gridContainer');
      if(gridContainer){
        let transformX = gridContainer.getAttribute('data-x') * -1;
        document.getElementById('trackrowmix_' + this.props.track.id).style.transform = 'translateX(' + transformX + 'px)';
      }
    }
  }

  toggleMixSelection = (type) => {
    this.mixSelection = type;
    this.forceUpdate();
  }

  render(){
    if(!this.player && this.props.track.type === 'audio')
      this.player = store.instruments.getPlayerByTrack(this.props.track.id);

    if(!this.panvol)
      this.panvol = this.props.track.getPanVol();
    
    let firstButton = <MixRowButtonEdit track={this.props.track} />
    if(this.props.store.ui.viewMode === 'edit')
      firstButton = <MixRowButtonToggleEditViewMode track={this.props.track} editViewMode={this.props.store.ui.views.edit.mode} />

    let secondButton = <MixRowButtonToggleRes track={this.props.track}/>
    if(this.props.track.type === 'master')
      secondButton = <MixRowButtonToggleGroup track={this.props.track}/>
      
    return (
      <div className='track-rowmix' id={'trackrowmix_' + this.props.track.id} style={{width: + this.props.store.ui.windowWidth}}>
        <div className='track-rowmix-left'>
          { firstButton }
          { secondButton }
          <MixRowButtonMute track={this.props.track} mute={this.props.track.mute}/>
          <MixRowButtonSolo track={this.props.track} solo={this.props.track.solo}/>
          <MixRowButtonSliderProp track={this.props.track} toggleMixSelection={(p) => this.toggleMixSelection(p)}/>
        </div>
        <div className='track-rowmix-right'>
          <MixMeters track={this.props.track}/>
          <MixRowSlider track={this.props.track} mixSelection={this.mixSelection} panvol={this.panvol} player={this.player}/>
        </div>
      </div>
    )
  }
})

const MixRowButtonSliderProp = observer(class MixRowButtonSliderProp extends Component{
  componentDidMount(){ }
  componentWillUnmount(){}

  toggleMixButton = (e) => {
    e.preventDefault();
    e.stopPropagation();
  
    if(e.target.innerHTML === 'Vol'){
      e.target.innerHTML = 'Pan';
      this.mixSelection = 'Pan';
    }
    else if(e.target.innerHTML === 'Pan'){
      let text = 'Vol';

      if(this.props.track.type === 'audio')
        text = 'Spd';

      e.target.innerHTML = text;
      this.mixSelection = text;
    }
    else if(e.target.innerHTML === 'Spd'){
      e.target.innerHTML = 'Vol';
      this.mixSelection = 'Vol';
    }

    this.props.toggleMixSelection(this.mixSelection);
  }

  render(){
    this.id = 'btnMixLevel_' + this.props.track.id;
    this.mixSelection = this.props.mixSelection;

    return (
      <button id={this.id} className='btn-mix' onClick={this.toggleMixButton}>Vol</button>
    );
  }
})

const MixRowButtonSolo = observer(class MixRowButtonSolo extends Component{
  componentDidMount(){}
  componentWillUnmount(){}

  toggleSolo = (e) => {
    e.preventDefault();
    e.stopPropagation();

    this.props.track.toggleSolo();
  }

  render(){
    this.id = 'btnMixSolo_' + this.props.track.id;
    (this.props.solo) ? this.soloColor = {'backgroundColor' : '#2671ea'} : this.soloColor = null;

    let disabled = false;
    if(this.props.track.type === 'master' && this.props.track.group === 'M')
        disabled = true;

    return (
      <button id={this.id} className='btn-mix' style={this.soloColor} disabled={disabled} onClick={this.toggleSolo}>S</button>
    );
  }
})

const MixRowSlider = observer(class MixRowSlider extends Component{
  changeSlider = (e) => {
    e.preventDefault();
    e.stopPropagation();

    //TODO: only call MST set prop onpresssup?
    if(this.props.mixSelection === 'Vol')
      this.props.panvol.setPropVal('volume', parseFloat(e.target.value), true);
    else if(this.props.mixSelection === 'Pan')
      this.props.panvol.setPropVal('pan', parseFloat(e.target.value), true);
    else if(this.props.mixSelection === 'Spd')
      this.props.player.setPropVal('playbackRate', parseFloat(e.target.value));

    if(this.bPressed)
      this.setButtonText(e.target.value);
    else
      this.setButtonText(this.props.mixSelection);
  }

  onPressDown = (e) => {
    e.stopPropagation();

    this.bPressed = true;
    this.setButtonText(e.target.value);
  }

  onPressUp = (e) => {
    e.stopPropagation();

    this.bPressed = false;
    this.setButtonText(this.props.mixSelection);
  }

  setButtonText = (txt) => {
    document.getElementById(this.btnId).innerHTML = txt;
  }

  render(){
    //corresponding button
    this.btnId = 'btnMixLevel_' + this.props.track.id;

    let sliderVal = 0, sliderEle;
    if(this.props.mixSelection === 'Vol'){
      sliderVal = this.props.panvol.volume;
      sliderEle = <input type='range' min='-40' max='10' value={sliderVal} className='trackMixSlider' step='0.05' id={'volSlider' + this.props.track.id} 
                    onChange={this.changeSlider} onInput={this.changeSlider} onMouseDown={this.onPressDown} onMouseUp={this.onPressUp} onTouchStart={this.onPressDown} onTouchEnd={this.onPressUp}/>
    }
    else if(this.props.mixSelection === 'Pan'){
      sliderVal = this.props.panvol.pan;
      sliderEle = <input type='range' min='-1' max='1' value={sliderVal} className='trackMixSlider' step='0.01' id={'volSlider' + this.props.track.id} 
                    onChange={this.changeSlider} onInput={this.changeSlider} onMouseDown={this.onPressDown} onMouseUp={this.onPressUp} onTouchStart={this.onPressDown} onTouchEnd={this.onPressUp}/>
    }
    else if(this.props.mixSelection === 'Spd'){
      sliderVal = this.props.player.playbackRate;
      sliderEle = <input type='range' min='0.01' max='3' value={sliderVal} className='trackMixSlider' step='0.01' id={'volSlider' + this.props.track.id} 
                    onChange={this.changeSlider} onInput={this.changeSlider} onMouseDown={this.onPressDown} onMouseUp={this.onPressUp} onTouchStart={this.onPressDown} onTouchEnd={this.onPressUp}/>
    }
    return (
      <div style={{marginLeft:'10px', marginRight:'10px'}}>
        { sliderEle }
      </div>
    );
  }
})

export const MixMeters = observer(class MixMeters extends Component{
  idSplit;
  idMeterL;
  idMeterR;
  split;
  meterL;
  meterR;
  
  componentDidMount(){
    this.addMeter();
  }

  componentDidUpdate(prevProps){
    if(prevProps.track !== this.props.track){
      this.addMeter();
    }
  }

  componentWillUnmount(){
    this.split.disconnect(this.meterL, 0);
    this.split.disconnect(this.meterR, 1);

    ToneObjs.delAudioObj(this.idMeterL, 'component');
    ToneObjs.delAudioObj(this.idMeterR, 'component');
    ToneObjs.delAudioObj(this.idSplit, 'component');
  }

  addMeter = () => {
    this.idTrack = this.props.track.id;

    this.idSplit = "mix_split_" + this.idTrack;
    if(!ToneObjs.components.find(c => c.id === this.idSplit))
      ToneObjs.components.push({id: this.idSplit, track: this.props.track.id, obj: new Tone.Split()})

    this.idMeterL = "mix_meter_L_" + this.idTrack;
    if(!ToneObjs.components.find(c => c.id === this.idMeterL))
      ToneObjs.components.push({id: this.idMeterL, track: this.props.track.id, obj: new Tone.Meter()})

    this.idMeterR = "mix_meter_R_" + this.idTrack;
    if(!ToneObjs.components.find(c => c.id === this.idMeterR))
      ToneObjs.components.push({id: this.idMeterR, track: this.props.track.id, obj: new Tone.Meter()})

    this.split = ToneObjs.components.find(o => o.id === this.idSplit).obj;
    this.meterL = ToneObjs.components.find(o => o.id === this.idMeterL).obj;
    this.meterR = ToneObjs.components.find(o => o.id === this.idMeterR).obj;

    //connect to panvol out for master tracks
    if(this.props.track.type === 'master'){
      let idPanVol = 'panvol_' + this.props.track.group + '_out';
      if(this.props.track.group === 'M')
        idPanVol = 'panvol_master_out';
      
      ToneObjs.components.find(o => o.id === idPanVol).obj.connect(this.split);
    }
    else{
      ToneObjs.components.find(o => o.id === this.props.track.getPanVol().id).obj.connect(this.split);
    }

    this.split.connect(this.meterL, 0);
    this.split.connect(this.meterR, 1);
  }

  render(){
    return(
      <div>
        <canvas id={'canvas-L-' + this.props.track.id} className='canvasMeterL'></canvas>
        <canvas id={'canvas-R-' + this.props.track.id} className='canvasMeterR'></canvas>
      </div>
    );
  }
})

const MixRowButtonMute = observer(class MixRowButtonMute extends Component{
  componentDidMount(){}
  componentWillUnmount(){}

  toggleMute = (e) => {
    e.preventDefault();
    e.stopPropagation();

    this.props.track.toggleMute();
  }

  render(){
    this.id = 'btnMixMute_' + this.props.track.id;
    this.props.mute ? this.muteColor = {'backgroundColor' : '#2671ea'} : this.muteColor = null;

    return (
      <button id={this.id} className='btn-mix' style={this.muteColor} onClick={this.toggleMute}>M</button>
    );
  }
})

const MixRowButtonToggleGroup = observer(class MixRowButtonToggleGroup extends Component{
  componentDidMount(){}
  componentWillUnmount(){}

  toggleGroup = (e) => {
    e.preventDefault();
    e.stopPropagation();

    store.ui.selectGroup(e.target.innerHTML);
  }

  render(){
    this.id = 'btnMixToggleGroup_' + this.props.track.id;
    
    return (
      <button id={this.id} className='btn-mix' onClick={this.toggleGroup}>{this.props.track.group}</button>
    );
  }
});

const MixRowButtonToggleRes = observer(class MixRowButtonToggleRes extends Component{
  componentDidMount(){}
  componentWillUnmount(){}

  toggleResolution = (e) => {
    e.preventDefault();
    e.stopPropagation();

    let ele = e.target;
    if(ele.innerHTML === '16')
      ele.innerHTML = '32';
    else if(ele.innerHTML === '32')
      ele.innerHTML = '64';
    else if(ele.innerHTML === '64')
      ele.innerHTML = '16';

    store.getPatternByTrackScene(this.props.track.id, store.ui.selectedScene.id).setResolution(parseInt(ele.innerHTML, 10));;
  }

  render(){
    this.id = 'btnMixToggleRes_' + this.props.track.id;
    let res = store.getPatternByTrackScene(this.props.track.id, store.ui.selectedScene.id).resolution;

    return (
      <button id={this.id} className='btn-mix' onClick={this.toggleResolution}>{res}</button>
    );
  }
});


const MixRowButtonEdit = observer(class MixRowButtonEditDelete extends Component{
  componentDidMount(){}
  componentWillUnmount(){}

  toggleEditView = (e) => {
    e.preventDefault();
    e.stopPropagation();

    store.ui.selectTrack(this.props.track.id);
    store.ui.toggleViewMode('edit');
  }

  render(){
    this.id = 'btnMixEdit_' + this.props.track.id;

    return (
      <button id={this.id} className='btn-mix' onClick={this.toggleEditView}>Edt</button>
    );
  }
});


const MixRowButtonToggleEditViewMode = observer(class MixRowButtonToggleEditViewMode extends Component {
  componentDidMount(){}
  componentWillUnmount(){}

  toggleEditViewMode = (e) => {
    e.preventDefault();
    e.stopPropagation();

    store.ui.views.edit.toggleMode();
  }

  render(){
    this.id = 'btnMixToggleEditViewMode_' + this.props.track.id;
    (this.props.track.type === 'master') ? this.disabled = true : this.disabled = false

    let text = 'Grph';
    if(this.props.editViewMode === 'graph')
      text = 'Bars';
    
    return (
      <button id={this.id} className='btn-mix' disabled={this.disabled} onClick={this.toggleEditViewMode}>{text}</button>
    );
  }
});

const MixRowButtonDeleteTrack = observer(class MixRowButtonDeleteTrack extends Component{
  componentDidMount(){}
  componentWillUnmount(){}

  deleteTrack = (e) => {
    e.preventDefault();
    e.stopPropagation();

    store.ui.toggleViewMode();
    store.delTrack(this.props.track.id);
  }

  render(){
    this.id = 'btnMixDelTrack_' + this.props.track.id;
    (this.props.track.type === 'master') ? this.disabled = true : this.disabled = false
    
    return (
      <button id={this.id} className='btn-mix' disabled={this.disabled} style={{color:'red'}} onClick={this.deleteTrack}>Del</button>
    );
  }
});