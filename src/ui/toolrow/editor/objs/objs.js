import React, { Component } from 'react';
import { observer } from "mobx-react";

import { UIAutoFilter, UIAutoPanner, UIAutoWah, UIBitCrusher, UIChebyshev, UIChorus, UIConvolver, UIDistortion, UIFeedbackDelay, UIFreeverb, UIJCReverb, UIPhaser, UIPingPongDelay, UIPitchShift, UIReverb, UIStereoWidener, UITremolo, UIVibrato } from './panels/effects.js';
import { UIAmplitudeEnvelope, UICompressor, UIEQ3, UIFilter, UILFO, UIFrequencyEnvelope, UILimiter, UIGate, UIMono, UIPanVol, UIFeedbackCombFilter, UILowpassCombFilter, UIMultibandCompressor, UIMidSideCompressor, UIMultibandSplit, UIVolume, UIPanner } from './panels/components.js';
import { UISynth, UIAMSynth, UIFMSynth, UIMonoSynth, UIMetalSynth, UIMembraneSynth, UIPluckSynth, UINoiseSynth, UIDuoSynth, UITinySynth } from './panels/instruments.js';
import { UIOscillator, UIAMOscillator, UIFMOscillator, UIFatOscillator, UIPWMOscillator, UIPulseOscillator, UINoise } from './panels/sources.js';


export const ToolObjEditor = observer(class ToolObjEditor extends Component {
    componentDidMount(){ }
  
    update = () => {
      this.forceUpdate();
    }
  
    render(){
      let display = null;
      let type = this.props.objId.split("_")[0];
  
      switch(type) {
        case "autofilter":
          display = <UIAutoFilter objId={this.props.objId} editorNum={this.props.editorNum} type="effect"/>
          break;
        case "autopanner":
          display = <UIAutoPanner objId={this.props.objId} editorNum={this.props.editorNum} type="effect"/>
          break;
        case "autowah":
          display = <UIAutoWah objId={this.props.objId} editorNum={this.props.editorNum} type="effect"/>
          break;
        case "bitcrusher":
          display = <UIBitCrusher objId={this.props.objId} editorNum={this.props.editorNum} type="effect"/>
          break;
        case "chebyshev":
          display = <UIChebyshev objId={this.props.objId} editorNum={this.props.editorNum} type="effect"/>
          break;
        case "chorus":
          display = <UIChorus objId={this.props.objId} editorNum={this.props.editorNum} type="effect"/>
          break;
        case "convolver":
          display = <UIConvolver objId={this.props.objId} editorNum={this.props.editorNum} type="effect"/>
          break;
        case "distortion":
          display = <UIDistortion objId={this.props.objId} editorNum={this.props.editorNum} type="effect"/>
          break;
        case "feedbackdelay":
          display = <UIFeedbackDelay objId={this.props.objId} editorNum={this.props.editorNum} type="effect"/>
          break;
        case "freeverb":
          display = <UIFreeverb objId={this.props.objId} editorNum={this.props.editorNum} type="effect"/>
          break;
        case "jcreverb":
          display = <UIJCReverb objId={this.props.objId} editorNum={this.props.editorNum} type="effect"/>
          break;
        case "phaser":
          display = <UIPhaser objId={this.props.objId} editorNum={this.props.editorNum} type="effect"/>
          break;
        case "pingpongdelay":
          display = <UIPingPongDelay objId={this.props.objId} editorNum={this.props.editorNum} type="effect"/>
          break;
        case "pitchshift":
          display = <UIPitchShift objId={this.props.objId} editorNum={this.props.editorNum} type="effect"/>
          break;
        case "reverb":
          display = <UIReverb objId={this.props.objId} editorNum={this.props.editorNum} type="effect"/>
          break;
        case "stereowidener":
          display = <UIStereoWidener objId={this.props.objId} editorNum={this.props.editorNum} type="effect"/>
          break;
        case "tremolo":
          display = <UITremolo objId={this.props.objId} editorNum={this.props.editorNum} type="effect"/>
          break;
        case "vibrato":
          display = <UIVibrato objId={this.props.objId} editorNum={this.props.editorNum} type="effect"/>
          break;
  
        //components
        case "amplitudeenvelope":
          display = <UIAmplitudeEnvelope objId={this.props.objId} editorNum={this.props.editorNum} type="component"/>
          break;
        case "compressor":
          display = <UICompressor objId={this.props.objId} editorNum={this.props.editorNum} type="component"/>
          break;
        case "eq3":
          display = <UIEQ3 objId={this.props.objId} editorNum={this.props.editorNum} type="component"/>
          break;
        case "filter":
          display = <UIFilter objId={this.props.objId} editorNum={this.props.editorNum} type="component"/>
          break;
        case "frequencyenvelope":
          display = <UIFrequencyEnvelope objId={this.props.objId} editorNum={this.props.editorNum} type="component"/>
          break;
        case "limiter":
          display = <UILimiter objId={this.props.objId} editorNum={this.props.editorNum} type="component"/>
          break;
        case "lfo":
          display = <UILFO objId={this.props.objId} editorNum={this.props.editorNum} type="component"/>
          break;
        case "gate":
          display = <UIGate objId={this.props.objId} editorNum={this.props.editorNum} type="component"/>
          break;
        case "mono":
          display = <UIMono objId={this.props.objId} editorNum={this.props.editorNum} type="component"/>
          break;
        case "panvol":
          display = <UIPanVol objId={this.props.objId} editorNum={this.props.editorNum} type="component"/>
          break;
        case "feedbackcombfilter":
          display = <UIFeedbackCombFilter objId={this.props.objId} editorNum={this.props.editorNum} type="component"/>
          break;
        case "lowpasscombfilter":
          display = <UILowpassCombFilter objId={this.props.objId} editorNum={this.props.editorNum} type="component"/>
          break;
        case "multibandcompressor":
          display = <UIMultibandCompressor objId={this.props.objId} editorNum={this.props.editorNum} type="component"/>
          break;
        case "midsidecompressor":
          display = <UIMidSideCompressor objId={this.props.objId} editorNum={this.props.editorNum} type="component"/>
          break;
        case "multibandsplit":
          display = <UIMultibandSplit objId={this.props.objId} editorNum={this.props.editorNum} type="component"/>
          break;
        case "volume":
          display = <UIVolume objId={this.props.objId} editorNum={this.props.editorNum} type="component"/>
          break;
        case "panner":
          display = <UIPanner objId={this.props.objId} editorNum={this.props.editorNum} type="component"/>
          break;
  
        //instruments
        case "synth":
          display = <UISynth objId={this.props.objId} editorNum={this.props.editorNum} type="instrument"/>
          break;
        case "amsynth":
          display = <UIAMSynth objId={this.props.objId} editorNum={this.props.editorNum} type="instrument"/>
          break;
        case "fmsynth":
          display = <UIFMSynth objId={this.props.objId} editorNum={this.props.editorNum} type="instrument"/>
          break;
        case "monosynth":
          display = <UIMonoSynth objId={this.props.objId} editorNum={this.props.editorNum} type="instrument"/>
          break;
        case "metalsynth":
          display = <UIMetalSynth objId={this.props.objId} editorNum={this.props.editorNum} type="instrument"/>
          break;
        case "membranesynth":
          display = <UIMembraneSynth objId={this.props.objId} editorNum={this.props.editorNum} type="instrument"/>
          break
        case "plucksynth":
          display = <UIPluckSynth objId={this.props.objId} editorNum={this.props.editorNum} type="instrument"/>
          break
        case "noisesynth":
          display = <UINoiseSynth objId={this.props.objId} editorNum={this.props.editorNum} type="instrument"/>
          break
        case "duosynth":
          display = <UIDuoSynth objId={this.props.objId} editorNum={this.props.editorNum} type="instrument"/>
          break
        case "tinysynth":
          display = <UITinySynth objId={this.props.objId} editorNum={this.props.editorNum} type="instrument"/>
          break
  
        //sources
        case "oscillator":
          display = <UIOscillator objId={this.props.objId} editorNum={this.props.editorNum} type="source"/>
          break;
        case "amoscillator":
          display = <UIAMOscillator objId={this.props.objId} editorNum={this.props.editorNum} type="source"/>
          break;
        case "fmoscillator":
          display = <UIFMOscillator objId={this.props.objId} editorNum={this.props.editorNum} type="source"/>
          break;
        case "fatoscillator":
          display = <UIFatOscillator objId={this.props.objId} editorNum={this.props.editorNum} type="source"/>
          break;
        case "pwmoscillator":
          display = <UIPWMOscillator objId={this.props.objId} editorNum={this.props.editorNum} type="source"/>
          break;
        case "pulseoscillator":
          display = <UIPulseOscillator objId={this.props.objId} editorNum={this.props.editorNum} type="source"/>
          break;
        case "noise":
          display = <UINoise objId={this.props.objId} editorNum={this.props.editorNum} type="source"/>
          break;
  
        case null:
          display = null;
          break;
        default:
          display = null;
      }
  
      return(display)
    }
  })