import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from "../../data/store.js";
import Tone from 'tone';
import { MixRowViewManagerScene } from './trackrow/mixrowmanagerscene.js';

export const ManagerView = observer(class ManagerView extends Component {
    componentDidMount(){}
    componentWillUnmount(){}
    componentDidUpdate(prevProps){}

    rowClick = (e) => {
        if(e.target.parentNode){
            let txtScene = e.target.parentNode.cells[0].innerHTML;

            if(txtScene){
                let scene = store.getScene(txtScene);

                if(scene){
                    store.ui.selectScene(scene.id);
                }
            }
        }
    }
  
    render() {
        return(
            <div id='divManager'>
                <MixRowViewManagerScene store={this.props.store} selectedScene={this.props.selectedScene}/>
                <table id='tableManager'>
                    <thead>
                    <tr>
                        { ['scene','Len','A', 'B', 'C', 'D'].map(r => <th key={'table_col_' + r}>{r}</th>) }
                    </tr>
                    </thead>
                    <tbody>
                    { store.getScenesAsc().map(s => 
                        <tr key={'table_row_' + s.id} onClick={this.rowClick} style={{height:'32px', backgroundColor: this.props.selectedScene.id === s.id ? 'blue' : 'transparent'}}>
                            <td>{s.id}</td>
                            <td>{Tone.Time(store.getSceneLength(s.id)).toBarsBeatsSixteenths().split(':')[0]}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>)
                    }
                    </tbody>
                </table>
            </div>
        )
    }
});