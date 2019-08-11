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
          if(!this.props.copySceneMode){
            let start = store.getSongLength();
            let end = Tone.Time(start) + Tone.Time('1:0:0');
            store.addScene('scene_' + randomId(), Tone.Time(start).toBarsBeatsSixteenths(), Tone.Time(end).toBarsBeatsSixteenths());
          }
          else{
            store.duplicateScene(this.props.selectedScene.id);
          }    
          break;
        case 'Dup':
          store.ui.views.manager.toggleCopySceneMode();
          break;
        case 'LenAdd':
          if(!this.props.copySceneMode){
            if(store.getSceneLength(scene.id) < Tone.Time('64:0:0'))
              store.shiftSceneTimes(scene.end, Tone.Time('1:0:0'), 'add');
          }
          else{
            if(store.getSceneLength(scene.id) <= Tone.Time('32:0:0')){
              store.shiftSceneTimes(scene.end, Tone.Time(store.getSceneLength(this.props.selectedScene.id)), 'add');
              
              const totalBars = Tone.Time(store.getSceneLength(this.props.selectedScene.id)).toBarsBeatsSixteenths().split(':')[0];
              const halfTotalBars = totalBars / 2;

              ['A','B','C','D'].forEach(g => {
                store.getPatternsBySceneGroup(this.props.selectedScene.id, g).forEach(p => {
                  for(let i = 1; i <= halfTotalBars; i++){
                    const destBarNum = halfTotalBars + i;
                    p.pasteNotesToBar(p.getNotesByBar(i), destBarNum)
                  }
                });
              })
              
            }
          }
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
          <button id="btnMixBar_Dup" className={"btn-mix-scene " + (this.props.copySceneMode ? ' itemSelected' : '')}  onClick={this.selectMixButton}>
            <i className='material-icons i-btn-mix-scene'>file_copy</i>
          </button>
          <button id="btnMixBar_New" className="btn-mix-scene" onClick={this.selectMixButton}>
            <i className='material-icons i-btn-mix-scene'>fiber_new</i>
          </button>
          <button id="btnMixBar_LenAdd" className="btn-mix-scene" onClick={this.selectMixButton}>
            <i className='material-icons i-btn-mix-scene'>add</i>
          </button>
          <button id="btnMixBar_LenSub" className="btn-mix-scene" onClick={this.selectMixButton} disabled={this.props.copySceneMode ? true : false}>
            <i className='material-icons i-btn-mix-scene'>remove</i>
          </button>
          <button id="btnMixBar_Up" className="btn-mix-scene" onClick={this.selectMixButton} disabled={this.props.copySceneMode ? true : false}>
            <i className='material-icons i-btn-mix-scene'>arrow_back</i>
          </button>
          <button id="btnMixBar_Down" className="btn-mix-scene" onClick={this.selectMixButton} disabled={this.props.copySceneMode ? true : false}>
            <i className='material-icons i-btn-mix-scene'>arrow_forward</i>
          </button>
          <button id="btnMixBar_Del" className="btn-mix-scene" onClick={this.selectMixButton} disabled={this.props.copySceneMode ? true : false}>
            <i className='material-icons i-btn-mix-scene red'>delete</i>
          </button>
        </div>
      )
    }
  })
  