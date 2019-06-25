import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from "../../data/store.js";
import interact from 'interactjs';
import { randomId } from "../../models/models.js";

import { ListBrowser } from "./browse/browse.js";
import { ToolHome } from "./home/home.js";
import { ToolSynth } from "./synth/synth.js";
import { ToolSong } from "./song/song.js";
import { ToolEditor } from "./editor/editor.js";

export const ToolRow = observer(class ToolRow extends Component {
    activeTool;
    selectedFile;
    toolRowHeight = '200px'; //set in css 
    action;
    songList;
  
    componentDidMount(){
      this.applyResizable();

      if(this.props.selectedToolbar !== 'home')
        document.getElementById('btnToolHome').click();

      window.addEventListener("wheel", e => {
        //don't zoom if curosr over bottom tool window
        let bottom = store.ui.windowHeight - 80;
        if(this.activeTool)
          bottom -= this.toolRowHeight.replace('px','');
        
        if(e.pageY < bottom && e.pageX < store.ui.windowWidth){
          let dir = Math.sign(e.deltaY);
          if(dir > 0)
            this.UIZoomIn();
          else
            this.UIZoomOut();
        }
      })
  
      interact('#container')
        .gesturable({
          onstart: e => {},
          onmove: e => {
            if(e.ds > 0)
              this.UIZoomIn();
            else
              this.UIZoomOut();
          },
          onend: e => {}
        })
    }
  
    componentDidUpdate(prevProps){
      if(prevProps.windowHeight !== this.props.windowHeight){
        let ele = document.getElementById('divToolRow');
        if(ele){
          let eleHeight = ele.style.height.replace('px','');
          if(eleHeight > this.props.windowHeight - 140)
            ele.style.height = (this.props.windowHeight - 140) + 'px';
        }
      }
      if(prevProps.selectedToolbar !== this.props.selectedToolbar){
        this.displayTool(this.props.selectedToolbar)
      }

      //hide zoom icons for manager mode
      if(this.props.mode === 'manager'){
        document.getElementById('divZoom').style.display = 'none';
      }
      else{
        document.getElementById('divZoom').style.display = 'block';
      }
    }
  
    applyResizable = () => {
      let self = this;
      let handleBG = document.getElementsByClassName('divToolRowHandleBG');
  
      interact('#divToolRow').resizable({
        edges: {
          top: '#divToolRowHandle',
          left: false,
          bottom: false,
          right: false 
        },
        inertia: true,
        allowFrom: '#divToolRowHandle',
        onend: function(event){
          handleBG[0].style.backgroundColor = "#19937a";
          handleBG[1].style.backgroundColor = "#19937a";
        },
      }).on('down', function(event) {
        if(event.target.id === "divToolRowHandle"){
          handleBG[0].style.backgroundColor = "gray";
          handleBG[1].style.backgroundColor = "gray";
        }
      }).on('up', function(event) {
          handleBG[0].style.backgroundColor = "#19937a";
          handleBG[1].style.backgroundColor = "#19937a";
      }).on('resizemove', function (event) {
        if(event.rect){
          if(event.rect.height < (store.ui.getWindowSizes().height - 140))
            event.target.style.height = event.rect.height + 'px';

          handleBG[0].style.backgroundColor = "gray";
          handleBG[1].style.backgroundColor = "gray";
        }
  
        if(event.target.style.height)
          self.toolRowHeight = event.target.style.height;
  
        if(store.ui.selectedToolbar === 'synth'){
          self.forceUpdate();
        }
      })
    }
  
    UIZoomIn = () => {
      let viewLength = this.props.store.ui.viewLength;
      let newTime = Tone.Time(viewLength) - Tone.Time("0:1:0");
      this.props.store.ui.setViewLength(Tone.Time(newTime).toBarsBeatsSixteenths());
    }
  
    UIZoomOut = () => {
      let viewLength = this.props.store.ui.viewLength;
      let newTime = Tone.Time(viewLength) + Tone.Time("0:1:0");
      this.props.store.ui.setViewLength(Tone.Time(newTime).toBarsBeatsSixteenths());
    }
  
    toggleTool = (e) => {
      let selection = e.target.id.substr(7).toLowerCase();
      if(store.ui.selectedToolbar === selection)
        store.ui.selectToolbar(undefined);
      else
        store.ui.selectToolbar(selection)
    }

    displayTool = (tool) => {
      if(tool)
        tool = 'btnTool' + tool.charAt(0).toUpperCase() + tool.slice(1);

      this.activeTool = tool;

      //toggle nav button class
      let btns = document.getElementsByClassName('btnToolRowNav');
      for(let i=0; i < btns.length; i++){
        if(btns[i].id === this.activeTool && !btns[i].classList.contains('btnToolRowNavSelected'))
          btns[i].classList.add('btnToolRowNavSelected');
        else
          btns[i].classList.remove('btnToolRowNavSelected');
      }

      //main container 
      if(this.activeTool)
        document.getElementById('divToolRow').style.display = 'block';
      else
        document.getElementById('divToolRow').style.display = 'none';

      //individual panels
      let panels = document.getElementsByClassName('divToolRowPanelContainer');
      for(let k=0; k < panels.length; k++){
        if(this.activeTool){
          if(this.activeTool.substr(3) === panels[k].id.substr(3)){
            panels[k].classList.remove('hidden');
          }
          else if(!panels[k].classList.contains('hidden')){
            panels[k].classList.add('hidden');
          }
        }
        else if(!panels[k].classList.contains('hidden')){
          panels[k].classList.add('hidden')
        }
      }

      //update height for synth panel
      //TODO: observable toolRowHeight?
      if(store.ui.selectedToolbar === 'synth'){
        interact('#divToolRow').fire({ type: 'resizemove', target: document.getElementById('divToolRow')});
      }
    }
  
    selectBrowserFile = (e, node) => {
      if(node.type === "instrument" || node.type === "source"){
        if(this.activeTool !== 'btnToolSynth')
          document.getElementById('btnToolSynth').click();
      }
      else if(node.type === "component" || node.type === "effect"){
        if(this.activeTool !== 'btnToolEditor')
          document.getElementById('btnToolEditor').click();
      }
      else if(node.type === "sample"){
        if(node.name === "...Record"){
          store.ui.selectObj("record_" + randomId());
        }
        else if(node.id){
          this.selectedFile = node.id;
          store.ui.selectObj("player_");
          this.forceUpdate();
        }
        else if(node.url && node.name){
          this.selectedFile = node.url + '/' + node.name;
          store.ui.selectObj("player_");
          this.forceUpdate();
        }
  
        if(this.activeTool !== 'btnToolEditor')
          document.getElementById('btnToolEditor').click();
      }
    }

    render(){
      let toolBrowse;

      let arrayBrowsers = ['browser1','browser2'].map(name => {
              return <ListBrowser selectedDir={this.props.store.ui.toolbar.browser[name].selectedDir} id={name}
                        songKey={this.props.store.settings.key} songScale={this.props.store.settings.scale}
                        songSwing={this.props.store.settings.swingSubdivision} modified={this.props.store.settings.modified}
                        numSamples={this.props.store.numSamples} numRegions={this.props.store.numRegions}
                        selectedGroup={this.props.store.ui.selectedGroup}/>
      })

      if(this.props.store.ui.windowWidth >= 480){
        toolBrowse =  <div id="divToolBrowse" className="divToolRowPanelContainer">
                        <div style={{width:'50%', height:'100%', float:'left', position:'relative'}}>
                          { arrayBrowsers[0] }
                        </div>
                        <div style={{width:'50%', height:'100%', float:'left', position:'relative'}}>
                          { arrayBrowsers[1] }
                        </div>
                      </div>
      }
      else{
        toolBrowse = <div id="divToolBrowse" className="divToolRowPanelContainer">
                        { arrayBrowsers[0]}
                      </div>
      }
      
      return(
        <div id="divToolRowContainer" style={{width: this.props.store.ui.windowWidth + 'px'}}>
          <ToggleModeIcons store={this.props.store} windowWidth={this.props.store.ui.windowWidth} viewMode={this.props.store.ui.viewMode} 
                              selectedGroup={this.props.store.ui.selectedGroup} mixMode={this.props.store.ui.mixMode} editMode={this.props.store.ui.editMode}
                              editViewMode={this.props.store.ui.views.edit.mode} managerMode={this.props.store.ui.views.manager.mode}/>
          <div id="divZoom">
            <button id="btnUIZoomOut" className="btnUIZoom" onClick={this.UIZoomOut}><i className="material-icons i-36" style={{marginLeft: '-4px'}}>remove_circle</i></button>
            <button id="btnUIZoomIn" className="btnUIZoom" onClick={this.UIZoomIn}><i className="material-icons i-36" style={{marginLeft: '-4px'}}>add_circle</i></button>
          </div>
          <div id='divToolRowIconsBG'></div>
          <div id="divToolRow">
            <div id="divToolRowHandle" className="divToolRowHandleBG">
              <div id="divToolRowHandleThumb" className="divToolRowHandleBG">
                <i className="material-icons i-28" style={{marginLeft:'11px', marginTop:'4px', color:'#12121e', pointerEvents:'none'}}>swap_vert</i>
              </div>
            </div>
            <ToolHome store={this.props.store}/>
            { toolBrowse }
            <ToolEditor store={this.props.store} file={this.selectedFile} tracks={this.props.store.tracks} objId={this.props.store.ui.selectedObj}/>
            <ToolSong store={this.props.store} bpm={this.props.store.settings.bpm} numTracks={this.props.store.getTracksByGroup(this.props.store.ui.selectedGroup).length}/>
            <ToolSynth store={this.props.store} selectedTrack={this.props.store.ui.selectedTrack} height={this.toolRowHeight} 
                            scale={this.props.store.settings.scale} scaleKey={this.props.store.settings.key} chord={this.props.store.ui.selectedChord}/>
          </div>
          <div id="divToolRowNav">
            <button id="btnToolHome" className="btnToolRowNav" onClick={this.toggleTool}>Main</button>
            <button id="btnToolBrowse" className="btnToolRowNav" onClick={this.toggleTool}>Lib</button>
            <button id="btnToolEditor" className="btnToolRowNav" onClick={this.toggleTool}>Edit</button>
            <button id="btnToolSong" className="btnToolRowNav" onClick={this.toggleTool}>Song</button>
            <button id="btnToolSynth" className="btnToolRowNav" onClick={this.toggleTool}>Keys</button> 
          </div>
        </div>
      )
    }
  })


const ToggleModeIcons = props => {
  const setEditIcon = () => {
    if(props.viewMode === "edit"){
      if(props.editViewMode === 'graph'){
        if(props.editMode)
          return "open_with";
        else
          return "arrow_right_alt";
      }
      else if(props.editViewMode === 'bar'){
        return "file_copy";
      }
    }
    else if(props.viewMode === "button"){
      if(props.editMode)
        return "open_with";
      else
        return "volume_up";
    }
    else if(props.viewMode === "manager"){
      return props.managerMode === "scene" ? "T" : "S";
    }
    else {
      return "equalizer";
    }
  }

  const toggleGroup = (e, next) => {
    let group = undefined;

    if(next){
      if(props.selectedGroup === "M")
        group = 'A'
      else if(props.selectedGroup === 'A')
        group = 'B'
      else if(props.selectedGroup === 'B')
        group = 'C'
      else if(props.selectedGroup === 'C')
        group = 'D'
      else if(props.selectedGroup === 'D'){
        if(store.ui.viewMode === 'button')
          group = 'A';
        else
          group = 'M';
      }
    }
    else {
      if(!e.target.id)
        group = e.target.innerHTML;
      else
        group = e.target.children[0].innerHTML;
    }

    store.ui.selectGroup(group);
  }

  const toggleMode = () => {
    if(props.viewMode === "edit" || props.viewMode === "button"){
      store.ui.toggleEditMode();
    }
    else if(props.viewMode === "sequencer" && props.selectedGroup !== 'M'){
      store.ui.toggleMixMode();
    }
    else if(props.viewMode === 'manager'){
      if(props.managerMode === 'scene')
        store.ui.views.manager.setMode('track')
      else
        store.ui.views.manager.setMode('scene')
    }
  }

  let bgVisibility= 'visible';

  let iconOpacity = 1;
  if((props.viewMode === "sequencer" && !props.mixMode) || (props.viewMode === 'edit' && props.editViewMode === 'bar' && !props.editMode))
      iconOpacity = 0.3;
  
  let showGroupIcon = 'block', iconStyleClass = '';
  if(props.viewMode === "edit"){
    showGroupIcon = 'none';
    iconStyleClass = ' editViewIconsBottom';
  }

  let showEditIcon = 'visible';
  if(props.viewMode === "button"){
    showEditIcon = 'hidden';
  }
  else if(props.viewMode === 'manager'){
    iconStyleClass = ' editViewIconsBottom';
    bgVisibility = 'hidden';
    showGroupIcon = 'hidden';
  }

  let groupIcons;
  if(props.viewMode !== 'manager' && props.viewMode !== 'edit'){
      groupIcons = <button id="btnToggleGroup" className="btnToolRowIconsLeft" onClick={e => toggleGroup(e, true)} style={{visibility:showGroupIcon, top:'-6px'}}>
                      <i className="material-icons i-36">{props.selectedGroup}</i>
                    </button>
    
    if(props.windowWidth > 550){
      groupIcons = ['A','B','C','D','M'].map((group, idx) => {
                    //no master option for button view
                    if(group === 'M' && store.ui.viewMode === 'button')
                      return null;
                    
                    let opacity = 0.3;
                    if(props.selectedGroup === group)
                      opacity = 1;
                    
                    return <button key={idx} id={"btnToggleGroup_" + group} className="btnToolRowIconsLeft" onClick={toggleGroup} style={{display:showGroupIcon, opacity:opacity, top:'-6px'}}>
                              <i key={idx} className="material-icons i-36">{group}</i>
                            </button>
                  });
    }
  }
  
  return (
    <div id="divToggleMode" style={{visibility: bgVisibility}}>
      { groupIcons }
      <button id="btnToggleMode" className={"btnToolRowIconsLeft" + iconStyleClass} onClick={toggleMode} style={{visibility:showEditIcon, opacity:iconOpacity}}>
        <i id="iconEdit" className="material-icons i-36">{setEditIcon()}</i>
      </button>
    </div>
  )
}