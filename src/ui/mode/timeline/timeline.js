import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from "../../../data/store.js";

export const GridTimeline = observer(class GridTimeline extends Component{
    eleContainer;
  
    componentDidMount(){}
  
    handleClick = (e) => {
      let offset = parseFloat(document.getElementById('gridContainer').getAttribute('data-x')).toFixed(3);
  
      if(isNaN(offset))
        offset = 0;
  
      let x = e.pageX + (offset * -1);
      let clickSecs = (x / this.props.windowWidth) * Tone.Time(this.props.ui.viewLength);
      clickSecs += 0.1; //transport is started 0.1 in advance
      Tone.Transport.position = Tone.Time(this.props.selectedScene.start) + Tone.Time(clickSecs);
    }
  
    render() {
      let len = this.props.ui.viewLength;
      let start = 1;
  
      if(this.props.selectedScene){
        len = store.getSceneLength(this.props.selectedScene.id);
        start = parseInt(Tone.Time(this.props.selectedScene.start).toBarsBeatsSixteenths().split(':')[0] * 4, 10);
        start += 1;
      }
  
      let total = Tone.Time(len).toBarsBeatsSixteenths().split(':');
      total = parseInt(total[0] * 4, 10) + parseInt(total[1], 10);
  
      let percent = 100 / total;
  
      if(!this.eleContainer)
        this.eleContainer = document.getElementById('gridContainer');
  
      let wPx, inc = 1, w = percent;
      if(this.eleContainer)
        wPx = this.eleContainer.style.width.replace('px','') * (percent * 0.01);
  
      if(wPx < 26 && wPx >= 13){
        inc = 2;
        w = 100 / (total / inc);
      }
      else if(wPx < 13 && wPx >= 6){
        inc = 4;
        w = 100 / (total / inc);
      }
      else if(wPx < 6){
        inc = 8;
        w = 100 / (total / inc);
      }
  
      let labels = [];
      for(let i=start; i<=(start-1) + total; i+=inc){
        let left = -2;
        if(i > 9)
          left = -5;
  
        labels.push(<label key={'keyGridTimeline' + i} className='lblTimeline' style={{left: left + 'px',width: w + '%'}}>{i}</label>)
      }
  
      return(
        <div id="divGridTimeline" onClick={this.handleClick}>
          { labels.map((obj, index) => obj)}
        </div>
      )
    }
  })
  