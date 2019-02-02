import React, { Component } from 'react';
import { observer } from "mobx-react";

export const ToolSideBar = observer(class ToolSideBar extends Component {
    render(){
      return (
        <div id="divSideBarContainer" style={{height: '100%', width: '20%', position:'fixed', zIndex:3, top:0, right:0, borderLeft:'1px solid rgb(169, 169, 169)'}}>
            { this.props.content }
        </div>
      )
    }
})
  