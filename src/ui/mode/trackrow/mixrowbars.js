import React, { Component } from 'react';
import { observer } from "mobx-react";

export const MixRowViewBars = observer(class MixRowViewBars extends Component{
    componentDidMount(){}
    componentWillUnmount(){}
    componentDidUpdate(prevProps){}
  
    selectMixButton = (e) => {
      e.preventDefault();

      switch(e.target.id.split('_')[1]){
        case 'Copy':
          this.props.store.ui.views.edit.copySelectedBars();
          break;
        case 'Paste':
          break;
        case 'Clear':
          break;
        case 'Rand':
          break;
        default:
      }
    }
  
    render(){
      return (
        <div className={"track-rowmix"} id={'trackrowmixbars_' + this.props.track.id + '_' + this.props.bar} style={{width: + this.props.store.ui.windowWidth}}>
          <button id="btnMixNote_Copy" className="btn-mix-bars" onClick={this.selectMixButton}>Copy</button>
          <button id="btnMixNote_Paste" className="btn-mix-bars" onClick={this.selectMixButton}>Paste</button>
          <button id="btnMixNote_Clear" className="btn-mix-bars" onClick={this.selectMixButton}>Clear</button>
          <button id="btnMixNote_Rand" className="btn-mix-bars" onClick={this.selectMixButton}>Rand</button>
        </div>
      )
    }
  })
  