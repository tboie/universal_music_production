import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from "../../data/store.js";
import Tone from 'tone';
import { MixRowViewManagerScene } from './trackrow/mixrowmanagerscene.js';
import { MixRowViewManagerTrack} from './trackrow/mixrowmanagertrack.js';


export const ManagerView = observer(class ManagerView extends Component {
    componentDidMount(){
    }
    componentDidUpdate(prevProps){}
    componentWillUnmount(){}
    render() {
        let view;
        if(this.props.managerMode === 'scene') 
            view = <ManagerViewScene store={this.props.store} selectedScene={this.props.store.ui.selectedScene} 
                        windowHeight={this.props.store.ui.windowHeight}/>
        else if(this.props.managerMode === 'track'){
            if(store.getNumTracks > 0){
                view = <ManagerViewTrack store={this.props.store} selectedTrack={this.props.store.ui.selectedTrack} 
                            windowHeight={this.props.store.ui.windowHeight}/>
            }
            else{
                view = <label className='labelCenter'>No Tracks</label>
            }
        }

        return(
            <div style={{width:'100%', height:(store.ui.windowHeight - 80) + 'px', display:'table', backgroundColor:'rgba(0,0,0,0.9)'}}>
                { view } 
            </div>
        )
    }
})

export const ManagerViewTrack = observer(class ManagerViewTrack extends Component {
    componentDidMount(){
        ['A','B','C','D'].forEach(g => {
            store.getTracksByGroup(g).forEach(t => {
                this.setTrackMuteButton(t.id, t.mute);
            });
        });
    }
    componentDidUpdate(prevProps){}
    componentWillUnmount(){}

    rowClick = (e) => {
        if(e.target.parentNode && e.target.parentNode.cells){
            let txtTrack = e.target.parentNode.cells[1].innerHTML;

            if(txtTrack){
                let track = store.getTrack(txtTrack);

                if(track){
                    store.ui.selectTrack(track.id);
                }
            }
        }
    }

    muteTrack = (trackId) => {
        let track = store.getTrack(trackId);
       
        if(!track.mute){
            track.toggleMute(true);
            this.setTrackMuteButton(track.id, true)
        }
        else{
            track.toggleMute(false);
            this.setTrackMuteButton(track.id, false)
        }
    }

    setTrackMuteButton = (trackId, mute) => {
        let eleBtn = document.getElementById('table_row_' + trackId + '_btn_mute');
        
        if(mute){
            if(!eleBtn.classList.contains('bgColorOn'))
                eleBtn.classList.add('bgColorOn');
        }
        else{
            if(eleBtn.classList.contains('bgColorOn'))
                eleBtn.classList.remove('bgColorOn');
        }
    }

    editTrack = (trackId) => {
        store.ui.selectTrack(trackId);
        store.ui.toggleViewMode('edit');
    }

    render() {
        let selTrackId = this.props.selectedTrack ? this.props.selectedTrack.id : undefined;

        return(
            <div id='divManager'>
                <MixRowViewManagerTrack store={this.props.store} selectedTrack={this.props.selectedTrack}/>
                <div id='divManagerTable' style={{height:(this.props.windowHeight - 160) + 'px', overflowY:'scroll'}}>
                    <table id='tableManager'>
                        <thead>
                        <tr>
                            { ['edit', 'track', 'type', 'grp', 'notes', 'mute'].map(r => <th key={'table_track_col_' + r}>{r}</th>) }
                        </tr>
                        </thead>
                        <tbody>
                            {['A','B','C','D'].map(g => 
                                store.getTracksByGroup(g).map(t => 
                                    <tr key={'table_row_' + t.id} onClick={this.rowClick} style={{backgroundColor: selTrackId === t.id ? 'blue' : 'transparent'}}>
                                        <td><button id={'table_row_' + t.id + '_btn_edit'} 
                                            className='managerTableColButton' onClick={() => this.editTrack(t.id)}>Edt</button></td>
                                        <td>{t.id}</td>
                                        <td>{t.type.substr(0,5)}</td>
                                        <td>{t.group}</td>
                                        <td>{store.getNotesByTrack(t.id).length}</td>
                                        <td><button id={'table_row_' + t.id + '_btn_mute'} 
                                            className='managerTableColButton' onClick={() => this.muteTrack(t.id)}>M</button>
                                        </td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                    <br/><br/><br/>
                </div>
            </div>
        )
    }
});

export const ManagerViewScene = observer(class ManagerViewScene extends Component {
    componentDidMount(){
        store.getScenesAsc.forEach(scene => {
            ['A','B','C','D'].forEach(group => {
                this.setGroupMuteButton(scene.id, group, scene.isGroupMuted(group));
            })
        })
    }
    componentDidUpdate(prevProps){}
    componentWillUnmount(){}

    rowClick = (e) => {
        if(e.target.parentNode && e.target.parentNode.cells){
            let txtScene = e.target.parentNode.cells[0].innerHTML;

            if(txtScene){
                let scene = store.getScene(txtScene);

                if(scene){
                    store.ui.selectScene(scene.id);
                }
            }
        }
    }

    muteSceneGroup = (sceneId, group) => {
        let scene = store.getScene(sceneId);
       
        if(!scene.isGroupMuted(group)){
            scene.setGroupMute(group, true);
            this.setGroupMuteButton(scene.id, group, true)
        }
        else{
            scene.setGroupMute(group, false);
            this.setGroupMuteButton(scene.id, group, false)
        }
    }

    setGroupMuteButton = (sceneId, group, mute) => {
        let eleBtn = document.getElementById('table_row_' + sceneId + '_btn_' + group);
        
        if(mute){
            if(!eleBtn.classList.contains('bgColorOn'))
                eleBtn.classList.add('bgColorOn');
        }
        else{
            if(eleBtn.classList.contains('bgColorOn'))
                eleBtn.classList.remove('bgColorOn');
        }
    }
  
    render() {
        return(
            <div id='divManager'>
                <MixRowViewManagerScene store={this.props.store} selectedScene={this.props.selectedScene} copySceneMode={store.ui.views.manager.copySceneMode}/>
                <div id='divManagerTable' style={{height:(this.props.windowHeight - 160) + 'px', overflowY:'scroll'}}>
                    <table id='tableManager'>
                        <thead>
                        <tr>
                            { ['scene','Len','A', 'B', 'C', 'D'].map(r => <th key={'table_scene_col_' + r}>{r}</th>) }
                        </tr>
                        </thead>
                        <tbody>
                        { store.getScenesAsc.map(s => 
                            <tr key={'table_row_' + s.id} onClick={this.rowClick} style={{backgroundColor: this.props.selectedScene.id === s.id ? 'blue' : 'transparent'}}>
                                <td>{s.id}</td>
                                <td>{Tone.Time(store.getSceneLength(s.id)).toBarsBeatsSixteenths().split(':')[0]}</td>
                                {['A','B','C','D'].map(g => 
                                    <td key={'table_row_' + s.id + '_btn_' + g}><button id={'table_row_' + s.id + '_btn_' + g} 
                                        className='managerTableColButton' onClick={() => this.muteSceneGroup(s.id, g)}>M</button></td>
                                )}
                            </tr>)
                        }
                        </tbody>
                    </table>
                    <br/><br/><br/>
                </div>
            </div>
        )
    }
});