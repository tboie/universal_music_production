//Copyright 2018-2019 Timothy Boie

import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from '../../../../../data/store.js';
import { UIEditorHeader, UICustomRangeControl, UIWaveTypeControl, UINoiseTypeControl } from './template.js';

export const UIOscillator = observer(class UIOscillator extends Component {
    obj;
  
    render() {
      this.obj = store.sources.oscillators.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type} />
          <br/><br/><br/>
          <UIWaveTypeControl obj={this.obj} propName={"type"}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'detune'} min={-100} max={100} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'phase'} min={0} max={360} mode={'range'} step={1} density={1} numType={'integer'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='volume' min={-100} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })


export const UIAMOscillator = observer(class UIAMOscillator extends Component {
    obj;
  
    render() {
      this.obj = store.sources.amoscillators.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type} />
          <br/><br/><br/>
          <UIWaveTypeControl obj={this.obj} propName={"type"}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'detune'} min={-100} max={100} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'phase'} min={0} max={360} mode={'range'} step={1} density={1} numType={'integer'} signal={false}/>
          <br/><br/>
          <UIWaveTypeControl obj={this.obj} propName={"modulationType"}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='harmonicity' min={0} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='volume' min={-100} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })

  export const UIFMOscillator = observer(class UIFMOscillator extends Component {
    obj;
  
    render() {
      this.obj = store.sources.fmoscillators.find(o => o.id === this.props.objId);

      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type} />
          <br/><br/><br/>
          <UIWaveTypeControl obj={this.obj} propName={"type"}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'detune'} min={-100} max={100} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'phase'} min={0} max={360} mode={'range'} step={1} density={1} numType={'integer'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='modulationIndex' min={0} max={100} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UIWaveTypeControl obj={this.obj} propName={"modulationType"}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='harmonicity' min={0} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='volume' min={-100} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })

  export const UIFatOscillator = observer(class UIFatOscillator extends Component {
    obj;
  
    render() {
      this.obj = store.sources.fatoscillators.find(o => o.id === this.props.objId);

      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type} />
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'detune'} min={-100} max={100} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'phase'} min={0} max={360} mode={'range'} step={1} density={1} numType={'integer'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'spread'} min={0} max={360} mode={'range'} step={1} density={1} numType={'integer'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'count'} min={1} max={10} mode={'range'} step={1} density={1} numType={'integer'} signal={false}/>
          <br/><br/>
          <UIWaveTypeControl obj={this.obj} propName={"type"}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='volume' min={-100} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })

  export const UIPWMOscillator = observer(class UIPWMOscillator extends Component {
    obj;
  
    render() {
      this.obj = store.sources.pwmoscillators.find(o => o.id === this.props.objId);

      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type} />
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'detune'} min={-100} max={100} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'phase'} min={0} max={360} mode={'range'} step={1} density={1} numType={'integer'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'modulationFrequency'} min={0} max={1000} mode={'range'} step={1} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='volume' min={-100} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })

  export const UIPulseOscillator = observer(class UIPulseOscillator extends Component {
    obj;
  
    render() {
      this.obj = store.sources.pulseoscillators.find(o => o.id === this.props.objId);

      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type} />
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'detune'} min={-100} max={100} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'phase'} min={0} max={360} mode={'range'} step={1} density={1} numType={'integer'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'width'} min={0} max={1} mode={'range'} step={0.01} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='volume' min={-100} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })

  export const UINoise = observer(class UINoise extends Component {
    obj;
  
    render() {
      this.obj = store.sources.noises.find(o => o.id === this.props.objId);

      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type} />
          <br/><br/><br/>
          <UINoiseTypeControl obj={this.obj} propName={"type"}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'playbackRate'} min={0} max={100} mode={'range'} step={0.01} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='volume' min={-100} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })




