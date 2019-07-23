//Copyright 2018-2019 Timothy Boie

import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from './data/store.js';

import { FooterView } from "./ui/footer/footer.js";
import { ToolRow } from "./ui/toolrow/toolrow.js";
import { ToolSideBar } from "./ui/toolrow/sidebar/sidebar.js";
import { HeaderView } from "./ui/header/header.js";
import { SequencerView } from "./ui/mode/sequencer.js";
import { GridButtonView } from "./ui/mode/button.js";
import { EditView } from './ui/mode/edit.js';
import { ManagerView } from './ui/mode/manager.js';
import { Draw } from './ui/draw.js';
import { DropZone } from './ui/mode/dropzone.js';
import { LoadSaveModal } from './ui/toolrow/song/loadsave.js';
import { ListBrowser } from "./ui/toolrow/browse/browse.js";

import { ToneObjs } from './models/models.js';
import { setTransport, firstPageLoad } from './ui/utils.js'

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

  componentDidUpdate(prevProps) {
    //called when a song was loaded from indexdb, fixes ui sizing issues
    if (this.bSongWasLoaded) {
      this.bSongWasLoaded = false;
      setTransport();
    }
  }

  render() {
    if (this.bFirstLoad){
      this.bFirstLoad = false;
      firstPageLoad();
    }

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
    else if (this.props.store.ui.viewMode === "manager")
      viewWindow = <ManagerView
                      store={this.props.store}
                      managerMode={this.props.store.ui.views.manager.mode}
                    />


    let sideBar;
    if(this.props.store.ui.showSideBar)
      sideBar = <ToolSideBar content={ <ListBrowser id={'browser3'} selectedDir={this.props.store.ui.toolbar.browser.browser3.selectedDir} 
                                            songKey={this.props.store.settings.key} songScale={this.props.store.settings.scale}
                                            songSwing={this.props.store.settings.swingSubdivision} modified={this.props.store.settings.modified}
                                            numSamples={this.props.store.numSamples} numRegions={this.props.store.numRegions}
                                            selectedGroup={this.props.store.ui.selectedGroup}/> }/>

    return (
      <div id="container" style={{ width: store.ui.windowWidth + 'px' }}>
        <HeaderView 
          store={this.props.store} 
          songLength={this.props.store.getSongLength} 
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
          settings={this.props.store.ui.settings}
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
          editMode={this.props.store.ui.editMode}
          />
        <DropZone 
          store={this.props.store} 
          />
        <LoadSaveModal 
          action={this.props.store.ui.toolbar.browser.action}
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
