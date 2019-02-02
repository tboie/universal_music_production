import React, { Component } from 'react';
import { observer } from "mobx-react";

export const ToolSearch = observer(class ToolSearch extends Component {
    //there is no "desktop" site for yaaya
    componentDidMount(){}
  
    render() {
      let userAgent = window.navigator.userAgent;
      let styleClass = 'iframeContainer';
      if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i)) {
        styleClass = 'iframeContainerIOS'
      }
  
      return (
        <div id="iframeContainer" className={styleClass}>
          <iframe id="iframeSearch" title="search" src="https://y2mate.com/" style={{height:'100%', width:'100%'}}/>
        </div>
      )
    }
  })