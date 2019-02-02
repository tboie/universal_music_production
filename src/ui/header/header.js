import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from "../../data/store.js";
import { LoopTile } from "./looptile.js";
import { CanvasHeaderTimeline } from "./timeline.js";

export const HeaderView = observer(class HeaderView extends Component{
  render(){
    return (
      <div id="divHeader" className="divHeader" style={{width: this.props.windowWidth + 'px'}}>
        <div id="divHeaderTimeline">
          <CanvasHeaderTimeline store={this.props.store} songLength={this.props.songLength} windowWidth={this.props.windowWidth} selectedScene={this.props.store.ui.selectedScene} scenes={store.getScenesAsc()}/>
          <div id="hdrPlayhead" className="progressLine" style={{height:'40px', top:0}}></div>
          <LoopTile settings={this.props.store.ui.settings} windowWidth={this.props.windowWidth} songLength={this.props.songLength} scenes={this.props.store.getScenesAsc()} bpm={this.props.store.settings.bpm}/>
        </div>
      </div>
    )
  }
});