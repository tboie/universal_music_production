import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from '../../../data/store.js';


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
            track.toggleGroup();
            break;
          case 'Up':
            track.moveTrackUp();
            break;
          case 'Down':
            track.moveTrackDown();
            break;
          case 'Clear':
            track.delNotes();
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
  