import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from "../../../../data/store.js";
import songTree from '../../../../data/songtree.js';
import { randomId } from "../../../../models/models.js";


export const ToolSongHeaderScene = observer(class ToolSongHeaderScene extends Component {
    btnSelected;
  
    componentDidMount(){
      document.getElementById("btnSettingLength").style.backgroundColor = "#2671ea";
      this.btnSelected = "btnSettingLength";
    }
  
    delScene = (e) => {
      songTree.children[0].children = songTree.children[0].children.filter(s => s.id !== this.props.selectedScene.id);
  
      store.delScene(this.props.selectedScene.id);
      this.props.update();
    }
  
    addScene = (e) => {
      // add 1m scene to end of song
      let start = store.getSongLength();
      let end = Tone.Time(start) + Tone.Time("1:0:0");
      store.addScene('scene_' + randomId(), Tone.Time(start).toBarsBeatsSixteenths(), Tone.Time(end).toBarsBeatsSixteenths());
  
      this.props.update();
    }
  
    toggleSetting = (e) => {
      if(e.target.id === "btnSettingLength"){
        e.target.style.backgroundColor = "#2671ea";
        document.getElementById("btnSettingMove").style.backgroundColor = "#e7e7e7";
        document.getElementById('btnSettingLeft').children[0].innerHTML = 'remove';
        document.getElementById('btnSettingRight').children[0].innerHTML = 'add';
        this.btnSelected = "btnSettingLength";
      }
      if(e.target.id === "btnSettingMove"){
        e.target.style.backgroundColor = "#2671ea";
        document.getElementById("btnSettingLength").style.backgroundColor = "#e7e7e7";
        document.getElementById('btnSettingLeft').children[0].innerHTML = 'arrow_back';
        document.getElementById('btnSettingRight').children[0].innerHTML = 'arrow_forward';
        this.btnSelected = "btnSettingMove";
      }
  
      this.props.update();
    }
  
    rightButtonClick = (e) => {
      let scene = this.props.selectedScene;
  
      if(this.btnSelected === "btnSettingLength"){
        if(store.getSceneLength(scene.id) < Tone.Time("16:0:0"))
          store.shiftSceneTimes(scene.end, Tone.Time("1:0:0"), "add");
      }
      //Move scene right
      else if(this.btnSelected === "btnSettingMove"){
        if(scene.end !== Tone.Time(store.getSongLength()).toBarsBeatsSixteenths()){
          store.swapScenes(scene.id, store.getSceneByTime(scene.end).id);
        }
      }
      //update UI
      store.ui.selectScene(scene.id);
  
      this.props.update();
    }
  
    leftButtonClick = (e) => {
      let scene = this.props.selectedScene;
  
      if(this.btnSelected === "btnSettingLength"){
        if(store.getSceneLength(scene.id) > Tone.Time("1:0:0")){
          store.shiftSceneTimes(scene.end, Tone.Time("1:0:0"), "sub");
        }
      }
      else if(this.btnSelected === "btnSettingMove"){
        if(scene.start !== "0:0:0"){
          store.swapScenes(store.getPrevScene(scene.id).id, scene.id);
        }
      }
      //update UI
      store.ui.selectScene(scene.id);
  
      this.props.update();
    }
  
    duplicateScene = () => {
      store.duplicateScene(this.props.selectedScene.id);
  
      this.props.update();
    }
    
    render(){
      let disabled=true;
      if(this.props.selectedScene)
        disabled=false;
      
      return (
        <div id="divToolSongHeader" style={{height:'30px', width:'100%', backgroundColor:'darkgray', position:'absolute', zIndex:2}}>
          <button id="btnSettingAddScene" onClick={this.addScene} style={{float:'left', height:'100%', width:'48px'}}>Add</button>
  
          <button id="btnSettingMove" onClick={this.toggleSetting} style={{float:'left', height:'100%', marginLeft:'10px', width:'48px'}} disabled={disabled}>Mov</button>
          <button id="btnSettingLength" onClick={this.toggleSetting} style={{float:'left', height:'100%', width:'48px'}} disabled={disabled}>Len</button>
  
          <button id="btnSettingLeft" style={{float:'left', height:'100%', width:'32px', marginLeft:'14px', borderRadius:'16px'}} disabled={disabled} onClick={this.leftButtonClick}>
            <i id="iconSampleSelect" className="material-icons i-hdr">remove</i>
          </button>
          <button id="btnSettingRight" style={{float:'left', height:'100%', width:'32px', marginLeft:'8px', borderRadius:'16px'}} disabled={disabled} onClick={this.rightButtonClick}>
            <i id="iconSampleSelect" className="material-icons i-hdr">add</i>
          </button>
  
          <button id="btnSettingDuplicate" onClick={this.duplicateScene} style={{float:'left', height:'100%', marginLeft:'10px', width:'48px'}} disabled={disabled}>Dup</button>
  
          <button onClick={this.delScene} style={{float:'right', height:'100%', color:'red'}} disabled={disabled}>Del</button>
        </div>
      )
    }
  })