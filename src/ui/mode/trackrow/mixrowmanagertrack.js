import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from '../../../data/store.js';
import { randomId } from '../../../models/models.js';



export const MixRowViewManagerTrack = observer(class MixRowViewManagerTrack extends Component{
    componentDidMount(){}

    componentDidUpdate(prevProps){}

    componentWillUnmount(){}


    selectMixButton = (e) => {
      e.preventDefault();
      
      let track = this.props.selectedTrack;

      if(track){
        switch(e.target.id.split('_')[1]){
          case 'Dup':
            store.duplicateTrack(track.id);
            break;
          case 'Group':
            const groups = ['A','B','C','D'];
            let idx = groups.indexOf(track.group);
            idx === groups.length - 1 ? track.setGroup(groups[0]) : track.setGroup(groups[idx + 1]);
            break;
          case 'Up':

            break;
          case 'Down':

            break;
          case 'Clear':
            store.getPatternsByTrack(track.id).forEach(p => p.deleteNotes());
            break;
          case 'Del':
            store.delTrack(track.id);
            break;
          default:
        }
      }
    }
  
    render(){
      return (
        <div className={"track-rowmix"} id={'trackrowmixmanagertrack'} style={{width: + this.props.store.ui.windowWidth}}>
          <button id="btnMixBar_Dup" className="btn-mix-track" onClick={this.selectMixButton}>
            <i className='material-icons i-btn-mix-scene'>file_copy</i>
          </button>
          <button id="btnMixBar_Group" className="btn-mix-track" onClick={this.selectMixButton}>
            { this.props.selectedTrack ? this.props.selectedTrack.group : 'N/A' }
          </button>
          <button id="btnMixBar_Up" className="btn-mix-track" onClick={this.selectMixButton}>
            <i className='material-icons i-btn-mix-scene'>arrow_upward</i>
          </button>
          <button id="btnMixBar_Down" className="btn-mix-track" onClick={this.selectMixButton}>
            <i className='material-icons i-btn-mix-scene'>arrow_downward</i>
          </button>
          <button id="btnMixBar_Clear" className="btn-mix-track" onClick={this.selectMixButton}>
            Clr
          </button>
          <button id="btnMixBar_Del" className="btn-mix-track" onClick={this.selectMixButton}>
            <i className='material-icons i-btn-mix-scene red'>delete</i>
          </button>
        </div>
      )
    }
  })
  