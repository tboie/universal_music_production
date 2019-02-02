import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from "../../../../data/store.js";

export const ToolSongHeaderScaleKey = observer(class ToolSongHeaderScaleKey extends Component {
    componentDidMount(){}
    componentWillUnmount(){}
    componentDidUpdate(prevProps, prevState, snapshot){}
  
    load = (e) => {
      if(this.props.type === "key")
        store.settings.setKey(this.props.node.name);
      else if(this.props.type === "scale")
        store.settings.setScale(this.props.node.name);
  
      this.props.update();
    }
  
    render(){
      let disableButton = true;
      if(this.props.type === "key" || this.props.type === "scale")
        disableButton = false;
  
      return (
        <div id="divToolSongHeader" style={{height:'30px', width:'100%', backgroundColor:'darkgray', position:'absolute', zIndex:2}}>
          <button id="btnLoad" onClick={this.load} style={{float:'left', height:'100%', width:'60px'}} disabled={disableButton}>Load</button>
        </div>
      )
    }
  })