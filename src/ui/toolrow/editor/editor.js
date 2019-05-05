import React from 'react';

import { ToolSampleEditor } from "./sample/sample.js";
import { ToolRecord } from "./record/record.js";
import { ToolObjEditor } from "./objs/objs.js";

export const ToolEditor = props => {
  let type;
  
  if(props.objId){
    if(props.objId.split("_")[0] === "player" || props.objId.split("_")[0] === "sample"){
      type = <ToolSampleEditor store={props.store} file={props.file} tracks={props.tracks} objId={props.objId} 
                selectedTrack={props.store.ui.selectedTrack} winWidth={props.store.ui.windowWidth}
                selectedToolbar={props.store.ui.selectedToolbar}/>
    }
    else if(props.objId.split("_")[0] === "record"){
      type = <ToolRecord store={props.store} objId={props.objId}/>
    }
    else{
      type = <ToolObjEditor objId={props.objId}/>
    }
  }
  else{
    type = <div style={{width:'100%', height:'100%', display:'table'}}>
              <div style={{display:'table-cell', verticalAlign:'middle', textAlign:'center', color:'white'}}>No Object Selected</div>
            </div>
  }

  return(
      <div id="divToolEditor" className="divToolRowPanelContainer">
        {type}
      </div>
    )
}