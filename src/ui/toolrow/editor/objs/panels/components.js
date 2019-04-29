//Copyright 2018-2019 Timothy Boie

import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from '../../../../../data/store.js';
import { UIEditorHeader, UICustomRangeControl, UITimeControl, UIWaveTypeControl, UIFilterTypeControl, UIFilterRolloffControl } from './template.js';


export const UIFilter = props => {
  let obj = store.components.filters.find(o => o.id === props.objId);

  return (
    <div className='divToolRowEditorContainer'>
      <UIEditorHeader obj={obj} type={props.type}/>
      <UICustomRangeControl obj={obj} propName='Q' min={0} max={10} mode={'steps'} step={1} density={10} numType={'integer'} signal={true}/>
      <UIFilterTypeControl obj={obj} propName={"type"}/>
      <UICustomRangeControl obj={obj} propName='frequency' min={0} max={10000} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
      <UIFilterRolloffControl obj={obj} propName={"rolloff"}/>
    </div>
  )
}

export const UIFrequencyEnvelope = props => {
  let obj = store.components.frequencyenvelopes.find(o => o.id === props.objId);

  return (
    <div className='divToolRowEditorContainer'>
      <UIEditorHeader obj={obj} type={props.type}/>
      <UICustomRangeControl obj={obj} propName='attack' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
      <UICustomRangeControl obj={obj} propName='decay' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
      <UICustomRangeControl obj={obj} propName='sustain' min={0.01} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
      <UICustomRangeControl obj={obj} propName='release' min={0.01} max={4} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
      <UICustomRangeControl obj={obj} propName='baseFrequency' min={20} max={1000} mode='range' step={null} density={1} numType={'float'} signal={false}/>
      <UICustomRangeControl obj={obj} propName='octaves' min={0} max={10} mode={'steps'} step={1} density={1} numType={'float'} signal={false}/>
    </div>
  )
}


export const UIAmplitudeEnvelope = props => {
  let obj = store.components.amplitudeenvelopes.find(o => o.id === props.objId);
    /*
    attack: types.optional(types.number, 0.1),
    decay: types.optional(types.number, 0.2),
    sustain: types.optional(types.number, 1),
    release: types.optional(types.number, 0.8),

    attackCurve: types.optional(types.union(types.string, types.array(types.number)), "linear"), //linear exponential sine cosine bounce ripple step
    decayCurve: types.optional(types.union(types.string, types.array(types.number)), "exponential"), 
    releaseCurve: types.optional(types.union(types.string, types.array(types.number)), "exponential"), 
    */

  return (
    <div className='divToolRowEditorContainer'>
      <UIEditorHeader obj={obj} type={props.type}/>
      <UICustomRangeControl obj={obj} propName='attack' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
      <UICustomRangeControl obj={obj} propName='decay' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
      <UICustomRangeControl obj={obj} propName='sustain' min={0.01} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
      <UICustomRangeControl obj={obj} propName='release' min={0.01} max={4} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
    </div>
  )
}

export const UIGate = props => {
  let obj = store.components.gates.find(o => o.id === props.objId);

  return (
    <div className='divToolRowEditorContainer'>
      <UIEditorHeader obj={obj} type={props.type}/>
      <UICustomRangeControl obj={obj} propName='threshold' min={-50} max={20} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
      <UICustomRangeControl obj={obj} propName='attack' min={0.01} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
      <UICustomRangeControl obj={obj} propName='release' min={0.01} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
    </div>
  )
}
  
export const UILimiter = props => {
  let obj = store.components.limiters.find(o => o.id === props.objId);

  return (
    <div className='divToolRowEditorContainer'>
      <UIEditorHeader obj={obj} type={props.type}/>
      <UICustomRangeControl obj={obj} propName='threshold' min={-100} max={0} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
    </div>
  )
}

 export const UILFO = props => {
  let obj = store.components.lfos.find(o => o.id === props.objId);

  return (
    <div className='divToolRowEditorContainer'>
      <UIEditorHeader obj={obj} type={props.type}/>
      <UIWaveTypeControl obj={obj} propName={"type"}/>
      <UICustomRangeControl obj={obj} propName={'min'} min={-100} max={100} mode={'range'} step={1} density={1} numType={'integer'} signal={false}/>
      <UICustomRangeControl obj={obj} propName={'max'} min={-100} max={100} mode={'range'} step={1} density={1} numType={'integer'} signal={false}/>
      <UICustomRangeControl obj={obj} propName={'phase'} min={0} max={360} mode={'range'} step={1} density={1} numType={'integer'} signal={false}/>
      <UITimeControl obj={obj} propName="frequency"/>
      <UICustomRangeControl obj={obj} propName={'amplitude'} min={-100} max={100} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
    </div>
  )
}
  
 export const UICompressor = props => {
  let obj = store.components.compressors.find(o => o.id === props.objId);
  //attack/release min and max values probably need to be verified
  return (
    <div className='divToolRowEditorContainer'>
      <UIEditorHeader obj={obj} type={props.type}/>
      <UICustomRangeControl obj={obj} propName='ratio' min={1} max={30} mode={'steps'} step={1} density={30} numType={'integer'} signal={true}/>
      <UICustomRangeControl obj={obj} propName='threshold' min={-50} max={0} mode={'range'} step={0.01} density={1} numType={'float'} signal={true}/>
      <UICustomRangeControl obj={obj} propName='attack' min={0} max={0.2} mode={'range'} step={0.001} density={1} numType={'float'} signal={true}/>
      <UICustomRangeControl obj={obj} propName='release' min={0.001} max={5} mode={'range'} step={0.001} density={1} numType={'float'} signal={true}/>
      <UICustomRangeControl obj={obj} propName='knee' min={-50} max={50} mode={'range'} step={0.01} density={1} numType={'float'} signal={true}/>
    </div>
  )
}
  
export const UIMultibandCompressor = observer(class UIMultibandCompressor extends Component {
  obj;
  arrSections = ['main', 'low', 'mid', 'high'];
  selSection = 'main';

  selectSection = (section) => {
    this.selSection = section;
    this.forceUpdate();
  }

  getDisplay = (s) => {
    if(s === this.selSection)
      return 'block'
    else
      return 'none'
  }

  render() {
    this.obj = store.components.multibandcompressors.find(o => o.id === this.props.objId);

    return (
      <div className='divToolRowEditorContainer'>
        <UIEditorHeader obj={this.obj} sections={this.arrSections} selSection={this.selSection} type={this.props.type} selectSection={this.selectSection}/>
        <div style={{display:this.getDisplay('main')}}>
          <UICustomRangeControl obj={this.obj} propName='lowFrequency' min={20} max={20000} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <UICustomRangeControl obj={this.obj} propName='highFrequency' min={20} max={20000} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
        </div>
        { 
          this.arrSections.map(section => {
            if(section !== 'main'){
              return <div style={{display:this.getDisplay(section)}}>
                      <UICustomRangeControl obj={this.obj} propName='ratio' min={1} max={30} mode={'steps'} step={1} density={30} numType={'integer'} signal={true} child={section}/>
                      <UICustomRangeControl obj={this.obj} propName='threshold' min={-50} max={0} mode={'range'} step={0.01} density={1} numType={'float'} signal={true} child={section}/>
                      <UICustomRangeControl obj={this.obj} propName='attack' min={0} max={0.2} mode={'range'} step={0.001} density={1} numType={'float'} signal={true} child={section}/>
                      <UICustomRangeControl obj={this.obj} propName='release' min={0.001} max={5} mode={'range'} step={0.001} density={1} numType={'float'} signal={true} child={section}/>
                      <UICustomRangeControl obj={this.obj} propName='knee' min={-50} max={50} mode={'range'} step={0.01} density={1} numType={'float'} signal={true} child={section}/>
                    </div>
            }
          }) 
        }
      </div>
    )
  }
})

export const UIMidSideCompressor = observer(class UIMidSideCompressor extends Component {
  obj;
  arrSections = ['mid', 'side'];
  selSection = 'mid';

  selectSection = (section) => {
    this.selSection = section;
    this.forceUpdate();
  }

  getDisplay = (s) => {
    if(s === this.selSection)
      return 'block'
    else
      return 'none'
  }

  render() {
    this.obj = store.components.midsidecompressors.find(o => o.id === this.props.objId);

    return (
      <div className='divToolRowEditorContainer'>
        <UIEditorHeader obj={this.obj} sections={this.arrSections} selSection={this.selSection} type={this.props.type} selectSection={this.selectSection}/>
        { 
          this.arrSections.map(section => {
            return <div style={{display:this.getDisplay(section)}}>
                      <UICustomRangeControl obj={this.obj} propName='ratio' min={1} max={30} mode={'steps'} step={1} density={30} numType={'integer'} signal={true} child={section}/>
                      <UICustomRangeControl obj={this.obj} propName='threshold' min={-50} max={0} mode={'range'} step={0.01} density={1} numType={'float'} signal={true} child={section}/>
                      <UICustomRangeControl obj={this.obj} propName='attack' min={0} max={0.2} mode={'range'} step={0.001} density={1} numType={'float'} signal={true} child={section}/>
                      <UICustomRangeControl obj={this.obj} propName='release' min={0.001} max={5} mode={'range'} step={0.001} density={1} numType={'float'} signal={true} child={section}/>
                      <UICustomRangeControl obj={this.obj} propName='knee' min={-50} max={50} mode={'range'} step={0.01} density={1} numType={'float'} signal={true} child={section}/>
                  </div>
          }) 
        }
      </div>
    )
  }
})
  
export const UIMono = props => {
  let obj = store.components.monos.find(o => o.id === props.objId);

  return (
    <div className='divToolRowEditorContainer'>
      <UIEditorHeader obj={obj} type={props.type}/>
    </div>
  )
}
  
export const UIEQ3 = props => {
  let obj = store.components.eq3s.find(o => o.id === props.objId);

  return (
    <div className='divToolRowEditorContainer'>
      <UIEditorHeader obj={obj} type={props.type}/>
      <UICustomRangeControl obj={obj} propName='low' min={-30} max={30} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
      <UICustomRangeControl obj={obj} propName='mid' min={-30} max={30} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
      <UICustomRangeControl obj={obj} propName='high' min={-30} max={30} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
      <UICustomRangeControl obj={obj} propName='lowFrequency' min={20} max={20000} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
      <UICustomRangeControl obj={obj} propName='highFrequency' min={20} max={20000} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
      <UICustomRangeControl obj={obj} propName='Q' min={0} max={10} mode={'steps'} step={1} density={10} numType={'integer'} signal={true}/>
    </div>
  )
}
  
export const UIPanVol = props => {
  let obj = store.components.panvols.find(o => o.id === props.objId);

  return (
    <div className='divToolRowEditorContainer'>
      <UIEditorHeader obj={obj} type={props.type}/>
      <UICustomRangeControl obj={obj} propName='volume' min={-100} max={10} mode='range' step={null} density={1} numType={'float'} signal={true}/>
      <UICustomRangeControl obj={obj} propName='pan' min={-1} max={1} mode='range' step={null} density={1} numType={'float'} signal={true}/>
    </div>
  )
}

export const UILowpassCombFilter = props => {
  let obj = store.components.lowpasscombfilters.find(o => o.id === props.objId);

  return (
    <div className='divToolRowEditorContainer'>
      <UIEditorHeader obj={obj} type={props.type}/>
      <UICustomRangeControl obj={obj} propName={'delayTime'} min={0.001} max={1} mode={'range'} step={0.001} density={1} numType={'float'} signal={true}/>
      <UICustomRangeControl obj={obj} propName={'resonance'} min={0} max={1} mode={'range'} step={0.001} density={1} numType={'float'} signal={true}/>
      <UICustomRangeControl obj={obj} propName={'dampening'} min={20} max={20000} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
    </div>
  )
}

  
export const UIFeedbackCombFilter = props => {
  let obj = store.components.feedbackcombfilters.find(o => o.id === props.objId);

  return (
    <div className='divToolRowEditorContainer'>
      <UIEditorHeader obj={obj} type={props.type}/>
      <UICustomRangeControl obj={obj} propName={'delayTime'} min={0.001} max={1} mode={'range'} step={0.001} density={1} numType={'float'} signal={true}/>
      <UICustomRangeControl obj={obj} propName={'resonance'} min={0} max={1} mode={'range'} step={0.001} density={1} numType={'float'} signal={true}/>
    </div>
  )
}

export const UIMultibandSplit = observer(class UIMultibandSplit extends Component {
  obj;
  arrSections = ['main', 'low', 'mid', 'high'];
  selSection = 'main';

  selectSection = (section) => {
    this.selSection = section;
    this.forceUpdate();
  }

  getDisplay = (s) => {
    if(s === this.selSection)
      return 'block'
    else
      return 'none'
  }

  render() {
    this.obj = store.components.multibandsplits.find(o => o.id === this.props.objId);

    return (
      <div className='divToolRowEditorContainer'>
        <UIEditorHeader obj={this.obj} sections={this.arrSections} selSection={this.selSection} type={this.props.type} selectSection={this.selectSection}/>
        <div style={{display:this.getDisplay('main')}}>
          <UICustomRangeControl obj={this.obj} propName='lowFrequency' min={20} max={20000} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <UICustomRangeControl obj={this.obj} propName='highFrequency' min={20} max={20000} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <UICustomRangeControl obj={this.obj} propName='Q' min={0} max={10} mode={'steps'} step={1} density={10} numType={'integer'} signal={true}/>
        </div>
        { 
          this.arrSections.map(section => {
            if(section !== 'main'){
              return <div style={{display:this.getDisplay(section)}}>
                        <UICustomRangeControl obj={this.obj} propName='Q' min={0} max={10} mode={'steps'} step={1} density={10} numType={'integer'} signal={true} child={section}/>
                        <UIFilterTypeControl obj={this.obj} propName={"type"}  child={section}/>
                        <UICustomRangeControl obj={this.obj} propName='frequency' min={0} max={10000} mode={'range'} step={null} density={1} numType={'float'} signal={true} child={section}/>
                        <UIFilterRolloffControl obj={this.obj} propName={"rolloff"} child={section}/>
                      </div>
            }
          }) 
        }
      </div>
    )
  }
})

export const UIVolume = props => {
  let obj = store.components.volumes.find(o => o.id === props.objId);

  return (
    <div className='divToolRowEditorContainer'>
      <UIEditorHeader obj={obj} type={props.type}/>
      <UICustomRangeControl obj={obj} propName='volume' min={-100} max={10} mode='range' step={null} density={1} numType={'float'} signal={true}/>
    </div>
  )
}

  
export const UIPanner = props => {
  let obj = store.components.panners.find(o => o.id === props.objId);

  return (
    <div className='divToolRowEditorContainer'>
      <UIEditorHeader obj={obj} type={props.type}/>
      <UICustomRangeControl obj={obj} propName='pan' min={-1} max={1} mode='range' step={null} density={1} numType={'float'} signal={true}/>
    </div>
  )
}