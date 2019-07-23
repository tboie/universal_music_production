import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from "../../data/store.js";
import interact from 'interactjs';


export const LoopTile = observer(class LoopTile extends Component{
    loopStart;
    loopEnd;
  
    //TODO BUGFIX: adjust times on BPM change
    componentDidMount(){
      this.loopStart = store.settings.loopStart;
      this.loopEnd = store.settings.loopEnd;
  
      this.setupLoopTile();
      store.settings.setLoopStart(store.settings.loopStart);
      store.settings.setLoopEnd(store.settings.loopEnd);
      Tone.Transport.loop = true;
    }
  
    componentDidUpdate(prevProps, prevState){
      interact('#divLoopTile').unset();
      this.setupLoopTile();
    }
  
    componentWillUnmount(){
      interact('#divLoopTile').unset();
    }
  
    setupLoopTile = () => {
      let self = this;
      let props = self.props;
      let divLoop = document.getElementById('divLoopTile');
  
      //set loop start position
      let x = (Tone.Time(store.settings.loopStart) / store.getSongLength * this.props.windowWidth);
      divLoop.setAttribute('data-x', x);
      divLoop.style.webkitTransform = divLoop.style.transform ='translateX(' + x + 'px)';
  
      //set loop tile width
      divLoop.textContent = Tone.Time(store.getLoopLength).toBarsBeatsSixteenths();
      divLoop.style.width = (store.getLoopLength / store.getSongLength * this.props.windowWidth) + 'px';
      
      //setup loop tile snaps
      let arraySnap = [{x:0}];
      props.scenes.forEach(function(scene){
        let pixelSnap = Tone.Time(scene.start) / Tone.Time(props.songLength) * props.windowWidth;
        arraySnap.push({x: pixelSnap})
      })
      arraySnap.push({x: this.props.windowWidth})
  
      //loop tile element
      let rHandleX = 0;
      if(!interact.isSet('#divLoopTile')){
        interact('#divLoopTile')
          .draggable({
            snap: {
            // targets: arraySnap,
            // range: 50,
            },
            restrict: {
              restriction: 'parent',
              elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
            },
          })
          .resizable({
            edges: { left: true, right: true, bottom: false, top: false},
            restrictEdges: {
              outer: 'parent',
              endOnly: true,
            },
            restrictSize: {
              min: { width: 0 },
            },
            inertia: false,
            snap: {
              targets: arraySnap,
              range: 25,
            }
          }).on('tap', function(event){
            //continue tap to canvasHeaderTimeline
            interact('#canvasHeaderTimeline').fire(event);
          }).on('hold', function(event) {
            Tone.Transport.loop = !Tone.Transport.loop;
  
            if(Tone.Transport.loop){
              event.target.style.backgroundColor = 'rgba(25, 147, 122, 0.25)';
              divLoop.textContent = Tone.Time(store.getLoopLength).toBarsBeatsSixteenths();
            }
            else{
              event.target.style.backgroundColor = 'transparent';
              divLoop.textContent = 'off';
            }
          }).on('resizestart', function(event) {
            //store right handle on start (prevent let drag overlap)
            let target = event.target, x = (parseFloat(target.getAttribute('data-x')) || 0);
            rHandleX = x + event.rect.width;
          }).on('resizemove', function (event) {
            let target = event.target, x = (parseFloat(target.getAttribute('data-x')) || 0);
            let offset = 0, timeEnd, timeStart;
            
            //left handle (loop start)
            if(event.pageX >= 0 && event.pageX <= props.windowWidth){
              if(event.edges.left && event.pageX < rHandleX){
                if(!event.snap.locked)
                  x = event.pageX;
                else 
                  x = event.snap.x;
  
                timeStart = (x / props.windowWidth) * Tone.Time(props.songLength);
                let loopStart = Tone.Time(timeStart).quantize("8n");
                self.loopStart = Tone.Time(loopStart).toBarsBeatsSixteenths();
                Tone.Transport.loopStart = self.loopStart;
              
                target.style.width = (rHandleX - x) + 'px';
                target.style.webkitTransform = target.style.transform ='translateX(' + x + 'px)';
                target.setAttribute('data-x', x);
              }
              //right handle (loop end)
              if(event.edges.right && event.pageX >= x){
                if(!event.snap.locked)
                  timeEnd = (event.pageX / props.windowWidth) * props.songLength;
                else
                  timeEnd = (event.snap.x / props.windowWidth) * props.songLength;  
                
                let loopEnd = Tone.Time(timeEnd).quantize("8n");
                self.loopEnd = Tone.Time(loopEnd).toBarsBeatsSixteenths();
                Tone.Transport.loopEnd = self.loopEnd;
  
                if(event.snap.locked){
                  target.style.width = (event.snap.x - x) + 'px';
                }
                else{
                  offset = (x + event.rect.width) - event.pageX;
                  target.style.width = (event.rect.width - offset) + 'px';
                }
              }
  
              //target.textContent = Tone.Time(store.getLoopLength).toBarsBeatsSixteenths();
              target.textContent = Tone.Time(Tone.Time(self.loopEnd) - Tone.Time(self.loopStart)).toBarsBeatsSixteenths();
            }
          }).on('dragmove', function (event) {
            x = (parseFloat(event.target.getAttribute('data-x')) || 0);
            x += event.dx;
  
            event.target.style.webkitTransform = event.target.style.transform = 'translateX(' + x + 'px)';
            event.target.setAttribute('data-x', x);
            
            let timeStart = (x / props.windowWidth) * Tone.Time(props.songLength);
            let timeEnd = Tone.Time(timeStart) + Tone.Time(store.getLoopLength);
  
            let loopStart = Tone.Time(timeStart).quantize("8n");
            let loopEnd = Tone.Time(timeEnd).quantize("8n");
  
            self.loopStart = Tone.Time(loopStart).toBarsBeatsSixteenths();
            self.loopEnd = Tone.Time(loopEnd).toBarsBeatsSixteenths();
            
            Tone.Transport.loopStart = self.loopStart;
            Tone.Transport.loopEnd = self.loopEnd;
  
          }).on('resizeend', function (event){
            self.updateModel();
          }).on('dragend', function (event){
            self.updateModel();
          });
        }
    }
  
    updateModel = () => {
      if(this.loopStart)
        store.settings.setLoopStart(this.loopStart);
      if(this.loopEnd)
        store.settings.setLoopEnd(this.loopEnd);
    }
  
    render(){
      return (
        <div id="divLoopTile"/>
      )
    }
  })