import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from "../../data/store.js";
import Tone from 'tone';

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
                <table id='tableManager'>
                    <thead>
                    <tr>
                        { ['scene','Len','A', 'B', 'C', 'D'].map(r => <th>{r}</th>) }
                    </tr>
                    </thead>
                    <tbody>
                    { store.getScenesAsc().map(s => 
                        <tr onClick={this.rowClick} style={{height:'32px', backgroundColor: store.ui.selectedScene.id === s.id ? 'blue' : 'transparent'}}>
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