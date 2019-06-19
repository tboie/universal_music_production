import React, { Component } from 'react';
import { observer } from "mobx-react";

export const MixRowViewBars = observer(class MixRowViewBars extends Component{
    componentDidMount(){
      this.togglePasteButton();
      this.toggleButtons(['Copy','Del','Rand']);
    }

    componentDidUpdate(prevProps){
      this.togglePasteButton();
      this.toggleButtons(['Copy','Del','Rand']);
    }

    componentWillUnmount(){}

    togglePasteButton = () => {
      let eleBtn = document.getElementById('btnMixBar_Paste');
      eleBtn.disabled = (this.props.numSelectedBars > 0 && this.props.numCopiedBars > 0) ? false : true;
    }

    toggleButtons = (btnIds) => {
      btnIds.forEach(id => {
        document.getElementById('btnMixBar_' + id).disabled = this.props.numSelectedBars > 0 ? false : true;
      })
    }

    selectMixButton = (e) => {
      e.preventDefault();

      switch(e.target.id.split('_')[1]){
        case 'Copy':
          this.props.store.ui.views.edit.copySelectedBars();
          break;
        case 'Paste':
          this.props.store.ui.views.edit.pasteCopiedBars();
          break;
        case 'Del':
          this.props.store.ui.views.edit.deleteSelectedBarNotes();
          break;
        case 'Rand':
          this.props.store.ui.views.edit.randomizeSelectedBarNotes();
          break;
        default:
      }
    }
  
    render(){
      return (
        <div className={"track-rowmix"} id={'trackrowmixbars_' + this.props.track.id + '_' + this.props.bar} style={{width: + this.props.store.ui.windowWidth}}>
          <button id="btnMixBar_Copy" className="btn-mix-bars" onClick={this.selectMixButton}>Copy</button>
          <button id="btnMixBar_Paste" className="btn-mix-bars" onClick={this.selectMixButton}>Paste</button>
          <button id="btnMixBar_Del" className="btn-mix-bars" onClick={this.selectMixButton}>Del</button>
          <button id="btnMixBar_Rand" className="btn-mix-bars" onClick={this.selectMixButton}>Rand</button>
        </div>
      )
    }
  })
  