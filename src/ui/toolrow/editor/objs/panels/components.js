//Copyright 2018-2019 Timothy Boie

import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from '../../../../../data/store.js';
import { UIEditorHeader, UICustomRangeControl, UITimeControl, UIWaveTypeControl, UIFilterTypeControl, UIFilterRolloffControl } from './template.js';


export const UIFilter = observer(class UIFilter extends Component {
  obj;

  render() {
    this.obj = store.components.filters.find(o => o.id === this.props.objId);

    return (
      <div className='divToolRowEditorContainer'>
        <UIEditorHeader obj={this.obj} type={this.props.type}/>
        <br/>
        <UICustomRangeControl obj={this.obj} propName='Q' min={0} max={12} mode={'steps'} step={1} density={10} numType={'integer'} signal={true}/>
        <br/><br/>
        <UIFilterTypeControl obj={this.obj} propName={"type"}/>
        <br/><br/>
        <UICustomRangeControl obj={this.obj} propName='frequency' min={0} max={10000} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
        <br/><br/>
        <UIFilterRolloffControl obj={this.obj} propName={"rolloff"}/>
      </div>
    )
  }
})

export const UIFrequencyEnvelope = observer(class UIFrequencyEnvelope extends Component {
  obj;

  render() {
    this.obj = store.components.frequencyenvelopes.find(o => o.id === this.props.objId);

    return (
      <div className='divToolRowEditorContainer'>
        <UIEditorHeader obj={this.obj} type={this.props.type}/>
        <br/><br/><br/>
        <UICustomRangeControl obj={this.obj} propName='attack' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
        <br/><br/>
        <UICustomRangeControl obj={this.obj} propName='decay' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
        <br/><br/>
        <UICustomRangeControl obj={this.obj} propName='sustain' min={0.01} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
        <br/><br/>
        <UICustomRangeControl obj={this.obj} propName='release' min={0.01} max={4} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
        <br/><br/>
        <UICustomRangeControl obj={this.obj} propName='baseFrequency' min={20} max={1000} mode='range' step={null} density={1} numType={'float'} signal={false}/>
        <br/><br/>
        <UICustomRangeControl obj={this.obj} propName='octaves' min={0} max={10} mode={'steps'} step={1} density={1} numType={'float'} signal={false}/>
      </div>
    )
  }
})


export const UIAmplitudeEnvelope = observer(class UIAmplitudeEnvelope extends Component {
  obj;

  render() {
    this.obj = store.components.amplitudeenvelopes.find(o => o.id === this.props.objId);
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
        <UIEditorHeader obj={this.obj} type={this.props.type}/>
        <br/><br/><br/>
        <UICustomRangeControl obj={this.obj} propName='attack' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
        <br/><br/>
        <UICustomRangeControl obj={this.obj} propName='decay' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
        <br/><br/>
        <UICustomRangeControl obj={this.obj} propName='sustain' min={0.01} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
        <br/><br/>
        <UICustomRangeControl obj={this.obj} propName='release' min={0.01} max={4} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
        <br/><br/>
      </div>
    )
  }
})

export const UIGate = observer(class UIGate extends Component {
    obj;
  
    render() {
      this.obj = store.components.gates.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName='threshold' min={-50} max={20} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='attack' min={0.01} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='release' min={0.01} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
          <br/><br/>
        </div>
      )
    }
  })
  
 export const UILimiter = observer(class UILimiter extends Component {
    obj;
  
    render() {
      this.obj = store.components.limiters.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName='threshold' min={-100} max={0} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
        </div>
      )
    }
  })

 export const UILFO = observer(class UILFO extends Component {
    obj;
  
    render() {
      this.obj = store.components.lfos.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UIWaveTypeControl obj={this.obj} propName={"type"}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'min'} min={-100} max={100} mode={'range'} step={1} density={1} numType={'integer'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'max'} min={-100} max={100} mode={'range'} step={1} density={1} numType={'integer'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'phase'} min={0} max={360} mode={'range'} step={1} density={1} numType={'integer'} signal={false}/>
          <br/><br/>
          <UITimeControl obj={this.obj} propName="frequency"/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'amplitude'} min={-100} max={100} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })
  
 export const UICompressor = observer(class UICompressor extends Component {
    obj;
  
    render() {
      this.obj = store.components.compressors.find(o => o.id === this.props.objId);
      //attack/release min and max values probably need to be verified
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName='ratio' min={1} max={20} mode={'steps'} step={1} density={30} numType={'integer'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='threshold' min={-50} max={0} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='attack' min={0} max={0.2} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='release' min={0.01} max={0.5} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='knee' min={-50} max={100} mode={'steps'} step={1} density={1} numType={'integer'} signal={true}/>
          <br/><br/>
        </div>
      )
    }
  })
  
  
  export const UIMultibandCompressor = observer(class UIMultibandCompressor extends Component {
    obj;
  
    render() {
      this.obj = store.components.multibandcompressors.find(o => o.id === this.props.objId);
      //attack/release min and max values probably need to be verified
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName='ratio' min={1} max={20} mode={'steps'} step={1} density={30} numType={'integer'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='threshold' min={-50} max={0} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='attack' min={0} max={0.2} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='release' min={0.01} max={0.5} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='knee' min={-50} max={100} mode={'steps'} step={1} density={1} numType={'integer'} signal={true}/>
          <br/><br/>
        </div>
      )
    }
  })
  
  export const UIMono = observer(class UIMono extends Component {
    obj;
  
    render() {
      this.obj = store.components.monos.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
        </div>
      )
    }
  })
  
  export const UIEQ3 = observer(class UIEQ3 extends Component {
    obj;
  
    render() {
      this.obj = store.components.eq3s.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName='low' min={-30} max={30} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='mid' min={-30} max={30} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='high' min={-30} max={30} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='lowFrequency' min={0} max={10000} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='highFrequency' min={0} max={10000} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
        </div>
      )
    }
  })
  
  export const UIPanVol = observer(class UIPanVol extends Component {
    obj;
  
    render() {
      this.obj = store.components.panvols.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName='volume' min={-100} max={10} mode='range' step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='pan' min={-1} max={1} mode='range' step={null} density={1} numType={'float'} signal={true}/>
          <br/>
        </div>
      )
    }
  })

  
  export const UIFeedbackCombFilter = observer(class UIFeedbackCombFilter extends Component {
    obj;
  
    render() {
      this.obj = store.components.feedbackcombfilters.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'delayTime'} min={0.01} max={1} mode={'range'} step={0.01} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'resonance'} min={0} max={1} mode={'range'} step={0.01} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })
  