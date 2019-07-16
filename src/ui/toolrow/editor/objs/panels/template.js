//Copyright 2018-2019 Timothy Boie
import React, { Component } from 'react';
import { observer } from "mobx-react";
import noUiSlider from 'nouislider';
import { store } from '../../../../../data/store.js';
import { toneObjNames } from '../../../../../data/tonenames.js';
import { ToneObjs } from '../../../../../models/models.js';


export const UIEditorHeader = observer(class UIEditorHeader extends Component {
  componentDidMount(){
    if(this.props.selSection){
      let strId = 'btnEditHeaderToggleSection_' + this.props.selSection;
      
      if(this.props.parent)
        strId = 'btnEditHeaderToggleSection_' + this.props.parent + '_' + this.props.selSection;
      
      document.getElementById(strId).style.backgroundColor = '#2671ea';
    }
  }

  delObj = (e) => {
    if(this.props.obj.id.split("_")[0] === "tinysynth"){
      store.components.delete('panvol', 'tinysynth_panvol_' + this.props.obj.id.split("_")[1]);
      store.instruments.delete('tinysynth', this.props.obj.id);
    }
    else{
      store[this.props.type + 's'].delete(this.props.obj.id.split("_")[0], this.props.obj.id);
    }

    store.ui.selectObj('');
  }

  selectSection = (e) => {
    let section = e.target.id.split('_')[1];
    let id = 'btnEditHeaderToggleSection';

    if(this.props.parent){
      section = e.target.id.split('_')[2];
      id = 'btnEditHeaderToggleSection_' + this.props.parent;
    }
    
    this.props.sections.forEach(s => {
      if(s === section)
        document.getElementById(id + '_' + s).style.backgroundColor = '#2671ea';
      else
        document.getElementById(id + '_' + s).style.backgroundColor = '';
    })

    this.props.selectSection(section, this.props.parent);
  }

  render() {
    let top = 0;
    let title = this.props.obj.id.split("_")[0];
    title = toneObjNames.find(n => n.toLowerCase() === title);

    let id = 'btnEditHeaderToggleSection';
    
    let sDisplay = "block";
    if(title === "panvol")
      sDisplay = "none";

    let btnDelete = <button onClick={this.delObj} id="btnDelObject" style={{display:sDisplay, float:'right',right:'5px', backgroundColor:'transparent', border:0, position:'absolute', zIndex:1 }}>
                      <i className="material-icons i-28 colorRed">delete</i>
                    </button>

    
    let btnRand;
    if(this.props.obj.track){
      let type = store.getObjTypeByIdTrack(this.props.obj.id, this.props.obj.track.id);
      if(type === "instrument" && title !== "NoiseSynth")
        btnRand = <button id="btnSetRandom" onClick={this.props.funcRandom} style={{position:'absolute', height:'100%', right:'56px', zIndex:99}}>Rnd</button>
    }

    let toggleSections = [];
    if(this.props.sections)
      toggleSections = this.props.sections;

    let height = 32;
    if(this.props.parent){
      btnRand = null;
      title = '';
      btnDelete = null;
      top = height;
      id = id + '_' + this.props.parent;
    }

    return (
      <div style={{height:height + 'px'}}>
        <div style={{position:'absolute', backgroundColor: 'rgb(12, 11, 27)', width:'100%', height:'32px', top:top + 'px', zIndex:99}}>
          <label style={{float:'left', position:'relative', top:'7px'}}>{title}</label>
          { btnRand }
          <div id="divEditorHdrSectionContainer">
            {
              toggleSections.map((section, idx) => 
                <button key={idx} id={id + '_' + section} onClick={this.selectSection} style={{height:'100%'}}>{section}</button>)
            }
          </div>
          { btnDelete }
        </div>
      </div>
    )
  }
})


export const UICustomRangeControl = observer(class UICustomRangeControl extends Component {
  sliderId;
  slider;
  obj;
  objType;

  componentDidMount(){
    this.slider = document.getElementById(this.sliderId);

    noUiSlider.create(this.slider, {
      start: this.obj[this.props.propName],
      connect: [true, false],
      range: {
        'min': this.props.min,
        'max': this.props.max
      },
      step: this.props.step,
      pips: {
        mode: this.props.mode,
        density: this.props.density
      },
      tooltips: true
    });

    this.slider.noUiSlider.on('update', (values, handle) => {
      this.updateValue(values[handle], false);
    });

    this.slider.noUiSlider.on('set', (values, handle) => {
      this.updateValue(values[handle], true);
    });
  }

  updateValue = (val, end) => {
    let props = this.props;

    //only update MST model on end 
    //TODO: does functionality have to be this way?  MST patch streams etc.

    //don't update if same value
    let bValChanged = false;
    if(val){
      if(props.child){
        if(props.obj[props.child][props.propName] !== parseFloat(val))
          bValChanged = true;
      }
      else if(props.obj[props.propName] !== parseFloat(val))
        bValChanged = true;
    }

    if(bValChanged){
      //update MST model
      if(end){
        if(props.numType === 'float')
          props.obj.setPropVal(props.propName, parseFloat(val), props.signal, props.child)
        else if(props.numType === 'integer')
          props.obj.setPropVal(props.propName, parseInt(val, 10), props.signal, props.child)
      }
      //only update toneobj during update
      else{
        let typedVal = val;
        if(props.numType === 'float')
          typedVal = parseFloat(val);
        else if(props.numType === 'integer')
          typedVal = parseInt(val, 10);


        let instName = props.obj.id.split('_')[0];
        //polysynths
        if(this.objType === "instrument" && instName !== "noisesynth" && instName !== "player" && instName !== "plucksynth" && instName !== "membranesynth" && instName !== "metalsynth"){
          if(props.voice)
            ToneObjs.setPropVal(props.obj.getParentId(), this.objType, props.propName, typedVal, props.signal, props.child, props.voice);
          else
            ToneObjs.setPropVal(props.obj.id, this.objType, props.propName, typedVal, props.signal, props.child);
        }
        //everything else
        else{
          ToneObjs.setPropVal(props.obj.id, this.objType, props.propName, typedVal, props.signal, props.child);

          if(instName === "reverb"){
            //reverb errors when preDelay >= decay
            //temp fix     if preDelay >= decay : preDelay = decay - 0.01
            let reverbToneObj = ToneObjs.effects.find(i => i.id === props.obj.id).obj;

            if(reverbToneObj.preDelay >= reverbToneObj.decay)
              ToneObjs.setPropVal(props.obj.id, this.objType, 'preDelay', reverbToneObj.decay - 0.01, props.signal, props.child);
            
            reverbToneObj.generate().then(() => {
              //console.log('generated finished')
            });
          }
        }
      }
    }
  }

  setRandomVal = () => {
    let min = this.props.min, max = this.props.max;
    let randVal = parseFloat((Math.random() * (max - min) + min).toFixed(2));
    //console.log('min: ' + min + ' max: ' + max + ' val: ' + randVal)
    this.slider.noUiSlider.set(randVal);
  }

  componentWillUnmount(){
    this.slider.noUiSlider.destroy();
  }

  componentDidUpdate(prevProps){
    if(prevProps.random !== this.props.random)
      this.setRandomVal();
    else
      this.slider.noUiSlider.set(this.obj[this.props.propName]);
  }

  render(){
    if(this.props.child){
      this.obj = this.props.obj[this.props.child];
      this.sliderId = 'slider_' + this.props.child + '_' + this.props.propName + '_' + this.props.obj.id;
    }
    else{
      this.obj = this.props.obj;
      this.sliderId = 'slider_' + this.props.propName + '_' + this.props.obj.id;
    }

    if(!this.objType){
      if(this.props.voice)
        this.objType = "instrument";
      else if(this.props.obj.track)
        this.objType = store.getObjTypeByIdTrack(this.props.obj.id, this.props.obj.track.id);
    }
  
    return(
      <div className='divEditorSliderContainer'>
        <label>{this.props.propName}</label><br/>
        <div id={this.sliderId}></div>
      </div>
    )
  }
})

export const UITimeControl = observer(class UITimeControl extends Component {
  slider;

  componentDidMount(){
    let self = this;
    this.slider = document.getElementById('slider_' + self.props.propName + '_' + self.props.obj.id);

    noUiSlider.create(this.slider, {
      start: self.props.obj[self.props.propName],
      connect: [true, false],
      range: {
        'min': 1,
        'max': 10
      },
      step: 1,
      pips: {
        mode: 'steps',
        density: 10,
        format: {
          to: function(a){
            return {'1':'4m', '2':'2m', '3':'1m', '4':'2n', '5':'4n', '6':'8n', '7':'16n', '8':'32n', '9':'64n', '10':'128n'}[a];
          }
        }
      },
      tooltips: true,
      format: {
        to: function ( value ) {
          let val = Math.round(value)

          if(val === 1)
            return '4m';
          else if(val === 2)
            return '2m';
          else if(val === 3)
            return '1m';
          else if(val === 4)
            return '2n';
          else if(val === 5)
            return '4n';
          else if(val === 6)
            return '8n';
          else if(val === 7)
            return '16n';
          else if(val === 8)
            return '32n';
          else if(val === 9)
            return '64n';
          else if(val === 10)
            return '128n'; 
        },
        from: function ( value ) {
          if(value === '4m')
            return 1;
          else if(value === '2m')
            return 2;
          else if(value === '1m')
            return 3;
          else if(value === '2n')
            return 4;
          else if(value === '4n')
            return 5;
          else if(value === '8n')
            return 6;
          else if(value === '16n')
            return 7;
          else if(value === '32n')
            return 8;
          else if(value === '64n')
            return 9;
          else if(value === '128n')
            return 10;
        }
      }
    });

    this.slider.noUiSlider.on('update', function ( values, handle ) {
      self.updateValue(values[handle]);
    });
  }

  updateValue = (val) => {
    let bValChanged = false;
    if(val){
        if(this.props.obj[this.props.propName] !== val)
          bValChanged = true;
    }

    if(bValChanged){
      this.props.obj.setPropVal(this.props.propName, val, true)
    }
  }

  componentWillUnmount(){
    this.slider.noUiSlider.destroy();
  }

  componentDidUpdate(prevProps, prevState, snapshot){
    this.slider.noUiSlider.set(this.props.obj[this.props.propName]);
  }

  render(){
    return(
      <div className='divEditorSliderContainer'>
        <label>{this.props.propName}</label><br/>
        <div id={'slider_' + this.props.propName + '_' + this.props.obj.id}></div>
      </div>
    )
  }
})

export const UIWaveTypeControl = observer(class UIWaveTypeControl extends Component {
  slider;
  obj;

  componentDidMount(){
    let self = this;
    let props = this.props;
    if(props.child)
      this.slider = document.getElementById('slider_' + props.child + '_' + props.propName + '_' + props.obj.id);
    else
      this.slider = document.getElementById('slider_' + props.propName + '_' + props.obj.id);


    if(props.child)
      self.obj = props.obj[props.child]
    else
      self.obj = props.obj;

    noUiSlider.create(this.slider, {
      start: self.obj[props.propName],
      connect: [true, false],
      range: {
        'min': 1,
        'max': 4
      },
      step: 1,
      pips: {
        mode: 'steps',
        density: 25,
        format: {
          to: function(a){
            return {'1':'SINE', '2':'TRI', '3':'SAW', '4':'SQR'}[a];
          }
        }
      },
      tooltips: true,
      format: {
        to: function ( value ) {
          let val = Math.round(value);

          if(val === 1)
            return 'sine';
          else if(val === 2)
            return 'triangle';
          else if(val === 3)
            return 'sawtooth';
          else if(val === 4)
            return 'square';
        },
        from: function ( value ) {
          if(value === 'sine')
            return 1;
          else if(value === 'triangle')
            return 2;
          else if(value === 'sawtooth')
            return 3;
          else if(value === 'square')
            return 4;
        }
      }
    });
    
    this.slider.noUiSlider.on('update', function ( values, handle ) {
      self.updateValue(values[handle]);
    });

    this.slider.noUiSlider.on('set', function ( values, handle ) {
      self.updateValue(values[handle]);
    });
  }

  updateValue = (val) => {
    let bValChanged = false;
    if(val){
      if(this.props.child){
        if(this.props.obj[this.props.child][this.props.propName] !== val)
          bValChanged = true;
      }
      else if(this.props.obj[this.props.propName] !== val)
        bValChanged = true;
    }

    if(bValChanged){
      this.props.obj.setPropVal(this.props.propName, val, false, this.props.child)
    }
  }

  componentWillUnmount(){
    this.slider.noUiSlider.destroy();
  }
  
  setRandomVal = () => {
    let min = 0, max = 3, types = ['sine', 'triangle', 'sawtooth', 'square'];
    let randVal = Math.floor(Math.random() * (max - min + 1)) + min;
    this.slider.noUiSlider.set(types[randVal]);
  }

  componentDidUpdate(prevProps){
    if(prevProps.random !== this.props.random){
      this.setRandomVal();
    }
    else{
      if(this.props.child)
        this.obj = this.props.obj[this.props.child]
      else
        this.obj = this.props.obj;
      
      this.slider.noUiSlider.set(this.obj[this.props.propName]);
    }
  }

  render(){
    let id = 'slider_' + this.props.propName + '_' + this.props.obj.id;
    if(this.props.child)
      id = 'slider_' + this.props.child + '_' + this.props.propName + '_' + this.props.obj.id

    return(
      <div className='divEditorSliderContainer'>
        <label>{this.props.propName}</label><br/>
        <div id={id}></div>
      </div>
    )
  }
})

export const UIFilterTypeControl = observer(class UIFilterTypeControl extends Component {
  slider;
  obj;

  componentDidMount(){
    let self = this;
    let props = this.props;
    if(props.child)
      this.slider = document.getElementById('slider_' + props.child + '_' + props.propName + '_' + props.obj.id);
    else
      this.slider = document.getElementById('slider_' + props.propName + '_' + props.obj.id);

    if(props.child)
      self.obj = props.obj[props.child]
    else
      self.obj = props.obj;

    noUiSlider.create(this.slider, {
      start: self.obj[props.propName],
      connect: [true, false],
      range: {
        'min': 1,
        'max': 8
      },
      step: 1,
      pips: {
        mode: 'steps',
        density: 12.5,
        format: {
          to: function(a){
            return {'1':'LOW', '2':'HI', '3':'BND', '4':'LSHLF', '5':'HSHLF', '6':'NOTCH', '7':'ALL', '8':'PEAK'}[a];
          }
        }
      },
      tooltips: true,
      format: {
        to: function ( value ) {
          let val = Math.round(value);

          if(val === 1)
            return 'lowpass';
          else if(val === 2)
            return 'highpass';
          else if(val === 3)
            return 'bandpass';
          else if(val === 4)
            return 'lowshelf';
          else if(val === 5)
            return 'highshelf';
          else if(val === 6)
            return 'notch';
          else if(val === 7)
            return 'allpass';
          else if(val === 8)
            return 'peaking';
        },
        from: function ( value ) {
          if(value === 'lowpass')
            return 1;
          else if(value === 'highpass')
            return 2;
          else if(value === 'bandpass')
            return 3;
          else if(value === 'lowshelf')
            return 4;
          else if(value === 'highshelf')
            return 5;
          else if(value === 'notch')
            return 6;
          else if(value === 'allpass')
            return 7;
          else if(value === 'peaking')
            return 8;
        }
      }
    });
    
    this.slider.noUiSlider.on('update', function ( values, handle ) {
      self.updateValue(values[handle]);
    });

    this.slider.noUiSlider.on('set', function ( values, handle ) {
      self.updateValue(values[handle]);
    });
  }

  updateValue = (val) => {
    let bValChanged = false;
    if(val){
      if(this.props.child){
        if(this.props.obj[this.props.child][this.props.propName] !== val)
          bValChanged = true;
      }
      else if(this.props.obj[this.props.propName] !== val)
        bValChanged = true;
    }

    if(bValChanged){
      this.props.obj.setPropVal(this.props.propName, val, false, this.props.child)
    }
  }

  componentWillUnmount(){
    this.slider.noUiSlider.destroy();
  }

  setRandomVal = () => {
    let min = 0, max = 7, types = ['lowpass','highpass','bandpass','lowshelf','highshelf','notch','allpass','peaking']
    let randVal = Math.floor(Math.random() * (max - min + 1)) + min;
    this.slider.noUiSlider.set(types[randVal]);
  }

  componentDidUpdate(prevProps){
    if(prevProps.random !== this.props.random){
      this.setRandomVal();
    }
    else{
      if(this.props.child)
        this.obj = this.props.obj[this.props.child]
      else
        this.obj = this.props.obj;
      
      this.slider.noUiSlider.set(this.obj[this.props.propName]);
    }
  }

  render(){
    let id = 'slider_' + this.props.propName + '_' + this.props.obj.id;
    if(this.props.child)
      id = 'slider_' + this.props.child + '_' + this.props.propName + '_' + this.props.obj.id

    return(
      <div className='divEditorSliderContainer'>
        <label>{this.props.propName}</label><br/>
        <div id={id}></div>
      </div>
    )
  }
})

export const UICurveTypeControl = observer(class UICurveTypeControl extends Component {
  slider;
  obj;

  componentDidMount(){
    let self = this;
    let props = this.props;
    if(props.child)
      this.slider = document.getElementById('slider_' + props.child + '_' + props.propName + '_' + props.obj.id);
    else
      this.slider = document.getElementById('slider_' + props.propName + '_' + props.obj.id);

    if(props.child)
      self.obj = props.obj[props.child]
    else
      self.obj = props.obj;

    noUiSlider.create(this.slider, {
      start: self.obj[props.propName],
      connect: [true, false],
      range: {
        'min': 1,
        'max': 7
      },
      step: 1,
      pips: {
        mode: 'steps',
        density: 14.28571,
        format: {
          to: function(a){
            return {'1':'LIN', '2':'EXP', '3':'SIN', '4':'COS', '5':'BOUNCE', '6':'RPPL', '7':'STEP'}[a];
          }
        }
      },
      tooltips: true,
      format: {
        to: function ( value ) {
          let val = Math.round(value);

          if(val === 1)
            return 'linear';
          else if(val === 2)
            return 'exponential';
          else if(val === 3)
            return 'sine';
          else if(val === 4)
            return 'cosine';
          else if(val === 5)
            return 'bounce';
          else if(val === 6)
            return 'ripple';
          else if(val === 7)
            return 'step';
        },
        from: function ( value ) {
          if(value === 'linear')
            return 1;
          else if(value === 'exponential')
            return 2;
          else if(value === 'sine')
            return 3;
          else if(value === 'cosine')
            return 4;
          else if(value === 'bounce')
            return 5;
          else if(value === 'ripple')
            return 6;
          else if(value === 'step')
            return 7;
        }
      }
    });
    
    this.slider.noUiSlider.on('update', function ( values, handle ) {
      self.updateValue(values[handle]);
    });
    this.slider.noUiSlider.on('set', function ( values, handle ) {
      self.updateValue(values[handle]);
    });
  }

  updateValue = (val) => {
    let bValChanged = false;
    if(val){
      if(this.props.child){
        if(this.props.obj[this.props.child][this.props.propName] !== val)
          bValChanged = true;
      }
      else if(this.props.obj[this.props.propName] !== val)
        bValChanged = true;
    }

    if(bValChanged){
      this.props.obj.setPropVal(this.props.propName, val, false, this.props.child)
    }
  }

  componentWillUnmount(){
    this.slider.noUiSlider.destroy();
  }

  setRandomVal = () => {
    let min = 0, max = 6, types = ['linear','exponential','sine','cosine','bounce','ripple','step'];
    let randVal = Math.floor(Math.random() * (max - min + 1)) + min;
    this.slider.noUiSlider.set(types[randVal]);
  }

  componentDidUpdate(prevProps){
    if(prevProps.random !== this.props.random){
      this.setRandomVal();
    }
    else{
      if(this.props.child)
        this.obj = this.props.obj[this.props.child]
      else
        this.obj = this.props.obj;
        
      this.slider.noUiSlider.set(this.obj[this.props.propName]);
    }
  }

  render(){
    let id = 'slider_' + this.props.propName + '_' + this.props.obj.id;
    if(this.props.child)
      id = 'slider_' + this.props.child + '_' + this.props.propName + '_' + this.props.obj.id

    return(
      <div className='divEditorSliderContainer'>
        <label>{this.props.propName}</label><br/>
        <div id={id}></div>
      </div>
    )
  }
})

export const UIFilterRolloffControl = observer(class UIFilterRolloffControl extends Component {
  slider;
  obj;

  componentDidMount(){
    let self = this;
    let props = this.props;
    if(props.child)
      this.slider = document.getElementById('slider_' + props.child + '_' + props.propName + '_' + props.obj.id);
    else
      this.slider = document.getElementById('slider_' + props.propName + '_' + props.obj.id);

    if(props.child)
      self.obj = props.obj[props.child]
    else
      self.obj = props.obj;
    
    noUiSlider.create(this.slider, {
      start: self.obj[props.propName],
      connect: [true, false],
      range: {
        'min': 1,
        'max': 4
      },
      step: 1,
      pips: {
        mode: 'steps',
        density: 25,
        format: {
          to: function(a){
            return {'1':'-12', '2':'-24', '3':'-48', '4':'-96'}[a];
          }
        }
      },
      tooltips: true,
      format: {
        to: function ( value ) {
          let val = Math.round(value);

          if(val === 1)
            return -12;
          else if(val === 2)
            return -24;
          else if(val === 3)
            return -48;
          else if(val === 4)
            return -96;
        },
        from: function ( value ) {
          if(parseInt(value, 10) === -12)
            return 1;
          else if(parseInt(value, 10) === -24)
            return 2;
          else if(parseInt(value, 10) === -48)
            return 3;
          else if(parseInt(value, 10) === -96)
            return 4;
        }
      }
    });
    
    this.slider.noUiSlider.on('update', function ( values, handle ) {
      self.updateValue(values[handle]);
    });

    this.slider.noUiSlider.on('set', function ( values, handle ) {
      self.updateValue(values[handle]);
    });
  }

  updateValue = (val) => {
    let bValChanged = false;
    if(val){
      if(this.props.child){
        if(this.props.obj[this.props.child][this.props.propName] !== parseInt(val, 10))
          bValChanged = true;
      }
      else if(this.props.obj[this.props.propName] !== parseInt(val, 10))
        bValChanged = true;
    }

    if(bValChanged){
      this.props.obj.setPropVal(this.props.propName, val, false, this.props.child)
    }
  }

  componentWillUnmount(){
    this.slider.noUiSlider.destroy();
  }

  setRandomVal = () => {
    let min = 0, max = 3, types = [-12,-24,-48,-96]
    let randVal = Math.floor(Math.random() * (max - min + 1)) + min;
    this.slider.noUiSlider.set(types[randVal]);
  }

  componentDidUpdate(prevProps){
    if(prevProps.random !== this.props.random){
      this.setRandomVal();
    }
    else{
      if(this.props.child)
        this.obj = this.props.obj[this.props.child]
      else
        this.obj = this.props.obj;

      this.slider.noUiSlider.set(this.obj[this.props.propName]);
    }
  }

  render(){
    let id = 'slider_' + this.props.propName + '_' + this.props.obj.id;
    if(this.props.child)
      id = 'slider_' + this.props.child + '_' + this.props.propName + '_' + this.props.obj.id

    return(
      <div className='divEditorSliderContainer'>
        <label>{this.props.propName}</label><br/>
        <div id={id}></div>
      </div>
    )
  }
})


export const UINoiseTypeControl = observer(class UINoiseTypeControl extends Component {
  slider;
  obj;

  componentDidMount(){
    let self = this;
    let props = this.props;
    if(props.child)
      this.slider = document.getElementById('slider_' + props.child + '_' + props.propName + '_' + props.obj.id);
    else
      this.slider = document.getElementById('slider_' + props.propName + '_' + props.obj.id);


    if(props.child)
      self.obj = props.obj[props.child]
    else
      self.obj = props.obj;

    noUiSlider.create(this.slider, {
      start: self.obj[props.propName],
      connect: [true, false],
      range: {
        'min': 1,
        'max': 3
      },
      step: 1,
      pips: {
        mode: 'steps',
        density: 100,
        format: {
          to: function(a){
            return {'1':'WHITE', '2':'PINK', '3':'BROWN'}[a];
          }
        }
      },
      tooltips: true,
      format: {
        to: function ( value ) {
          let val = Math.round(value);

          if(val === 1)
            return 'white';
          else if(val === 2)
            return 'pink';
          else if(val === 3)
            return 'brown';
        },
        from: function ( value ) {
          if(value === 'white')
            return 1;
          else if(value === 'pink')
            return 2;
          else if(value === 'brown')
            return 3;
        }
      }
    });
    
    this.slider.noUiSlider.on('update', function ( values, handle ) {
      self.updateValue(values[handle]);
    });
  }

  updateValue = (val) => {
    let bValChanged = false;
    if(val){
      if(this.props.child){
        if(this.props.obj[this.props.child][this.props.propName] !== val)
          bValChanged = true;
      }
      else if(this.props.obj[this.props.propName] !== val)
        bValChanged = true;
    }

    if(bValChanged){
      this.props.obj.setPropVal(this.props.propName, val, false, this.props.child)
    }
  }

  componentWillUnmount(){
    this.slider.noUiSlider.destroy();
  }

  componentDidUpdate(prevProps, prevState, snapshot){
    if(this.props.child)
      this.obj = this.props.obj[this.props.child]
    else
      this.obj = this.props.obj;

    this.slider.noUiSlider.set(this.obj[this.props.propName]);
  }

  render(){
    let id = 'slider_' + this.props.propName + '_' + this.props.obj.id;
    if(this.props.child)
      id = 'slider_' + this.props.child + '_' + this.props.propName + '_' + this.props.obj.id

    return(
      <div className='divEditorSliderContainer'>
        <label>{this.props.propName}</label><br/>
        <div id={id}></div>
      </div>
    )
  }
})

export const UIOverSample = observer(class UIOverSample extends Component {
  obj;
  slider;

  componentDidMount(){
    let self = this;
    let props = this.props;

    this.slider = document.getElementById('slider_' + props.propName + '_' + props.obj.id);

    noUiSlider.create(this.slider, {
      start: self.props.obj[props.propName],
      connect: [true, false],
      range: {
        'min': 1,
        'max': 3
      },
      step: 1,
      pips: {
        mode: 'steps',
        density: 33.333,
        format: {
          to: function(a){
            return {'1':'NONE', '2':'2x', '3':'4x'}[a];
          }
        }
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
      self.updateValue(values[handle]);
    });

    this.slider.noUiSlider.on('set', function ( values, handle ) {
      self.updateValue(values[handle]);
    });
  }

  updateValue = (val) => {
    let bValChanged = false;
    if(val){
        if(this.props.obj[this.props.propName] !== val)
          bValChanged = true;
    }

    if(bValChanged){
      this.props.obj.setPropVal(this.props.propName, val, this.props.signal)
    }
  }

  componentWillUnmount(){
    this.slider.noUiSlider.destroy();
  }

  setRandomVal = () => {
    let min = 0, max = 2, types = ['none','2x','4x'];
    let randVal = Math.floor(Math.random() * (max - min + 1)) + min;
    this.slider.noUiSlider.set(types[randVal]);
  }

  componentDidUpdate(prevProps){
    if(prevProps.random !== this.props.random){
      this.setRandomVal();
    }
    else{
      this.slider.noUiSlider.set(this.props.obj[this.props.propName]);
    }
  }

  render(){
    return(
      <div className='divEditorSliderContainer'>
        <label>{this.props.propName}</label><br/>
        <div id={'slider_' + this.props.propName + '_' + this.props.obj.id}></div>
      </div>
    )
  }
})


export const UIOmniOscTypeControl = observer(class UIOmniOscTypeControl extends Component {
  slider;
  sliderId;
  obj;
  oscType;

  componentDidMount(){
    this.slider = document.getElementById(this.sliderId);

    noUiSlider.create(this.slider, {
      start: this.getOscType(),
      connect: [true, false],
      range: {
        'min': 1,
        'max': 6
      },
      step: 1,
      pips: {
        mode: 'steps',
        density: 25,
        format: {
          to: function(a){
            return {'1':'REG', '2':'FM', '3':'AM', '4':'FAT', '5':'PULSE', '6':'PWM'}[a];
          }
        }
      },
      tooltips: true,
      format: {
        to: function ( value ) {
          let val = Math.round(value);

          if(val === 1)
            return 'basic';
          else if(val === 2)
            return 'fm';
          else if(val === 3)
            return 'am';
          else if(val === 4)
            return 'fat';
          else if(val === 5)
            return 'pulse';
          else if(val === 6)
            return 'pwm';
        },
        from: function ( value ) {
          if(value === 'basic')
            return 1;
          else if(value === 'fm')
            return 2;
          else if(value === 'am')
            return 3;
          else if(value === 'fat')
            return 4;
          else if(value === 'pulse')
            return 5;
          else if(value === 'pwm')
            return 6;
        }
      }
    });
    
    this.slider.noUiSlider.on('update', (values, handle) => {
      this.updateValue(values[handle]);
    });

    this.slider.noUiSlider.on('set', (values, handle) => {
      this.updateValue(values[handle]);
    });
  }

  getOscType = () => {
    let type = this.obj.type;

    if(type.substr(0, 2) === "fm")
      return "fm"
    else if(type.substr(0, 2) === "am")
      return "am"
    else if(type.substr(0, 3) === "fat")
      return "fat"
    else if(type === "pwm" || type === "pulse")
      return type;
    else 
      return "basic";
  }

  updateValue = (val) => {
    if(val !== this.oscType){
      this.oscType = val;
      this.forceUpdate();
    }
  }

  componentWillUnmount(){
    this.slider.noUiSlider.destroy();
  }
  
  setRandomVal = () => {
    let min = 0, max = 5, types = ['fm', 'am', 'fat', 'pwm', 'pulse', 'basic'];
    let randVal = Math.floor(Math.random() * (max - min + 1)) + min;
    this.slider.noUiSlider.set(types[randVal]);
  }

  componentDidUpdate(prevProps){
    if(prevProps.random !== this.props.random)
      this.setRandomVal();
  }

  render(){
    if(this.props.child){
      this.obj = this.props.obj[this.props.child];
      this.sliderId = 'slider_' + this.props.child + '_' + this.props.propName + '_' + this.props.obj.id;
    }
    else{
      this.obj = this.props.obj;
      this.sliderId = 'slider_' + this.props.propName + '_' + this.props.obj.id;
    }

    if(!this.oscType)
      this.oscType = this.getOscType();

    return(
      <div>
        <div className='divEditorSliderContainer'>
          <label>{this.props.propName}</label><br/>
          <div id={this.sliderId}></div>
        </div>
        <UIOmniOscWaveTypeControl obj={this.props.obj} child={this.props.child} oscType={this.oscType} random={this.props.random}/>
      </div>
    )
  }
})

const UIOmniOscWaveTypeControl = observer(class UIOmniOscWaveTypeControl extends Component {
  slider;
  sliderId;
  waveType;
  obj;
  
  componentDidMount(){
    this.slider = document.getElementById(this.sliderId);
    
    noUiSlider.create(this.slider, {
      start: this.getWaveType(),
      connect: [true, false],
      range: {
        'min': 1,
        'max': 4
      },
      step: 1,
      pips: {
        mode: 'steps',
        density: 25,
        format: {
          to: function(a){
            return {'1':'SINE', '2':'TRI', '3':'SAW', '4':'SQR'}[a];
          }
        }
      },
      tooltips: true,
      format: {
        to: function ( value ) {
          let val = Math.round(value);

          if(val === 1)
            return 'sine';
          else if(val === 2)
            return 'triangle';
          else if(val === 3)
            return 'sawtooth';
          else if(val === 4)
            return 'square';
        },
        from: function ( value ) {
          if(value === 'sine')
            return 1;
          else if(value === 'triangle')
            return 2;
          else if(value === 'sawtooth')
            return 3;
          else if(value === 'square')
            return 4;
        }
      }
    });
    
    this.slider.noUiSlider.on('update', (values, handle) => {
      this.updateValue(values[handle]);
    });

    this.slider.noUiSlider.on('set', (values, handle) => {
      this.updateValue(values[handle]);
    });
  }

  //only used for init
  getWaveType = () => {
    let type = this.obj.type;

    if(type.substr(0, 2) === "fm" || type.substr(0, 2) === "am")
      return type.substr(2);
    else if(type.substr(0, 3) === "fat")
      return type.substr(3);
    else if(type === "pwm" || type === "pulse")
      return "sine";
    else
      return type;
  }

  updateValue = (val) => {
    if(val){
      if(val !== this.waveType){
        this.waveType = val;
        
        let newVal;
        if(this.props.oscType === 'basic')
          newVal = this.waveType;
        else if(this.props.oscType === "pwm" || this.props.oscType === "pulse")
          newVal = this.props.oscType;
        else
          newVal = this.props.oscType + this.waveType;

        this.props.obj.setPropVal('type', newVal, false, this.props.child)
      }
    }
  }

  componentWillUnmount(){
    this.slider.noUiSlider.destroy();
  }
  
  setRandomVal = () => {
    let min = 0, max = 3, types = ['sine', 'triangle', 'sawtooth', 'square'];
    let randVal = Math.floor(Math.random() * (max - min + 1)) + min;
    if(this.props.oscType !== "pulse" && this.props.oscType !== "pwm")
      this.slider.noUiSlider.set(types[randVal]);
  }

  componentDidUpdate(prevProps){
    if(prevProps.random !== this.props.random){
      this.setRandomVal();
    }

    if(prevProps.oscType !== this.props.oscType){
      let newVal = this.props.oscType;

      if(this.props.oscType === "pulse" || this.props.oscType === "pwm"){
        this.slider.setAttribute('disabled', true);
      }
      else{
        this.slider.removeAttribute('disabled');

        if(this.props.oscType === "basic")
          newVal = this.waveType;
        else
          newVal = this.props.oscType + this.waveType;
      }
      
      this.props.obj.setPropVal('type', newVal, false, this.props.child)
    }
  }

  render(){
    if(this.props.child){
      this.obj = this.props.obj[this.props.child];
      this.sliderId = 'slider_' + this.props.child + '_wavetype_' + this.props.obj.id;
    }
    else{
      this.obj = this.props.obj;
      this.sliderId = 'slider_wavetype_' + this.props.obj.id;
    }

    return(
      <div className='divEditorSliderContainer'>
        <label>wavetype</label><br/>
        <div id={this.sliderId}></div>
      </div>
    )
  }
})