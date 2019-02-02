import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from "../../../../data/store.js";
import { randomId } from "../../../../models/models.js";
import { renderSong } from "../../../utils.js";
import { LoadSaveModal } from "../loadsave.js";


export const ToolSongHeader = observer(class ToolSongHeader extends Component {
  action;

  componentDidMount(){}

  addScene = (e) => {
    // add 1m scene to end of song
    let start = store.getSongLength();
    let end = Tone.Time(start) + Tone.Time("1:0:0");
    store.addScene('scene_' + randomId(), Tone.Time(start).toBarsBeatsSixteenths(), Tone.Time(end).toBarsBeatsSixteenths());

    this.props.update();
  }

  loadSaveAs = () => {
    this.action = "loadsaveas_" + randomId();
    this.props.update();
    this.forceUpdate();
  }

  saveSong = () => {
    let self = this;
    store.DBGetAllSongs().then(function(list){
      if(list.find(song => song.id === store.id)){
        store.settings.setModified(Date.now());
        store.DBSaveStore(true);
      } else {
        self.loadSaveAs();
      }
    })
  }

  exportSong = () => {
    renderSong();
  }

  render(){
    return (
      <div id="divToolSongHeader" style={{height:'30px', width:'100%', backgroundColor:'darkgray', position:'absolute', zIndex:2}}>
        <LoadSaveModal action={this.action}/>
        <button onClick={this.loadSaveAs} style={{float:'left', height:'100%'}}>Load/SaveAs</button>
        <button onClick={this.saveSong} style={{float:'left', height:'100%', marginLeft:'14px'}}>Save</button>
        <button id="btnRenderSong" onClick={this.exportSong} style={{float:'left', height:'100%', marginLeft:'14px'}}>Render</button>
        <button id="btnExportSong" onClick={this.exportSong} style={{float:'left', height:'100%', marginLeft:'14px'}}>Render</button>
      </div>
    )
  }
})

