import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from "../../data/store.js";
import interact from 'interactjs';

export const CanvasHeaderTimeline = observer(class CanvasHeaderTimeline extends Component{
    ctx;
    c;
  
    componentDidMount(){
      interact('#canvasHeaderTimeline').on('tap', event => { this.canvasTap(event.pageX) });
      this.drawScenes();
    }
  
    componentDidUpdate(prevProps, prevState){
      this.drawScenes();
    }
  
    componentWillUnmount(){
      if(interact.isSet('#canvasHeaderTimeline'))
        interact('#canvasHeaderTimeline').unset();
    }
  
    canvasTap = (tapX) => {
      let self = this;
  
      store.getScenesAsc().some((s, idx) => {
        let x1 = Tone.Time(s.start) / self.props.songLength * store.ui.windowWidth;
        let x2 = Tone.Time(s.end) / self.props.songLength * store.ui.windowWidth;
  
        if(tapX > x1 && tapX < x2){
          /* de-select scene
          if(self.props.selectedScene){
            if(self.props.selectedScene.id === s.id){
              store.ui.selectScene(undefined);
              return true;
            }
          }
          */
          store.ui.selectScene(s.id);
          return true;
        }
        
        return false;
      })
    }
  
    drawScenes = () => {
      let self = this;
  
      self.c = document.getElementById("canvasHeaderTimeline");
      self.ctx = self.c.getContext("2d");
  
      let c = self.c;
      let ctx = self.ctx;
  
      c.width = this.props.windowWidth;
      c.height = 40;
  
      ctx.canvas.width = c.width;
      ctx.canvas.height = c.height;
  
      //initial ctx setup for drawing
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.strokeStyle = 'lightgray';
      ctx.lineWidth = 2;
      ctx.beginPath();
  
      this.props.scenes.forEach((s, idx) => {
        let x1 = Math.floor(Tone.Time(s.start) / self.props.songLength * store.ui.windowWidth);
        let x2 = Math.floor(Tone.Time(s.end) / self.props.songLength * store.ui.windowWidth);
        let w = x2 - x1;
  
        //color selected scene
        if(store.ui.selectedScene){
          if(store.ui.selectedScene.id === s.id){
            ctx.fillStyle = 'white';
            ctx.fillRect(x1, 0, w, c.height);
          }
        }
  
        //line
        ctx.moveTo(x2, 0);
        ctx.lineTo(x2, c.height);
       
        //text
        let text = Tone.Time(store.getSceneLength(s.id)).toBarsBeatsSixteenths().split(':')[0];
       
        let middle = (w / 2) - 4;
        if(text.length > 1)
          middle = (w / 2) - 8;
  
        ctx.font = '12px Verdana';
        ctx.fillStyle = 'black';
        ctx.fillText(text, x1 + middle, 24, w);
      })
  
      //draw lines
      ctx.stroke();
    }
  
    render(){
      return(
        <canvas id="canvasHeaderTimeline" style={{width:this.props.windowWidth + 'px', height:'40px', backgroundColor:'gray'}}/>
      )
    }
  })