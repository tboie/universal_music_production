import { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from "../data/store.js";
import { ToneObjs } from "../models/models.js";

export const Draw = observer(class Draw extends Component {
    reqVal;

    playhead;
    hdrPlayhead;
    pos;
    hdrPos;

    objMeterCanvas = [];
    objButtonCanvas = [];
    objEditCanvas = [];
  
    componentDidMount(){
      this.reqVal = requestAnimationFrame(this.draw);

      this.initPlayhead();
    }
  
    componentWillUnmount(){
     cancelAnimationFrame(this.reqVal);
    }
  
    componentDidUpdate(prevProps){
      this.initPlayhead();

      if((!prevProps.mixMode && this.props.mixMode) || prevProps.viewMode !== this.props.viewMode 
        || prevProps.selectedTrack !== this.props.selectedTrack || prevProps.numTracks !== this.props.numTracks
        || (!this.props.editMode && prevProps.editMode && this.props.editViewMode === 'bar')){
        this.initMeters();
      }
      
      if(this.props.viewMode === 'edit' && this.props.editViewMode === 'graph'){
        if(prevProps.objs.length !== this.props.objs.length || prevProps.viewMode !== 'edit' || prevProps.editViewMode === 'bar' 
          || prevProps.selectedTrack !== this.props.selectedTrack){
          this.initEditObjs();
        }
      }

      if((this.props.viewMode === 'button' && prevProps.viewMode !== 'button')
        || (this.props.numTracks !== prevProps.numTracks && this.props.viewMode === 'button')){
        this.initAddButtonObjs();
      }

      //cleanup if not being used
      if((prevProps.viewMode === 'edit' && prevProps.editViewMode === 'graph') 
        && (this.props.viewMode !== 'edit' || this.props.editViewMode !== 'graph')){
        this.resetObjArray(this.objEditCanvas);
      }

      if(prevProps.viewMode === 'button' && this.props.viewMode !== 'button'){
        this.resetObjArray(this.objButtonCanvas);
      }
    }
  
    initPlayhead = () => {
      this.playhead = document.getElementById("playhead");

      if(this.playhead){
        if(this.props.viewMode === "sequencer" && this.props.store.ui.selectedGroup === "M"){
          this.playhead.style.display = "none";
        }
        else if(this.props.viewMode === "sequencer" && this.props.store.ui.mixMode){
          this.playhead.style.display = "none";
        }
        else{
          this.playhead.style.display = "block";
        }
      }
  
      this.hdrPlayhead = document.getElementById("hdrPlayhead");
    }

    resetObjArray = (objs) => {
      if(objs){
        objs.forEach(row => {
          if(row.waveform){
            row.waveform.dispose();
            row.waveform = null;
          }
        })

        objs = [];
      }
    }
    
    initEditObjs = () => {
      this.resetObjArray(this.objEditCanvas);
      
      ToneObjs.instruments.filter(o => o.track === this.props.selectedTrack.id)
        .forEach(obj => {
          if(obj.id.split('_')[0] !== 'mix')
            this.addObjEditCanvas(obj);
      }) 
      ToneObjs.components.filter(o => o.track === this.props.selectedTrack.id)
        .forEach(obj => {
          if(obj.id.split('_')[0] !== 'mix')
            this.addObjEditCanvas(obj);
      })
      ToneObjs.effects.filter(o => o.track === this.props.selectedTrack.id)
        .forEach(obj => {
          if(obj.id.split('_')[0] !== 'mix')
            this.addObjEditCanvas(obj);
      })
      ToneObjs.sources.filter(o => o.track === this.props.selectedTrack.id)
        .forEach(obj => {
          if(obj.id.split('_')[0] !== 'mix')
            this.addObjEditCanvas(obj);
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
      
      //be sure to disconnect/dispose later
      let waveform = new Tone.Waveform(1024);
      obj.obj.connect(waveform);
  
      this.objEditCanvas.push({id: obj.id, obj: obj.obj, waveform: waveform, gradient: waveformGradient, ctx: ctx, width: ctx.canvas.width, height: ctx.canvas.height})
    }

    initAddButtonObjs = () => {
      this.resetObjArray(this.objButtonCanvas);

      store.getTracksByGroup(store.ui.selectedGroup).filter(t => t.type === 'instrument').forEach(track => {
        let rowPanVol = ToneObjs.components.find(c => c.id === track.getPanVol.id);

        if(rowPanVol){
          let ele = document.getElementById('canvasGridButton_' + track.id);
          let ctx = ele.getContext('2d');
          ctx.canvas.width = ele.width;
          ctx.canvas.height = ele.height;
      
          let waveformGradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, ctx.canvas.height);
          waveformGradient.addColorStop(0, "#ddd");
          waveformGradient.addColorStop(1, "#ddd");

          //be sure to disconnect/dispose later
          let waveform = new Tone.Waveform(1024);
          rowPanVol.obj.connect(waveform);
      
          this.objButtonCanvas.push({id: rowPanVol.id, obj: rowPanVol.obj, waveform: waveform, gradient: waveformGradient, ctx: ctx, width: ctx.canvas.width, height: ctx.canvas.height})
        }
      })
    }
  
    initMeters = () => {
      this.objMeterCanvas = [];
  
      this.props.tracks.forEach(track => {
        if(this.props.selectedTrack === track || this.props.store.ui.viewMode === "sequencer"){
          let cL = document.getElementById('canvas-L-' + track.id);
          let cR = document.getElementById('canvas-R-' + track.id);
   
          if(cL && cR){
            let meterL = ToneObjs.components.find(c => c.id === ("mix_meter_L_" + track.id));
            let meterR = ToneObjs.components.find(c => c.id === ("mix_meter_R_" + track.id));
            
            if(meterL && meterR){
              if(meterL.obj && meterR.obj){
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

                this.objMeterCanvas.push({track: track.id, type: track.type, meterL: meterL, meterR: meterR, ctxL: ctxL, ctxR: ctxR, width: width, height: height, gradientL: gradientL, gradientR: gradientR})
              }
            }
          }
        }
      })
    }
  
    draw = () => {
      this.drawPlayhead();

      if((this.props.mixMode || store.ui.viewMode === 'edit' || store.ui.viewMode === 'button') && this.objMeterCanvas){
        this.drawTrackMixMeters();
      }
      
      if(store.ui.viewMode === "edit" && this.props.editViewMode === 'graph'){
        this.drawEditViewObjs();
      }
      
      if(store.ui.viewMode === 'button'){
        this.drawButtonViewObjs();
      }
  
      requestAnimationFrame(this.draw);
    }

    drawButtonViewObjs = () => {
      if(!this.objButtonCanvas){
        this.initAddButtonObjs();
      }
  
      this.objButtonCanvas.forEach(obj => {
        if(obj.waveform){
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
        }
      })
    }
  
    drawEditViewObjs = () => {
      if(!this.objEditCanvas){
        this.initEditObjs();
      }
  
      this.objEditCanvas.forEach(obj => {
        if(obj.waveform){
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
        }
      })
    }
  
    drawTrackMixMeters = () => {
      this.objMeterCanvas.forEach(objMeter => {
        if(objMeter.meterL.obj && objMeter.meterR.obj){
          if(objMeter.meterL.obj._analyser && objMeter.meterR.obj._analyser){
            let levelL = objMeter.meterL.obj.getLevel();
            let levelR = objMeter.meterR.obj.getLevel();
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
          else{
            this.initMeters();
          }
        }
      })
    }
  
    drawPlayhead = () => {
      //individual track progress lines when editview bar mode
      if(this.props.viewMode === 'edit' && this.props.editViewMode === 'bar'){
        if(Tone.Transport.state === 'started'){
          let scenePos = (Tone.Time(Tone.Transport.position) - Tone.Time(store.ui.selectedScene.start));
          let currBar = parseInt(Tone.Time(scenePos).toBarsBeatsSixteenths().split(':')[0], 10) + 1;

          if(!this.playhead){
            this.playhead = document.getElementById('playhead_' + this.props.selectedTrack.id + '_' + currBar)
          }
          if(this.playhead){
            if(parseInt(this.playhead.id.split('_')[2], 10) !== currBar){
              this.playhead.style.display = 'none';
              this.playhead = document.getElementById('playhead_' + this.props.selectedTrack.id + '_' + currBar)
              if(this.playhead)
                this.playhead.style.display = 'block';
            }

            if(this.playhead){
              this.pos = (scenePos - Tone.Time((currBar-1) + ':0:0')) / Tone.Time(store.ui.viewLength) * store.ui.windowWidth;
              this.playhead.style.tansform = this.playhead.style.webkitTransform  = 'translateX(' + this.pos + 'px)';
            }
          }
        }
        else if(this.playhead){
          if(this.playhead.display !== 'none'){
            this.playhead.style.display = 'none';
            this.playhead.style.transform = 'translateX(0px)';
            this.playhead = undefined;
          }
        }
      }
      //all other views
      else if((this.props.viewMode === "sequencer" && !this.props.store.ui.mixMode) || this.props.viewMode === "button" || this.props.viewMode === "edit") {
        if(this.playhead){
          if(Tone.Transport.state === 'started'){
            if(store.ui.selectedScene){
              let scenePos = (Tone.Time(Tone.Transport.position) - Tone.Time(store.ui.selectedScene.start));
              this.pos = scenePos / Tone.Time(store.ui.viewLength) * store.ui.windowWidth;
              this.playhead.style.tansform = this.playhead.style.webkitTransform  = 'translateX(' + this.pos + 'px)';
            }
          }
          else{
            this.playhead.style.transform = 'translateX(0px)';
          }
        }
      }
  
      if(this.hdrPlayhead){
        if(Tone.Transport.state === 'started'){
          this.hdrPos = Tone.Time(Tone.Transport.position) / store.getSongLength() * this.props.store.ui.windowWidth;
          this.hdrPlayhead.style.tansform = this.hdrPlayhead.style.webkitTransform  = 'translateX(' + this.hdrPos + 'px)';
        }
        else{
          this.hdrPlayhead.style.transform = 'translateX(0px)';
        }
      }
    }
  
    render(){
      return null;
    }
  })