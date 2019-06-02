import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from "../../../../data/store.js";
import Microphone from 'recorder-js/src/microphone.js';
import { randomId } from "../../../../models/models.js";
import { ToolSampleEditor } from '../sample/sample.js';

export const ToolRecord = observer(class ToolRecord extends Component {
    source;
    recorder;
    sampleId;
    status = 'stopped';
    icon;
    interval;
    objId;
  
    componentDidMount(){
      //console.log('toolrecord mounted')
      this.source = new Tone.UserMedia();
      this.source.open().then(() => {});
      this.recorder = new Microphone(this.source.output);
      this.icon = document.getElementById('btnToggleRecord').children[0];
    }
  
    componentDidUpdate(prevProps, prevState, snapshot){
      //console.log('toolrecord updated')
      if(!this.sampleId){
        this.icon = document.getElementById('btnToggleRecord').children[0];
  
        //open mic again for new session
        if(this.source.state !== 'started')
          this.source.open().then(() => { });
      }
    }
  
    componentWillUnmount(){
      //console.log('toolrecord unmounting')
      if(this.source){
        this.source.close();
        this.source.dispose();
        this.source = undefined;
      }
  
      if(this.recorder){
        this.recorder.stop();
        this.recorder.clear();
        this.recorder = undefined;
      }
      
      if(this.interval)
        clearInterval(this.interval)
    }
  
    init = () => {
      //console.log('init called.   thisObjId: ' + this.objId + '  props.objID: '+ this.props.objId)
      if(this.objId !== this.props.objId){
        this.objId = this.props.objId;
        this.status = 'stopped';
        this.sampleId = undefined;
      }
    }
  
    startRecord = () => {
      //console.log('startRecord ' + this.status);
      let self = this;
  
      //input has been opened && recording stopped
      if(self.source.state === 'started' && this.status === 'stopped'){
        let count = 4;
        self.icon.innerHTML = 'looks_' + count;
  
        this.interval = setInterval(Timer, 1000);
  
        function Timer() {
          count -= 1;
  
          if(count === 0){
            clearInterval(self.interval);
            self.icon.innerHTML = 'stop';
            self.recorder.clear();
            self.recorder.record(self.source._stream);
  
            return;
          }
  
          let strNum = count;
          if(count === 2)
            strNum = 'two';
          else if(count === 1)
            strNum = 'one';
  
          self.icon.innerHTML = 'looks_' + strNum;
        }
      }
  
      self.status = 'recording';
    }
  
    stopRecord = () => {
      //console.log('stopRecord: ' + this.status)
      let self = this;
      
      clearInterval(this.interval);
      this.icon.innerHTML = 'fiber_manual_record';
      this.status = 'stopped';
      
      if(this.recorder.recording){
        this.recorder.stop();
        this.recorder.getBuffer((buffer) => {
          this.recorder.exportWAV(blob => {
            //Microphone.forceDownload(blob, 'output.wav');
            let sampleId = 'sample_' + randomId();
            let newFile = new File([blob], 'rec' + randomId() + ' ' + new Date().toLocaleTimeString());
  
            store.DBSaveAudioFile({
              id: sampleId,
              data: newFile
            }).then(function(){
              self.sampleId = sampleId;
              self.recorder.clear();
              self.source.close();
  
              //fileTree.children[4].children.push({name: newFile.name, id: sampleId , type: 'sample'});
              self.forceUpdate();
            });
          });
        });
      }
    }
  
    toggleRecord = (e) => {
      //console.log('toggleRecord: ' + this.status)
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