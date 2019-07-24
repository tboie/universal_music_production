import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from '../../../data/store.js';
import { randomId } from '../../../models/models.js';



export const MixRowViewManagerScene = observer(class MixRowViewManagerScene extends Component{
    componentDidMount(){}

    componentDidUpdate(prevProps){}

    componentWillUnmount(){}
    

    selectMixButton = (e) => {
      e.preventDefault();

      let scene = store.ui.selectedScene;

      switch(e.target.id.split('_')[1]){
        case 'New':
          let start = store.getSongLength();
          let end = Tone.Time(start) + Tone.Time('1:0:0');
          store.addScene('scene_' + randomId(), Tone.Time(start).toBarsBeatsSixteenths(), Tone.Time(end).toBarsBeatsSixteenths());    
          break;
        case 'Dup':
          store.duplicateScene(scene.id);
          break;
        case 'LenAdd':
          if(store.getSceneLength(scene.id) < Tone.Time('64:0:0'))
            store.shiftSceneTimes(scene.end, Tone.Time('1:0:0'), 'add');
          break;
        case 'LenSub':
          if(store.getSceneLength(scene.id) > Tone.Time('1:0:0'))
            store.shiftSceneTimes(scene.end, Tone.Time('1:0:0'), 'sub');
          break;
        case 'Up':
          if(scene.start !== '0:0:0')
            store.swapScenes(store.getPrevScene(scene.id).id, scene.id);
          break;
        case 'Down':
          if(scene.end !== Tone.Time(store.getSongLength()).toBarsBeatsSixteenths())
            store.swapScenes(scene.id, store.getSceneByTime(scene.end).id);
          break;
        case 'Del':
            store.delScene(scene.id);
          break;
        default:
      }
    }
  
    render(){
      return (
        <div className={"track-rowmix"} id={'trackrowmixmanagerscene'} style={{width: + this.props.store.ui.windowWidth}}>
          <button id="btnMixBar_New" className="btn-mix-scene" onClick={this.selectMixButton}>
            <i className='material-icons i-btn-mix-scene'>fiber_new</i>
          </button>
          <button id="btnMixBar_Dup" className="btn-mix-scene" onClick={this.selectMixButton}>
            <i className='material-icons i-btn-mix-scene'>file_copy</i>
          </button>
          <button id="btnMixBar_LenAdd" className="btn-mix-scene" onClick={this.selectMixButton}>
            <i className='material-icons i-btn-mix-scene'>add</i>
          </button>
          <button id="btnMixBar_LenSub" className="btn-mix-scene" onClick={this.selectMixButton}>
            <i className='material-icons i-btn-mix-scene'>remove</i>
          </button>
          <button id="btnMixBar_Up" className="btn-mix-scene" onClick={this.selectMixButton}>
            <i className='material-icons i-btn-mix-scene'>arrow_back</i>
          </button>
          <button id="btnMixBar_Down" className="btn-mix-scene" onClick={this.selectMixButton}>
            <i className='material-icons i-btn-mix-scene'>arrow_forward</i>
          </button>
          <button id="btnMixBar_Del" className="btn-mix-scene" onClick={this.selectMixButton}>
            <i className='material-icons i-btn-mix-scene red'>delete</i>
          </button>
        </div>
      )
    }
  })
  