import { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from "../data/store.js";
import { ToneObjs } from "../models/models.js";


export const Draw = observer(class Draw extends Component {
    reqVal;
    prevPosition;
    playhead;
    hdrPlayhead;
    pos;
    hdrPos;
    offset;
    objMeterCanvas;
    objButtonCanvas;
    objEditCanvas;
  
    componentDidMount(){
      this.objButtonCanvas = [];
      this.initPlayhead();
      this.reqVal = requestAnimationFrame(this.draw);
    }
  
    componentWillUnmount(){
     cancelAnimationFrame(this.reqVal);
    }
  
    componentDidUpdate(prevProps, prevState, snapshot){
      this.initPlayhead();
      this.initMeters();
  
      if(this.props.store.ui.viewMode === "button"){
        this.initGridButtons();
      }
  
      if(this.props.store.ui.viewMode === "edit"){
        this.initEditObjs();
      }
    }
  
    initPlayhead = () => {
      this.playhead = document.getElementById("playhead");

      if(this.props.viewMode === "sequencer" && this.props.store.ui.selectedGroup === "M")
        this.playhead.style.display = "none";
      else
        this.playhead.style.display = "block";
  
      this.hdrPlayhead = document.getElementById("hdrPlayhead");
    }
  
    initGridButtons = () => {
      let self = this;
      this.objButtonCanvas = [];
      let objButtonCanvas = this.objButtonCanvas;
  
      this.props.tracks.forEach(function(track){
        if(self.props.store.ui.viewMode === "button"){
          let ele = document.getElementById('canvasGridButton_' + track.id);
          if(ele){
            let ctx = ele.getContext('2d');
            ctx.canvas.width = ele.offsetWidth;
            ctx.canvas.height = ele.offsetHeight;
            
            let player = ToneObjs.instruments.find(i => i.track === track.id);
            objButtonCanvas.push({instrument: player, ctx: ctx, width: ctx.canvas.width, height: ctx.canvas.height})
          }
        }
      })
    }
  
    initEditObjs = () => {
      let self = this;
      this.objEditCanvas = [];
      
      ToneObjs.instruments.filter(o => o.track === self.props.selectedTrack.id)
        .forEach(function(obj){
          if(obj.id.split('_')[0] !== 'mix')
            self.addObjEditCanvas(obj);
      }) 
      ToneObjs.components.filter(o => o.track === self.props.selectedTrack.id)
        .forEach(function(obj){
          if(obj.id.split('_')[0] !== 'mix')
            self.addObjEditCanvas(obj);
      })
      ToneObjs.effects.filter(o => o.track === self.props.selectedTrack.id)
        .forEach(function(obj){
          if(obj.id.split('_')[0] !== 'mix')
            self.addObjEditCanvas(obj);
      })
      ToneObjs.sources.filter(o => o.track === self.props.selectedTrack.id)
        .forEach(function(obj){
          if(obj.id.split('_')[0] !== 'mix')
            self.addObjEditCanvas(obj);
      })
    }
  
    addObjEditCanvas = (obj) => {
      let ele = document.getElementById('canvas_' + obj.id);
      let ctx = ele.getContext('2d');
      ctx.canvas.width = ele.width;
      ctx.canvas.height = ele.height;
  
      let waveformGradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, ctx.canvas.height);
      waveformGradient.addColorStop(0, "#ddd");
      waveformGradient.addColorStop(1, "#000");
      
      let waveform = new Tone.Waveform(1024);
      obj.obj.connect(waveform);
  
      this.objEditCanvas.push({id: obj.id, obj: obj.obj, waveform: waveform, gradient: waveformGradient, ctx: ctx, width: ctx.canvas.width, height: ctx.canvas.height})
    }
  
    initMeters = () => {
      let self = this;
      let cL, cR;
  
      //Reset entire array of objmeters
      this.objMeterCanvas = [];
  
      this.props.tracks.forEach(function(track){
        if(self.props.selectedTrack === track || self.props.store.ui.viewMode === "sequencer"){
          cL = document.getElementById('canvas-L-' + track.id);
          cR = document.getElementById('canvas-R-' + track.id);
   
          if(cL && cR){
            if(!self.objMeterCanvas.find(o => o.track === track.id)){
              let ctxL = cL.getContext('2d');
              let ctxR = cR.getContext('2d');
  
              //left and right dimensions should be the same
              let width = cL.width;
              let height = cL.height;
  
              let gradientL = ctxL.createLinearGradient(0, 0, width, 0);
              gradientL.addColorStop(0, "#BFFF02");
              gradientL.addColorStop(0.8, "#02FF24");
              gradientL.addColorStop(1, "#FF0202");
          
              let gradientR = ctxR.createLinearGradient(0, 0, width, 0);
              gradientR.addColorStop(0, "#BFFF02");
              gradientR.addColorStop(0.8, "#02FF24");
              gradientR.addColorStop(1, "#FF0202");
  
              let meterL = ToneObjs.components.find(c => c.id === ("mix_meter_L_" + track.id)).obj;
              let meterR = ToneObjs.components.find(c => c.id === ("mix_meter_R_" + track.id)).obj;
  
              //console.log('init meters adding track: ' + track.id)
              self.objMeterCanvas.push({track: track.id, type: track.type, meterL: meterL, meterR: meterR, ctxL: ctxL, ctxR: ctxR, width: width, height: height, gradientL: gradientL, gradientR: gradientR})
            }
          }
        }
      })
    }
  
    draw = () => {
      
      if(Tone.Transport.position !== this.prevPosition){
        this.drawPlayhead();
        this.prevPosition = Tone.Transport.position;
      }
  
      this.drawMeters();
  
      if(this.props.store.ui.viewMode === "button"){
        this.drawGridButtons();
      }
  
      if(this.props.store.ui.viewMode === "edit"){
        this.drawEditViewObjs();
      }
  
      requestAnimationFrame(this.draw);
    }
  
    drawEditViewObjs = () => {
      if(!this.objEditCanvas){
        this.initEditObjs();
      }
  
      this.objEditCanvas.forEach(function(obj){
        let values = obj.waveform.getValue();
        obj.ctx.clearRect(0, 0,  obj.width,  obj.height);
        obj.ctx.beginPath();
        obj.ctx.lineJoin = "round";
        obj.ctx.lineWidth = 6;
        obj.ctx.strokeStyle = obj.gradient;
        obj.ctx.moveTo(0, (values[0] / 255) *  obj.height);
        
        for (let i = 1, len = values.length; i < len; i++){
          let val = (values[i] + 1) / 2;
          let x =  obj.width * (i / len);
          let y = val *  obj.height;
          obj.ctx.lineTo(x, y);
        }
  
        obj.ctx.stroke();
      })
    }
  
    drawGridButtons = () => {
      let self = this;
      
      this.props.store.tracks.filter(t => t.type === "audio").forEach(function(track){
        let button = self.objButtonCanvas.find(o => o.instrument.track === track.id);
        if(button){
          let player = button.instrument.obj;
          let fill = 0;  
  
          if(player.state === "started"){
            if(!button.started){
              button.startPos = player.position;
              button.started = true;
            }
  
            if(player.position >= button.startPos){
              fill = ((player.position - button.startPos) / player.buffer.duration) * button.width;
            }
            else{
              fill = ((player.position + (player.buffer.duration - button.startPos)) / player.buffer.duration) * button.width;
            }
  
            button.ctx.fillStyle = '#181f87';
            button.ctx.fillRect(0, 0, fill, button.height);
          }
          if(player.state === 'stopped'){
            button.started = false;
            button.startPos = 0;
            button.progress = 0;
            button.ctx.clearRect(0, 0, button.width, button.height);
          }
        }
        else{
          self.initGridButtons();
        }
      })
    }
  
    drawMeters = () => {
      let self = this;
      let objMeterCanvas = this.objMeterCanvas;
  
      if(objMeterCanvas){
        if(this.props.store.ui.viewMode === "sequencer"){
          if(this.props.store.ui.selectedGroup !== 'M' && this.props.store.ui.mixMode){
            this.props.tracks.filter(t => t.group === this.props.store.ui.selectedGroup && t.type !== 'master').forEach(function(track){  
              let objMeter = objMeterCanvas.find(t => t.track === track.id);
  
              if(objMeter){
                self.drawTrackMixMeters(objMeter);
              }
              else {
                self.initMeters();
              }
            })
          }
          //or only draw master
          else{
            objMeterCanvas.filter(t => t.type === "master").forEach(function(objMeter){
              if(objMeter){
                self.drawTrackMixMeters(objMeter);
              }
              else {
                self.initMeters();
              }
            })
          }
        }
        //all other views show one track
        else{
          if(this.props.selectedTrack){
            let objMeter = objMeterCanvas.find(t => t.track === this.props.selectedTrack.id);
            if(objMeter){
              self.drawTrackMixMeters(objMeter);
            }
            else {
              self.initMeters();
            }
          }
        }
      }
      else{
        self.initMeters();
      }
    }
  
    drawTrackMixMeters = (objMeter) => {
      let levelL = objMeter.meterL.getLevel();
      let levelR = objMeter.meterR.getLevel();
      levelL = Tone.dbToGain(levelL); //scale it between 0 - 1
      levelR = Tone.dbToGain(levelR); //scale it between 0 - 1
  
      objMeter.ctxL.clearRect(0, 0, objMeter.width, objMeter.height);
      objMeter.ctxL.fillStyle = objMeter.gradientL;
      objMeter.ctxL.fillRect(0, 0, objMeter.width, objMeter.height);
      objMeter.ctxL.fillStyle = "#0c0b1b";
      objMeter.ctxL.fillRect(objMeter.width * levelL, 0, objMeter.width, objMeter.height);
  
      objMeter.ctxR.clearRect(0, 0, objMeter.width, objMeter.height);
      objMeter.ctxR.fillStyle = objMeter.gradientR;
      objMeter.ctxR.fillRect(0, 0, objMeter.width, objMeter.height);
      objMeter.ctxR.fillStyle = "#0c0b1b";
      objMeter.ctxR.fillRect(objMeter.width * levelR, 0, objMeter.width, objMeter.height);
    }
  
    drawPlayhead = () => {
      //The transport is started 0.1s in advance
      if(((this.props.viewMode === "sequencer" && !this.props.store.ui.mixMode) || this.props.viewMode === "button" || this.props.viewMode === "edit") 
        && this.playhead){
        if(store.ui.selectedScene){
          this.pos = (Tone.Time(Tone.Transport.position) - Tone.Time(store.ui.selectedScene.start)) / Tone.Time(store.ui.viewLength) * store.ui.windowWidth;
          this.offset = 0.1 / Tone.Time(store.ui.viewLength) * store.ui.windowWidth;
          this.playhead.style.tansform = this.playhead.style.webkitTransform  = 'translateX(' + (this.pos - this.offset) + 'px)';
        }
      }
  
      if(this.hdrPlayhead){
        this.hdrPos = Tone.Time(Tone.Transport.position) / store.getSongLength() * this.props.store.ui.windowWidth;
        this.offset = 0.1 / store.getSongLength() * this.props.store.ui.windowWidth;
        this.hdrPlayhead.style.tansform = this.hdrPlayhead.style.webkitTransform  = 'translateX(' + (this.hdrPos - this.offset) + 'px)';
      }
    }
  
    render(){
      return null;
    }
  })