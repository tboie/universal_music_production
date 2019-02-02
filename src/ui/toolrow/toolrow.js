import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from "../../data/store.js";
import interact from 'interactjs';
import { randomId } from "../../models/models.js";

import { ToolBrowse } from "./browse/browse.js";
import { ToolHome } from "./home/home.js";
import { ToolSynth } from "./synth/synth.js";
import { ToolSong } from "./song/song.js";
import { ToolSearch } from "./search/search.js";
import { ToolSideBar } from "./sidebar/sidebar.js";
import { ToolEditor } from "./editor/editor.js";

export const ToolRow = observer(class ToolRow extends Component {
    activeTool;
    selectedFile;
    toolRowHeight;
    action;
    songList;
  
    componentDidMount(){
      let self = this;
  
      this.applyResizable();
  
      //show home on initial load
      this.toolRowHeight = (window.innerHeight - 240) + 'px';
      document.getElementById('btnToolHome').click();
  
      window.addEventListener("wheel", e => {
        //don't zoom if curosr over bottom tool window
        let bottom = store.ui.windowHeight - 80;
        if(self.activeTool)
          bottom -= self.toolRowHeight.replace('px','');
        
        if(e.pageY < bottom && e.pageX < store.ui.windowWidth){
          let dir = Math.sign(e.deltaY);
          if(dir > 0)
            self.UIZoomIn();
          else
            self.UIZoomOut();
        }
      })
  
      interact('#container')
        .gesturable({
          onstart: e => {},
          onmove: e => {
            if(e.ds > 0)
              self.UIZoomIn();
            else
              self.UIZoomOut();
          },
          onend: e => {}
        })
    }
  
    componentDidUpdate(prevProps, prevState, snapshot){
      if(prevProps.windowHeight !== this.props.windowHeight){
        let ele = document.getElementById('divToolRow');
        if(ele){
          let eleHeight = ele.style.height.replace('px','');
          if(eleHeight > this.props.windowHeight - 140)
            ele.style.height = (this.props.windowHeight - 140) + 'px';
        }
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
        if(event.rect.height < (store.ui.getWindowSizes().height - 140))
          event.target.style.height = event.rect.height + 'px';
  
        self.toolRowHeight = event.target.style.height;
  
        handleBG[0].style.backgroundColor = "gray";
        handleBG[1].style.backgroundColor = "gray";
  
        //store.ui.calibrateSizes();
  
        if(self.activeTool === "btnToolSynth"){
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
      if(this.activeTool === e.target.id)
        this.activeTool = null;
      else
        this.activeTool = e.target.id;
  
      let btns = document.getElementsByClassName('btnToolRowNav');
      for(let i=0; i < btns.length; i++){
        if(btns[i].id === this.activeTool && !btns[i].classList.contains('btnToolRowNavSelected'))
          btns[i].classList.add('btnToolRowNavSelected');
        else
          btns[i].classList.remove('btnToolRowNavSelected');
      }
  
      this.forceUpdate();
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
      let toolComponent = null;
  
      switch(this.activeTool) {
        case "btnToolHome":
          toolComponent = <ToolHome store={this.props.store}/>
          break;
        case "btnToolBrowse":
          if(this.props.store.ui.windowWidth >= 480)
            toolComponent = <div style={{height:'100%', width:'100%'}}>
                              <ToolBrowse store={this.props.store} funcSelectFile={this.selectBrowserFile} halfWindow={true} 
                                viewMode={this.props.store.ui.viewMode} selectedGroup={this.props.store.ui.selectedGroup} 
                                numSamples={this.props.store.getAllSamples().length} numRegions={this.props.store.getAllRegions().length} />
                              <ToolBrowse store={this.props.store} funcSelectFile={this.selectBrowserFile} halfWindow={true}
                                viewMode={this.props.store.ui.viewMode} selectedGroup={this.props.store.ui.selectedGroup} 
                                numSamples={this.props.store.getAllSamples().length} numRegions={this.props.store.getAllRegions().length} />
                            </div>
          else
            toolComponent = <ToolBrowse store={this.props.store} funcSelectFile={this.selectBrowserFile} halfWindow={false} viewMode={this.props.store.ui.viewMode} selectedGroup={this.props.store.ui.selectedGroup}/>
          break;
        case "btnToolEditor":
          toolComponent = <ToolEditor store={this.props.store} file={this.selectedFile} tracks={this.props.store.tracks} objId={this.props.store.ui.selectedObj}/>
          break;
        case "btnToolSearch":
          toolComponent = <ToolSearch store={this.props.store}/>
          break;
        case "btnToolSong":
          toolComponent = <ToolSong store={this.props.store} bpm={this.props.store.settings.bpm}/>
          break;
        case "btnToolSynth":
          toolComponent = <ToolSynth store={this.props.store} selectedTrack={this.props.store.ui.selectedTrack} height={this.toolRowHeight} 
                            scale={this.props.store.settings.scale} scaleKey={this.props.store.settings.key} chord={this.props.store.ui.selectedChord}/>
          break;
        case null:
          toolComponent = null;
          break;
        default:
          toolComponent = null;
      }
  
      let styleToolRow = null;
      if(!this.activeTool){
        styleToolRow = {height:0, display:'none'};
      }
      else{
        styleToolRow = {height:this.toolRowHeight, display:'block'};
      }
  
      let toolSideBar = null;
      if(this.props.store.ui.showSideBar)
        toolSideBar = <ToolSideBar content={<ToolBrowse store={this.props.store} sidebar={true} funcSelectFile={this.selectBrowserFile} 
                        viewMode={this.props.store.ui.viewMode} selectedGroup={this.props.store.ui.selectedGroup} 
                        numSamples={this.props.store.getAllSamples().length} numRegions={this.props.store.getAllRegions().length} /> }/>
  
      return(
        <div id="divToolRowContainer" style={{width: this.props.store.ui.windowWidth + 'px'}}>
          <ToggleModeIcons store={this.props.store} windowWidth={this.props.store.ui.windowWidth}/>
          <div id="divZoom">
            <button id="btnUIZoomOut" className="btnUIZoom" onClick={this.UIZoomOut}><i className="material-icons i-36" style={{marginLeft: '-4px'}}>remove_circle</i></button>
            <button id="btnUIZoomIn" className="btnUIZoom" onClick={this.UIZoomIn}><i className="material-icons i-36" style={{marginLeft: '-4px'}}>add_circle</i></button>
          </div>
          <div id="divToolRow" style={styleToolRow}>
            <div id="divToolRowHandle" className="divToolRowHandleBG">
              <div id="divToolRowHandleThumb" className="divToolRowHandleBG">
                <i className="material-icons i-28" style={{marginLeft:'11px', marginTop:'4px', color:'#12121e'}}>swap_vert</i>
              </div>
            </div>
            { toolComponent }
          </div>
          <div id="divToolRowNav">
            <button id="btnToolHome" className="btnToolRowNav" onClick={this.toggleTool}>Main</button>
            <button id="btnToolBrowse" className="btnToolRowNav" onClick={this.toggleTool}>Lib</button>
            <button id="btnToolEditor" className="btnToolRowNav" onClick={this.toggleTool}>Edit</button>
            <button id="btnToolSong" className="btnToolRowNav" onClick={this.toggleTool}>Song</button>
            { /*<button id="btnToolSearch" className="btnToolRowNav" onClick={this.toggleTool}>Search</button> */ }
            <button id="btnToolSynth" className="btnToolRowNav" onClick={this.toggleTool}>Keys</button> 
            {/*
            <button id="btnToolRecord" className="btnToolRowNav" onClick={this.toggleTool} disabled>Record</button>
            */}
            { toolSideBar }
          </div>
          
        </div>
      )
    }
  })


const ToggleModeIcons = observer(class ToggleModeIcons extends Component {
  componentDidMount(){
  }

  componentWillUnmount(){
  }

  componentDidUpdate(prevProps, prevState, snapshot){
  }

  setEditIcon = () => {
    if(this.props.store.ui.viewMode === "edit"){
      if(this.props.store.ui.editMode)
        return "open_with";
      else
        return "arrow_right_alt";
    }
    else if(this.props.store.ui.viewMode === "button"){
      if(this.props.store.ui.editMode)
        return "open_with";
      else
        return "volume_up";
    } 
    else {
      return "equalizer";
    }
  }


  toggleGroup = (e, next) => {
    let group = undefined;

    if(next){
      if(this.props.store.ui.selectedGroup === "M"){
        group = 'A'
      }
      else if(this.props.store.ui.selectedGroup === 'A'){
        group = 'B'
      }
      else if(this.props.store.ui.selectedGroup === 'B'){
        group = 'C'
      }
      else if(this.props.store.ui.selectedGroup === 'C'){
        group = 'D'
      }
      else if(this.props.store.ui.selectedGroup === 'D'){
        group = 'M'
      }
    }
    else {
       group = e.target.children[0].innerHTML;
    }

    store.ui.selectGroup(group);
  }

  toggleMode = () => {
    if(this.props.store.ui.viewMode === "edit" || this.props.store.ui.viewMode === "button"){
      store.ui.toggleEditMode();
    }
    else if(this.props.store.ui.viewMode === "sequencer"){
      store.ui.toggleMixMode();
    }
  }


  render(){
    let iconOpacity = 1;
    if(this.props.store.ui.viewMode === "sequencer" && !this.props.store.ui.mixMode)
        iconOpacity = 0.3;
    
    let showGroupIcon = 'block';
    if(this.props.store.ui.viewMode === "edit"){
      showGroupIcon = 'none';
    }

    let showEditIcon = 'visible';
    if(this.props.store.ui.viewMode === "button"){
      showEditIcon = 'hidden';
    }

    let groupIcons =  <button id="btnToggleGroup" className="btnUIZoom" onClick={e => this.toggleGroup(e, true)} style={{visibility: showGroupIcon, float:'left', position:'relative', top:'-6px'}}>
                        <i className="material-icons i-36">{this.props.store.ui.selectedGroup}</i>
                      </button>
    
    
    if(this.props.windowWidth > 550){
      groupIcons = ['A','B','C','D','M'].map((group, idx) => {
                    let opacity = 0.3;
                    if(store.ui.selectedGroup === group)
                      opacity = 1;

                    return <button key={idx} id="btnToggleGroup" className="btnUIZoom" onClick={this.toggleGroup} style={{display:showGroupIcon, float:'left', position:'relative', top:'-6px', opacity:opacity}}>
                              <i key={idx} className="material-icons i-36">{group}</i>
                            </button>
                  });
    }
   
    return (
      <div id="divToggleMode">
        { groupIcons }
        <button id="btnToggleMode" className="btnUIZoom" onClick={this.toggleMode} style={{visibility: showEditIcon, float:'left', opacity:iconOpacity}}><i id="iconEdit" className="material-icons i-36">{this.setEditIcon()}</i></button>
      </div>
    )
  }
})