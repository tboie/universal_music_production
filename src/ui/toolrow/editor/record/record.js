import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from "../../../../data/store.js";
import Recorder from 'recorder-js';
import { randomId } from "../../../../models/models.js";
import { ToolSampleEditor } from '../sample/sample.js';

export const ToolRecord = observer(class ToolRecord extends Component {
    source;
    recorder;
    sampleId;
    status = 'stopped';
    icon;
    count;
    interval;
    objId;

    componentDidMount(){
      this.source = new Tone.UserMedia();

      this.source.open().then(() => {
        this.recorder = new Recorder(this.source._mediaStream.context, {
          // An array of 255 Numbers
          //onAnalysed: data => console.log(data),
        });
        
        this.recorder.init(this.source._stream);
      });
     
      this.icon = document.getElementById('btnToggleRecord').children[0];
    }
  
    componentDidUpdate(prevProps, prevState, snapshot){
      if(!this.sampleId){
        this.icon = document.getElementById('btnToggleRecord').children[0];
  
        if(this.source.state !== 'started')
          this.source.open().then(() => { });
      }
    }
  
    componentWillUnmount(){
      if(this.source){
        this.source.close();
        this.source.dispose();
        this.source = undefined;
      }
  
      if(this.recorder){
        this.recorder.stop();
        this.recorder = undefined;
      }
      
      if(this.interval)
        clearInterval(this.interval)
    }
  
    init = () => {
      if(this.objId !== this.props.objId){
        this.objId = this.props.objId;
        this.status = 'stopped';
        this.sampleId = undefined;
      }
    }
  
    startRecord = () => {
      if(this.source.state === 'started' && this.status === 'stopped'){
        this.count = 4;
        this.icon.innerHTML = 'looks_' + this.count;
        this.interval = setInterval(this.Timer, 1000);
      }
    }

    Timer = () => {
      this.count -= 1;
  
      if(this.count === 0){
        clearInterval(this.interval);
        this.icon.innerHTML = 'stop';
        this.recorder.start(this.source._stream);
        this.status = 'recording';
        return;
      }

      let strNum = this.count;
      if(this.count === 2)
        strNum = 'two';
      else if(this.count === 1)
        strNum = 'one';

      this.icon.innerHTML = 'looks_' + strNum;
    }
  
    stopRecord = () => {
      clearInterval(this.interval);
      this.icon.innerHTML = 'fiber_manual_record';

      if(this.status === 'recording'){
        this.status = 'stopped';
        this.recorder.stop().then(({blob, buffer}) => {
          let sampleId = 'sample_' + randomId();
          let newFile = new File([blob], 'rec' + randomId() + ' ' + new Date().toLocaleTimeString());

          store.DBSaveAudioFile({
            id: sampleId,
            data: newFile
          }).then(() => {
            this.sampleId = sampleId;
            this.source.close();
            this.forceUpdate();
          });
        });
      }
    };
  
    toggleRecord = (e) => {
      if(this.status === 'stopped'){
        this.startRecord();
      } else {
        this.stopRecord();
      }
    }
  
    render(){
      this.init();
  
      let component = <div style={{textAlign:'center', top:'30%', position:'relative'}}>
                        <button id="btnToggleRecord" style={{backgroundColor:'transparent'}} onClick={this.toggleRecord}><i className="material-icons i-72 colorRed">fiber_manual_record</i></button>
                      </div>
  
      if(this.sampleId)
        component= <ToolSampleEditor store={this.props.store} file={this.sampleId} tracks={this.props.store.tracks} objId={this.props.objId} selectedTrack={this.props.store.ui.selectedTrack} winWidth={this.props.store.ui.windowWidth}/>
  
      return(
        <div style={{color:'white', width:'100%', height:'100%'}}>
          { component }
        </div>
      )
    }
  })