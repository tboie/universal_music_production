//Copyright 2018-2019 Timothy Boie

import React, { Component } from 'react';
import { observer } from "mobx-react";
import noUiSlider from 'nouislider';
import { store } from '../../../../../data/store.js';
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
      let top = '0px';
      let title = this.props.obj.id.split("_")[0];
      let btnDelete = <button onClick={this.delObj} id="btnDelObject" style={{display:sDisplay, float:'right',right:'5px', backgroundColor:'transparent', border:0, position:'absolute', zIndex:1 }}>
                        <i className="material-icons i-28 colorRed">delete</i>
                      </button>
      
      let id = 'btnEditHeaderToggleSection';
      
      let sDisplay = "block";
      if(title === "panvol")
        sDisplay = "none";

      let toggleSections = [];
      if(this.props.sections)
        toggleSections = this.props.sections;

      if(this.props.parent){
        title = '';
        btnDelete = null;
        top = '32px';
        id = id + '_' + this.props.parent;
      }
  
      return (
        <div style={{position:'absolute', zIndex:10, backgroundColor: 'rgb(12, 11, 27)', width:'100%', height:'32px', top:top}}>
          <label style={{float:'left'}}>{title}</label>
          <div id="divHeaderSectionContainer">
            {
              toggleSections.map((section, idx) => 
                <button key={idx} id={id + '_' + section} onClick={this.selectSection} style={{height:'100%'}}>{section}</button>)
            }
          </div>
          { btnDelete }
        </div>
      )
    }
  })

 export const UICustomRangeControl = observer(class UICustomRangeControl extends Component {
    slider;
    obj;
    toneObj;
    typeObj;
  
    componentDidMount(){
      let self = this;
      let props = this.props;
      
      if(props.child)
        this.slider = document.getElementById('slider_' + props.child + '_' + props.propName + '_' + props.obj.id);
      else
        this.slider = document.getElementById('slider_' + props.propName + '_' + props.obj.id);

      if(this.props.child)
        self.obj = props.obj[props.child]
      else
        self.obj = props.obj;
  
      noUiSlider.create(this.slider, {
        start: self.obj[props.propName],
        connect: [true, false],
        range: {
          'min': props.min,
          'max': props.max
        },
        step: props.step,
        pips: {
          mode: props.mode,
          density: props.density
        },
        tooltips: true
      });
  
      this.slider.noUiSlider.on('update', function ( values, handle ) {
        self.updateValue(values[handle], false);
      });

      this.slider.noUiSlider.on('set', function ( values, handle ) {
        self.updateValue(values[handle], true);
      });
    }
  
    updateValue = (val, end) => {
      //only update MST model on end 
      //TODO: does functionality have to be this way?  MST patch streams etc.

      //don't update if same value
      //take note of the != operator instead of !==

      let bValChanged = false;
      if(val){
        if(this.props.child){
          if(this.props.obj[this.props.child][this.props.propName] != val)
            bValChanged = true;
        }
        else if(this.props.obj[this.props.propName] != val)
          bValChanged = true;
      }

      if(bValChanged){
        /*
        if(this.props.child)
          console.log('value changed ' + this.props.obj.id + '.' + this.props.child +  '.' + this.props.propName +  '  objVal: ' + this.props.obj[this.props.child][this.props.propName] + ' sliderVal: ' + val);
        else
          console.log('value changed ' + this.props.obj.id + '.' + this.props.propName +  '   objVal: ' + this.props.obj[this.props.propName] + ' sliderVal: ' + val);
        */

        if(end){
          if(this.props.numType === 'float')
            this.props.obj.setPropVal(this.props.propName, parseFloat(val), this.props.signal, this.props.child)
          else if(this.props.numType === 'integer')
            this.props.obj.setPropVal(this.props.propName, parseInt(val, 10), this.props.signal, this.props.child)
        }
        //only update toneobj during update
        else{
          let typedVal = val;
          if(this.props.numType === 'float')
            typedVal = parseFloat(val);
          else if(this.props.numType === 'integer')
            typedVal = parseInt(val, 10);

          
          //Polyphonic synths use set method for all properties
          let instName = this.props.obj.id.split('_')[0];
          //console.log('updating tonejs value')
          if(this.objType === "instruments" && instName !== "noisesynth" && instName !== "player" && instName !== "plucksynth" && instName !== "membranesynth" && instName !== "metalsynth"){
            if(this.props.voice){
              if(this.props.child)
                this.toneObj.set(this.props.voice + '.' + this.props.child + '.' + this.props.propName, typedVal);
              else
                this.toneObj.set(this.props.voice + '.' + this.props.propName, typedVal);
            }
            else{ 
              if(this.props.child)
                this.toneObj.set(this.props.child + '.' + this.props.propName, typedVal);
              else{
                this.toneObj.set(this.props.propName, typedVal);
              }
            }
          }
          else{
            if(this.props.signal){
              if(this.props.child)
                this.toneObj[this.props.child][this.props.propName].value = typedVal;
              else
                this.toneObj[this.props.propName].value = typedVal;
            }
            else{
              if(this.props.child)
                this.toneObj[this.props.child][this.props.propName] = typedVal;
              else
                this.toneObj[this.props.propName] = typedVal;
            }

            if(instName === "reverb"){
              this.toneObj.generate().then(() => {
                //console.log('generated finished')
              });
            }
          }
        }
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

      if(!this.toneObj){
        if(!this.objType){
          if(this.props.voice)
            this.objType = "instruments";
          else
            this.objType = store.getObjTypeByIdTrack(this.props.obj.id, this.props.obj.track.id) + 's';
        }
        
        if(ToneObjs.custom.find(o => o.id === this.props.obj.id))
          this.objType = 'custom';
        
        if(this.props.voice)
          this.toneObj = ToneObjs[this.objType].find(o => o.id === this.props.obj.getParentId()).obj;
        else
          this.toneObj = ToneObjs[this.objType].find(o => o.id === this.props.obj.id).obj;
      }

      return(
        <div>
          <label>{this.props.propName}</label><br/>
          <div id={id}></div>
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
          density: 10
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
          if(this.props.obj[this.props.propName] != val)
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
        <div>
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
          density: 25
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
    }
  
    updateValue = (val) => {
      //don't update if same value
      //take note of the != operator instead of !==
      let bValChanged = false;
      if(val){
        if(this.props.child){
          if(this.props.obj[this.props.child][this.props.propName] != val)
            bValChanged = true;
        }
        else if(this.props.obj[this.props.propName] != val)
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
        <div>
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
          density: 12.5
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
    }
  
    updateValue = (val) => {
      //don't update if same value
      //take note of the != operator instead of !==
      let bValChanged = false;
      if(val){
        if(this.props.child){
          if(this.props.obj[this.props.child][this.props.propName] != val)
            bValChanged = true;
        }
        else if(this.props.obj[this.props.propName] != val)
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
        <div>
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
          density: 14.28571
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
    }
  
    updateValue = (val) => {
      //don't update if same value
      //take note of the != operator instead of !==
      let bValChanged = false;
      if(val){
        if(this.props.child){
          if(this.props.obj[this.props.child][this.props.propName] != val)
            bValChanged = true;
        }
        else if(this.props.obj[this.props.propName] != val)
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
        <div>
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
          density: 25
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
    }
  
    updateValue = (val) => {
      //don't update if same value
      //take note of the != operator instead of !==
      let bValChanged = false;
      if(val){
        if(this.props.child){
          if(this.props.obj[this.props.child][this.props.propName] != val)
            bValChanged = true;
        }
        else if(this.props.obj[this.props.propName] != val)
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
        <div>
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
          density: 33.333
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
      //don't update if same value
      //take note of the != operator instead of !==
      let bValChanged = false;
      if(val){
        if(this.props.child){
          if(this.props.obj[this.props.child][this.props.propName] != val)
            bValChanged = true;
        }
        else if(this.props.obj[this.props.propName] != val)
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
        <div>
          <label>{this.props.propName}</label><br/>
          <div id={id}></div>
        </div>
      )
    }
  })
