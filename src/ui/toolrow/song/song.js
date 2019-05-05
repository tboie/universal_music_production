import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from "../../../data/store.js";
import { Treebeard } from 'react-treebeard';
import songTree from '../../../data/songtree.js';
import { Scale } from "tonal";

import { ToolSongHeaderScene } from "./header/scene.js";
import { ToolSongHeaderTrack } from "./header/track.js";
import { ToolSongHeaderPattern } from "./header/pattern.js";
import { ToolSongHeaderScaleKey } from "./header/scalekey.js";
import { ToolSongHeader } from "./header/song.js";

export const ToolSong = observer(class ToolSong extends Component {
    selectedItem;
    copiedPatternId;
    copiedTrackId;
  
    componentDidMount(){
      this.updateSongData();
    }
  
    componentDidUpdate(prevProps){
      if(prevProps.bpm !== this.props.bpm)
        songTree.name = store.settings.title + ' [' + Tone.Time(store.getSongLength()).toBarsBeatsSixteenths() + '] [' + store.settings.bpm + " bpm]";
      
      if(prevProps.numTracks !== this.props.numTracks)
        this.updateSongData();
    }
  
    componentWillUnmount(){
      if(this.state.cursor)
        this.state.cursor.active = false;
    }
  
    constructor(props){
      super(props);
      this.state = songTree;
      this.onToggle = this.onToggle.bind(this);
    }
  
    onToggle(node, toggled){
        if(this.state.cursor){
          this.state.cursor.active = false;
        }
        node.active = true;
  
        if(node.children){ 
          if(node.type !== 'song')
            node.toggled = toggled; 
        }
        this.setState({ cursor: node });
  
        if(node.type === "song" || node.type === "folderScenes" || node.type === "folderTracks" 
            || node.type === 'key' || node.type === 'scale' || node.type === "folderScales" || node.type === "folderKeys"){
  
          this.selectedItem = node.type;
        }
        else if(node.type === "track"){
          store.ui.selectTrack(node.id);
          this.selectedItem = node.type;
        }
        else if(node.type === "scene"){
          store.ui.selectScene(node.id);
          this.selectedItem = node.type;
        }
        else if(node.type === "group" || node.type === "folderTracksGroup"){
          store.ui.selectGroup(node.id);
          this.selectedItem = node.type;
        }
        else if(node.type === "pattern"){
          let p = store.getPattern(node.id);
          if(store.ui.selectedTrack !== p.track){
            store.ui.selectTrack(p.track.id);
          }
  
          if(store.ui.selectedPattern){
            if(store.ui.selectedPattern.id === node.id){
              store.ui.selectPattern(undefined);
              node.active = false;
              this.selectedItem = node.type;
            }
            else{
              store.ui.selectPattern(node.id);
              this.selectedItem = node.type;
            }
          }
          else{
            store.ui.selectPattern(node.id);
            this.selectedItem = node.type;
          }
        }
  
        this.forceUpdate();
    }
  
    updateSongData = () => {
      let self = this;
      //add bpm?
      songTree.name = store.settings.title + ' [' + Tone.Time(store.getSongLength()).toBarsBeatsSixteenths() + '] [' + store.settings.bpm + " bpm]";
  
      let sceneFolder = songTree.children[0].children;
      let tracksFolder = songTree.children[1].children;
  
      let storeScenes = store.getScenesAsc();
      songTree.children[0].name = 'Scenes [' + storeScenes.length + ']';
  
      //update scenes
      storeScenes.forEach(scene => {
        let sObj = {
          name: scene.id + ' [' + scene.start + ']',
          toggled: false,
          type: 'scene',
          id: scene.id,
          start: Tone.Time(scene.start),
          /*  show groups for scene */
          children: 
            ['A','B','C','D'].map(group => {
              let patterns = store.getPatternsByScene(scene.id).filter(p => p.track.group === group && p.track.type !== 'master');
              let gObj = {};
  
              gObj.name = group + ' [' + patterns.length + ']';
              gObj.type = 'group';
              gObj.id = group;
              gObj.toggled = false;
              gObj.children = patterns.map(p => {
                let pObj = {};
  
                if(self.copiedPatternId === p.id)
                  pObj.name = p.id + ' [copied]';
                else
                  pObj.name = p.id;
                
                pObj.toggled = false;
                pObj.type = 'pattern';
                pObj.id = p.id;
                //pObj.children = [];
                return pObj;
              });
              return gObj;
            })
            /* */
        }
  
        //add or set scenes
        if(!sceneFolder.find(s => s.id === scene.id)){
          sceneFolder.push(sObj);
        }
        else{
          let srcScene = sceneFolder.find(s => s.id === scene.id);
          
          srcScene.name = sObj.name;
          srcScene.start = sObj.start;
          /* scene group stuff */
          srcScene.children.forEach(function(srcGroup){
            let sGroup = sObj.children.find(g => g.id === srcGroup.id)
            srcGroup.name = sGroup.name;
            srcGroup.children = sGroup.children;
          }) 
          /* */
        }
      });
  
      sceneFolder.sort(function(a, b){return a.start - b.start});
  
      //update tracks
      songTree.children[1].name = 'Tracks [' + store.tracks.filter(t => t.type !== 'master').length + ']';
      ['A','B','C','D'].forEach((group, idx) => {
        let tracks = store.getTracksByGroup(group);
        let gObj = {};
  
        gObj.name = group + ' [' + tracks.length + ']';
        gObj.type = 'folderTracksGroup';
        gObj.id = group;
        gObj.toggled = false;
        gObj.children = tracks.map(t => {
          let tObj = {};
          let strType = t.type.substr(0,5);
  
          if(self.copiedTrackId === t.id)
            tObj.name = t.id + + ' [' + strType + '] [copied]';
          else
            tObj.name = t.id + ' [' + strType + ']';
  
          tObj.toggled = false;
          tObj.type = 'track';
          tObj.id = t.id;
          //pObj.children = [];
          return tObj;
        });
        
        tracksFolder[idx] = gObj;
      })
  
      //update current scale:
      let key = store.settings.key, scale = store.settings.scale;
      songTree.children[2].name = 'Scales [' + key + ' ' + scale + '] [' + Scale.notes(key, scale).toString() + ']';
  
      /*
      console.log('patches')
      console.log(undoManager.history.map(n => n.patches))
      console.log('inverse:')
      console.log(undoManager.history.map(n => n.inversePatches))
      */
     
      this.forceUpdate();
    }
  
    copyPattern = () => {
      this.copiedPatternId = store.ui.selectedPattern.id;
      this.updateSongData();
    }
  
    copyTrack = () => {
      this.copiedTrackId = store.ui.selectedTrack.id;
      this.updateSongData();
    }
  
    render(){
      let header = <ToolSongHeader update={this.updateSongData}/>;
      if(this.selectedItem === "scene" || this.selectedItem === "folderScenes"){
        header = <ToolSongHeaderScene selectedScene={this.props.store.ui.selectedScene} update={this.updateSongData}/>
      }
      else if(this.selectedItem === "pattern"){
        header = <ToolSongHeaderPattern selectedPattern={this.props.store.ui.selectedPattern} copiedPatternId={this.copiedPatternId} 
                    update={this.updateSongData} copy={this.copyPattern} paste={this.pastePattern}/>
      }
      else if(this.selectedItem === "track" || this.selectedItem === "folderTracks" || this.selectedItem === "folderTracksGroup"){
        header = <ToolSongHeaderTrack selectedTrack={this.props.store.ui.selectedTrack} copiedTrackId={this.copiedTrackId} 
                    update={this.updateSongData} type={this.selectedItem} copy={this.copyTrack} paste={this.pasteTrack}/>
      }
      else if(this.selectedItem === "scale" || this.selectedItem === "key" || this.selectedItem === "folderScales" || this.selectedItem === "folderKeys"){
        header = <ToolSongHeaderScaleKey update={this.updateSongData} type={this.selectedItem} node={this.state.cursor} />
      }
      else if(this.selectedItem === "group"){
        header = <div id="divToolSongHeader" style={{height:'30px', width:'100%', backgroundColor:'darkgray', position:'absolute', zIndex:2}}></div>
      }
  
      return(
        <div id="divToolSong" className="divToolRowPanelContainer" style={{backgroundColor:'rgb(33, 37, 43)', overflowY:'scroll'}}>
          { header }
          <div className="divToolSongBody" style={{marginTop:'38px'}}>
            <Treebeard
              data={songTree} 
              onToggle={this.onToggle}
            />
          </div>
        </div>
      )
    }
  })
  