import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from "../../data/store.js";
import Tone from 'tone';
import { MixRowViewManagerScene } from './trackrow/mixrowmanagerscene.js';

export const ManagerView = observer(class ManagerView extends Component {
    componentDidMount(){
        store.getScenesAsc().forEach(scene => {
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
                <MixRowViewManagerScene store={this.props.store} selectedScene={this.props.selectedScene}/>
                <div id='divManagerTable' style={{height:(this.props.windowHeight - 160) + 'px', overflowY:'scroll'}}>
                    <table id='tableManager'>
                        <thead>
                        <tr>
                            { ['scene','Len','A', 'B', 'C', 'D'].map(r => <th key={'table_col_' + r}>{r}</th>) }
                        </tr>
                        </thead>
                        <tbody>
                        { store.getScenesAsc().map(s => 
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