//Copyright 2018-2019 Timothy Boie

import React, { Component } from 'react';
import { observer } from "mobx-react";
import noUiSlider from 'nouislider';
import { store } from '../../../../../data/store.js'
import { UIEditorHeader, UICustomRangeControl, UITimeControl, UIWaveTypeControl, UIFilterTypeControl, UIFilterRolloffControl } from './template.js';


//TODO: add filter? and check ALL octave type details , double check start (stop?) functionalities
export const UIAutoFilter = observer(class UIAutoFilter extends Component {
    obj;
    arrSections = ['main', 'filter'];
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
      if(!this.obj)
        this.obj = store.effects.autofilters.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} sections={this.arrSections} selSection={this.selSection} type={this.props.type} selectSection={this.selectSection}/>
          <br/><br/><br/>
          <div style={{display:this.getDisplay('main')}}>
            <UITimeControl obj={this.obj} propName="frequency"/>
            <br/><br/>
            <UIWaveTypeControl obj={this.obj} propName="type"/>
            <br/><br/>
            <UICustomRangeControl obj={this.obj} propName={'depth'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
            <br/><br/>
            <UICustomRangeControl obj={this.obj} propName='baseFrequency' min={20} max={1000} mode='range' step={null} density={1} numType={'float'} signal={false}/>
            <br/><br/> 
            <UICustomRangeControl obj={this.obj} propName='octaves' min={0} max={10} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
            <br/><br/>
            <UICustomRangeControl obj={this.obj} propName={'wet'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          </div>
          <div style={{display:this.getDisplay('filter')}}>
            <UICustomRangeControl obj={this.obj} propName='Q' min={0} max={12} mode={'steps'} step={1} density={10} numType={'integer'} signal={true} child={'filter'}/>
            <br/><br/>
            <UIFilterTypeControl obj={this.obj} propName={"type"} child={'filter'}/>
            <br/><br/>
            <UIFilterRolloffControl obj={this.obj} propName={"rolloff"} child={'filter'}/>
          </div>
        </div>
      )
    }
  })

//TODO: verify .start()
export const UIAutoPanner = observer(class UIAutoPanner extends Component {
    obj;
  
    render() {
      this.obj = store.effects.autopanners.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'depth'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UITimeControl obj={this.obj} propName="frequency"/>
          <br/><br/>
          <UIWaveTypeControl obj={this.obj} propName="type"/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'wet'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })
  
  //TODO: fix follower
  //      double check range max's
export const UIAutoWah = observer(class UIAutoWah extends Component {
    obj;
  
    render() {
      this.obj = store.effects.autowahs.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName='baseFrequency' min={20} max={1000} mode='range' step={null} density={1} numType={'float'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='octaves' min={0} max={10} mode={'steps'} step={1} density={10} numType={'integer'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='sensitivity' min={-40} max={0} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='Q' min={0} max={12} mode={'steps'} step={1} density={10} numType={'integer'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='gain' min={0} max={12} mode={'steps'} step={1} density={10} numType={'integer'} signal={true}/>
          <br/><br/>  
          <UICustomRangeControl obj={this.obj} propName={'wet'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })
  
  export const UIBitCrusher = observer(class UIBitCrusher extends Component {
    obj;
  
    render() {
      this.obj = store.effects.bitcrushers.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'bits'} min={1} max={8} mode={'steps'} step={1} density={12.5} numType={'integer'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'wet'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })
  
  
  //TODO: verify oversample not working
  export const UIChebyshev = observer(class UIChebyshev extends Component{
    obj;
    slider;
  
    componentDidMount(){
      let self = this;
      this.slider = document.getElementById('slider_oversample_' + self.props.objId);
  
      noUiSlider.create(this.slider, {
        start: self.obj.oversample,
        connect: [true, false],
        range: {
          'min': 1,
          'max': 3
        },
        step: 1,
        pips: {
          mode: 'steps',
          density: 1
        },
        tooltips: true,
        format: {
          to: function ( value ) {
            if(parseInt(value, 10) === 1)
              return 'none';
            if(parseInt(value, 10) === 2)
              return '2x';
            if(parseInt(value, 10) === 3)
              return '4x';
          },
          from: function ( value ) {
            if(value === 'none')
              return 1;
            if(value === '2x')
              return 2;
            if(value === '4x')
              return 3;
          }
        }
      });
  
      this.slider.noUiSlider.on('update', function ( values, handle ) {
        self.obj.setPropVal('oversample', values[handle], false)
      });
    }
  
    componentWillUnmount(){
      this.slider.noUiSlider.destroy();
    }
  
    componentDidUpdate(prevProps, prevState, snapshot){
      //update slider wet value?
    }
  
    render() {
      this.obj = store.effects.chebyshevs.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'order'} min={0} max={10} mode={'steps'} step={1} density={10} numType={'integer'} signal={false}/>
          <br/><br/>
          <label>oversample</label>
          <div id={'slider_oversample_' + this.props.objId}></div>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'wet'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })
  
  
  //TODO: check ranges as usual
  export const UIChorus = observer(class UIChorus extends Component {
    obj;
  
    render() {
      this.obj = store.effects.choruss.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'frequency'} min={0} max={20} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/> 
          <UICustomRangeControl obj={this.obj} propName={'delayTime'} min={0} max={25} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'depth'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
          <br/><br/>
          <UIWaveTypeControl obj={this.obj} propName={"type"}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'spread'} min={0} max={360} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'wet'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })
  
  //TODO: figure out impulse responses and layout
  export const UIConvolver = observer(class UIConvolver extends Component {
    render() {
      return null;
    }
  })
  
  //TODO: oversample not working?
  export const UIDistortion = observer(class UIDistortion extends Component {
    obj;
    slider;
  
    componentDidMount(){
      let self = this;
      this.slider = document.getElementById('slider_oversample_' + self.props.objId);
  
      noUiSlider.create(this.slider, {
        start: self.obj.oversample,
        connect: [true, false],
        range: {
          'min': 1,
          'max': 3
        },
        step: 1,
        pips: {
          mode: 'steps',
          density: 1
        },
        tooltips: true,
        format: {
          to: function ( value ) {
            if(parseInt(value, 10) === 1)
              return 'none';
            if(parseInt(value, 10) === 2)
              return '2x';
            if(parseInt(value, 10) === 3)
              return '4x';
          },
          from: function ( value ) {
            if(value === 'none')
              return 1;
            if(value === '2x')
              return 2;
            if(value === '4x')
              return 3;
          }
        }
      });
  
      this.slider.noUiSlider.on('update', function ( values, handle ) {
        self.obj.setPropVal('oversample', values[handle], false)
      });
    }
  
    componentWillUnmount(){
      this.slider.noUiSlider.destroy();
    }
  
    componentDidUpdate(prevProps, prevState, snapshot){
      //update slider wet value?
    }
  
    render() {
      this.obj = store.effects.distortions.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'distortion'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
          <br/><br/>
          <label>oversample</label>
          <div id={'slider_oversample_' + this.props.objId}></div>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'wet'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })
  
  //TODO: bug for 1n time delay
  export const UIFeedbackDelay = observer(class UIFeedbackDelay extends Component {
    obj;
  
    render() {
      this.obj = store.effects.feedbackdelays.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UITimeControl obj={this.obj} propName='delayTime'/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'feedback'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'wet'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })
  
  export const UIFreeverb = observer(class UIFreeverb extends Component{
    obj;
  
    render() {
      this.obj = store.effects.freeverbs.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'roomSize'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'dampening'} min={0} max={15000} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'wet'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })
  
export const UIJCReverb = observer(class UIJCReverb extends Component{
    obj;
  
    render() {
      this.obj = store.effects.jcreverbs.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'roomSize'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'wet'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })
  
  //TODO: ranges and funcitonanlity
export const UIPhaser = observer(class UIPhaser extends Component{
    obj;
  
    render() {
      this.obj = store.effects.phasers.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName='frequency' min={0} max={25} mode='range' step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='octaves' min={0} max={10} mode={'steps'} step={1} density={10} numType={'integer'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='stages' min={0} max={20} mode={'steps'} step={1} density={1} numType={'integer'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='Q' min={0} max={12} mode={'steps'} step={1} density={10} numType={'integer'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='baseFrequency' min={20} max={1000} mode='range' step={null} density={1} numType={'float'} signal={false}/>
          <br/><br/>  
          <UICustomRangeControl obj={this.obj} propName={'wet'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })
  
  //TODO: verify 1n
  export  const UIPingPongDelay = observer(class UIPingPongDelay extends Component{
    obj;
  
    render() {
      this.obj = store.effects.pingpongdelays.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UITimeControl obj={this.obj} propName='delayTime'/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'feedback'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>  
          <UICustomRangeControl obj={this.obj} propName={'wet'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })
  
  //TODO: add rest of params? 
  export const UIPitchShift = observer(class UIPitchShift extends Component{
    obj;
  
    render() {
      this.obj = store.effects.pitchshifts.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'pitch'} min={-24} max={24} mode={'steps'} step={1} density={10} numType={'integer'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'wet'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })
  
  export const UIReverb = observer(class UIReverb extends Component{
    obj;

    render() {
      this.obj = store.effects.reverbs.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'decay'} min={0.1} max={4} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'preDelay'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={false}/>
        </div>
      )
    }
  })
  
  export const UIStereoWidener = observer(class UIStereoWidener extends Component{
    obj;
  
    render() {
      this.obj = store.effects.stereowideners.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName='width' min={0} max={1} mode='range' step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'wet'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })
  
  export  const UITremolo = observer(class UITremolo extends Component{
    obj;
  
    render() {
      this.obj = store.effects.tremolos.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName='frequency' min={0} max={50} mode='range' step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UIWaveTypeControl obj={this.obj} propName={"type"}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='depth' min={0} max={1} mode='range' step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='spread' min={0} max={360} mode='range' step={null} density={1} numType={'float'} signal={false}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'wet'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })
  
 export const UIVibrato = observer(class UIVibrato extends Component{
    obj;
  
    render() {
      this.obj = store.effects.vibratos.find(o => o.id === this.props.objId);
  
      return (
        <div className='divToolRowEditorContainer'>
          <UIEditorHeader obj={this.obj} type={this.props.type}/>
          <br/><br/><br/>
          <UICustomRangeControl obj={this.obj} propName='frequency' min={0} max={50} mode='range' step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName='depth' min={0} max={1} mode='range' step={null} density={1} numType={'float'} signal={true}/>
          <br/><br/>
          <UIWaveTypeControl obj={this.obj} propName={"type"}/>
          <br/><br/>
          <UICustomRangeControl obj={this.obj} propName={'wet'} min={0} max={1} mode={'range'} step={null} density={1} numType={'float'} signal={true}/>
        </div>
      )
    }
  })