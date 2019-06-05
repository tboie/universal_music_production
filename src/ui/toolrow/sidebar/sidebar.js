import React, { Component } from 'react';
import { observer } from "mobx-react";

export const ToolSideBar = observer(class ToolSideBar extends Component {
    render(){
      return (
        <div id="divSideBarContainer">
            { this.props.content }
        </div>
      )
    }
})
  