//Copyright 2018-2019 Timothy Boie

import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from '../../../../../data/store.js';
import { UIEditorHeader, UICustomRangeControl, UIWaveTypeControl, UIFilterTypeControl, UIFilterRolloffControl, UICurveTypeControl, UINoiseTypeControl, UIOmniOscTypeControl } from './template.js';

const randomId = () => Math.random().toString(36).substr(2, 5)

export const UISynth = observer(class UISynth extends Component {
  obj;
  arrSections = ['main', 'env'];
  selSection = 'main';

  selectSection = (section) => {
    this.selSection = section;
    this.forceUpdate();
  }

  getDisplay = (s) => {
    return s === this.selSection ? 'block' : 'none';
  }

  setRandomVals = () => {
    this.random = randomId();
    this.forceUpdate();
  }

  render() {
    this.obj = store.instruments.synths.find(o => o.id === this.props.objId);
    
    return (
      <div className='divToolRowEditorContainer'>
        <UIEditorHeader obj={this.obj} editorNum={this.props.editorNum} sections={this.arrSections} selSection={this.selSection} type={this.props.type} selectSection={this.selectSection} funcRandom={this.setRandomVals}/>
        <div style={{display:this.getDisplay('main')}}>
          <UIOmniOscTypeControl obj={this.obj} editorNum={this.props.editorNum} propName={'type'} child={'oscillator'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='volume' min={-100} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='portamento' min={0} max={0.3} mode={'range'} step={0.01} density={1} numType={'float'} signal={false}/>
        </div>
        <div style={{display:this.getDisplay('env')}}>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='attack' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='decay' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='sustain' min={0.01} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='release' min={0.01} max={4} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
        </div>
      </div>
    )
  }
})


export const UIAMSynth = observer(class UIAMSynth extends Component {
  obj;
  arrSections = ['main', 'env', 'mod'];
  selSection = 'main';

  selectSection = (section) => {
    this.selSection = section;
    this.forceUpdate();
  }

  getDisplay = (s) => {
    return s === this.selSection ? 'block' : 'none';
  }

  setRandomVals = () => {
    this.random = randomId();
    this.forceUpdate();
  }

  render() {
    this.obj = store.instruments.amsynths.find(o => o.id === this.props.objId);

    return (
      <div className='divToolRowEditorContainer'>
        <UIEditorHeader obj={this.obj} editorNum={this.props.editorNum} sections={this.arrSections} selSection={this.selSection} type={this.props.type} selectSection={this.selectSection} funcRandom={this.setRandomVals}/>
        <div style={{display:this.getDisplay('main')}}>
          <UIOmniOscTypeControl obj={this.obj} editorNum={this.props.editorNum} propName={'type'} child={'oscillator'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='volume' min={-100} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='harmonicity' min={0} max={4} mode={'range'} step={0.1} density={1} numType={'float'} signal={true} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='portamento' min={0} max={0.3} mode={'range'} step={0.01} density={1} numType={'float'} signal={false}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='detune' min={-100} max={100} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
        </div>
        <div style={{display:this.getDisplay('env')}}>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='attack' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='decay' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='sustain' min={0.01} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='release' min={0.01} max={4} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
        </div>
        <div style={{display:this.getDisplay('mod')}}>
          <UIWaveTypeControl obj={this.obj} editorNum={this.props.editorNum} propName={"type"} child={'modulation'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='attack' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'modulationEnvelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='decay' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'modulationEnvelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='sustain' min={0.01} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'modulationEnvelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='release' min={0.01} max={4} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'modulationEnvelope'} random={this.random}/>
        </div>
      </div>
    )
  }
})

export const UIFMSynth = observer(class UIFMSynth extends Component {
  obj;
  arrSections = ['main', 'osc', 'mod'];
  selSection = 'main';

  selectSection = (section) => {
    this.selSection = section;
    this.forceUpdate();
  }

  getDisplay = (s) => {
    return s === this.selSection ? 'block' : 'none';
  }

  setRandomVals = () => {
    this.random = randomId();
    this.forceUpdate();
  }

  render() {
    this.obj = store.instruments.fmsynths.find(o => o.id === this.props.objId);
    
    return (
      <div className='divToolRowEditorContainer'>
        <UIEditorHeader obj={this.obj} editorNum={this.props.editorNum} sections={this.arrSections} selSection={this.selSection} type={this.props.type} selectSection={this.selectSection} funcRandom={this.setRandomVals}/>
        <div style={{display:this.getDisplay('main')}}>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='modulationIndex' min={0} max={40} mode={'range'} step={0.1} density={1} numType={'float'} signal={true} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='volume' min={-100} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='harmonicity' min={0} max={4} mode={'range'} step={0.1} density={1} numType={'float'} signal={true} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='portamento' min={0} max={0.3} mode={'range'} step={0.01} density={1} numType={'float'} signal={false}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='detune' min={-100} max={100} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
        </div>
        <div style={{display:this.getDisplay('osc')}}>
          <UIOmniOscTypeControl obj={this.obj} editorNum={this.props.editorNum} propName={'type'} child={'oscillator'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='attack' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='decay' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='sustain' min={0.01} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='release' min={0.01} max={4} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
        </div>
        <div style={{display:this.getDisplay('mod')}}>
          <UIWaveTypeControl obj={this.obj} editorNum={this.props.editorNum} propName={"type"} child={'modulation'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='attack' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'modulationEnvelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='decay' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'modulationEnvelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='sustain' min={0.01} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'modulationEnvelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='release' min={0.01} max={4} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'modulationEnvelope'} random={this.random}/>
        </div>

      </div>
    )
  }
})


export const UIMonoSynth = observer(class UIMonoSynth extends Component {
  obj;
  arrSections = ['main', 'filter', 'env1', 'env2'];
  selSection = "main";

  selectSection = (section) => {
    this.selSection = section;
    this.forceUpdate();
  }

  getDisplay = (s) => {
    return s === this.selSection || !s ? 'block' : 'none';
  }

  setRandomVals = () => {
    this.random = randomId();
    this.forceUpdate();
  }

  render() {
    this.obj = store.instruments.monosynths.find(o => o.id === this.props.objId);

    return (
      <div className='divToolRowEditorContainer'>
        <UIEditorHeader obj={this.obj} editorNum={this.props.editorNum} sections={this.arrSections} selSection={this.selSection} type={this.props.type} selectSection={this.selectSection} funcRandom={this.setRandomVals}/>
        <MonoSynthVoice obj={this.obj} editorNum={this.props.editorNum} voice={null} getDisplay={(section, child) => this.getDisplay(section)} random={this.random}/>
      </div>
    )
  }
})


export const UIMetalSynth = observer(class UIMetalSynth extends Component {
  obj;
  arrSections = ['main', 'env'];
  selSection = 'main';

  selectSection = (section) => {
    this.selSection = section;
    this.forceUpdate();
  }

  getDisplay = (s) => {
    return s === this.selSection ? 'block' : 'none';
  }

  setRandomVals = () => {
    this.random = randomId();
    this.forceUpdate();
  }

  render() {
    this.obj = store.instruments.metalsynths.find(o => o.id === this.props.objId);

    return (
      <div className='divToolRowEditorContainer'>
        <UIEditorHeader obj={this.obj} editorNum={this.props.editorNum} sections={this.arrSections} selSection={this.selSection} type={this.props.type} selectSection={this.selectSection} funcRandom={this.setRandomVals}/>
        <div style={{display:this.getDisplay('main')}}>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='volume' min={-100} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='modulationIndex' min={0} max={40} mode={'range'} step={0.1} density={1} numType={'float'} signal={false} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='resonance' min={0} max={8000} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='octaves' min={0} max={4} mode={'steps'} step={0.25} density={1} numType={'float'} signal={false}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='harmonicity' min={0} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={false} random={this.random}/>
        </div>
        <div style={{display:this.getDisplay('env')}}>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='attack' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='decay' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='sustain' min={0.01} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='release' min={0.01} max={4} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
        </div>
      </div>
    )
  }
})

export const UIMembraneSynth = observer(class UIMembraneSynth extends Component {
  obj;
  arrSections = ['main', 'env'];
  selSection = 'main';

  selectSection = (section) => {
    this.selSection = section;
    this.forceUpdate();
  }

  getDisplay = (s) => {
    return s === this.selSection ? 'block' : 'none';
  }

  setRandomVals = () => {
    this.random = randomId();
    this.forceUpdate();
  }

  render() {
    this.obj = store.instruments.membranesynths.find(o => o.id === this.props.objId);

    return (
      <div className='divToolRowEditorContainer'>
        <UIEditorHeader obj={this.obj} editorNum={this.props.editorNum} sections={this.arrSections} selSection={this.selSection} type={this.props.type} selectSection={this.selectSection} funcRandom={this.setRandomVals}/>
        <div style={{display:this.getDisplay('main')}}>
          <UIOmniOscTypeControl obj={this.obj} editorNum={this.props.editorNum} propName={'type'} child={'oscillator'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='volume' min={-100} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='octaves' min={0.5} max={6} mode={'steps'} step={0.5} density={1} numType={'float'} signal={false} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='pitchDecay' min={0} max={0.2} mode={'range'} step={0.01} density={1} numType={'float'} signal={false} random={this.random}/>
        </div>
        <div style={{display:this.getDisplay('env')}}>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='attack' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='decay' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='sustain' min={0.01} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='release' min={0.01} max={4} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={this.random}/>
          <UICurveTypeControl obj={this.obj} editorNum={this.props.editorNum} propName={"attackCurve"} child={'envelope'} random={this.random}/>
        </div>
      </div>
    )
  }
})

export const UIPluckSynth = observer(class UIPluckSynth extends Component {
  obj;

  setRandomVals = () => {
    this.random = randomId();
    this.forceUpdate();
  }

  render() {
    this.obj = store.instruments.plucksynths.find(o => o.id === this.props.objId);

    return (
      <div className='divToolRowEditorContainer'>
        <UIEditorHeader obj={this.obj} editorNum={this.props.editorNum} type={this.props.type} funcRandom={this.setRandomVals}/>
        <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='attackNoise' min={0.1} max={20} mode={'range'} step={0.01} density={1} numType={'float'} signal={false} random={this.random}/>
        <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='dampening' min={20} max={10000} mode='range' step={null} density={1} numType={'float'} signal={false} random={this.random}/>
        <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='resonance' min={0} max={1} mode='range' step={0.01} density={1} numType={'float'} signal={false} random={this.random}/>
        <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='volume' min={-100} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
      </div>
    )
  }
})

export const UINoiseSynth = observer(class UINoiseSynth extends Component {
  obj;

  render() {
    this.obj = store.instruments.noisesynths.find(o => o.id === this.props.objId);

    return (
      <div className='divToolRowEditorContainer'>
        <UIEditorHeader obj={this.obj} editorNum={this.props.editorNum} type={this.props.type} />
        <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='volume' min={-100} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
        <UINoiseTypeControl obj={this.obj} editorNum={this.props.editorNum} propName={"type"} child={'noise'}/>
        <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='attack' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'}/>
        <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='decay' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'}/>
        <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='sustain' min={0.01} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'}/>
        <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='release' min={0.01} max={4} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'}/>
      </div>
    )
  }
})

export const UIDuoSynth = observer(class UIDuoSynth extends Component {
  obj;
  arrSections = ['main', 'voice0', 'voice1'];
  arrChildSections = [];
  selSection = "main";
  selChildSection = "main";

  selectSection = (section, child) => {
    if(!child){
      this.selSection = section;

      if(this.selSection === 'main')
        this.arrChildSections = [];
      else
        this.arrChildSections = ['main', 'filter', 'env1', 'env2'];
    }
    else
      this.selChildSection = section;
    
    this.forceUpdate();
  }

  getDisplay = (s, child) => {
    let selection = this.selSection;
    if(child)
      selection = this.selChildSection;

    return s === selection ? 'block' : 'none';
  }

  setRandomVals = () => {
    this.random = randomId();
    this.forceUpdate();
  }

  render() {
    this.obj = store.instruments.duosynths.find(o => o.id === this.props.objId);

    let childHeader = null;
    if(this.selSection !== "main")
      childHeader = <div style={{height:'32px'}}><UIEditorHeader obj={this.obj} editorNum={this.props.editorNum} sections={this.arrChildSections} selSection={this.selChildSection} type={this.props.type} selectSection={this.selectSection} parent={this.selSection}/><br/><br/></div>

    return (
      <div className='divToolRowEditorContainer'>
        <UIEditorHeader obj={this.obj} editorNum={this.props.editorNum} sections={this.arrSections} selSection={this.selSection} type={this.props.type} selectSection={this.selectSection} funcRandom={this.setRandomVals}/>
        { childHeader }
        <div style={{display:this.getDisplay('main')}}>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='volume' min={-100} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='vibratoAmount' min={0} max={1} mode={'range'} step={0.01} density={1} numType={'float'} signal={true} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='vibratoRate' min={0} max={1000} mode={'range'} step={null} density={1} numType={'float'} signal={true} random={this.random}/>
          <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='harmonicity' min={0} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true} random={this.random}/>
        </div>
        <MonoSynthVoice obj={this.obj.voice0} editorNum={this.props.editorNum} voice={'voice0'} getDisplay={(section, child) => this.getDisplay(section, child)} random={this.random}/>
        <MonoSynthVoice obj={this.obj.voice1} editorNum={this.props.editorNum} voice={'voice1'} getDisplay={(section, child) => this.getDisplay(section, child)} random={this.random}/>
    </div>
    )
  }
})

const MonoSynthVoice = observer(props =>
  <div style={{display: props.getDisplay(props.voice)}}>
    <div style={{display: props.getDisplay('main', true)}}>
      <UICustomRangeControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='volume' min={-100} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
      <UIOmniOscTypeControl obj={props.obj} editorNum={props.editorNum} propName={'type'} child={'oscillator'} random={props.random}/>
      <UICustomRangeControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='detune' min={-100} max={100} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
      <UICustomRangeControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='portamento' min={0} max={0.3} mode={'range'} step={0.01} density={1} numType={'float'} signal={false}/>
    </div>
    <div style={{display: props.getDisplay('filter', true)}}>
      <UICustomRangeControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='Q' min={0} max={10} mode={'steps'} step={1} density={10} numType={'integer'} signal={true} child={'filter'} random={props.random}/>
      <UICustomRangeControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='frequency' min={0} max={10000} mode={'range'} step={null} density={1} numType={'float'} signal={true} child={'filter'} random={props.random}/>
      <UIFilterTypeControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='type' child={'filter'} random={props.random}/>
      <UIFilterRolloffControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='rolloff' child={'filter'} random={props.random}/>
      <UICustomRangeControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='gain' min={-20} max={3} mode={'range'} step={null} density={1} numType={'float'} signal={true} child={'filter'} random={props.random}/>
    </div>
    <div style={{display: props.getDisplay('env1', true)}}>
      <UICustomRangeControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='attack' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={props.random}/>
      <UICustomRangeControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='decay' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={props.random}/>
      <UICustomRangeControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='sustain' min={0.01} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={props.random}/>
      <UICustomRangeControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='release' min={0.01} max={4} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'envelope'} random={props.random}/>
    </div>
    <div style={{display: props.getDisplay('env2', true)}}>
      <UICustomRangeControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='attack' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'filterEnvelope'} random={props.random}/>
      <UICustomRangeControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='decay' min={0.01} max={2} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'filterEnvelope'} random={props.random}/>
      <UICustomRangeControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='sustain' min={0.01} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'filterEnvelope'} random={props.random}/>
      <UICustomRangeControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='release' min={0.01} max={4} mode={'range'} step={null} density={1} numType={'float'} signal={false} child={'filterEnvelope'} random={props.random}/>
      <UICustomRangeControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='baseFrequency' min={20} max={1000} mode='range' step={null} density={1} numType={'float'} signal={false} child={'filterEnvelope'} random={props.random}/>
      <UICustomRangeControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='octaves' min={0} max={10} mode={'steps'} step={1} density={1} numType={'float'} signal={false} child={'filterEnvelope'} random={props.random}/>
      <UICustomRangeControl obj={props.obj} editorNum={props.editorNum} voice={props.voice} propName='exponent' min={1} max={10} mode={'steps'} step={1} density={1} numType={'integer'} signal={false} child={'filterEnvelope'} random={props.random}/>
    </div>
  </div>
)

export const UITinySynth = observer(class UITinySynth extends Component {
  obj;

  render() {
    // tinysynth -> panvol
    let tokens = this.props.objId.split('_')
    this.obj = store.instruments.tinysynths.find(o => o.id === tokens[0] + '_' + tokens[2]);
    this.panvol = store.components.panvols.find(o => o.id === this.props.objId);
    
    return (
      <div className='divToolRowEditorContainer'>
        <UIEditorHeader obj={this.obj} editorNum={this.props.editorNum} type={this.props.type} />
        {/*<UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='channel' min={0} max={15} mode={'steps'} step={1} density={1} numType={'integer'} signal={false}/>*/}
        <UICustomRangeControl obj={this.obj} editorNum={this.props.editorNum} propName='instrument' min={0} max={127} mode={'steps'} step={1} density={10} numType={'integer'} signal={false}/>
        <UICustomRangeControl obj={this.panvol} editorNum={this.props.editorNum} propName='volume' min={-100} max={10} mode={'range'} step={0.1} density={1} numType={'float'} signal={true}/>
      </div>
    )
  }
})