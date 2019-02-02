import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from "../../../../data/store.js";

export const ToolSongHeaderTrack = observer(class ToolSongHeaderTrack extends Component {
    componentDidMount(){}
    componentWillUnmount(){}
    componentDidUpdate(prevProps, prevState, snapshot){}
  
    dupTrack = () => {
      store.duplicateTrack(this.props.selectedTrack.id);
      this.props.update();
    }
  
    delTrack = () => {
      store.ui.toggleViewMode();
      store.delTrack(this.props.selectedTrack.id);
      this.props.update();
    }
  
    delTrackNotes = () => {
      if(store.ui.selectedNote)
        if(store.ui.selectedNote.getPattern().track === this.props.selectedTrack)
          store.ui.selectNote(undefined);
      
      store.getPatternsByTrack(this.props.selectedTrack.id).forEach(p => {
        p.deleteNotes();
      })
    }
  
    copyTrack = () => {
      this.props.copy();
    }
  
    pasteTrack = () => {
      store.duplicateTrack(store.ui.selectedTrack.id);
      this.props.update();
    }
  
    render(){
      let disableButton = true;
      if(this.props.selectedTrack && this.props.type === "track"){
        disableButton = false;
      }
  
      let pasteDisabled = true;
      if(this.props.copiedTrackId){
        pasteDisabled=false;
      }
  
      return (
        <div id="divToolSongHeader" style={{height:'30px', width:'100%', backgroundColor:'darkgray', position:'absolute', zIndex:2}}>
          <button id="btnDuplicateTrack" onClick={this.dupTrack} style={{float:'left', height:'100%'}} disabled={disableButton}>Dup</button>
          <button id="btnToolSongCopyTrack" onClick={this.copyTrack} style={{float:'left', height:'100%', marginLeft:'14px'}} disabled={disableButton}>Copy</button>
          <button id="btnToolSongPasteTrack" onClick={this.pasteTrack} style={{float:'left', height:'100%', marginLeft:'14px'}} disabled={pasteDisabled}>Paste</button>
          
          <button id="btnToolSongHeaderDelTrack" onClick={this.delTrack} style={{float:'right', height:'100%', color:'red'}} disabled={disableButton}>Del</button>
          <button id="btnToolSongHeaderDelTrackNotes" onClick={this.delTrackNotes} style={{float:'right', height:'100%', color:'red', marginRight:'6px'}} disabled={disableButton}>Clear</button>
        </div>
      )
    }
  })