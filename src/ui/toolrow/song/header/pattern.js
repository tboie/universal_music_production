import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from "../../../../data/store.js";


export const ToolSongHeaderPattern = observer(class ToolSongHeaderPattern extends Component {
    componentDidMount(){}
    componentWillUnmount(){}
    componentDidUpdate(prevProps, prevState, snapshot){}
  
    copyPattern = () => {
      this.props.copy();
    }
  
    pastePattern = () => {
      let copiedPattern = store.getPattern(this.props.copiedPatternId);
      this.props.selectedPattern.pastePattern(copiedPattern);
      //this.props.paste();
    }
  
    changeQuantization = () => {
      let res = this.props.selectedPattern.resolution;
      if(res === 16)
        this.props.selectedPattern.setResolution(32);
      else if(res === 32)
        this.props.selectedPattern.setResolution(64);
      else
        this.props.selectedPattern.setResolution(16);
  
      //hacky way to trigger trackrowview update
      //store.ui.selectPattern(undefined);
      store.ui.selectPattern(this.props.selectedPattern.id);
    }
  
    clearPattern = () => {
      if(store.ui.selectedNote)
        if(store.ui.selectedNote.getPattern().track === this.props.selectedPattern.track)
          store.ui.selectNote(undefined);
        
      this.props.selectedPattern.deleteNotes();
    }
  
    render(){
      let copyDisabled = true;
      let pasteDisabled = true;
      let txtQuant = "N/A";
  
      if(this.props.selectedPattern){
        copyDisabled=false;
        txtQuant = this.props.selectedPattern.resolution + 'n';
      }
      if(this.props.copiedPatternId){
        pasteDisabled=false;
      }
  
      return (
        <div id="divToolSongHeader" style={{height:'30px', width:'100%', backgroundColor:'darkgray', position:'absolute', zIndex:2}}>
          <button id="btnCopyPattern" onClick={this.copyPattern} style={{float:'left', height:'100%'}} disabled={copyDisabled}>Copy</button>
          <button id="btnPastePattern" onClick={this.pastePattern} style={{float:'left', height:'100%', marginLeft:'14px'}} disabled={pasteDisabled}>Paste</button>
          <button id="btnChangeQuant" onClick={this.changeQuantization} style={{float:'left', height:'100%', marginLeft:'14px'}} disabled={copyDisabled}>{txtQuant}</button>
          <button id="btnClearPattern" onClick={this.clearPattern} style={{float:'right', height:'100%', color:'red'}} disabled={copyDisabled}>Clear</button>
        </div>
      )
    }
  })