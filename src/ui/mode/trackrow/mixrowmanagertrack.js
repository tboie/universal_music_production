import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from '../../../data/store.js';
import { randomId } from '../../../models/models.js';



export const MixRowViewManagerTrack = observer(class MixRowViewManagerTrack extends Component{
    componentDidMount(){
     // this.togglePasteButton();
      //this.toggleButtons(['Copy','Del','Rand']);
    }

    componentDidUpdate(prevProps){
      //this.togglePasteButton();
      //this.toggleButtons(['Copy','Del','Rand']);
    }

    componentWillUnmount(){}

    togglePasteButton = () => {
      let eleBtn = document.getElementById('btnMixBar_Paste');
      eleBtn.disabled = (this.props.numSelectedBars > 0 && this.props.numCopiedBars > 0) ? false : true;
    }

    toggleButtons = (btnIds) => {
      btnIds.forEach(id => {
        let eleBtn = document.getElementById('btnMixBar_' + id);
        
        if(id === 'Rand' && this.props.track.type === 'audio')
          eleBtn.disabled = true;
        else
          eleBtn.disabled = this.props.numSelectedBars > 0 ? false : true;
      })
    }

    selectMixButton = (e) => {
      e.preventDefault();

      let track = store.ui.selectedTrack;

      switch(e.target.id.split('_')[1]){
        case 'Dup':
          store.duplicateTrack(track.id);
          break;
        case 'Group':
          break;
        case 'Up':
          break;
        case 'Down':
          break;
        case 'Clear':
            break;
        case 'Del':
            store.delTrack(track.id);
          break;
        default:
      }
    }
  
    render(){
      return (
        <div className={"track-rowmix"} id={'trackrowmixmanagertrack'} style={{width: + this.props.store.ui.windowWidth}}>
          <button id="btnMixBar_Dup" className="btn-mix-scene" onClick={this.selectMixButton}>
            <i className='material-icons i-btn-mix-scene'>file_copy</i>
          </button>
          <button id="btnMixBar_Group" className="btn-mix-scene" onClick={this.selectMixButton}>
            { store.ui.selectedTrack.group }
          </button>
          <button id="btnMixBar_Up" className="btn-mix-scene" onClick={this.selectMixButton}>
            <i className='material-icons i-btn-mix-scene'>arrow_upward</i>
          </button>
          <button id="btnMixBar_Down" className="btn-mix-scene" onClick={this.selectMixButton}>
            <i className='material-icons i-btn-mix-scene'>arrow_downward</i>
          </button>
          <button id="btnMixBar_Clear" className="btn-mix-scene" onClick={this.selectMixButton}>
            Clear
          </button>
          <button id="btnMixBar_Del" className="btn-mix-scene" onClick={this.selectMixButton}>
            <i className='material-icons i-btn-mix-scene red'>delete</i>
          </button>
        </div>
      )
    }
  })
  