import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from "../../../../data/store.js";
import { randomId } from "../../../../models/models.js";
import { renderSong } from "../../../utils.js";
import { LoadSaveModal } from "../loadsave.js";
import { audioBufferToWav } from "../../../utils.js";
import { saveAs } from 'file-saver';
import JSZip from 'jszip';


export const ToolSongHeader = observer(class ToolSongHeader extends Component {
  action;

  componentDidMount(){}

  addScene = (e) => {
    // add 1m scene to end of song
    let start = store.getSongLength();
    let end = Tone.Time(start) + Tone.Time("1:0:0");
    store.addScene('scene_' + randomId(), Tone.Time(start).toBarsBeatsSixteenths(), Tone.Time(end).toBarsBeatsSixteenths());

    this.props.update();
  }

  loadSaveAs = () => {
    store.ui.toolbar.browser.setAction("loadsaveas_" + randomId());
   // this.props.update();
   // this.forceUpdate();
  }

  saveSong = () => {
    let self = this;
    store.DBGetAllSongs().then(function(list){
      if(list.find(song => song.id === store.id)){
        store.settings.setModified(Date.now());
        store.DBSaveStore(true);
      } else {
        self.loadSaveAs();
      }
    })
  }

  renderSong = () => {
    renderSong().then(() => {});
  }

  folderAddAudioFile = (resolve, reject, id, songFolder) => {
    store.DBLoadAudioFile(id).then(result => {

      if(result){
        if(result.data){
          let buffer = new Tone.Buffer();

          let strName = id;
          if(strName.split('_')[0] === "region" || strName.split('_')[0] === "sample")
            strName = id + '.wav';
          
          if (Array.isArray(result.data) || result.data instanceof Float32Array) {
            buffer.fromArray(result.data);
            audioBufferToWav(buffer.get()).then(blob => {
              songFolder.file(strName, blob);

              buffer.dispose();

              resolve(true);
            });
          }
          else{
            let blobUrl = window.URL.createObjectURL(result.data);
            buffer.load(blobUrl, () => {
              audioBufferToWav(buffer.get()).then(blob => {
                songFolder.file(strName, blob);

                window.URL.revokeObjectURL(blobUrl);
                buffer.dispose();

                resolve(true);
              });
            });
          }
        }
        else{
          reject('no audio data found in DB')
        }
      }
      else{
        reject('no id found in DB')
      }
    })
  }

  exportSong = () => {
    let self = this;
    let zip = new JSZip();

    let songFolder = zip.folder(store.settings.title);
    songFolder.file("song.json", JSON.stringify(store));

    let promiseArray = [];
    store.getAllSamples().forEach(s => {
      promiseArray.push(new Promise((resolve, reject) => { self.folderAddAudioFile(resolve, reject, s.id, songFolder) } ))
      
      s.regions.forEach(r => {
        promiseArray.push(new Promise((resolve, reject) => { self.folderAddAudioFile(resolve, reject, r.id, songFolder) } ))
      })
    })

    Promise.all(promiseArray).then(() => { zip.generateAsync({type:'blob'}).then(content => {
        saveAs(content, store.settings.title + '.zip')
      });
    });
  }

  render(){
    return (
      <div id="divToolSongHeader" style={{height:'30px', width:'100%', backgroundColor:'darkgray', position:'absolute', zIndex:2}}>
        { /* <LoadSaveModal action={this.action}/> */ }
        <button onClick={this.loadSaveAs} style={{float:'left', height:'100%'}}>Load/SaveAs</button>
        <button onClick={this.saveSong} style={{float:'left', height:'100%', marginLeft:'14px'}}>Save</button>
        <button id="btnRenderSong" onClick={this.renderSong} style={{float:'left', height:'100%', marginLeft:'14px'}}>Render</button>
        <button id="btnExportSong" onClick={this.exportSong} style={{float:'left', height:'100%', marginLeft:'14px'}}>Export</button>
      </div>
    )
  }
})

