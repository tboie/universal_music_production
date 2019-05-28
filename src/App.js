//Copyright 2018-2019 Timothy Boie

import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import * as debounce from 'lodash/debounce';
import { store } from './data/store.js';

import { FooterView } from "./ui/footer/footer.js";
import { ToolRow } from "./ui/toolrow/toolrow.js";
import { ToolSideBar } from "./ui/toolrow/sidebar/sidebar.js";
import { HeaderView } from "./ui/header/header.js";
import { SequencerView } from "./ui/mode/sequencer.js";
import { GridButtonView } from "./ui/mode/button.js";
import { EditView } from './ui/mode/edit.js';
import { DropZone } from './ui/mode/dropzone.js';
import { Draw } from './ui/draw.js';
import { ListBrowser } from "./ui/toolrow/browse/browse.js";
import { initMidi } from "./midi/midi.js";

import { ToneObjs } from './models/models.js';

import './App.css';
import "nouislider/distribute/nouislider.min.css";

//*******************************************************************

const AppView = observer(class AppView extends Component {
  bFirstLoad = true;
  bSongWasLoaded = false;

  componentDidMount() {
    Tone.start();
    ToneObjs.initMetronome();

    console.log(Tone.context.sampleRate)

    //logo fade
    let eleLogo = document.getElementById('imgBGLogo');
    eleLogo.classList.add('logoFade');

    //load song or create master tracks
    let loadSongId = sessionStorage.getItem("load_songId");
    if (loadSongId) {
      store.DBLoadStore(loadSongId);
      sessionStorage.removeItem("load_songId");
      this.bSongWasLoaded = true;
    }
    else {
      if (!this.props.store.tracks.find(t => t.id === "track_master")) {
        store.addMasterTracks();
      }
    }
  }

  //called before elements are mounted
  firstLoad = () => {
    this.bFirstLoad = false;

    if(!Tone.supported){
      alert("Sorry, but this app is not supported by your browser.  Please update to a better option."); 
    }

    // not sure how reliable Tone.start() in mount is for all cases... so use this too
    document.documentElement.addEventListener('mousedown', () => {
      if(Tone.initialized){
        if(Tone.context.state !== 'running')
          Tone.start();
      }
    })

    //disable right click menu - this fixes the touch hold menu on some touch screens
    document.addEventListener('contextmenu', e => e.preventDefault());

    //online offline event handlers
    window.addEventListener('load', () => {
      function updateOnlineStatus(event){
        if (navigator.onLine) {
          //console.log('online');
        } else {
          //console.log('offline');
        }
      }
      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);
    });

    //tab/window in background
    document.addEventListener('visibilitychange', function(){
      //console.log('hidden: ' + document.hidden);
    });

    //resize
    window.addEventListener('resize', debounce(this.resizeFunction, 75));
    this.resizeFunction();

    //set transport and device
    this.setTransport();
    store.ui.setDevice();

    initMidi();

    /*  enable persistent storage
    if (navigator.storage && navigator.storage.persist)
      navigator.storage.persist().then(function(persistent) {
        if (persistent)
          console.log("Storage will not be cleared except by explicit user action");
        else
          console.log("Storage may be cleared by the UA under storage pressure.");
      });
    */
  }

  componentDidUpdate(prevProps) {
    //called when a song was loaded from indexdb, fixes ui sizing issues
    if (this.bSongWasLoaded) {
      this.bSongWasLoaded = false;
      this.setTransport();
      this.resizeFunction();
    }
  }

  resizeFunction = () => {
    store.ui.setWindowWidthHeight(window.innerWidth || document.body.clientWidth,
      window.innerHeight || document.body.clientHeight);
  };

  setTransport = () => {
    Tone.Transport.position = "0:0:0";
    Tone.Transport.bpm.value = this.props.store.settings.bpm;
    Tone.Transport.swing = this.props.store.settings.swing;
    Tone.Transport.swingSubdivision = this.props.store.settings.swingSubdivision;
    Tone.Transport.loopStart = this.props.store.settings.loopStart;
    Tone.Transport.loopEnd = this.props.store.settings.loopEnd;
  }

  render() {
    if (this.bFirstLoad)
      this.firstLoad();

    let viewWindow = null;
    if (this.props.store.ui.viewMode === "sequencer")
      viewWindow = <SequencerView
                      store={this.props.store}
                      mixMode={this.props.store.ui.mixMode}
                      selectedGroup={this.props.store.ui.selectedGroup}
                      numTracks={store.getTracksByGroup(this.props.store.ui.selectedGroup).length}
                      windowHeight={this.props.store.ui.windowHeight}
                    />
    else if (this.props.store.ui.viewMode === "button")
      viewWindow = <GridButtonView
                      store={this.props.store}
                      selectedTrack={this.props.store.ui.selectedTrack}
                      editMode={this.props.store.ui.editMode}
                    />
    else if (this.props.store.ui.viewMode === "edit" && this.props.store.ui.selectedTrack)
      viewWindow = <EditView
                      store={this.props.store}
                      track={this.props.store.ui.selectedTrack}
                      edit={this.props.store.ui.editMode}
                      windowHeight={this.props.store.ui.windowHeight} 
                      windowWidth={this.props.store.ui.windowWidth}
                      editViewMode={this.props.store.ui.views.edit.mode}
                    />


    let sideBar;
    if(this.props.store.ui.showSideBar)
      sideBar = <ToolSideBar content={ <ListBrowser id={'browser3'} selectedDir={this.props.store.ui.toolbar.browser.browser3.selectedDir} 
                                            numSamples={this.props.store.numSamples} numRegions={this.props.store.numRegions}/> }/>

    return (
      <div id="container" style={{ width: store.ui.windowWidth + 'px' }}>
        <HeaderView 
          store={this.props.store} 
          songLength={this.props.store.getSongLength()} 
          windowWidth={this.props.store.ui.windowWidth} 
          />
        { viewWindow }
        { sideBar }
        <ToolRow 
          store={this.props.store} 
          mode={this.props.store.ui.viewMode} 
          selectedToolbar={this.props.store.ui.selectedToolbar}
          windowHeight={this.props.store.ui.windowHeight}
          />
        <FooterView 
          store={this.props.store} 
          viewMode={this.props.store.ui.viewMode} 
          bpm={this.props.store.settings.bpm} 
          />
        <Draw 
          store={this.props.store} 
          mixMode={this.props.store.ui.mixMode} 
          tracks={this.props.store.tracks} 
          numTracks={this.props.store.getTracksByGroup(this.props.store.ui.selectedGroup).length} 
          viewMode={this.props.store.ui.viewMode} 
          selectedTrack={this.props.store.ui.selectedTrack} 
          objs={this.props.store.getObjsByTrackObj(this.props.store.ui.selectedTrack)}
          editViewMode={this.props.store.ui.views.edit.mode}
          />
        <DropZone 
          store={this.props.store} 
          />
        <img src="logobg.png" id="imgBGLogo" alt="propa.app" draggable="false"/>
      </div>
    )
  }
})

export default class App extends Component {
  render() {
    return <AppView store={store} />
  }
}


/*
onSnapshot(store, (snapshot) => {
  console.dir(snapshot);
});

onAction(store, act => {
  console.dir(act);
  //getSnapshot(store)
});

onPatch(store, p => {
  console.dir(p);
  //getSnapshot(store)
});
*/
