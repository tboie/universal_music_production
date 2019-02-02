import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from "../../../data/store.js";
import * as cloneDeep from 'lodash/cloneDeep';
import fileTree from '../../../data/filetree.js';
import { randomId } from "../../../models/models.js";
import { Treebeard } from 'react-treebeard';
import { audioBufferToWav } from "../../utils.js";

export const ToolBrowse = observer(class ToolBrowse extends Component {
    player;
    folder;
    id;
    privTree;
    colorInterval;
  
    constructor(props){
      super(props);
      this.privTree = cloneDeep(fileTree);
      this.state = this.privTree;
      this.onToggle = this.onToggle.bind(this);
    }
  
    componentDidMount(){
      document.getElementById('btnLoadFile_' + this.id).disabled = true;
      this.player = new Tone.Player().toMaster();
  
      if(this.props.sidebar){
        document.getElementById("divToolBrowseHeader_" + this.id).style.display = 'none';
        document.getElementById("divToolBrowseBody_" + this.id).style.marginTop = '4px';
      }
  
      this.setItemsDraggable();
      this.refreshSampleFolder();
    }
  
    componentDidUpdate(prevProps, prevState, snapshot){  
      this.setItemsDraggable();
  
      if(prevProps.viewMode !== this.props.viewMode || prevProps.selectedGroup !== this.props.selectedGroup)
        this.toggleLoadButton();
  
      if(prevProps.numSamples !== this.props.numSamples || prevProps.numRegions !== this.props.numRegions){
        this.refreshSampleFolder();
      }
    }
  
    componentWillUnmount(){
      if(this.player)
        this.player.dispose();
  
      if(this.state.cursor)
        this.state.cursor.active = false;
    }
  
    refreshSampleFolder = () => {
      let self = this;
      
      //add new samples/regions
      store.getAllSamples().forEach(s => {
        if(!self.privTree.children[4].children.find(i => i.name === s.url)){
          self.privTree.children[4].children.push({id: s.id, name: s.url, type:'sample'});
        }
  
        s.regions.forEach((r, idx) => {
          if(!self.privTree.children[4].children.find(i => i.id === r.id)){
            self.privTree.children[4].children.push({id: r.id, name: r.id, type:'sample'});
          }
        })
      })
      
      //remove deleted samples/regions
      self.privTree.children[4].children.forEach(i => {
        if(i.id){
          let type = i.id.split('_')[0];
    
          if(type === "region"){
            if(!store.getAllRegions().find(r => r.id === i.id)){
              self.privTree.children[4].children = self.privTree.children[4].children.filter(r => r.id !== i.id || r.name.substr(0,3) === "...");
            }
          }
          //sample and Url id's
          else{
            if(!store.getSample(i.id)){
              self.privTree.children[4].children = self.privTree.children[4].children.filter(r => r.id !== i.id || r.name.substr(0,3) === "...");
            }
          }
          
        }
      })
  
      self.forceUpdate();
    }
  
    toggleLoadButton = (item) => {
      let node = item;
      if(!node)
        node = this.state.cursor;
  
      if(node){
        if(node.children){ 
          //node.toggled = toggled;
          document.getElementById('btnLoadFile_' + this.id).disabled = true;
        } 
        else {
          if(node.type){
            if(node.type === "component" || node.type === "effect"){
              //only add these in edit view mode
              if(store.ui.viewMode === "edit"){
                document.getElementById('btnLoadFile_' + this.id).disabled = false;
              }
              else{
                document.getElementById('btnLoadFile_' + this.id).disabled = true;
              }
            }
            else if(node.type === "sample" || node.type === "instrument" || node.type === "source"){
              //can't add instruments when editing master graphs or viewing master group
              if((this.props.viewMode === "edit" && store.ui.selectedTrack.type === "master") || this.props.selectedGroup === "M"){
                document.getElementById('btnLoadFile_' + this.id).disabled = true;
              }
              else{
                document.getElementById('btnLoadFile_' + this.id).disabled = false;
              }
            }
          }
          else{
            document.getElementById('btnLoadFile_' + this.id).disabled = false;
          }
        }
      }
    }
  
    onToggle(node, toggled, disablePlay){
      let self = this;
  
      if(this.state.cursor){
        this.state.cursor.active = false;
      }
      node.active = true;
  
      if(node.children){ 
        node.toggled = toggled;
      }
  
      this.toggleLoadButton(node);
  
      this.setState({ cursor: node }, () => {
  
        if(!node.children && node.name !== "...Import" && node.name !== '...Record'){  
          if(this.selected !== node.name){
            this.selected = node.name;
  
            self.player.stop();
  
            if(disablePlay)
              self.player.autostart = false;
            else
              self.player.autostart = true;
  
            if(node.type === "sample"){
              if(node.url){
                let url = node.url + '/' + node.name;
                store.DBLoadAudioFile(url).then(function(result){
                  if(result){
                    if(result.data){
                      if(result.data instanceof Blob){
                        let blobUrl = window.URL.createObjectURL(result.data);
                        self.player.load(blobUrl, function(){
                          window.URL.revokeObjectURL(blobUrl);
  
                          self.colorListItem(self.state.cursor, disablePlay);
                        });
                      }
                      else if (Array.isArray(result.data) || result.data instanceof Float32Array) {            
                        self.player.buffer.fromArray(result.data);
                        self.player.start();
                        self.colorListItem(self.state.cursor, disablePlay);
                      }
                    }
                  }
                  else{
                    self.player.load(url, () => {
                      self.colorListItem(self.state.cursor, disablePlay);
  
                      //save as blob because toArray is empty during load above on FF
                      audioBufferToWav(self.player.buffer.get()).then(blob => {
                        store.DBSaveAudioFile({
                          id: url,
                          url: url,
                          duration: self.player.buffer.duration,
                          data: blob
                        }).then(() => {
                          //console.log('saved audio blob file ' + url);
                        });
                      });
                    });
                  }
                })
              }
              else{
                store.DBLoadAudioFile(node.id).then(function(result){
                  if(result){
                    if(result.data){
                      if (Array.isArray(result.data) || result.data instanceof Float32Array) {
                        self.player.buffer.fromArray(result.data);
                        self.player.start();
  
                        self.colorListItem(self.state.cursor, disablePlay);
                      }
                      else{
                        let blobUrl = window.URL.createObjectURL(result.data);
                        self.player.load(blobUrl, function(){
                          window.URL.revokeObjectURL(blobUrl);
  
                          self.colorListItem(self.state.cursor, disablePlay);
                        });
                      }
                    }
                  }
                })
              }
            }
          }
          else {
            if(this.player.loaded){
              if(this.player.state === "started"){
                this.player.stop();
                self.colorListItem(self.state.cursor, true);
              } 
              else {
                this.player.start();
                self.colorListItem(self.state.cursor, disablePlay);
              }
            }
          }
        }
        else{
          this.selected = node.name;
          if(this.player.loaded){
            if(this.player.state === "started"){
              this.player.stop();
              self.colorListItem(self.state.cursor, true);
            } 
          }
        }
      });
    }
  
    colorListItem = (node, disablePlay) => {
      clearTimeout(this.colorInterval);
  
      let ele;
      let nodes = document.getElementById('divToolBrowseBody_' + this.id).querySelectorAll('ul > li > div > ul > li > div > div');
      for(let n of nodes){
        if(n.innerText.indexOf(node.name) > -1){
          ele = n.parentNode;
          break;
        }
      }
  
      if(ele && node.active){
        if(disablePlay){
          ele.style.backgroundColor = 'rgb(49, 54, 63)';
        }
        else{
          ele.style.backgroundColor = '#181f87';
          this.colorInterval = setTimeout(() => {this.colorListItem(node, true)}, this.player.buffer.duration * 1000);
        }
      }
    }
  
    importFile = (e) => {
      let self = this;
      let file = e.target.files[0];
  
      if(file){
        if(file.type.split('/')[0] === "audio"){
          let fileName = file.name;
          let sampleId = 'sample_' + randomId();
          //let sampleUrl = '/';
          //let sampleSize = file.size;
  
          store.DBSaveAudioFile({
            id: sampleId,
            url: '',
            duration: undefined,
            data: file
          }).then(() => {
            fileTree.children[4].children.push({name: fileName, id: sampleId , type: 'sample'});
            let idx = self.privTree.children[4].children.push({name: fileName, id: sampleId , type: 'sample'});
            
            if(!self.privTree.children[4].toggled)
              self.privTree.children[4].toggled = true;
  
            self.onToggle(self.privTree.children[4].children[idx-1], false, true);
            self.loadFile();
          });
        }
      }
    }
  
    btnInputFileClick = (e) => {
      document.getElementById('inputFile_' + this.id).click();
    }
  
    btnInputFolderClick = (e) => {
      document.getElementById('inputFolder_' + this.id).click();
    }
  
    importFolder = (e) => {
      /* not supported in some browsers
      let theFiles = e.target.files;
      let relativePath = theFiles[0].webkitRelativePath;
      let folder = relativePath.split("/")[0];
  
      //TODO: use jsonpath to get folders and stuff
      //let names = jp.query(fileTree, '$..name');
  
      
      for (let file of Array.from(e.target.files)) {
        if(file.name){
          if(file.type === "audio/wav"){
            let sampleId = 'sample_' + randomId();
  
            store.DBSaveAudioFile({
              id: sampleId,
              data: file
            }).then(function(){
              console.log('folder import: ' + file.name + ' saved to DB');
      
              fileTree.children[0].children.push({name: file.name, id: sampleId});
            });
          }
        }
        //store.DBSaveAudioFile(file.name);
        //item.textContent = file.webkitRelativePath;
      };
      */
    }
  
    loadFile = (e) => {
      //sample
      if(this.state.cursor.type === "sample"){
        if(this.state.cursor.name === "...Import"){
          document.getElementById("btnInputFile_" + this.id).click();
        }
        else if(this.state.cursor.name === "...Folder"){
          document.getElementById("btnInputFolder_" + this.id).click();
        }
        else if(this.state.cursor.name === "...Record"){
          this.props.funcSelectFile(e, this.state.cursor);
        }
        else if(this.state.cursor.url){
          let url = this.state.cursor.url + '/' + this.state.cursor.name;
          store.DBLoadAudioFile(url).then(result => {
            if(!result){
              let buffer = new Tone.Buffer(url, () => {
                audioBufferToWav(buffer.get()).then(blob => {
                  store.DBSaveAudioFile({
                    id: url,
                    url: url,
                    duration: buffer.duration,
                    data: blob
                  }).then(() => {
                    if(!store.getSample(url))
                      store.addSample(url, url, buffer.length, [], buffer.duration);
                    
                    if(buffer.duration < 2.5 || result.id.split('_')[0] === 'region')
                      store.addTrack('track_' + randomId(), 'audio', false, false, url);

                    this.props.funcSelectFile(e, this.state.cursor);
  
                    buffer.dispose();
                  });
                });
              });
            }
            else{
              if(!store.getSample(url))
                store.addSample(url, url, result.data.length, [], result.duration);
              
              if(result.duration < 2.5 || result.id.split('_')[0] === 'region')
                store.addTrack('track_' + randomId(), 'audio', false, false, url);
              
              this.props.funcSelectFile(e, this.state.cursor);
            }
          });
        }
        else{
          let sample = store.getSample(this.state.cursor.name);
          if(sample && sample.duration < 2.5)
            store.addTrack('track_' + randomId(), 'audio', false, false, this.state.cursor.name);
  
          this.props.funcSelectFile(e, this.state.cursor)
        }
      }
      
      else if(this.state.cursor.type === "effect"){
        if(this.props.store.ui.selectedTrack){
          let id = this.state.cursor.name.toLowerCase() + "_" + randomId();
          store.effects.add(this.state.cursor.name.toLowerCase(), {id: id, track: this.props.store.ui.selectedTrack.id})
          store.ui.selectObj(id);
          this.props.funcSelectFile(e, this.state.cursor);
        }
      }
  
      else if(this.state.cursor.type === "component"){
        if(this.props.store.ui.selectedTrack){
          let id = this.state.cursor.name.toLowerCase() + "_" + randomId();
          store.components.add(this.state.cursor.name.toLowerCase(), {id: id, track: this.props.store.ui.selectedTrack.id})
          store.ui.selectObj(id);
          this.props.funcSelectFile(e, this.state.cursor);
        }
      }
  
      else if(this.state.cursor.type === "instrument"){
        let name = this.state.cursor.name.toLowerCase();
        let instId = name + '_' + randomId();
        let trackId = 'track_' + randomId();
  
        if(store.ui.viewMode === "edit" && name !== "player"){
          trackId = store.ui.selectedTrack.id;
          store.instruments.add(name, {id: instId, track: trackId});
        }
        else{
          store.addTrack(trackId, 'instrument', false, false);
          store.instruments.add(name, {id: instId, track: trackId});
  
          let panvolId = store.components.getAllByTrack(trackId).find(c => c.id.split('_')[0] === 'panvol').id;
  
          if(name !== "tinysynth")
            store.addConnection('connection_' + randomId(), trackId, instId, panvolId, "instrument", "component");
          else
            store.addConnection('connection_' + randomId(), trackId, 'tinysynth_panvol_' + instId.split('_')[1], panvolId, "component", "component");
        }
  
        if(name === "tinysynth")
          store.ui.selectObj('tinysynth_panvol_' + instId.split('_')[1]);
        else
          store.ui.selectObj(instId);
  
        this.props.funcSelectFile(e, this.state.cursor);
      }
  
      else if(this.state.cursor.type === "source"){
        let name = this.state.cursor.name.toLowerCase();
        let sourceId = name + '_' + randomId();
        let trackId = 'track_' + randomId();
  
        if(store.ui.viewMode !== "edit"){
          store.addTrack(trackId, 'instrument', false, false);
          store.sources.add(name, {id: sourceId, track: trackId});
  
          let panvolId = store.components.getAllByTrack(trackId).find(c => c.id.split('_')[0] === 'panvol').id;
          store.addConnection('connection_' + randomId(), trackId, sourceId, panvolId, "source", "component");
        }
        else{
          trackId = store.ui.selectedTrack.id;
          store.sources.add(name, {id: sourceId, track: trackId});
        }
  
        store.ui.selectObj(sourceId);
        this.props.funcSelectFile(e, this.state.cursor);
      }
    }
  
    setItemsDraggable = () => {
      let items = document.getElementById('divToolBrowseBody_' + this.id).querySelectorAll('li');
      
      for(let i=0; i<items.length; i++){
        if(!items[i].draggable){
          items[i].setAttribute('draggable', true);
        }
      }
    }
  
    dragStart = (e) => {
      if(!document.getElementById('btnLoadFile_' + this.id).disabled){
        if(this.state.cursor.name){
          if(e.target.innerHTML.indexOf(this.state.cursor.name) !== -1){
            e.dataTransfer.setData("text", 'btnLoadFile_' + this.id);
            document.getElementById('divDropZone').style.display = 'block';
            document.getElementById('divDropZone').classList.add('drop-allowed');
          }
        }
      }
    }
  
    dragEnd = (e) => {
      document.getElementById('divDropZone').style.display = 'none';
      document.getElementById('divDropZone').classList.remove('drop-allowed');
    }
  
    render(){
      if(!this.id)
        this.id = randomId();
  
      let winWidth = '100%';
      if(this.props.halfWindow)
        winWidth = '50%';
  
      return(
        <div id={"divToolBrowse_" + this.id} style={{height:'100%', width:winWidth, backgroundColor:'rgb(33, 37, 43)', overflowY:'scroll', float:'left'}}>
          <div id={"divToolBrowseHeader_" + this.id} style={{height:'30px', width:'100%', backgroundColor:'darkgray', position:'absolute', zIndex:2}}>
          { /* removing search due to slowness.  webworker?
            <input className="inputBrowserSearch" style={{height:'24px', width:'125px'}}
              onKeyUp={this.onKeyUp}
              placeholder="Search..."
              type="text"/>
          */ }
            
            <button id={"btnInputFile_" + this.id} onClick={this.btnInputFileClick} style={{height:'100%', width:'80px', float:'left', display:'none'}}>+Sample</button>
            <button id={"btnInputFolder_" + this.id} onClick={this.btnInputFolderClick} style={{height:'100%', width:'80px', float:'left', display:'none'}}>+ Folder</button>
            <input id={"inputFile_" + this.id} type="file" accept="audio/*" onChange={this.importFile} multiple style={{display:'none'}}/>
            <input id={"inputFolder_" + this.id} type="file" accept="audio/*" onChange={this.importFolder} multiple mozdirectory="" webkitdirectory="" directory="" style={{display:'none'}}/>
  
            <button id={"btnLoadFile_" + this.id} onClick={this.loadFile} style={{height:'100%', width:'80px', marginLeft:'0px'}}>Load</button>
          </div>
          <div id={"divToolBrowseBody_" + this.id} draggable={false} onDragStart={this.dragStart} onDragEnd={this.dragEnd} className={"divToolBrowseBody"} style={{marginTop:'38px'}}>
            <Treebeard
              data={this.privTree} 
              onToggle={this.onToggle}
            />
          </div>
        </div>
      )
    }
  })