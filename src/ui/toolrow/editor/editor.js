import React, { Component } from 'react';
import { observer } from "mobx-react";

import { ToolSampleEditor } from "./sample/sample.js";
import { ToolRecord } from "./record/record.js";
import { ToolObjEditor } from "./objs/objs.js";

export const ToolEditor = observer(class ToolEditor extends Component {
    
    componentDidMount(){}
  
    render() {
      let type = <div style={{width:'100%', height:'100%', display:'table'}}>
                    <div style={{display:'table-cell', verticalAlign:'middle', textAlign:'center', color:'white'}}>No Object Selected</div>
                 </div>
      
      if(this.props.objId){
        if(this.props.objId.split("_")[0] === "player")
          type = <ToolSampleEditor store={this.props.store} file={this.props.file} tracks={this.props.tracks} objId={this.props.objId} 
                    selectedTrack={this.props.store.ui.selectedTrack} winWidth={this.props.store.ui.windowWidth}/>
        else if(this.props.objId.split("_")[0] === "record")
          type = <ToolRecord store={this.props.store} objId={this.props.objId}/>
        else
          type = <ToolObjEditor objId={this.props.objId}/>
      }
  
      return(type)
    }
  })