//Copyright 2018-2019 Timothy Boie

import { types, getParent, destroy, getMembers, applySnapshot, getSnapshot } from "mobx-state-tree";
import Tone from 'tone';
import idb from 'idb';
import { Note as TonalNote, Chord, Scale } from "tonal";
import { store } from "../data/store.js";
//import { UndoManager } from "mst-middlewares";
import * as cloneDeep from 'lodash/cloneDeep';
import { setToneObjs, renderSong } from '../ui/utils.js';
import interact from 'interactjs';

/*******************************************
TODO: move to separate files. 
lots of circular dependencies here.  see MST types.late();
********************************************/

export const randomId = () => Math.random().toString(36).substr(2, 5);

export let ToneObjs = {
    instruments: [],
    effects: [],
    components: [],
    sources: [],
    parts: [],
    custom: [],
    metronome: undefined,

    initMetronome(){
        if(!ToneObjs.metronome){
            let noise = new Tone.Synth({
                volume: 10,
                oscillator: {
                    type  : 'square'
                },
                envelope: {
                    attack: 0.001 ,
                    decay: 0.05,
                    sustain: 0.05,
                    release: 0.05,
                }
            }).toMaster();

            ToneObjs.metronome = new Tone.Loop(time => {
                let beat = parseInt(Tone.Transport.position.split(':')[1], 10);

                if(beat === 0)
                    noise.triggerAttackRelease('C6', '0.001s', time);
                else
                    noise.triggerAttackRelease('C5', '0.001s', time);
                
            }, '0:1').start(-1 * Tone.Time('1:0:0'));

            ToneObjs.metronome.mute = !store.ui.recordMode; 
        }
    },

    //instruments, effects, components, sources
    addAudioObj(name, objSelf, type) {
        type = type + 's';
        
        let p = getMembers(objSelf).properties;
        delete p.id;
        delete p.track;
        delete p.ui;

        let args = {}, noArgs = true;
        Object.keys(p).forEach(key => {
            args[key] = objSelf[key];
            noArgs = false;
        });

        if(noArgs)
            args = undefined;

        if(type === "instruments" && name !== "Player" && name !== "NoiseSynth" && name !== "PluckSynth" && name !== "MembraneSynth" && name !== "MetalSynth"){
            if(!ToneObjs[type].find(row => row.id === objSelf.id)){
                ToneObjs[type].push({ id: objSelf.id, track: objSelf.track.id, obj: new Tone.PolySynth(8, Tone[name]).set(args) });
            }
        }
        else{
            if(!ToneObjs[type].find(row => row.id === objSelf.id)){
                let id = objSelf.id.split('_')[0];
                if(id === 'lfo' || id === 'autofilter' || id === 'autopanner' || id === 'tremolo'){
                    ToneObjs[type].push({ id: objSelf.id, track: objSelf.track.id, obj: new Tone[name](args).start('0:0:0') });
                    ToneObjs[type].find(o => o.id === objSelf.id).obj.sync();
                }
                else{
                    ToneObjs[type].push({ id: objSelf.id, track: objSelf.track.id, obj: new Tone[name](args) });
                }
            }
        }
    },
    
    delAudioObj(id, type){
        type = type + 's';
        let row = ToneObjs[type].find(e => e.id === id);
        if(row){
            if(row.obj){
                row.obj.dispose();
                ToneObjs[type] = ToneObjs[type].filter(e => e.id !== id);
            }
        }
    },

    //set audio obj prop
    setPropVal: (id, type, prop, val, signal, child, voice) => {
        let obj, name = id.split('_')[0];

        if(type === "instrument" && name === "tinysynth")
            obj = ToneObjs['custom'].find(row => row.id === id).obj;
        else
            obj = ToneObjs[type + 's'].find(row => row.id === id).obj;
        
        if(obj){
            //polysynths
            if(type === "instrument" && name !== "player" && name !== "noisesynth" && name !== "plucksynth" && name !== "membranesynth" && name !== "metalsynth" && name !== "tinysynth"){
                let currVal, queryStr;

                if(voice){
                    if(child){
                        currVal = obj.get()[voice][child][prop];
                        queryStr = voice + '.' + child + '.' + prop;
                    } 
                    else{
                        currVal = obj.get()[voice][prop];
                        queryStr = voice + '.' + prop;
                    }
                }
                else if(child){
                    currVal = obj.get()[child][prop];
                    queryStr = child + '.' + prop;
                }
                else{
                    currVal = obj.get()[prop]
                    queryStr = prop;
                }
                
                if(currVal !== val)
                    obj.set(queryStr, val);
            }
            //all other objs
            else{
                if(child)
                    obj = obj[child];
                
                if(signal){
                    if(obj[prop].value !== val)
                        obj[prop].value = val;
                }
                else{
                    if(obj[prop] !== val)
                        obj[prop] = val;
                }
            }
        }
    },
    trackInstNoteOn: (trackId, notes) => {
        ToneObjs.instruments.filter(o => o.track === trackId).forEach(row => {
            if(row.obj){
                let type = row.id.split('_')[0];
        
                if(type === 'metalsynth'){
                    row.obj.frequency.setValueAtTime(notes[0], undefined, Math.random()*0.5 + 0.5);
                    row.obj.triggerAttack(undefined, 1);
                }
                else if(type === 'noisesynth'){
                    row.obj.triggerAttack();
                }
                else if(type === 'plucksynth' || type === 'membranesynth'){
                    row.obj.triggerAttack(TonalNote.freq(notes[0]));
                }
                else if(type !== 'player'){
                    row.obj.triggerAttack(notes.map(n => TonalNote.freq(n)));
                }
            }
        });
    
          //mute pattern on keypress for monophonic 
        let bPatternsMuted = false;
        ToneObjs.sources.filter(o => o.track === trackId).forEach(row => {
            if(!bPatternsMuted){
                ToneObjs.parts.filter(p => p.track === trackId).forEach(o => {
                    if(!o.obj.mute)
                        o.obj.mute = true;
                    });
                bPatternsMuted = true;
            }
    
            if(row.obj){
                if(row.id.split('_')[0] !== 'noise')
                    row.obj.frequency.value = TonalNote.freq(notes[0]);
    
                row.obj.start();
            }
        });
    
        ToneObjs.custom.filter(o => o.track === trackId).forEach(row => {
            if(row.obj){
                let ch = store.instruments.getInstrumentByTypeId("tinysynth", row.id).channel;
    
                if(!store.ui.selectedChord){
                    let noteNum = TonalNote.midi(notes[0]); //C4 is 60
                    row.obj.send([0x90 + ch, noteNum, 100], Tone.context.currentTime)
                }
                else{
                    notes.forEach(n => {
                        let midi = TonalNote.midi(n)
                        if(midi)
                            row.obj.send([0x90 + ch, midi, 100], Tone.context.currentTime)
                    })
                }
            }
        });

        ToneObjs.components.filter(o => o.track === trackId && o.id.split('_')[0] === 'amplitudeenvelope').forEach(component => {
            component.obj.triggerAttack();      
        })
    },

    trackInstNoteOff: (trackId, notes, mouseDown) => {
        ToneObjs.instruments.filter(o => o.track === trackId).forEach(row => {
            if(row.obj){
              let type = row.id.split('_')[0];
    
              if(type === "metalsynth" || type === "membranesynth" || type === "noisesynth"){
                row.obj.triggerRelease();
              }
              else if(type !== "player" && type !== "plucksynth"){
                //row.obj.releaseAll();
                row.obj.triggerRelease(notes.map(n => TonalNote.freq(n)));
              }
            }
        });
          
        ToneObjs.sources.filter(o => o.track === trackId).forEach(row => {
            if(row.obj){
                let timeStop = Tone.now();
                const connectionsEnv = store.getConnectionsByObjId(row.id).filter(c => c.dest.split('_')[0] === 'amplitudeenvelope');

                //if connected to amplitude envelope, stop note at end of longest envelope release
                if(connectionsEnv.length > 0){
                    let envs = [];
                    connectionsEnv.forEach(c => envs.push(store.components.getComponentByTypeId('amplitudeenvelope', c.dest)));
                    timeStop += envs.sort((a, b) => b.release - a.release)[0].release;
                }

                row.obj.stop(timeStop);
            }
        });
    
          //now unmute patterns that were muted on press
        if(!mouseDown){
            ToneObjs.parts.filter(p => p.track === trackId).forEach(o => {
              if(o.obj.mute)
                o.obj.mute = false; 
            });
        }
    
        ToneObjs.custom.filter(o => o.track === trackId).forEach(row => {
            if(row.obj){ 
                let ch = store.instruments.getInstrumentByTypeId("tinysynth", row.id).channel;
    
                if(!this.selectedChord){
                    let noteNum = TonalNote.midi(notes[0]); //C4 is 60
                    row.obj.send([0x80 + ch, noteNum, 0], Tone.context.currentTime)
                }
                else{
                    notes.forEach(n => {
                        let midi = TonalNote.midi(n)
                        if(midi)
                            row.obj.send([0x80 + ch, midi, 0], Tone.context.currentTime)
                    })
                }
            }
        });

        ToneObjs.components.filter(o => o.track === trackId && o.id.split('_')[0] === 'amplitudeenvelope').forEach(component => {
            component.obj.triggerRelease();     
        })
    }
}


const Region = types.model("Region", {
    id: types.identifier, //wavesurfer region id
    url: types.maybe(types.string), //aka filename
    start: types.maybe(types.number),
    end: types.maybe(types.number)
}).views(self => ({
    getRegions() {
        return { start: self.start, end: self.end }
    },
    getSample(){
        return getParent(self, 2);
    }
})).actions(self => ({
    setRegions(start, end) {
        self.start = start;
        self.end = end;
    },
    delete() {
        destroy(self);
    },
    afterCreate() {},
    beforeDestroy() {}
}));


const Sample = types.model("Sample", {
    id: types.identifier,
    url: types.maybe(types.string),
    length: types.maybe(types.number),
    duration: types.maybe(types.number),
    regions: types.optional(types.array(Region), [])
}).views(self => ({
    getRegion(id) {
        return self.regions.find(r => r.id === id);
    }
})).actions(self => {
    function addRegion(id, url, start, end) {
        self.regions.push({ id: id, url: url, start: start, end: end })
    }
    function delRegion(id) {
        destroy(self.getRegion(id));
    }
    function afterAttach(){} 
    function afterCreate(){}
    function beforeDestroy(){}

    return { addRegion, delRegion, beforeDestroy, afterAttach, afterCreate }
});


const MixRow = types.model("TrackMixRow", {
    mainSelection: types.optional(types.string, "Vol"),
    editSelection: types.optional(types.string, "Dur")
}).views(self => ({

})).actions(self => ({
    setMainSelection(val){
        self.mainSelection = val;
    },
    setEditSelection(val){
        self.editSelection = val;
    }
}));


const Track = types.model("Track", {
    id: types.identifier,
    type: types.union(types.literal("audio"), types.literal("instrument"), types.literal("master")),
    mute: types.optional(types.boolean, false),
    solo: types.optional(types.boolean, false),
    sample: types.maybe(types.reference(Sample)),
    region: types.maybe(types.reference(Region)),
    group: types.maybe(types.union(types.literal("A"), types.literal("B"), types.literal("C"), types.literal("D"), types.literal("M"))),
    resolution: types.optional(types.string, "16n"),
    groupIndex: types.maybe(types.number),
    mixRow: MixRow
}).views(self => ({
    returnRegion(){
        let r = self.region;
        if(r)
            r = self.region.getRegions();

        return r;
    },
    get getPlaybackRate(){
        if(self.type === "audio"){
          let player = store.instruments.getPlayerByTrack(self.id);
          if(player)
            return player.playbackRate;
          else
            return 1;
        }
        else
          return 1;
    },
    getPanVol(){
        let panvol;
        if(self.type === "master" && self.group !== "M")
            panvol = store.components.getComponentByTypeId('panvol','panvol_' + self.group + '_out');
        else
            panvol = store.components.getAllByTrack(self.id).find(c => c.id.split('_')[0] === 'panvol');

        return panvol;
    }
})).actions(self => {
    function delNotes(){
        store.getPatternsByTrack(self.id).forEach(p => p.deleteNotes());
    }
    function toggleMute(val) {
        if(val === undefined)
            self.mute = !self.mute;
        else
            self.mute = val;

        let panvol = self.getPanVol();
        if(panvol)
            panvol.setPropVal('mute', self.mute);
    }
    function toggleSolo() {
        self.solo = !self.solo;

        let tracks = store.getTracksByGroup(self.group);

        if(self.type === 'master'){
            //all master tracks except for grande master
            tracks = store.getTracksByGroup('M').filter(t => t.group !== 'M');
            store.components.solos.find(s => s.track.id === self.id).setPropVal('solo', self.solo);
        }

        if(tracks.some(t => { return t.solo })){
            tracks.forEach(t => {
                if(!t.mute && !t.solo)
                    t.toggleMute();
                else if(t.mute && t.solo)
                    t.toggleMute();
            })
        } else{
            tracks.forEach(t => {
                if(t.mute)
                    t.toggleMute();
            })
        }
    }
    function setResolution(res){
        self.resolution = res;
        store.getPatternsByTrack(self.id).forEach(p => {
            if(p.resolution !== res){
                p.setResolution(res);
            }
        })
    }
    function setGroup(group){
        self.group = group;
    }
    function setGroupIndex(num){
        self.groupIndex = num;
    }
    function toggleGroup(){
        const groups = ['A','B','C','D'];
        const idx = groups.indexOf(self.group);

        //shift current group indexes
        store.getTracksByGroup(self.group).filter(t => t.groupIndex > self.groupIndex).forEach(t => t.setGroupIndex(t.groupIndex - 1));
        //switch group
        idx === groups.length - 1 ? self.setGroup(groups[0]) : self.setGroup(groups[idx + 1]);
        //set group index to last
        self.groupIndex = store.getTracksByGroup(self.group).length - 1;
    }
    function moveTrackUp(){
        if(self.groupIndex > 0){
            let prevTrack = store.getTracksByGroup(self.group).find(t => t.groupIndex === (self.groupIndex - 1));
            if(prevTrack){
                prevTrack.setGroupIndex(self.groupIndex);
                self.groupIndex -= 1;
            }
        }
    }
    function moveTrackDown(){
        if(self.groupIndex < (store.getTracksByGroup(self.group).length - 1)){
            let nextTrack = store.getTracksByGroup(self.group).find(t => t.groupIndex === (self.groupIndex + 1));
            if(nextTrack){
                nextTrack.setGroupIndex(self.groupIndex);
                self.groupIndex += 1;
            }
        }
    }
    function afterCreate(){}
    function afterAttach(){}

    return { afterCreate, afterAttach, delNotes, setResolution, setGroupIndex, moveTrackUp, moveTrackDown, setGroup, toggleMute, toggleSolo, toggleGroup }
});

const UIObj = types.model("UIObj", {
    x: types.maybe(types.number),
    y: types.maybe(types.number)
    //  title, color?
}).views(self => ({

})).actions(self => ({
    setCoords(x, y) {
        self.x = x;
        self.y = y;
    }
}))

const Connection = types.model("Connection", {
    id: types.identifier,
    track: types.reference(Track),
    src: types.maybe(types.string), // STRINGS not references
    dest: types.maybe(types.string), // STRINGS not references
    srcType: types.maybe(types.string), //component, instrument, etc..
    destType: types.maybe(types.string),
    numOut: types.optional(types.number, 0),
    numIn: types.optional(types.number, 0),
    signal: types.maybe(types.string)
}).actions(self => ({
    addConnection(offline) {
        let objSrc, objDest;

        if(self.src.split('_')[0] === 'tinysynth' && self.srcType !== 'component')
            self.srcType = 'component';
        
        let arraySrc = ToneObjs[self.srcType + "s"];
        let arrayDest = ToneObjs[self.destType + "s"];

        if(offline){
            arraySrc = offline[self.srcType + "s"];
            arrayDest = offline[self.destType + "s"];
        }

        if (self.src !== "master" && self.dest !== "master") {
            objSrc = arraySrc.find(i => i.id === self.src).obj;
            objDest = arrayDest.find(i => i.id === self.dest).obj;

            if(self.signal){
                let name = self.dest.split('_')[0];
                if(self.signal !== 'detune' && self.destType === "instrument" && name !== "player" && name !== "noisesynth" && name !== "plucksynth" && name !== "membranesynth" && name !== "metalsynth" && name !== "tinysynth"){
                    objDest.voices.forEach(v => {
                        objSrc.connect(v[self.signal]);
                    })
                }
                else{
                    objSrc.connect(objDest[self.signal]);
                }
            }
            else{
                objSrc.connect(objDest, self.numOut, self.numIn);
            }
        }
        else if(self.dest === "master") {
            objSrc = arraySrc.find(i => i.id === self.src).obj;
            objSrc.connect(Tone.Master, self.numOut, self.numIn);
        }
        else if(self.src === "master"){
            objDest = arrayDest.find(i => i.id === self.dest).obj;
            Tone.Master.connect(objDest, self.numOut, self.numIn);
        }
    },
    afterAttach() {
        self.addConnection();
    },
    beforeDestroy() {
        let objSrc, objDest;
        let arraySrc = ToneObjs[self.srcType + "s"];
        let arrayDest = ToneObjs[self.destType + "s"];

        if (self.src !== "master" && self.dest !== "master") {
            objSrc = arraySrc.find(i => i.id === self.src).obj;
            objDest = arrayDest.find(i => i.id === self.dest).obj;

            if(self.signal){
                let name = self.dest.split('_')[0];
                if(self.signal !== 'detune' && self.destType === "instrument" && name !== "player" && name !== "noisesynth" && name !== "plucksynth" && name !== "membranesynth" && name !== "metalsynth" && name !== "tinysynth"){
                    objDest.voices.forEach(v => {
                        objSrc.disconnect(v[self.signal]);
                    })
                }
                else{
                    objSrc.disconnect(objDest[self.signal]);
                }
            }
            else{
                objSrc.disconnect(objDest, self.numOut, self.numIn);
            }
        }
        else if(self.dest === "master") {
            objSrc = arraySrc.find(i => i.id === self.src).obj;
            objSrc.disconnect(Tone.Master, self.numOut, self.numIn);
        }
        else if(self.src === "master"){
            objDest = arrayDest.find(i => i.id === self.dest).obj;
            Tone.Master.disconnect(objDest, self.numOut, self.numIn);
        }
    }
}));


const Filter = types.model("Filter", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    type: types.optional(types.enumeration("filter", ["lowpass", "highpass", "bandpass", "lowshelf", "highshelf", "notch", "allpass", "peaking"]), "lowpass"),
    frequency: types.optional(types.union(types.number, types.string), 350),
    rolloff: types.optional(types.number, -12),
    Q: types.optional(types.number, 1),
    gain: types.optional(types.number, 0),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterCreate(){
    },
    afterAttach() {
        if (!self.ui && self.track !== undefined)
            self.ui = UIObj.create();

        if (self.track !== undefined)
            getParent(self, 2).addToneObj("Filter", self);
    },
    beforeDestroy() {
        if (self.track !== undefined)
            getParent(self, 2).delToneObj(self.id);
    }
}));

const AutoFilter = types.model("AutoFilter", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    frequency: types.optional(types.union(types.number, types.string), "8n"),
    type: types.optional(types.enumeration("wave", ["sine", "triangle", "sawtooth", "square", "custom"]), "sine"),
    depth: types.optional(types.number, 1),
    baseFrequency: types.optional(types.union(types.number, types.string), 200),
    octaves: types.optional(types.number, 2.6),
    filter: Filter,

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        if(child)
            self[child][prop] = val;
        else
            self[prop] = val;

        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("AutoFilter", self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const AutoPanner = types.model("AutoPanner", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    frequency: types.optional(types.union(types.number, types.string), "8n"),
    type: types.optional(types.enumeration("wave", ["sine", "triangle", "sawtooth", "square"]), "sine"),
    depth: types.optional(types.number, 1),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("AutoPanner", self)
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const AutoWah = types.model("AutoWah", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    baseFrequency: types.optional(types.union(types.number, types.string), 100),
    octaves: types.optional(types.number, 6),
    sensitivity: types.optional(types.number, 0),
    Q: types.optional(types.number, 2),
    gain: types.optional(types.number, 2),
    //follower: Follower

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("AutoWah", self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const BitCrusher = types.model("BitCrusher", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    bits: types.optional(types.number, 4),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("BitCrusher", self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));


const Chebyshev = types.model("Chebyshev", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    order: types.optional(types.number, 1),
    oversample: types.optional(types.enumeration("oversample", ["none", "2x", "4x"]), "none"),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("Chebyshev", self)
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const Chorus = types.model("Chorus", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    frequency: types.optional(types.union(types.number, types.string), 1.5),
    delayTime: types.optional(types.number, 3.5),
    depth: types.optional(types.number, 0.7),
    type: types.optional(types.enumeration("wave", ["sine", "triangle", "sawtooth", "square"]), "sine"),
    spread: types.optional(types.number, 180),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("Chorus", self)
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const Convolver = types.model("Convolver", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    url: types.optional(types.string, ""), //TODO: deal with sample?

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("Convolver", self)
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const Distortion = types.model("Distortion", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    distortion: types.optional(types.number, 0.8),
    oversample: types.optional(types.enumeration("oversample", ["none", "2x", "4x"]), "none"),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("Distortion", self)
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const FeedbackDelay = types.model("FeedbackDelay", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    delayTime: types.optional(types.string, "8n"),
    maxDelay: types.optional(types.number, 1), //can't be changed, see Tone.Delay docs
    feedback: types.optional(types.number, 0.5),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("FeedbackDelay", self)
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const Freeverb = types.model("Freeverb", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    roomSize: types.optional(types.number, 0.7),
    dampening: types.optional(types.number, 3000),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("Freeverb", self)
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const JCReverb = types.model("JCReverb", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    roomSize: types.optional(types.number, 0.5),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("JCReverb", self)
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const MidSideEffect = types.model("MidSideEffect", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("MidSideEffect", self)
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const Phaser = types.model("Phaser", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    frequency: types.optional(types.union(types.number, types.string), 0.5),
    octaves: types.optional(types.number, 3),
    stages: types.optional(types.number, 10),
    Q: types.optional(types.number, 10),
    baseFrequency: types.optional(types.union(types.number, types.string), 350),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("Phaser", self)
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const PingPongDelay = types.model("PingPongDelay", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    delayTime: types.optional(types.string, "8n"),
    maxDelayTime: types.optional(types.string, "1"),
    feedback: types.optional(types.number, 0.5),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("PingPongDelay", self)
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const PitchShift = types.model("PitchShift", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    pitch: types.optional(types.number, 0),
    //The window size corresponds roughly to the sample length in a looping sampler. 
    //Smaller values are desirable for a less noticeable delay time of the pitch shifted signal, 
    //  but larger values will result in smoother pitch shifting for larger intervals. 
    //A nominal range of 0.03 to 0.1 is recommended.
    windowSize: types.optional(types.number, 0.1),
    delayTime: types.optional(types.string, "0"),
    feedback: types.optional(types.number, 0),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("PitchShift", self)
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const Reverb = types.model("Reverb", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    decay: types.optional(types.number, 1.5),
    preDelay: types.optional(types.number, 0.01),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("Reverb", self);

        ToneObjs.effects.find(o => o.id === self.id).obj.generate().then(() => {
            //console.log('reverb generate finished')
        });  
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const StereoWidener = types.model("StereoWidener", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    width: types.optional(types.number, 0.5),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("StereoWidener", self)
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const Tremolo = types.model("Tremolo", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    frequency: types.optional(types.union(types.number, types.string), 10),
    type: types.optional(types.enumeration("wave", ["sine", "triangle", "sawtooth", "square", "custom"]), "sine"),
    depth: types.optional(types.number, 0.5),
    spread: types.optional(types.number, 180),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("Tremolo", self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const Vibrato = types.model("Vibrato", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    wet: types.optional(types.number, 1),

    maxDelay: types.optional(types.number, 0.005),
    frequency: types.optional(types.union(types.number, types.string), 5),
    depth: types.optional(types.number, 0.1),
    type: types.optional(types.enumeration("wave", ["sine", "triangle", "sawtooth", "square", "custom"]), "sine"),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'effect', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("Vibrato", self)
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const Effects = types.model("Effects", {
    autofilters: types.maybe(types.array(AutoFilter)),
    autopanners: types.maybe(types.array(AutoPanner)),
    autowahs: types.maybe(types.array(AutoWah)),
    bitcrushers: types.maybe(types.array(BitCrusher)),
    chebyshevs: types.maybe(types.array(Chebyshev)),
    choruss: types.maybe(types.array(Chorus)), //plural chorus
    convolvers: types.maybe(types.array(Convolver)),
    distortions: types.maybe(types.array(Distortion)),
    feedbackdelays: types.maybe(types.array(FeedbackDelay)),
    freeverbs: types.maybe(types.array(Freeverb)),
    jcreverbs: types.maybe(types.array(JCReverb)),
    midsideeffects: types.maybe(types.array(MidSideEffect)),
    phasers: types.maybe(types.array(Phaser)),
    pingpongdelays: types.maybe(types.array(PingPongDelay)),
    pitchshifts: types.maybe(types.array(PitchShift)),
    reverbs: types.maybe(types.array(Reverb)),
    stereowideners: types.maybe(types.array(StereoWidener)),
    tremolos: types.maybe(types.array(Tremolo)),
    vibratos: types.maybe(types.array(Vibrato))
}).views(self => ({
    getEffectByTypeId(type, id) {
        return self[type + 's'].find(item => item.id === id);
    },
    getAllByTrack(trackId) {
        let p = getMembers(self).properties;
        let list = [];
        for (let key in p) {
            if (p.hasOwnProperty(key)) {
                self[key].filter(o => o.track.id === trackId).forEach(function (item) {
                    list.push(item);
                })
            }
        }
        return list;
    }
})).actions(self => ({
    add(type, args) {
        //this broke on package.json updates
        //self[type + 's'].push(args);

        switch (type) {
            case "autofilter":
                if(!args.oscillator){
                    let defaultArgs = {...Tone.AutoFilter.defaults.filter};
                    defaultArgs.id = 'filter_' + randomId();
                    args.filter = Filter.create(defaultArgs);
                }
                self[type + 's'].push(AutoFilter.create(args));
                break;
            case "autopanner":
                self[type + 's'].push(AutoPanner.create(args));
                break;
            case "autowah":
                self[type + 's'].push(AutoWah.create(args));
                break;
            case "bitcrusher":
                self[type + 's'].push(BitCrusher.create(args));
                break;
            case "chebyshev":
                self[type + 's'].push(Chebyshev.create(args));
                break;
            case "chorus":
                self[type + 's'].push(Chorus.create(args));
                break;
            case "convolver":
                self[type + 's'].push(Convolver.create(args));
                break;
            case "distortion":
                self[type + 's'].push(Distortion.create(args));
                break;
            case "feedbackdelay":
                self[type + 's'].push(FeedbackDelay.create(args));
                break;
            case "freeverb":
                self[type + 's'].push(Freeverb.create(args));
                break;
            case "jcreverb":
                self[type + 's'].push(JCReverb.create(args));
                break;
            case "midsideeffect":
                self[type + 's'].push(MidSideEffect.create(args));
                break;
            case "phaser":
                self[type + 's'].push(Phaser.create(args));
                break;
            case "pingpongdelay":
                self[type + 's'].push(PingPongDelay.create(args));
                break;
            case "pitchshift":
                self[type + 's'].push(PitchShift.create(args));
                break;
            case "reverb":
                self[type + 's'].push(Reverb.create(args));
                break;
            case "stereowidener":
                self[type + 's'].push(StereoWidener.create(args));
                break;
            case "tremolo":
                self[type + 's'].push(Tremolo.create(args));
                break;
            case "vibrato":
                self[type + 's'].push(Vibrato.create(args));
                break;
            default:
                break;
        }
    },
    delete(type, id) {
        destroy(self.getEffectByTypeId(type, id));
    },
    addToneObj(name, objSelf) {
       ToneObjs.addAudioObj(name, objSelf, 'effect');
    },
    delToneObj(id) {
        store.delConnectionsByObj(id);
        ToneObjs.delAudioObj(id, 'effect');
    }
}))

//*************************************************/


const Follower = types.model("Follower", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    
    smoothing: types.optional(types.number, 0.05)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterAttach() {
        getParent(self, 2).addToneObj("Follower", self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const Meter = types.model("Meter", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    smoothing: types.optional(types.number, 0.8)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterAttach() {
        getParent(self, 2).addToneObj('Meter', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id)
    }
}));

const PanVol = types.model("PanVol", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    pan: types.optional(types.number, 0),
    volume: types.optional(types.number, 0),
    mute: types.optional(types.boolean, false),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("PanVol", self);
    },
    beforeDestroy() {
        let tokens = self.id.split('_');
        if(tokens[0] === "tinysynth"){
            let ts = store.instruments.getInstrumentByTypeId('tinysynth', 'tinysynth_' + tokens[2]);
            ts.disconnectFromPanVol();
        }

        getParent(self, 2).delToneObj(self.id);
    }
}));

const Split = types.model("Split", {
    id: types.identifier,
    track: types.maybe(types.reference(Track))
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterAttach() {
        getParent(self, 2).addToneObj('Split', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id)
    }
}));

const Limiter = types.model("Limiter", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    threshold: types.optional(types.number, -12),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('Limiter', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id)
    }
}));

const Solo = types.model("Solo", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    solo: types.optional(types.boolean, false),
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterAttach() {
        getParent(self, 2).addToneObj('Solo', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id)
    }
}));

const Compressor = types.model("Compressor", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    ratio: types.optional(types.number, 12),
    threshold: types.optional(types.number, -24),
    release: types.optional(types.number, 0.25),
    attack: types.optional(types.number, 0.003),
    knee: types.optional(types.number, 30),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        if (self.track !== undefined)
            getParent(self, 2).addToneObj('Compressor', self);
    },
    beforeDestroy() {
        if (self.track !== undefined)
            getParent(self, 2).delToneObj(self.id)
    }
}));

const MultibandCompressor = types.model("MultibandCompressor", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    low: Compressor,
    mid: Compressor,
    high: Compressor,

    lowFrequency: types.optional(types.number, 250),
    highFrequency: types.optional(types.number, 2000),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        if(child)
            self[child][prop] = val;
        else
            self[prop] = val;
        
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('MultibandCompressor', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id)
    }
}));

const MidSideCompressor = types.model("MidSideCompressor", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    mid: Compressor,
    side: Compressor,

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        if(child)
            self[child][prop] = val;
        else
            self[prop] = val;
        
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('MidSideCompressor', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id)
    }
}));

const EQ3 = types.model("EQ3", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    low: types.optional(types.number, 0),
    mid: types.optional(types.number, 0),
    high: types.optional(types.number, 0),
    lowFrequency: types.optional(types.union(types.number, types.string), 400),
    highFrequency: types.optional(types.union(types.number, types.string), 2500),
    Q: types.optional(types.number, 1),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('EQ3', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id)
    }
}));

const Mono = types.model("Mono", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('Mono', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id)
    }
}));

const Gate = types.model("Gate", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    attack: types.optional(types.number, 0.1),
    release: types.optional(types.number, 0.1),
    threshold: types.optional(types.number, -40),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('Gate', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id)
    }
}));

const AmplitudeEnvelope = types.model("AmplitudeEnvelope", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    attack: types.optional(types.number, 0.1),
	decay: types.optional(types.number, 0.2),
	sustain: types.optional(types.number, 1),
    release: types.optional(types.number, 0.8),

    attackCurve: types.optional(types.union(types.string, types.array(types.number)), "linear"), //linear exponential sine cosine bounce ripple step
    decayCurve: types.optional(types.union(types.string, types.array(types.number)), "exponential"), 
    releaseCurve: types.optional(types.union(types.string, types.array(types.number)), "exponential"), 
    
    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterCreate() {

    },
    afterAttach() {
        if (!self.ui && self.track !== undefined)
            self.ui = UIObj.create();

        if(self.track !== undefined)
            getParent(self, 2).addToneObj('AmplitudeEnvelope', self);
    },
    beforeDestroy() {
        if(self.track !== undefined)
            getParent(self, 2).delToneObj(self.id)
    }
}));

const Envelope = types.model("Envelope", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    attack: types.optional(types.number, 0.01),
	decay: types.optional(types.number, 0.1),
	sustain: types.optional(types.number, 0.5),
    release: types.optional(types.number, 1),
    
    attackCurve: types.optional(types.union(types.string, types.array(types.number)), "linear"), //linear exponential sine cosine bounce ripple step
    decayCurve: types.optional(types.union(types.string, types.array(types.number)), "exponential"), 
    releaseCurve: types.optional(types.union(types.string, types.array(types.number)), "exponential"), 
    
    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    //TODO: check if part of synth instruments
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui && self.track !== undefined)
            self.ui = UIObj.create();

    },
    afterAttach() {
        if(self.track !== undefined)
            getParent(self, 2).addToneObj('Envelope', self);
    },
    beforeDestroy() {
        if(self.track !== undefined)
            getParent(self, 2).delToneObj(self.id)
    }
}));

const FrequencyEnvelope = types.model("FrequencyEnvelope", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    //need these?
    attack: types.optional(types.number, 0.1),
	decay: types.optional(types.number, 0.2),
	sustain: types.optional(types.number, 1),
    release: types.optional(types.number, 0.8),

    baseFrequency: types.optional(types.union(types.number, types.string), 200),
    octaves: types.optional(types.number, 4),
    exponent: types.optional(types.number, 2),

    attackCurve: types.optional(types.union(types.string, types.array(types.number)), "linear"), //linear exponential sine cosine bounce ripple step
    decayCurve: types.optional(types.union(types.string, types.array(types.number)), "exponential"), 
    releaseCurve: types.optional(types.union(types.string, types.array(types.number)), "exponential"), 
    
    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    //TODO: check if part of synth instruments
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterCreate() {
        
    },
    afterAttach() {
        if (!self.ui && self.track !== undefined)
            self.ui = UIObj.create();

        if(self.track !== undefined)
            getParent(self, 2).addToneObj('FrequencyEnvelope', self);
    },
    beforeDestroy() {
        if(self.track !== undefined)
            getParent(self, 2).delToneObj(self.id)
    }
}));

const LFO = types.model("LFO", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    type: types.optional(types.string, "sine"),
    min: types.optional(types.number, 0),
    max: types.optional(types.number, 1),
    phase: types.optional(types.number, 0),
    frequency: types.optional(types.string, "4n"),
    amplitude: types.optional(types.number, 1),
    //units: Tone.Type.Default

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('LFO', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id)
    }
}));

const FeedbackCombFilter = types.model("FeedbackCombFilter", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    delayTime: types.optional(types.union(types.number, types.string), 0.1),
    resonance: types.optional(types.number, 0.1),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('FeedbackCombFilter', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id)
    }
}));

const LowpassCombFilter = types.model("LowpassCombFilter", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    delayTime: types.optional(types.union(types.number, types.string), 0.1),
    resonance: types.optional(types.number, 0.1),
    dampening: types.optional(types.number, 3000),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('LowpassCombFilter', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id)
    }
}));

const MultibandSplit = types.model("MultibandSplit", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    lowFrequency: types.optional(types.number, 400),
    highFrequency: types.optional(types.number, 2500),
    Q: types.optional(types.number, 1),
    low: Filter,
    mid: Filter,
    high: Filter,

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('MultibandSplit', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id)
    }
}));

const Volume = types.model("Volume", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    volume: types.optional(types.number, 0),
    mute: types.optional(types.boolean, false),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('Volume', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id)
    }
}));

const Panner = types.model("Panner", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    pan: types.optional(types.number, 0),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'component', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj("Panner", self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id)
    }
}));

const Components = types.model("Components", {
    filters: types.maybe(types.array(Filter)),
    followers: types.maybe(types.array(Follower)),
    meters: types.maybe(types.array(Meter)),
    panvols: types.maybe(types.array(PanVol)),
    splits: types.maybe(types.array(Split)),
    limiters: types.maybe(types.array(Limiter)),
    solos: types.maybe(types.array(Solo)),
    eq3s: types.maybe(types.array(EQ3)),
    compressors: types.maybe(types.array(Compressor)),
    monos: types.maybe(types.array(Mono)),
    gates: types.maybe(types.array(Gate)),
    envelopes: types.maybe(types.array(Envelope)),
    amplitudeenvelopes: types.maybe(types.array(AmplitudeEnvelope)),
    frequencyenvelopes: types.maybe(types.array(FrequencyEnvelope)),
    lfos: types.maybe(types.array(LFO)),
    feedbackcombfilters: types.maybe(types.maybe(types.array(FeedbackCombFilter))),
    lowpasscombfilters: types.maybe(types.maybe(types.array(LowpassCombFilter))),
    multibandcompressors: types.maybe(types.array(MultibandCompressor)),
    midsidecompressors: types.maybe(types.array(MidSideCompressor)),
    multibandsplits: types.maybe(types.array(MultibandSplit)),
    volumes: types.maybe(types.array(Volume)),
    panners: types.maybe(types.array(Panner)),
}).views(self => ({
    isHidden(id){
        let count = (id.match(/_/g) || []).length;
        if(count >= 2)
            return true;
        else
            return false;
    },
    getComponentByTypeId(type, id) {
        return self[type + 's'].find(item => item.id === id);
    },
    getAllByTrack(trackId) {
        let p = getMembers(self).properties;
        let list = [];
        for (let key in p) {
            if (p.hasOwnProperty(key)) {
                self[key].filter(o => o.track.id === trackId).forEach(function (item) {
                    list.push(item);
                })
            }
        }
        return list;
    }
})).actions(self => ({
    add(type, args) {
        //this broke during package.json update...
        //self[type + 's'].push(args)

        switch (type) {
            case "filter":
                self[type + 's'].push(Filter.create(args));
                break;
            case "follower":
                self[type + 's'].push(Follower.create(args));
                break;
            case "meter":
                self[type + 's'].push(Meter.create(args));
                break;
            case "panvol":
                self[type + 's'].push(PanVol.create(args));
                break;
            case "split":
                self[type + 's'].push(Split.create(args));
                break;
            case "limiter":
                self[type + 's'].push(Limiter.create(args));
                break;
            case "solo":
                self[type + 's'].push(Solo.create(args));
                break;
            case "eq3":
                self[type + 's'].push(EQ3.create(args));
                break;
            case "compressor":
                self[type + 's'].push(Compressor.create(args));
                break;
            case "mono":
                self[type + 's'].push(Mono.create(args));
                break;
            case "gate":
                self[type + 's'].push(Gate.create(args));
                break;
            case "envelope":
                self[type + 's'].push(Envelope.create(args));
                break;
            case "amplitudeenvelope":
                self[type + 's'].push(AmplitudeEnvelope.create(args));
                break;
            case "frequencyenvelope":
                self[type + 's'].push(FrequencyEnvelope.create(args));
                break;
            case "lfo":
                self[type + 's'].push(LFO.create(args));
                break;
            case "feedbackcombfilter":
                self[type + 's'].push(FeedbackCombFilter.create(args));
                break;
            case "lowpasscombfilter":
                self[type + 's'].push(LowpassCombFilter.create(args));
                break;
            case "multibandcompressor":
                if(!args.low){
                    let defaultArgs = {...Tone.Compressor.defaults};
                    defaultArgs.id = 'compressor_' + randomId();
                    args.low = Compressor.create(defaultArgs);
                }
                if(!args.mid){
                    let defaultArgs = {...Tone.Compressor.defaults};
                    defaultArgs.id = 'compressor_' + randomId();
                    args.mid = Compressor.create(defaultArgs);
                }
                if(!args.high){
                    let defaultArgs = {...Tone.Compressor.defaults};
                    defaultArgs.id = 'compressor_' + randomId();
                    args.high = Compressor.create(defaultArgs);
                }
                self[type + 's'].push(MultibandCompressor.create(args));
                break;
            case "midsidecompressor":
                if(!args.mid){
                    let defaultArgs = {...Tone.Compressor.defaults};
                    defaultArgs.id = 'compressor_' + randomId();
                    args.mid = Compressor.create(defaultArgs);
                }
                if(!args.side){
                    let defaultArgs = {...Tone.Compressor.defaults};
                    defaultArgs.id = 'compressor_' + randomId();
                    args.side = Compressor.create(defaultArgs);
                }
                self[type + 's'].push(MidSideCompressor.create(args));
                break;
            case "multibandsplit":
                if(!args.low){
                    let defaultArgs = {...Tone.Filter.defaults};
                    defaultArgs.id = 'filter_' + randomId();
                    args.low = Filter.create(defaultArgs);
                }
                if(!args.mid){
                    let defaultArgs = {...Tone.Filter.defaults};
                    defaultArgs.id = 'filter_' + randomId();
                    args.mid = Filter.create(defaultArgs);
                }
                if(!args.high){
                    let defaultArgs = {...Tone.Filter.defaults};
                    defaultArgs.id = 'filter_' + randomId();
                    args.high = Filter.create(defaultArgs);
                }
                self[type + 's'].push(MultibandSplit.create(args));
                break;
            case "volume":
                self[type + 's'].push(Volume.create(args));
                break;
            case "panner":
                self[type + 's'].push(Panner.create(args));
                break;
            default:
                break;
        }
    },
    delete(type, id) {
        destroy(self.getComponentByTypeId(type, id));
    },
    addToneObj(name, objSelf) {
        ToneObjs.addAudioObj(name, objSelf, 'component');
    },
    delToneObj(id) {
        store.delConnectionsByObj(id);
        ToneObjs.delAudioObj(id, 'component');
    }
}))

const AMOscillator = types.model("AMOscillator", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    frequency: types.optional(types.union(types.number, types.string), 440), //both number and string
    type: types.optional(types.string, "sine"), //partials can also be used ex) "sine4"
    modulationType: types.optional(types.string, "square"), //partials can also be used ex) "sine4"
    detune: types.optional(types.number, 0),
    phase: types.optional(types.number, 0),
    harmonicity: types.optional(types.number, 1),
    volume: types.optional(types.number, 0),
    //partials: types.optional(types.array(types.number), []),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    //check if part of synth instrument and use the ToneObj
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'source', prop, val, signal, child);
    },
    afterCreate() {},
    afterAttach() {
        if (!self.ui && self.track !== undefined)
            self.ui = UIObj.create();

        if(self.track !== undefined){
            getParent(self, 2).addToneObj('AMOscillator', self);
        }
    },
    beforeDestroy() {
        if(self.track !== undefined)
            getParent(self, 2).delToneObj(self.id)
    }
}));

const FMOscillator = types.model("FMOscillator", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    frequency: types.optional(types.union(types.number, types.string), 440), //both number and string
    type: types.optional(types.string, "sine"), //partials can also be used ex) "sine4"
    modulationType: types.optional(types.string, "square"), //partials can also be used ex) "sine4"
    modulationIndex: types.optional(types.number, 2),
    detune: types.optional(types.number, 0),
    phase: types.optional(types.number, 0),
    harmonicity: types.optional(types.number, 1),
    volume: types.optional(types.number, 0),
    //partials: types.optional(types.array(types.number), []),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    //check if part of synth instrument and use the ToneObj
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'source', prop, val, signal, child);
    },
    afterCreate() {},
    afterAttach() {
        if (!self.ui && self.track !== undefined)
            self.ui = UIObj.create();

        if(self.track !== undefined){
            getParent(self, 2).addToneObj('FMOscillator', self);
        }
    },
    beforeDestroy() {
        if(self.track !== undefined)
            getParent(self, 2).delToneObj(self.id)
    }
}));

const FatOscillator = types.model("FatOscillator", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    type: types.optional(types.string, "sawtooth"), //partials can also be used ex) "sine4"
    frequency: types.optional(types.union(types.number, types.string), 440), //both number and string
    detune: types.optional(types.number, 0),
    phase: types.optional(types.number, 0),
    spread: types.optional(types.number, 20),
    count: types.optional(types.number, 3),
    volume: types.optional(types.number, 0),
    //partials: types.optional(types.array(types.number), []),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    //check if part of synth instrument and use the ToneObj
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'source', prop, val, signal, child);
    },
    afterCreate() {},
    afterAttach() {
        if (!self.ui && self.track !== undefined)
            self.ui = UIObj.create();

        if(self.track !== undefined){
            getParent(self, 2).addToneObj('FatOscillator', self);
        }
    },
    beforeDestroy() {
        if(self.track !== undefined)
            getParent(self, 2).delToneObj(self.id)
    }
}));


const Oscillator = types.model("Oscillator", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    type: types.optional(types.string, "sine"), //partials can also be used ex) "sine4"
    frequency: types.optional(types.union(types.number, types.string), 440), //TODO: types.custom for string and number since "C4" and 440 can be used
    detune: types.optional(types.number, 0),
    phase: types.optional(types.number, 0),
    volume: types.optional(types.number, 0),
    //partials: types.optional(types.array(types.number), []),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    //check if part of synth instrument and use the ToneObj
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'source', prop, val, signal, child);
    },
    afterCreate() {
  
    },
    afterAttach() {
        if (!self.ui && self.track !== undefined)
            self.ui = UIObj.create();

        if(self.track !== undefined){
            getParent(self, 2).addToneObj('Oscillator', self);
        }
    },
    beforeDestroy() {
        if(self.track !== undefined)
            getParent(self, 2).delToneObj(self.id)
    }
}));

/*
Tone.OmniOscillator aggregates Tone.Oscillator, Tone.PulseOscillator, Tone.PWMOscillator, Tone.FMOscillator, Tone.AMOscillator, and Tone.FatOscillator into one class. 
The oscillator class can be changed by setting the type. omniOsc.type = "pwm" will set it to the Tone.PWMOscillator. 
Prefixing any of the basic types (“sine”, “square4”, etc.) with “fm”, “am”, or “fat” will use the FMOscillator, AMOscillator or FatOscillator respectively. 
For example: omniOsc.type = "fatsawtooth" will create set the oscillator to a FatOscillator of type “sawtooth”.
*/
const OmniOscillator = types.model("OmniOscillator", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    type: types.optional(types.string, "sine"), //partials can also be used ex) "sine4"
    frequency: types.optional(types.union(types.number, types.string), 440), //both number and string
    detune: types.optional(types.number, 0),
    phase: types.optional(types.number, 0),
    volume: types.optional(types.number, 0),
    //harmonicity ?
    //partials: types.optional(types.array(types.number), []),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    //check if part of synth instrument and use the ToneObj
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'source', prop, val, signal, child);
    },
    afterCreate() {},
    afterAttach() {
        if (!self.ui && self.track !== undefined)
            self.ui = UIObj.create();
        
        if(self.track !== undefined){
            getParent(self, 2).addToneObj('OmniOscillator', self);
        }
    },
    beforeDestroy() {
        if(self.track !== undefined)
            getParent(self, 2).delToneObj(self.id)
    }
}));

const PWMOscillator = types.model("PWMOscillator", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    type: types.optional(types.string, "sine"), //partials can also be used ex) "sine4"
    frequency: types.optional(types.union(types.number, types.string), 440), //both number and string
    detune: types.optional(types.number, 0),
    phase: types.optional(types.number, 0),
    modulationFrequency: types.optional(types.union(types.number, types.string), 0.4), //both string and number (frequency)
    volume: types.optional(types.number, 0),
    //harmonicity //no harmonicity for PWM
    //partials: types.optional(types.array(types.number), []), //no partials for PWM

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    //check if part of synth instrument and use the ToneObj
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'source', prop, val, signal, child);
    },
    afterCreate() {},
    afterAttach() {
        if (!self.ui && self.track !== undefined)
            self.ui = UIObj.create();

        if(self.track !== undefined){
            getParent(self, 2).addToneObj('PWMOscillator', self);
        }
    },
    beforeDestroy() {
        if(self.track !== undefined)
            getParent(self, 2).delToneObj(self.id)
    }
}));


const PulseOscillator = types.model("PulseOscillator", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    type: types.optional(types.string, "sine"), //partials can also be used ex) "sine4"
    frequency: types.optional(types.union(types.number, types.string), 440), //both number and string
    detune: types.optional(types.number, 0),
    phase: types.optional(types.number, 0),
    width: types.optional(types.number, 0.2),
    volume: types.optional(types.number, 0),
    //partials: types.optional(types.array(types.number), []),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    //check if part of synth instrument and use the ToneObj
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'source', prop, val, signal, child);
    },
    afterCreate() {},
    afterAttach() {
        if (!self.ui && self.track !== undefined)
            self.ui = UIObj.create();

        if(self.track !== undefined){
            getParent(self, 2).addToneObj('PulseOscillator', self);
        }
    },
    beforeDestroy() {
        if(self.track !== undefined)
            getParent(self, 2).delToneObj(self.id)
    }
}));


const Noise = types.model("Noise", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    type: types.optional(types.string, "white"), //white pink brown
    playbackRate: types.optional(types.number, 1),
    volume: types.optional(types.number, 0),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    //check if part of synth instrument and use the ToneObj
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'source', prop, val, signal, child);
    },
    afterCreate() {
    },
    afterAttach() {
        if (!self.ui && self.track !== undefined)
            self.ui = UIObj.create();

        if(self.track !== undefined)
            getParent(self, 2).addToneObj('Noise', self);

    },
    beforeDestroy() {
        if(self.track !== undefined)
            getParent(self, 2).delToneObj(self.id)
    }
}));

/*
var motu = new Tone.UserMedia();
//opening the input asks the user to activate their mic
motu.open().then(function(){
	//promise resolves when input is available
});
*/
const UserMedia = types.model("UserMedia", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    type: types.optional(types.number, 0), 
    mute: types.optional(types.boolean, false),

    ui: types.maybe(UIObj)
}).views(self => ({

})).actions(self => ({
    //check if part of synth instrument and use the ToneObj
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'source', prop, val, signal, child);
    },
    afterCreate() {
        self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('UserMedia', self);

    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id)
    }
}));



const Sources = types.model("Sources", {
    amoscillators: types.maybe(types.array(AMOscillator)),
    fatoscillators: types.maybe(types.array(FatOscillator)),
    fmoscillators: types.maybe(types.array(FMOscillator)),
    oscillators: types.maybe(types.array(Oscillator)),
    omnioscillators: types.maybe(types.array(OmniOscillator)),
    pwmoscillators: types.maybe(types.array(PWMOscillator)),
    pulseoscillators: types.maybe(types.array(PulseOscillator)),
    noises: types.maybe(types.array(Noise)),
    usermedias: types.maybe(types.array(UserMedia))
}).views(self => ({
    getSourceByTypeId(type, id) {
        return self[type + 's'].find(item => item.id === id);
    },
    getAllByTrack(trackId) {
        let p = getMembers(self).properties;
        let list = [];
        for (let key in p) {
            if (p.hasOwnProperty(key)) {
                self[key].filter(o => o.track.id === trackId).forEach(function (item) {
                    list.push(item);
                })
            }
        }
        return list;
    }
})).actions(self => ({
    add(type, args) {
        //this broke during package.json update....
        //self[type + 's'].push(args);

        switch (type) {
            case "amoscillator":
                self[type + 's'].push(AMOscillator.create(args));
                break;
            case "fatoscillator":
                self[type + 's'].push(FatOscillator.create(args));
                break
            case "fmoscillator":
                self[type + 's'].push(FMOscillator.create(args));
                break
            case "oscillator":
                self[type + 's'].push(Oscillator.create(args));
                break;
            case "omnioscillator":
                self[type + 's'].push(OmniOscillator.create(args));
                break;
            case "pwmoscillator":
                self[type + 's'].push(PWMOscillator.create(args));
                break;
            case "pulseoscillator":
                self[type + 's'].push(PulseOscillator.create(args));
                break;
            case "noise":
                self[type + 's'].push(Noise.create(args));
                break;
            case "usermedia":
                self[type + 's'].push(UserMedia.create(args));
                break;
            default:
                break;
        }
    },
    delete(type, id) {
        destroy(self.getSourceByTypeId(type, id));
    },
    addToneObj(name, objSelf) {
       ToneObjs.addAudioObj(name, objSelf, 'source');
    },
    delToneObj(id) {
        store.delConnectionsByObj(id);
        ToneObjs.delAudioObj(id, 'source');
    }
}));


const Player = types.model("Player", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),
    sample: types.maybe(types.reference(Sample)),
    region: types.maybe(types.reference(Region)),

    url: types.maybe(types.string),
    //onload  : types.maybe(types.null) , //hm
    playbackRate: types.optional(types.number, 1),
    loop: types.optional(types.boolean, false),
    autostart: types.optional(types.boolean, false),
    loopStart: types.optional(types.number, 0),
    loopEnd: types.optional(types.number, 0),
    retrigger: types.optional(types.boolean, false),
    reverse: types.optional(types.boolean, false),
    fadeIn: types.optional(types.number, 0),
    fadeOut: types.optional(types.number, 0),
    volume: types.optional(types.number, 0),

    ui: types.maybe(UIObj),
    //automation: types.array(types.late(() => Automation))
}).actions(self => ({
    addAutomation(patternId, signal){
        self.automation.push({pattern: patternId, signal: signal})
    },
    setModelPlaybackRate(val){
        self.playbackRate = val;
    },
    setPropVal(prop, val, signal, child) {
        self[prop] = val;
        ToneObjs.setPropVal(self.id, 'instrument', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('Player', self);

        let player = ToneObjs.instruments.find(o => o.id === self.id).obj;

        if (self.region) {
            store.DBLoadAudioFile(self.region.id).then(result => {
                player.buffer.fromArray(result.data);
            });
        }
        else {
            store.DBLoadAudioFile(self.sample.id).then(result => {
                if(result){
                    if(result.data){
                        if (Array.isArray(result.data) || result.data instanceof Float32Array) {            
                            player.buffer.fromArray(result.data);
                        }
                        else{
                            let blobUrl = window.URL.createObjectURL(result.data);
                            player.load(blobUrl, function(){
                                window.URL.revokeObjectURL(blobUrl);
                            });
                        }
                    }
                  }
            });
        }
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));


const Synth = types.model("Synth", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    oscillator: OmniOscillator,
    envelope: AmplitudeEnvelope,
    portamento: types.optional(types.number, 0),
    volume: types.optional(types.number, 0),

    ui: types.maybe(UIObj)
}).actions(self => ({
    setPropVal(prop, val, signal, child) {
        if(child)
            self[child][prop] = val;
        else
            self[prop] = val;
        
        ToneObjs.setPropVal(self.id, 'instrument', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('Synth', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));


const MonoSynth = types.model("MonoSynth", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    //frequency: types.optional(types.union(types.number, types.string), 'C4'), //this should be custom type allowing numbers/strings (freq/note)
    detune: types.optional(types.number, 0),
    oscillator: OmniOscillator, //square default
    filter: Filter, //Q: 6 , type: lowpass ,rolloff: -24
    envelope: AmplitudeEnvelope, //attack: 0.005 , decay: 0.1 , sustain: 0.9 , release: 1
    filterEnvelope: FrequencyEnvelope, //attack: 0.06 ,decay: 0.2 ,sustain: 0.5 ,release: 2 ,baseFrequency: 200 ,octaves: 7 , exponent: 2
    portamento: types.optional(types.number, 0),
    volume: types.optional(types.number, -8), //... 0 is going to blow my eardrums

    ui: types.maybe(UIObj)
}).views(self => ({
    getParentId(){
        return getParent(self, 1).id;
    }
})).actions(self => ({
    setPropVal(prop, val, signal, child) {
        if(self.getParentId()){
            let parent = getParent(self, 1);
            if(parent.id.split('_')[0] === "duosynth"){
                let voice = "voice0";
                if(parent.voice1.id === self.id)
                    voice = "voice1";

                if(child)
                    self[child][prop] = val;
                else
                    self[prop] = val;

                ToneObjs.setPropVal(parent.id, 'instrument', prop, val, signal, child, voice);
            }
        }
        else{
            if(child)
                self[child][prop] = val;
            else
                self[prop] = val;

            ToneObjs.setPropVal(self.id, 'instrument', prop, val, signal, child);
        }
    },
    afterCreate() {

    },
    afterAttach() {
        if (!self.ui && self.track !== undefined)
            self.ui = UIObj.create();

        if(self.track !== undefined)
            getParent(self, 2).addToneObj('MonoSynth', self);
    },
    beforeDestroy() {
        if(self.track !== undefined)
            getParent(self, 2).delToneObj(self.id);
    }
}));

const AMSynth = types.model("AMSynth", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    harmonicity: types.optional(types.number, 3),
    detune: types.optional(types.number, 0),
    oscillator : OmniOscillator , //sine default
    envelope : AmplitudeEnvelope,
    modulation: OmniOscillator, //type:square
    modulationEnvelope : AmplitudeEnvelope,//({attack: 0.5 ,decay: 0 ,sustain: 1 ,release: 0.5}),
    portamento: types.optional(types.number, 0),
    volume: types.optional(types.number, 0),

    ui: types.maybe(UIObj)
}).actions(self => ({
    setPropVal(prop, val, signal, child) {
        if(child)
            self[child][prop] = val;
        else
            self[prop] = val;

        ToneObjs.setPropVal(self.id, 'instrument', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('AMSynth', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const FMSynth = types.model("FMSynth", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    harmonicity: types.optional(types.number, 3) ,
    modulationIndex: types.optional(types.number, 10) ,
    detune: types.optional(types.number, 0),
    oscillator: OmniOscillator , //sine default
    envelope: AmplitudeEnvelope,
    modulation: OmniOscillator, //set to square
    modulationEnvelope: AmplitudeEnvelope,//({attack: 0.5 ,decay: 0 ,sustain: 1 ,release: 0.5}),
    portamento: types.optional(types.number, 0),
    volume: types.optional(types.number, 0),

    ui: types.maybe(UIObj)
}).actions(self => ({
    setPropVal(prop, val, signal, child) {
        if(child)
            self[child][prop] = val;
        else
            self[prop] = val;

        ToneObjs.setPropVal(self.id, 'instrument', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('FMSynth', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const MetalSynth = types.model("MetalSynth", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    frequency: types.optional(types.union(types.number, types.string), 200),
    envelope: AmplitudeEnvelope, // {"attack" : 0.001, "decay" : 1.4, "release" : 0.2}
    harmonicity: types.optional(types.number, 5.1),
    modulationIndex: types.optional(types.number, 32),
    resonance: types.optional(types.number, 4000),
    octaves: types.optional(types.number, 1.5),
    volume: types.optional(types.number, 0),

    ui: types.maybe(UIObj)
}).actions(self => ({
    setPropVal(prop, val, signal, child) {
        if(child)
            self[child][prop] = val;
        else
            self[prop] = val;

        ToneObjs.setPropVal(self.id, 'instrument', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('MetalSynth', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const MembraneSynth = types.model("MembraneSynth", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    pitchDecay: types.optional(types.number, 0.05),
    octaves: types.optional(types.number, 10),
    oscillator: OmniOscillator,
    envelope: AmplitudeEnvelope,
    volume: types.optional(types.number, 0),

    ui: types.maybe(UIObj)
}).actions(self => ({
    setPropVal(prop, val, signal, child) {
        if(child)
            self[child][prop] = val;
        else
            self[prop] = val;
        
        ToneObjs.setPropVal(self.id, 'instrument', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('MembraneSynth', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const PluckSynth = types.model("PluckSynth", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    attackNoise: types.optional(types.number, 1),
	dampening: types.optional(types.union(types.number, types.string), 4000),
    resonance: types.optional(types.number, 0.7),
    volume: types.optional(types.number, 0),

    ui: types.maybe(UIObj)
}).actions(self => ({
    setPropVal(prop, val, signal, child) {
        if(child)
            self[child][prop] = val;
        else
            self[prop] = val;

        ToneObjs.setPropVal(self.id, 'instrument', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('PluckSynth', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const NoiseSynth = types.model("NoiseSynth", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    noise: Noise,
    envelope: AmplitudeEnvelope,
    volume: types.optional(types.number, 0),

    ui: types.maybe(UIObj)
}).actions(self => ({
    setPropVal(prop, val, signal, child) {
        if(child)
            self[child][prop] = val;
        else
            self[prop] = val;
        
        ToneObjs.setPropVal(self.id, 'instrument', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('NoiseSynth', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

//not currently being used
const PolySynth = types.model("PolySynth", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    polyphony: types.optional(types.number, 4),
    detune: types.optional(types.number, 0),
    voice: types.optional(types.string, "Synth"), //convert to obj Tone.Synth Tone["Synth"]
    volume: types.optional(types.number, 0),

    ui: types.maybe(UIObj)
}).actions(self => ({
    setPropVal(prop, val, signal, child) {},
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('PolySynth', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const DuoSynth = types.model("DuoSynth", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    vibratoAmount: types.optional(types.number, 0.5),
	vibratoRate: types.optional(types.union(types.number, types.string), 5),
    harmonicity: types.optional(types.number, 1.5),
    voice0: MonoSynth,
    voice1: MonoSynth,
    volume: types.optional(types.number, 0),
    
    ui: types.maybe(UIObj)
}).actions(self => ({
    setPropVal(prop, val, signal, child) {
        if(child)
            self[child][prop] = val;
        else
            self[prop] = val;

        ToneObjs.setPropVal(self.id, 'instrument', prop, val, signal, child);
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        getParent(self, 2).addToneObj('DuoSynth', self);
    },
    beforeDestroy() {
        getParent(self, 2).delToneObj(self.id);
    }
}));

const TinySynth = types.model("TinySynth", {
    id: types.identifier,
    track: types.maybe(types.reference(Track)),

    panvol: types.maybe(types.reference(PanVol)),

    channel: types.optional(types.number, 0), //0-15  9=drums
    instrument: types.optional(types.number, 0),
    
    ui: types.maybe(UIObj)
}).actions(self => ({
    setPropVal(prop, val, signal, child) {
        if(prop === "instrument"){
            self[prop] = val;
            ToneObjs.custom.find(o => o.id === self.id).obj.send([0xc0, val]);
        }
        else if(prop === "channel"){
            self[prop] = val;
        }
    },
    disconnectFromPanVol(){
        let tokens = self.id.split('_');
        let tsRow = ToneObjs.custom.find(o => o.id === self.id);
        let pvRow = ToneObjs.components.find(o => o.id === 'tinysynth_panvol_' + tokens[1]);
        if(tsRow && pvRow){
            if(tsRow.obj && pvRow.obj){
                //disconnect standard audionode from tone node
                Tone.disconnect(tsRow.obj.getConnectSourceNode(), pvRow.obj);
            }
        }
    },
    afterCreate() {
        if (!self.ui)
            self.ui = UIObj.create();
    },
    afterAttach() {
        let outId = 'tinysynth_panvol_' + self.id.split('_')[1];

        if(!self.panvol){
            store.components.add('panvol', {id: outId, track: self.track.id});
            self.panvol = outId;
        }

        let outObj = ToneObjs.components.find(c => c.id === outId).obj;

        if(!ToneObjs.custom.find(row => row.id === self.id)){
            ToneObjs.custom.push({id: self.id, track: self.track.id, obj: new window.WebAudioTinySynth({internalcontext:0, useReverb:0})})
            
            let tinySynth = ToneObjs.custom.find(t => t.id === self.id).obj;
            
            Tone.connect(tinySynth.setAudioContext(Tone.context), outObj);
            tinySynth.send([0xc0, self.instrument]);
        }
    },
    beforeDestroy() {
        self.disconnectFromPanVol();
        let toneRow = ToneObjs.custom.find(o => o.id === self.id);
        toneRow.obj.destroy();
        toneRow.obj = null;
        delete toneRow.obj;
        ToneObjs.custom = ToneObjs.custom.filter(o => o.id !== self.id);
    }
}));


const Instruments = types.model("Instruments", {
    players: types.maybe(types.array(Player)),
    amsynths: types.maybe(types.array(AMSynth)),
    fmsynths: types.maybe(types.array(FMSynth)),
    synths: types.maybe(types.array(Synth)),
    monosynths: types.maybe(types.array(MonoSynth)),
    metalsynths: types.maybe(types.array(MetalSynth)),
    membranesynths: types.maybe(types.array(MembraneSynth)),
    plucksynths: types.maybe(types.array(PluckSynth)),
    noisesynths: types.maybe(types.array(NoiseSynth)),
    polysynths: types.maybe(types.array(PolySynth)),
    duosynths: types.maybe(types.array(DuoSynth)),
    tinysynths: types.maybe(types.array(TinySynth))
}).views(self => ({
    getInstrumentByTypeId(type, id) {
        return self[type + 's'].find(item => item.id === id);
    },
    //audio track has 1 player
    getPlayerByTrack(trackId) {
        return self.players.find(p => p.track.id === trackId)
    },
    getAllByTrack(trackId) {
        let p = getMembers(self).properties;
        let list = [];
        for (let key in p) {
            if (p.hasOwnProperty(key)) {
                self[key].filter(o => o.track.id === trackId).forEach(function (item) {
                    list.push(item);
                })
            }
        }
        return list;
    }
})).actions(self => ({
    add(type, args) {
        //this broke during package.json update....
        //self[type + 's'].push(args);

        switch (type) {
            case "player":
                self[type + 's'].push(Player.create(args));
                break;
            case "synth":
                if(!args.oscillator){
                    let defaultArgs = {...Tone.Synth.defaults.oscillator};
                    defaultArgs.id = 'omnioscillator_' + randomId();
                    args.oscillator = OmniOscillator.create(defaultArgs);
                }
                if(!args.envelope){
                    let defaultArgs = {...Tone.Synth.defaults.envelope};
                    defaultArgs.id = 'amplitudeenvelope_' + randomId();
                    args.envelope = AmplitudeEnvelope.create(defaultArgs);
                }
                self[type + 's'].push(Synth.create(args));
                break;
            case "amsynth":
                if(!args.oscillator){
                    let defaultArgs = {...Tone.AMSynth.defaults.oscillator};
                    defaultArgs.id = 'omnioscillator_' + randomId();
                    args.oscillator = OmniOscillator.create(defaultArgs)
                }
                if(!args.envelope){
                    let defaultArgs = {...Tone.AMSynth.defaults.envelope};
                    defaultArgs.id = 'amplitudeenvelope_' + randomId();
                    args.envelope = AmplitudeEnvelope.create(defaultArgs);
                }
                if(!args.modulation){
                    let defaultArgs = {...Tone.AMSynth.defaults.modulation};
                    defaultArgs.id = 'omnioscillator_' + randomId();
                    args.modulation = OmniOscillator.create(defaultArgs);
                }
                if(!args.modulationEnvelope){
                    let defaultArgs = {...Tone.AMSynth.defaults.modulationEnvelope};
                    defaultArgs.id = 'amplitudeenvelope_' + randomId();
                    args.modulationEnvelope = AmplitudeEnvelope.create(defaultArgs);
                }
                self[type + 's'].push(AMSynth.create(args));
                break;
            case "fmsynth":
                if(!args.oscillator){
                    let defaultArgs = {...Tone.FMSynth.defaults.oscillator};
                    defaultArgs.id = 'omnioscillator_' + randomId();
                    args.oscillator = OmniOscillator.create(defaultArgs)
                }
                if(!args.envelope){
                    let defaultArgs = {...Tone.FMSynth.defaults.envelope};
                    defaultArgs.id = 'amplitudeenvelope_' + randomId();
                    args.envelope = AmplitudeEnvelope.create(defaultArgs);
                }
                if(!args.modulation){
                    let defaultArgs = {...Tone.FMSynth.defaults.modulation};
                    defaultArgs.id = 'omnioscillator_' + randomId();
                    args.modulation = OmniOscillator.create(defaultArgs);
                }
                if(!args.modulationEnvelope){
                    let defaultArgs = {...Tone.FMSynth.defaults.modulationEnvelope};
                    defaultArgs.id = 'amplitudeenvelope_' + randomId();
                    args.modulationEnvelope = AmplitudeEnvelope.create(defaultArgs);
                }
                self[type + 's'].push(FMSynth.create(args));
                break;
            case "monosynth":
                if(!args.oscillator){
                    let defaultArgs = {...Tone.MonoSynth.defaults.oscillator};
                    defaultArgs.id = 'omnioscillator_' + randomId();
                    args.oscillator = OmniOscillator.create(defaultArgs)
                }
                if(!args.filter){
                    let defaultArgs = {...Tone.MonoSynth.defaults.filter};
                    defaultArgs.id = 'filter_' + randomId();
                    args.filter = Filter.create(defaultArgs)
                }
                if(!args.envelope){
                    let defaultArgs = {...Tone.MonoSynth.defaults.envelope};
                    defaultArgs.id = 'amplitudeenvelope_' + randomId();
                    args.envelope = AmplitudeEnvelope.create(defaultArgs);
                }
                if(!args.filterEnvelope){
                    let defaultArgs = {...Tone.MonoSynth.defaults.filterEnvelope};
                    defaultArgs.id = 'frequencyenvelope_' + randomId();
                    args.filterEnvelope = FrequencyEnvelope.create(defaultArgs);
                }
                self[type + 's'].push(MonoSynth.create(args));
                break;
            case "metalsynth":
                if(!args.envelope){
                    let defaultArgs = {...Tone.MetalSynth.defaults.envelope};
                    defaultArgs.id = 'amplitudeenvelope_' + randomId();
                    args.envelope = AmplitudeEnvelope.create(defaultArgs)
                }
                self[type + 's'].push(MetalSynth.create(args));
                break;
            case "membranesynth":
                if(!args.oscillator){
                    let defaultArgs = {...Tone.MembraneSynth.defaults.oscillator};
                    defaultArgs.id = 'omnioscillator_' + randomId();
                    args.oscillator = OmniOscillator.create(defaultArgs)
                }
                if(!args.envelope){
                    let defaultArgs = {...Tone.MembraneSynth.defaults.envelope};
                    defaultArgs.id = 'amplitudeenvelope_' + randomId();
                    args.envelope = AmplitudeEnvelope.create(defaultArgs)
                }
                self[type + 's'].push(MembraneSynth.create(args));
                break;
            case "plucksynth":
                self[type + 's'].push(PluckSynth.create(args));
                break;
            case "noisesynth":
                if(!args.noise){
                    let defaultArgs = {...Tone.NoiseSynth.defaults.noise};
                    defaultArgs.id = 'noise_' + randomId();
                    args.noise = Noise.create(defaultArgs)
                }
                if(!args.envelope){
                    let defaultArgs = {...Tone.NoiseSynth.defaults.envelope};
                    defaultArgs.id = 'amplitudeenvelope_' + randomId();
                    args.envelope = AmplitudeEnvelope.create(defaultArgs)
                }
                self[type + 's'].push(NoiseSynth.create(args));
                break;
            case "polysynth":
                self[type + 's'].push(PolySynth.create(args));
                break;
            case "duosynth":
                if(!args.voice0){
                    let defaultArgs = cloneDeep(Tone.DuoSynth.defaults.voice0);
                    defaultArgs.id = 'monosynth_' + randomId();

                    defaultArgs.oscillator.id = 'omnioscillator_' + randomId();
                    defaultArgs.oscillator = OmniOscillator.create(defaultArgs.oscillator)

                    //no filter defined in duosynth defaults
                    if(!defaultArgs.filter)
                        defaultArgs.filter = {...Tone.MonoSynth.defaults.filter};

                    defaultArgs.filter.id = 'filter_' + randomId();
                    defaultArgs.filter = Filter.create(defaultArgs.filter)
                    
                    defaultArgs.envelope.id = 'amplitudeenvelope_' + randomId();
                    defaultArgs.envelope = AmplitudeEnvelope.create(defaultArgs.envelope);
                    
                    defaultArgs.filterEnvelope.id = 'frequencyenvelope_' + randomId();
                    defaultArgs.filterEnvelope = FrequencyEnvelope.create(defaultArgs.filterEnvelope);
                    
                    args.voice0 = MonoSynth.create(defaultArgs)
                }
                if(!args.voice1){
                    let defaultArgs = cloneDeep(Tone.DuoSynth.defaults.voice1);
                    defaultArgs.id = 'monosynth_' + randomId();

                    defaultArgs.oscillator.id = 'omnioscillator_' + randomId();
                    defaultArgs.oscillator = OmniOscillator.create(defaultArgs.oscillator)
                    
                    //no filter in defaults quick fix
                    if(!defaultArgs.filter)
                        defaultArgs.filter = {...Tone.MonoSynth.defaults.filter};
                    
                    defaultArgs.filter.id = 'filter_' + randomId();
                    defaultArgs.filter = Filter.create(defaultArgs.filter)
                    
                    defaultArgs.envelope.id = 'amplitudeenvelope_' + randomId();
                    defaultArgs.envelope = AmplitudeEnvelope.create(defaultArgs.envelope);
                    
                    defaultArgs.filterEnvelope.id = 'frequencyenvelope_' + randomId();
                    defaultArgs.filterEnvelope = FrequencyEnvelope.create(defaultArgs.filterEnvelope);

                    args.voice1 = MonoSynth.create(defaultArgs)
                }
                
                self[type + 's'].push(DuoSynth.create(args));
                break;
            case "tinysynth":
                self[type + 's'].push(TinySynth.create(args))
                break;
            default:
                break;
        }
    },
    delete(type, id){
        destroy(self.getInstrumentByTypeId(type, id));
    },
    addToneObj(name, objSelf){
       ToneObjs.addAudioObj(name, objSelf, 'instrument');
    },
    delToneObj(id){
        store.delConnectionsByObj(id);
        ToneObjs.delAudioObj(id, 'instrument');
    },
}));

const Scene = types.model("Scene", {
    id: types.identifier,
    start: types.string,
    end: types.string,
    muteGroups: types.array(types.string)
}).views(self => ({
    isGroupMuted(group){
        return self.muteGroups.find(g => g === group);
    },
    getLength(){
        return store.getSceneLength(self.id);
    }
})).actions(self => ({
    setStart(time) {
        self.start = time;
    },
    setEnd(time) {
        self.end = time;
    },
    setGroupMute(group, mute){
        if(self.muteGroups.find(g => g === group)){
            self.muteGroups = self.muteGroups.filter(g => g !== group)
        }
        else{
            self.muteGroups.push(group);
        }

        store.getPatternsBySceneGroup(self.id, group).forEach(p => {
            p.setMute(mute);
        })
    }
}));

const Note = types.model("Note", {
    id: types.identifier,
    time: types.string,
    mute: types.optional(types.boolean, false),
    note: types.maybe(types.union(types.array(types.number), types.array(types.string))), //freq and string..
    duration: types.maybe(types.union(types.number, types.string)), //audio tracks use % .. insts use quantized time for now
    velocity: types.optional(types.number, 1),
    probability: types.optional(types.number, 1),
    //playbackRate: types.maybe(types.number),
    //humanize: types.optional(types.union(types.boolean, types.string, types.number), false),
    offset: types.optional(types.number, 0), // % of quantized position
}).views(self => ({
    getPattern(){
        return getParent(self, 2);
    },
    getNote(){
        if(self.note !== undefined)
            return self.note.map(n => n)
        else
            return undefined
    }
})).actions(self => ({
    pasteNoteProps(srcNote){
        for(const prop in srcNote){
            if(prop !== 'id' && prop !== 'time'){
                if(prop === 'note')
                    self[prop] = srcNote.getNote();
                else
                    self[prop] = srcNote[prop];
            }
        }
        self.setPartNote();
    },
    setRandomNote(){
        const minOctave = 0, maxOctave = 7;
        const arrayNotes = Scale.notes(store.settings.key, store.settings.scale)

        const randOctave = Math.floor(Math.random() * (maxOctave - minOctave + 1) ) + minOctave;
        const randNote = arrayNotes[Math.floor(Math.random() * (arrayNotes.length - 0))];

        let noteVal = [randNote + randOctave];

        if(store.ui.selectedChord !== undefined)
            noteVal = Chord.notes(noteVal[0], store.ui.selectedChord);

        self.note = noteVal;
        self.setPartNote();
    },
    setNote(note){
        self.note = note;
        self.setPartNote();
    },
    setOffset(val){
        self.offset = val;
        self.setPartNote();
    },
    setVelocity(val){
        self.velocity = val;
        self.setPartNote();
    },
    setDuration(val){
        self.duration = val;
        self.setPartNote();
    },
    setProbability(val){
        self.probability = val;
        self.setPartNote();
    },
    setHumanize(val){
        self.humanize = val;
        self.setPartNote();
    },
    toggle() {
        self.mute = !self.mute;
        self.setPartNote();
    },
    setPartNote(){
        let part = ToneObjs.parts.find(p => p.id === getParent(self, 2).id);
        let event = part.obj.at(self.time, { "mute": self.mute, "note": self.getNote(), "duration": self.duration, "velocity": self.velocity, "offset": self.offset, "time": self.time});
        event.probability = self.probability;
        event.humanize = self.humanize;
    },
    afterAttach() {
        self.setPartNote();
    },
    /*
    beforeDetach() {
        console.log('note being DETACHED')
        let part = ToneObjs.parts.find(p => p.id === getParent(self, 2).id);
        //part.obj.remove(self.time, self.note);
        part.obj.remove(self.time);
    },
    */
    beforeDestroy() {
        let part = ToneObjs.parts.find(p => p.id === getParent(self, 2).id);
        //part.obj.remove(self.time, self.note);
        part.obj.remove(self.time);
    }
}));

const Pattern = types.model("Pattern", {
    id: types.identifier,
    resolution: types.optional(types.string, '16n'),
    track: types.reference(Track),
    scene: types.reference(Scene),
    notes: types.maybe(types.array(Note)),
    mute: types.optional(types.boolean, false)
}).views(self => ({
    getNote(time) {
        return self.notes.find(n => n.time === time);
    },
    getNotesByBar(bar){
        return self.notes.filter(n => Tone.Time(n.time) >= Tone.Time((bar - 1) + ':0:0') && Tone.Time(n.time) < Tone.Time(bar + ':0:0'))
    },
    getSortedNotesAsc() {
        let sceneNotes = [];
        self.notes.forEach(function (note) {
            if (Tone.Time(note.time) < Tone.Time(store.getSceneLength(self.scene.id)))
                sceneNotes.push(note);
        })

        return sceneNotes.sort(function (a, b) {
            return Tone.Time(a.time).toSeconds() - Tone.Time(b.time).toSeconds();
        });
    },
    getSortedNotesDesc() {
        let sceneNotes = [];
        self.notes.forEach(function (note) {
            if (Tone.Time(note.time) < Tone.Time(store.getSceneLength(self.scene.id)))
                sceneNotes.push(note);
        })

        return sceneNotes.sort(function (a, b) {
            return Tone.Time(b.time).toSeconds() - Tone.Time(a.time).toSeconds();
        });
    },
    getLength(){
        return store.getSceneLength(self.scene.id);
    }
})).actions(self => {
    function addNote(time, mute, val, dur, vel, prob, offset) {
        let values;

        if(val){
          values = val.map(n => n)
        }

        self.notes.push(Note.create({ id: 'note_' + randomId(), time: time, mute: mute, note: values, duration: dur, velocity: vel, probability: prob, offset: offset}));
    }
    function deleteNote(note){
        destroy(note);
    }
    function setResolution(val) {
        self.resolution = val;
    }
    function setMute(val) {
        self.mute = val;
        ToneObjs.parts.find(p => p.id === self.id).obj.mute = val;
    }
    function deleteNotes(){
        if(store.ui.selectedNote)
            store.ui.selectNote(undefined);
        
        self.getSortedNotesAsc().forEach(note => {
            destroy(note);
        })
    }
    function deleteNotesByBar(bar){
        if(store.ui.selectedNote)
            store.ui.selectNote(undefined);
        
        self.getNotesByBar(bar).forEach(n => self.deleteNote(n));
    }
    function pasteNotesToBar(notes, bar){
        bar -= 1;
        notes.forEach(n => {
            let newTime = bar + ':' + n.time.split(':')[1] + ':' + n.time.split(':')[2];
            self.addNote(newTime, n.mute, n.note, n.duration, n.velocity, n.probability, n.offset);
        })
    }
    function pastePattern(src){
        self.resolution = src.resolution;
        
        self.deleteNotes();
        
        //use snapshot instead?
        src.notes.forEach(function(note){
            self.notes.push(Note.create({
                    id: 'note_' + randomId(),
                    time: note.time,
                    mute: note.mute,
                    note: note.getNote(),
                    duration: note.duration,
                    velocity: note.velocity,
                    probability: note.probability,
                    humanize: note.humanize,
                    offset: note.offset
                })
            )
        })
    }
    function createRandomNotes(bar){
        let timeStart = '0:0:0', timeEnd = Tone.Time(self.getLength()).toBarsBeatsSixteenths();

        if(bar){
            timeStart = (bar - 1) + ':0:0';
            timeEnd = bar + ':0:0';
        }
        
        let startBar = parseInt(timeStart.split(':')[0], 10);
        let totalBars = parseInt(timeEnd.split(':')[0], 10) - startBar;
        let totalNotes = totalBars * self.resolution.slice(0, -1);

        let minOctave = 0, maxOctave = 7;
        let arrayNotes = Scale.notes(store.settings.key, store.settings.scale)

        for(let i=0; i<totalBars; i++){
            for(let k=0; k<totalNotes; k++){
                let noteTime = Tone.Time(Tone.Time((i + startBar) + ':0:0') + (Tone.Time((self.resolution)) * k)).toBarsBeatsSixteenths();

                let randOctave = Math.floor(Math.random() * (maxOctave - minOctave + 1) ) + minOctave;
                let randNote = arrayNotes[Math.floor(Math.random() * (arrayNotes.length - 0))];
                let noteVal = [randNote + randOctave];

                if(store.ui.selectedChord !== undefined)
                    noteVal = Chord.notes(noteVal[0], store.ui.selectedChord);

                self.addNote(noteTime, false, noteVal, self.resolution);
            }
        }
    }
    function initPart(offline) {
        let tObjs = ToneObjs;

        if(offline){
            tObjs = offline;
        }

        let part = tObjs.parts.find(p => p.id === self.id);
        
        //check this when scene time changes
        if(!offline){
            if(!part.player)
                part.player = new Tone.Player().connect(ToneObjs.components.find(c => c.id === self.track.getPanVol().id).obj);

            if(!part.playerPart)
                part.playerPart = new Tone.Part((time, note) => { part.player.start(time); });
            
            part.playerPart.start(self.scene.start).stop(self.scene.end);
            part.playerPart.mute = true;
            part.playerPart.at('0:0:0', 'C3')
        }
        
        part.obj = new Tone.Part(function (time, value) {

            //empty inst notes are ignored
            //audio notes are always undefined FYI
            if(value.note)
                if(value.note.length === 1) 
                    if(value.note[0] === '')
                        return;
            

            let offset = Tone.Time(self.resolution) * value.offset;

            //convert to freq for notes like F##3 that Tone doesn't support
            if(value.note){
                for(let i=0; i<value.note.length; i++){
                    if(isNaN(value.note[i])){
                        value.note[i] = TonalNote.freq(value.note[i]);
                    }
                }
            }

            //get prev note if duration exceeds current note's
            function checkPrevNoteDur(){
                let deltaDur, objNote;
                let result = self.getSortedNotesDesc().filter(n => Tone.Time(n.time) < Tone.Time(value.time)).some(note => {
                        if(note.note){
                            if(note.note[0]){
                                //no need for offset
                                let prevEndDur = Tone.Time(note.time) + Tone.Time(note.duration);
                                let currEndDur = Tone.Time(value.time) + Tone.Time(value.duration);
                                if(prevEndDur > currEndDur){ 
                                    deltaDur = Tone.Time(prevEndDur) - Tone.Time(currEndDur);
                                    objNote = note;
                                    return true;
                                }
                            }
                        }
                        return false;
                    })

                if(result)
                    return {note: objNote, deltaDur: deltaDur}
                else
                    return false;
            }

            tObjs.instruments.filter(inst => inst.track === part.track).forEach(function (instrument) {
                let type = instrument.id.split('_')[0];
                if (!value.mute){
                    if(type === 'player'){
                        instrument.obj.volume.value = value.velocity;
                        instrument.obj.stop(time + offset); //stop current play at next note
                        instrument.obj.start(time + offset);
                        if(value.duration < 1){
                            let computedDur = instrument.obj.buffer.duration / instrument.obj.playbackRate;
                            computedDur *= value.duration;
                            computedDur += offset;
                            instrument.obj.stop(time + computedDur)
                        }
                    }
                    else if(type === 'metalsynth'){
                        if(value.note !== undefined){
                            instrument.obj.frequency.setValueAtTime(value.note[0], time + offset, Math.random()*0.5 + 0.5);
                            instrument.obj.triggerAttackRelease(Tone.Time(value.duration), time + offset, value.velocity);
                            
                            let objContinue = checkPrevNoteDur();
                            if(objContinue){
                                instrument.obj.frequency.setValueAtTime(objContinue.note.getNote()[0], time + Tone.Time(value.duration), Math.random()*0.5 + 0.5);
                                instrument.obj.triggerAttackRelease(objContinue.deltaDur, time + Tone.Time(value.duration), objContinue.note.velocity);
                            }
                            
                        }
                    }
                    else if(type === "noisesynth"){
                        if(value.note !== undefined){
                            instrument.obj.triggerAttackRelease(Tone.Time(value.duration), time + offset, value.velocity);
                            
                            let objContinue = checkPrevNoteDur();
                            if(objContinue){
                                instrument.obj.triggerAttackRelease(objContinue.note.getNote()[0], objContinue.deltaDur, time + Tone.Time(value.duration), objContinue.note.velocity);
                            }
                            
                        }
                    }
                    else if(type === "synth" || type === "monosynth" || type === "amsynth" || type === "fmsynth" || type === "duosynth"){
                        if(value.note !== undefined){
                            //instrument.obj.releaseAll(time + offset);
                            instrument.obj.triggerAttackRelease(value.note, Tone.Time(value.duration), time + offset, value.velocity);
                            
                            let objContinue = checkPrevNoteDur();
                            if(objContinue){
                                instrument.obj.triggerAttackRelease(objContinue.note.getNote(), objContinue.deltaDur, time + Tone.Time(value.duration), objContinue.note.velocity);
                            }
                            
                        }
                    }
                    //TODO: deal with prev note duration continue as above?
                    else if(type === "plucksynth" || type === "membranesynth"){
                        if(value.note !== undefined){
                            instrument.obj.triggerAttackRelease(value.note[0], Tone.Time(value.duration), time + offset, value.velocity);
                        }
                    }
                }
            })

            tObjs.sources.filter(src => src.track === part.track).forEach(source => {
                let type = source.id.split('_')[0];
                if (!value.mute){
                    if(value.note !== undefined){
                        //prevent notes playing forever when toolsynth played simultanesouly
                        //source.obj.stop(time + offset);

                        if(type !== 'noise')
                            source.obj.frequency.setValueAtTime(value.note[0], time + offset);

                        let timeStop = time + Tone.Time(value.duration);

                        //if connected to amplitude envelope, stop note at end of longest envelope release
                        let connectionsEnv = store.getConnectionsByObjId(source.id).filter(c => c.dest.split('_')[0] === 'amplitudeenvelope')               
                        if(connectionsEnv.length > 0){
                            let envs = [];
                            connectionsEnv.forEach(c => envs.push(store.components.getComponentByTypeId('amplitudeenvelope', c.dest)));
                            timeStop += envs.sort((a, b) => b.release - a.release)[0].release;
                        }

                        source.obj.start(time + offset);
                        source.obj.stop(timeStop);
                    }
                }
            })

            tObjs.components.filter(src => src.track === part.track && src.id.split('_')[0] === 'amplitudeenvelope').forEach(function (component) {
                if (!value.mute){
                    if(value.note !== undefined){
                        component.obj.triggerAttackRelease(Tone.Time(value.duration), time + offset, value.velocity);
                        
                        let objContinue = checkPrevNoteDur();
                        if(objContinue){
                            component.obj.triggerAttackRelease(objContinue.note.getNote()[0], objContinue.deltaDur, time + Tone.Time(value.duration), objContinue.note.velocity);
                        }
                        
                    }
                }
            })

            tObjs.custom.filter(o => o.track === part.track).forEach(function(row){
                if(row.obj){
                    if(!value.mute){
                        if(!value.note !== undefined){
                            let ch = store.instruments.getInstrumentByTypeId("tinysynth", row.id).channel;

                            value.note.forEach(n => {
                                let noteNum = Tone.Frequency(n).toMidi();
                                
                                row.obj.send([0x90 + ch, noteNum, 100], time + offset)
                                row.obj.send([0x80 + ch, noteNum, 0], time + Tone.Time(value.duration));
                            })
                            
                            let objContinue = checkPrevNoteDur();
                            if(objContinue){
                                objContinue.note.getNote().forEach(n => {
                                    let noteNum = Tone.Frequency(n).toMidi();

                                    //stop prev note for curr note
                                    row.obj.send([0x80 + ch, noteNum, 0], time + offset);

                                    //continue prev note
                                    row.obj.send([0x90 + ch, noteNum, 100], time + Tone.Time(value.duration))
                                    row.obj.send([0x80 + ch, noteNum, 0], time + Tone.Time(value.duration) + objContinue.deltaDur);
                                })
                            }
                            
                        }
                    }
                }
            });

            //Grid button animations
            if(store.ui.viewMode === 'button' && store.getTrack(part.track).type === 'audio'){
                let divGridButton = document.getElementById('divGridButton_' + part.track);
                if(divGridButton){
                    let divProgress = divGridButton.querySelector('.divGridButtonProgress');

                    if(divProgress){
                        let player = tObjs.instruments.find(inst => inst.track === part.track).obj;
        
                        Tone.Draw.schedule(() => {
                            if(divGridButton && divProgress && player){
                                let duration = player.buffer.duration / player.playbackRate;

                                if(player.state === 'started'){
                                    divProgress.style.animation = 'none';
                                    window.requestAnimationFrame(time => {
                                        window.requestAnimationFrame(time => {
                                        divProgress.style.animation = 'progressWidth ' + duration + 's linear';
                                        });
                                    });
                                }
                                else{
                                    divProgress.style.animation = 'progressWidth ' + duration + 's linear';
                                }   
                            }
                        }, time)
                    }
                }
            }
        }).start(self.scene.start).stop(self.scene.end);

        part.obj.mute = self.mute;
    }
    function afterAttach() {
        if(!ToneObjs.parts.find(row => row.id === self.id)){
            ToneObjs.parts.push({
                id: self.id,
                track: self.track.id
            });

            self.initPart();
        }
    }
    function beforeDestroy() {
        ToneObjs.parts.find(p => p.id === self.id).obj.removeAll();
        ToneObjs.parts.find(p => p.id === self.id).obj.dispose();
        ToneObjs.parts.splice(ToneObjs.parts.findIndex(p => p.id === self.id), 1);

    }
    return { addNote, deleteNote, deleteNotesByBar, pasteNotesToBar, createRandomNotes, setResolution, setMute, pastePattern, deleteNotes, initPart, afterAttach, beforeDestroy }
});


const AutomationValue = types.model("AutomationValue", {
    time: types.union(types.string, types.number), // BarsBeatsSixteenths string
    value: types.union(types.string, types.number),
    //type: types.string, //add different types?  'linearRampToValueAtTime','setValueAtTime' etc.
}).views(self => ({
})).actions(self => ({
}));


const Automation = types.model("Automation", {
    pattern: types.reference(Pattern),
    signal: types.maybe(types.string),
    params: types.array(AutomationValue)
}).views(self => ({
    getParams(){
        return self.params.map(p => ({time: p.time, value: p.value}));
    }
})).actions(self => ({
    addParam(val, time){
        self.params.push({value: val, time: time })
    }
}));


/*******************************************
 
  UI STUFF

********************************************/

/****** Browser ******/

const ListBrowser = types.model("ListBrowser", {
    selectedDir: types.optional(types.string, '/'),
    selectedFile: types.maybe(types.string)
}).actions(self => ({
    selectDir(dir){
        self.selectedFile = undefined;
        self.selectedDir = dir;
    },
    selectFile(file){
        self.selectedFile = (self.selectedDir + '/').replace('//','/') + file;
    }
}))


/****** Main Views *****/

const UISequencerView = types.model("UISequencerView", {

}).views(self => ({

})).actions(self => ({

}))

const UIButtonView = types.model("UIButtonView", {

}).views(self => ({

})).actions(self => ({

}))

const UIEditView = types.model("UIEditView", {
    mode: types.optional(types.union(types.literal("graph"), types.literal("bar")), "bar"),
    selectedBars: types.array(types.number),
    copiedBars: types.array(types.number),
    copiedPattern: types.maybe(types.reference(Pattern)),
    multiNoteSelect: types.optional(types.boolean, false),
    selectedNotes: types.array(types.string),
    copiedNote: types.maybe(types.reference(Note))
}).views(self => ({
    isBarSelected(bar){
        return self.selectedBars.find(b => b === bar);
    },
    isBarCopied(bar){
        return self.copiedBars.find(b => b === bar);
    },
    get getNumSelectedBars(){
        return self.selectedBars.length;
    },
    get getNumCopiedBars(){
        return self.copiedBars.length;
    },
    getNumSelectedNotes(){
        return self.selectedNotes.length;
    }
})).actions(self => ({
    toggleMultiNoteSelect(){
        self.multiNoteSelect = !self.multiNoteSelect;
        
        if(!self.multiNoteSelect){
            self.delSelectedNotes();
        }
        else if(store.ui.selectedNote){
            store.ui.selectNote(undefined);
        }
    },
    toggleNote(noteId){
        if(self.selectedNotes.find(n => n === noteId))
            self.selectedNotes = self.selectedNotes.filter(n => n !== noteId);
        else
            self.selectedNotes.push(noteId);
    },
    delSelectedNotes(){
        self.selectedNotes = [];
        store.ui.selectNote(undefined);
        store.getNotesByTrack(store.ui.selectedTrack.id)
            .filter(n => n.note[0] === '').forEach(note => note.getPattern().deleteNote(note));
    },
    copySelectedNote(){
        self.copiedNote = store.getNotesByTrack(store.ui.selectedTrack.id).find(n => n.id === self.selectedNotes[0]).id;
        self.selectedNotes = [];
    },
    pasteCopiedNote(){
        self.selectedNotes.forEach(id => {
            const dstNote = store.getNotesByTrack(store.ui.selectedTrack.id).find(n => n.id === id);
            dstNote.pasteNoteProps(self.copiedNote);
        });

        self.selectedNotes = [];
    },
    clearSelectedNote(){
        self.selectedNote = undefined;
    },
    toggleMode() {
        if(self.mode === 'graph'){
            store.ui.setViewLength('1:0:0');
            self.mode = 'bar';
        }
        else{
            self.mode = 'graph';
        }
    },
    toggleBarSelect(bar){
        if(self.isBarSelected(bar))
            self.selectedBars = self.selectedBars.filter(b => b !== bar);
        else
            self.selectedBars.push(bar);
    },
    selectAllBars(){
        let totalBars = parseInt(Tone.Time(store.ui.selectedPattern.getLength()).toBarsBeatsSixteenths().split(':')[0], 10);
        self.selectedBars = [...Array(totalBars).keys()].map(x => x+1);
    },
    copySelectedBars(){
        self.copiedPattern = store.ui.selectedPattern;
        self.copiedBars = [...self.selectedBars];
        self.selectedBars = [];
    },
    pasteCopiedBars(){
        let firstSelectedBarNum = self.selectedBars.sort((a, b) =>  a - b)[0];
        let firstCopiedBarNum = self.copiedBars.sort((a, b) =>  a - b)[0];
        let diff = firstSelectedBarNum - firstCopiedBarNum;

        self.copiedBars.forEach(bar => {
            let destBar = bar + diff;
            let notes = self.copiedPattern.getNotesByBar(bar);
            
            store.ui.selectedPattern.deleteNotesByBar(destBar);
            store.ui.selectedPattern.pasteNotesToBar(notes, destBar)
        })
    },
    deleteSelectedBarNotes(){
        self.selectedBars.forEach(bar => store.ui.selectedPattern.deleteNotesByBar(bar));
    },
    clearSelectedBars(){
        self.selectedBars = [];
    },
    clearCopiedBars(){
        self.copiedBars = [];
    },
    randomizeSelectedBarNotes(){
        self.selectedBars.forEach(bar => {
            store.ui.selectedPattern.deleteNotesByBar(bar);
            store.ui.selectedPattern.createRandomNotes(bar);
        })
    },
    randomizeSelectedNotes(){
        self.selectedNotes.forEach(id => {
            store.getNotesByTrack(store.ui.selectedTrack.id).find(n => n.id === id).setRandomNote();
        })
    }
}))

const UIManagerView = types.model("UIEditView", {
    mode: types.optional(types.union(types.literal('scene'), types.literal('track')), 'scene'),
    copiedTrack: types.maybe(types.safeReference(Track)),
}).views(self => ({
    
})).actions(self => ({
    setMode(mode){
        self.mode = mode;
    },
    copyTrack(trackId){
        self.copiedTrack = store.getTrack(trackId);
    }
}))


const UIMainViews = types.model("UIMainViews", {
    sequencer: UISequencerView,
    button: UIButtonView,
    edit: UIEditView,
    manager: UIManagerView
}).views(self => ({

})).actions(self => ({

}))


/****** UI Toolbar *****/

const UIToolbarMain = types.model("UIToolbarMain", {
}).views(self => ({

})).actions(self => ({

}))

const UIToolbarBrowser = types.model("UIToolbarBrowser", {
    browser1: ListBrowser,
    browser2: ListBrowser,
    browser3: ListBrowser,
    action: types.maybe(types.string)
}).views(self => ({

})).actions(self => ({
    setAction(action){
        self.action = action + '_' + randomId();
    }
}))

const UIToolbarEdit= types.model("UIToolbarEdit", {
}).views(self => ({

})).actions(self => ({

}))

const UIToolbarSong = types.model("UIToolbarSong", {
}).views(self => ({

})).actions(self => ({

}))

const UIToolbarKeys = types.model("UIToolbarKeys", {
}).views(self => ({

})).actions(self => ({

}))

const UIToolbar = types.model("UIToolbar", {
    main: UIToolbarMain,
    browser: UIToolbarBrowser,
    edit: UIToolbarEdit,
    song: UIToolbarSong,
    keys: UIToolbarKeys
}).views(self => ({

})).actions(self => ({

}))


const UI = types.model("UI", {
    viewMode: types.optional(types.union(types.literal("sequencer"), types.literal("button"), types.literal("edit"), types.literal("manager")), "sequencer"),
    views: UIMainViews,
    toolbar: UIToolbar,
    mixMode: types.optional(types.boolean, false),
    editMode: types.optional(types.boolean, true),
    recordMode: types.optional(types.boolean, false),
    settings: types.optional(types.boolean, false),
    viewLength: types.optional(types.string, "1:0:0"),
    windowHeight: types.optional(types.number, 0),
    windowWidth: types.optional(types.number, 0),
    selectedToolbar: types.maybe(types.union(types.literal("home"), types.literal("browse"), types.literal("editor"), types.literal("song"), types.literal("synth"))),
    selectedScene: types.maybe(types.reference(Scene)),
    selectedTrack: types.maybe(types.reference(Track)),
    selectedPattern: types.maybe(types.reference(Pattern)),
    selectedObj: types.maybe(types.string),
    selectedGroup: types.optional(types.string, "A"),
    selectedNote: types.maybe(types.reference(Note)),
    selectedKey: types.optional(types.string, ''),
    selectedChord: types.maybe(types.string),
    device: types.maybe(types.union(types.literal("mobile"), types.literal("desktop"))),
    showSideBar: types.optional(types.boolean, false),
}).views(self => ({
    getSelectedPatternProp(prop, track){
        if(prop === "resolution"){
            if(track){
                if(track.type !== 'master')
                    return track.resolution;
            }
            else if(self.selectedPattern)
                return self.selectedPattern.resolution;
            
            return undefined;
        }
        else if(prop === "notes"){
            if(track){
                if(track.type !== 'master')
                    return store.getPatternByTrackScene(track.id, self.selectedScene.id).getSortedNotesAsc().length;
            }
            else if(self.selectedPattern)
                return self.selectedPattern.getSortedNotesAsc();
            
            return undefined;
        }
    },
    get getSelectedNoteVelocity(){
        return self.selectedNote ? self.selectedNote.velocity : undefined;
    },
    get getSelectedNoteValue(){
        if(self.selectedNote)
            return self.selectedNote.note ? self.selectedNote.note.map(n => n) : undefined;
        else
            return undefined;
    },
    get getSelectedNoteDuration(){
        if(self.selectedNote)
            return self.selectedNote.duration ? self.selectedNote.duration : undefined;
        else
            return undefined;
    },
    get getSelectedNoteOffset(){
        return self.selectedNote ? self.selectedNote.offset : undefined;
    },
    getGridSizes(){
        if(self.selectedScene){
            let windowWidth = self.windowWidth;
            let viewLength = Tone.Time(self.viewLength);
            let sceneLength = store.getSceneLength(self.selectedScene.id);

            //only show 1 bar for editview track bars
            if(store.ui.viewMode === 'edit' && store.ui.views.edit.mode === 'bar')
                sceneLength = Tone.Time(Tone.Time('1:0:0'));

            if(sceneLength > viewLength) {
                let scenePx = (sceneLength / viewLength) * windowWidth;

                let parentWidth = ((scenePx * 2) - windowWidth) + 'px';
                let parentLeft = ((scenePx * -1) + windowWidth) + 'px';

                let containerWidth = scenePx + 'px';
                let containerLeft = (scenePx - windowWidth) + 'px';
                
                return {parent: {width: parentWidth, left: parentLeft}, container:{width: containerWidth, left: containerLeft}}
            }
        }
        
        return {parent: {width: self.windowWidth + 'px', left: 0}, container:{width: self.windowWidth + 'px', left: 0}}
    },
    calibrateSizes(setupScroll, resetGridY) {
        if(self.selectedScene){
            if (self.viewMode === "sequencer" || self.viewMode === "button" || self.viewMode === "edit") {
                let windowWidth = self.windowWidth;
                let viewLength = self.viewLength;
                let sceneLength = store.getSceneLength(self.selectedScene.id);
                let gridParent = document.getElementById('gridParent');
                let gridContainer = document.getElementById('gridContainer');

                //only show 1 bar for edit view track
                if(store.ui.viewMode === 'edit' && store.ui.views.edit.mode === 'bar')
                    sceneLength = Tone.Time(Tone.Time('1:0:0'));

                if (Tone.Time(sceneLength).toSeconds() >= Tone.Time(viewLength).toSeconds()) {
                    let viewSecs = Tone.Time(viewLength).toSeconds();
                    let sceneSecs = Tone.Time(sceneLength).toSeconds();
                    let scenePx = windowWidth * (sceneSecs / viewSecs);

                    gridParent.style.width = ((scenePx * 2) - windowWidth) + 'px';
                    gridParent.style.left = ((scenePx * -1) + windowWidth) + 'px';

                    gridContainer.style.width = scenePx + 'px';
                    gridContainer.style.left = (scenePx - windowWidth) + 'px';
                }

                if(setupScroll && (self.viewMode === "sequencer" || (self.viewMode === "edit" && self.views.edit.mode === 'bar'))){
                    let gridContainerHeight = gridContainer.offsetHeight;

                    //162 = header + footer + toolbar + gridtimeline + toolrow icons
                    let top = 40, padding = 162;
                    if(self.viewMode === "edit" && self.views.edit.mode === 'bar'){
                        top = 80; //+ mixrow + gridtimeline
                        padding = 202; //+ mixrow
                        //allow one row to be visible when scrolled to top;
                        if(gridContainerHeight > (self.windowHeight - padding))
                            padding = self.windowHeight - 60;
                    }
                    
                    let diff = gridContainerHeight - (self.windowHeight - padding); 

                    if(self.viewMode === "edit" && self.views.edit.mode === 'bar'){
                        diff = gridContainerHeight - (self.windowHeight - padding); 
                    }
                    if(diff > 0){
                        let prevTop = parseInt(gridParent.style.top.replace('px',''), 10);
                        let newTop = top - diff;

                        gridParent.style.top =  newTop + 'px';
                        gridParent.style.height = (gridContainerHeight + diff) + 'px';

                        let topDiff = 0;
                        if(newTop !== prevTop)
                            topDiff = prevTop - newTop;
                
                        let gridX = parseInt(gridContainer.getAttribute('data-x'), 10);
                        let gridY = parseInt(gridContainer.getAttribute('data-y'), 10);

                        //reset grid Y showing first bar
                        if(resetGridY)
                            gridY = (newTop * -1) + 80;
                        //adjust when bars added / deleted
                        else if(newTop < prevTop)
                            gridY = gridY + topDiff;
                        else
                            gridY = gridY - topDiff

                        gridContainer.setAttribute('data-y', gridY);
                        gridContainer.style.transform = 'translate(' + gridX + 'px,' + gridY + 'px)';
                    } else {
                        gridParent.style.top = top + 'px';
                        gridParent.style.height = gridContainerHeight + 'px';
                        gridContainer.setAttribute('data-y', 0);
                    }
                }

                //align grid in case gap created on size change
                let left = parseFloat(gridContainer.style.left.replace('px', ''));
                let gridX = parseFloat(gridContainer.getAttribute('data-x'));
                let gridY = parseFloat(gridContainer.getAttribute('data-y'));
                //right gap
                if (left < (gridX * -1)) {
                    let newX = left * -1;
                    gridContainer.setAttribute('data-x', newX);
                    gridContainer.style.webkitTransform = gridContainer.style.transform = 'translate(' + newX + 'px, ' + gridY + 'px)';
                }
                //left gap
                if(gridX > 0){
                    gridContainer.setAttribute('data-x', 0);
                    gridContainer.style.webkitTransform = gridContainer.style.transform = 'translate(' + 0 + 'px, ' + gridY + 'px)';
                }

                interact('#gridContainer').fire({ type: 'dragmove', target: gridContainer });
            }
        }
    },
    getWindowSizes() {
        return { width: self.windowWidth, height: self.windowHeight }
    }
})).actions(self => {
    function selectToolbar(selection){
        self.selectedToolbar = selection;
    }
    function setWindowWidthHeight(width, height) {
        self.windowHeight = height;

        if(width >= 960){
            if(!self.showSideBar)
                self.showSideBar = true;
            
            self.windowWidth = width * 0.8;
        }
        else{
            if(self.showSideBar)
                self.showSideBar = false;
            
            self.windowWidth = width;
        }
    }
    function toggleMixMode() {
        self.mixMode = !self.mixMode;
    }
    function toggleEditMode() {
        self.editMode = !self.editMode;

        if(self.viewMode === 'edit' && self.views.edit.mode === 'bar'){
            if(!self.editMode){
                self.views.edit.clearSelectedBars();

                if(self.views.edit.multiNoteSelect)
                    self.views.edit.delSelectedNotes();
            }
            else
                self.views.edit.delSelectedNotes();
        }
    }
    function toggleRecordMode() {
        self.recordMode = !self.recordMode;

        ToneObjs.metronome.mute = !self.recordMode;
    }
    function toggleSettings(bChangeView) {
        if(bChangeView)
            self.toggleViewMode('manager');
        
        self.settings = !self.settings;
    }
    function setViewLength(val) {
        if(self.selectedScene){
            if(self.viewMode === 'edit' && self.views.edit.mode === 'bar'){
                if(Tone.Time(val) >= Tone.Time('0:1:0') && Tone.Time(val) <= Tone.Time('1:0:0')){
                    self.viewLength = val;
                    self.calibrateSizes();
                }
            }
            else if(Tone.Time(val) <= store.getSceneLength(self.selectedScene.id) && Tone.Time(val) >= Tone.Time("0:1:0")){
                self.viewLength = val;
                self.calibrateSizes();
            }
        }
    }
    function setViewScene(scene) {
        if(scene.id !== self.selectedScene.id){
            self.setViewLength(Tone.Time(store.getSceneLength(scene.id)).toBarsBeatsSixteenths());
        }
    }
    function selectScene(id) {
        self.selectedScene = store.getScene(id);
        if (self.selectedScene)
            self.setViewScene(self.selectedScene)
    }
    function selectTrack(id) {
        if(!id){
            if(store.ui.viewMode === "edit")
                store.ui.toggleViewMode('sequencer');

            self.selectedTrack = undefined;
        }
        else{
            let selTrack = store.getTrack(id);
            
            //testing track render
            if(store.settings.partRender && self.selectedTrack && self.selectedScene){
                if(self.selectedTrack.id !== id && self.selectedTrack.type !== 'master'){
                    //render previous 
                    renderSong(self.selectedTrack, store.getPatternByTrackScene(self.selectedTrack.id, self.selectedScene.id)).then(() => {
                        //console.log('rendersong pattern complete')
                        //toggle new selected track
                        if(selTrack){
                            if(selTrack.type !== 'master'){
                                let row = ToneObjs.parts.find(row => row.id === store.getPatternByTrackScene(selTrack.id, self.selectedScene.id).id);
                                row.player.stop();
                                row.playerPart.mute = true;
                                row.obj.mute = false;
                            }
                        }
                    });  
                }
            }

            self.selectedPattern = store.getPatternByTrackScene(selTrack.id, store.ui.selectedScene.id);
            self.selectedTrack = selTrack;
        }
    }
    function selectPattern(id) {
        if(id){
            let pattern = store.getPattern(id);
            self.selectScene(pattern.scene.id)
            self.selectedPattern = pattern;
        }
        else{
            self.selectedPattern = undefined;
        }
    }
    function selectObj(id) {
        self.selectedObj = id;
    }
    function selectGroup(group) {
        if(group === 'M' && !self.mixMode)
            self.mixMode = true;
        
        self.selectedGroup = group;
    }
    function selectNote(note){
        let prevNote = self.selectedNote;

        self.selectedNote = note;
        if(note)
            self.selectedTrack = note.getPattern().track;

        if(prevNote && !self.views.edit.multiNoteSelect){
            if(self.selectedNote !== prevNote){
                if(prevNote.getPattern().track.type === 'instrument'){
                    let noteVals = prevNote.getNote();
                    if(noteVals){
                        if(noteVals[0] === ''){
                            let pattern = prevNote.getPattern();
                            pattern.deleteNote(prevNote);
                        }
                    }
                }
            }
        }
    }
    function selectKey(key){
        self.selectedKey = key;
    }
    function selectChord(chord){
        self.selectedChord = chord;
    }
    function toggleViewMode(mode) {
        if (!mode) {
            let nextMode = document.getElementById('iViewMode').innerHTML === 'reorder' ? 'sequencer' : 'button';
            
            if (nextMode === 'button'){
                if(self.selectedNote && self.selectedTrack){
                    if(self.selectedNote.getPattern().track !== self.selectedTrack){
                        self.selectNote(undefined);
                    }
                }
                
                if(self.editMode)
                    self.editMode = false;

                if(self.selectedGroup === 'M')
                    self.selectedGroup = 'A';

                if(self.selectedTrack && self.selectedScene)
                    self.selectedPattern = store.getPatternByTrackScene(self.selectedTrack.id, self.selectedScene.id);
                
                self.viewMode = "button";
            }
            else{
                if(self.mixMode && self.selectedGroup !== 'M')
                    self.mixMode = false;
                
                self.viewMode = "sequencer";
            }
        }
        else if (mode === "edit") {
            if(self.selectedNote && self.selectedTrack){
                if(self.selectedNote.getPattern().track !== self.selectedTrack){
                    self.selectNote(undefined);
                }
            }
            if(self.selectedTrack.type !== 'master'){
                self.selectPattern(store.getPatternByTrackScene(self.selectedTrack.id, self.selectedScene.id).id)
                
                if(Tone.Time(self.viewLength) > Tone.Time('1:0:0'))
                    self.setViewLength('1:0:0');
            }
            else{
                if(self.views.edit.mode !== 'graph')
                    self.views.edit.toggleMode('graph')
            }
            
            self.viewMode = "edit";
        }
        else if (mode === "sequencer") {
            self.viewMode = "sequencer";
        }
        else if (mode === "button") {
            self.viewMode = "button";
        }
        else if (mode === "manager") {
            self.viewMode = "manager";
        }

        if(self.viewMode === 'button' || self.viewMode === 'sequencer' || (self.viewMode === 'edit' && self.views.edit.mode === 'graph')){
            if(Tone.Time(self.viewLength) > Tone.Time(self.selectedScene.getLength()))
                self.viewLength = Tone.Time(self.selectedScene.getLength()).toBarsBeatsSixteenths();
        }
    }
    function setDevice() {
        //take a look at matchMedia if needed
        let device = 'desktop';
        if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )
          device = 'mobile';
    
        self.device = device;
    }
    return { selectToolbar, setWindowWidthHeight, toggleMixMode, setViewLength, setViewScene, toggleSettings, selectScene, selectTrack, selectPattern, selectObj, selectGroup, selectNote, selectKey, selectChord, toggleViewMode, toggleEditMode, toggleRecordMode, setDevice }
});

const Settings = types.model("Settings", {
    title: types.maybe(types.string),
    modified: types.maybe(types.Date),
    bpm: types.optional(types.number, 90),
    swing: types.optional(types.number, 0),
    swingSubdivision: types.optional(types.string, "8n"),
    loopStart: types.optional(types.string, "0:0:0"),
    loopEnd: types.optional(types.string, "1:0:0"),
    scale: types.optional(types.string, "major"),
    key: types.optional(types.string, "C"),
    partRender: types.optional(types.boolean, true)
}).actions(self => ({
    setScale(scale){
        self.scale = scale;
    },
    setKey(key){
        self.key = key;
    },
    setSongTitle(id){
        self.title = id;
    },
    setModified(time){
        self.modified = time;
    },
    setBPM(val) {
        self.bpm = val;
        Tone.Transport.bpm.value = parseFloat(val);
    },
    setSwing(val) {
        self.swing = val;
        Tone.Transport.swing = parseFloat(val);
    },
    setSwingSubdivision(val) {
        self.swingSubdivision = val;
        Tone.Transport.swingSubdivision = val;
    },
    setLoopStart(val) {
        self.loopStart = val;
        Tone.Transport.loopStart = Tone.Time(val);
    },
    setLoopEnd(val) {
        self.loopEnd = val;
        Tone.Transport.loopEnd = Tone.Time(val);
    }
}))

export const RootStore = types.model("RootStore", {
    id: types.maybe(types.string),

    settings: Settings,

    tracks: types.maybe(types.array(Track)),
    patterns: types.maybe(types.array(Pattern)),
    scenes: types.maybe(types.array(Scene)),
    samples: types.maybe(types.array(Sample)),

    ui: UI,

    sources: types.maybe(Sources),
    instruments: types.maybe(Instruments),
    effects: types.maybe(Effects),
    components: types.maybe(Components),
    connections: types.maybe(types.array(Connection)),
})
    .views(self => {
        return {
            getObjsByTrackObj(track) {
                let list = [];
                if (track) {
                    list = list.concat(self.instruments.getAllByTrack(track.id));
                    list = list.concat(self.effects.getAllByTrack(track.id));
                    list = list.concat(self.components.getAllByTrack(track.id));
                    list = list.concat(self.sources.getAllByTrack(track.id));
                }
                return list;
            },
            getObjTypeByIdTrack(id, track) {
                if (self.instruments.getAllByTrack(track).find(o => o.id === id))
                    return "instrument";
                else if (self.effects.getAllByTrack(track).find(o => o.id === id))
                    return "effect";
                else if (self.components.getAllByTrack(track).find(o => o.id === id))
                    return "component";
                else if(self.sources.getAllByTrack(track).find(o => o.id === id))
                    return "source";
                else
                    return null;
            },
            getTrack(trackId) {
                return self.tracks.find(t => t.id === trackId);
            },
            getTrackBySampleRegion(sampleId, regionId) {
                //return self.tracks.filter(t => t.type !== "master" && t.type === "audio").find(t => (t.sample.id === sampleId && t.region.id === regionId))
                return self.tracks.filter(t => t.type !== "master" && t.type === "audio" && t.sample.id === sampleId && t.region).find(t => t.region.id === regionId);
            },
            getTracksByGroup(group){
                if(group === 'M')
                    return self.tracks.filter(t => t.type === 'master');
                else
                    return self.tracks.filter(t => t.group === group && t.type !== 'master').sort((a, b) => { return a.groupIndex - b.groupIndex });;
            },
            getScene(sceneId) {
                return self.scenes.find(s => s.id === sceneId);
            },
            getSceneByTime(time) {
                let t = Tone.Time(time);
                return self.scenes.find(s => (t >= Tone.Time(s.start) && t < Tone.Time(s.end)))
            },
            getScenesAsc() {
                return self.scenes.sort(function (a, b) {
                    return Tone.Time(a.start) - Tone.Time(b.start);
                });
            },
            getScenesDesc() {
                return self.scenes.sort(function (a, b) {
                    return Tone.Time(b.start) - Tone.Time(a.start);
                });
            },
            getPrevScene(sceneId) {
                let s = self.getScene(sceneId);
                let sceneList = self.getScenesDesc();

                if (sceneList.length > 1) {
                    for (let i = 0; i < sceneList.length; i++) {
                        if (sceneList[i] === s && i !== sceneList.length) {
                            return sceneList[i + 1];
                        }
                    }
                }
            },
            getNextScene(sceneId) {
                let s = self.getScene(sceneId);
                let sceneList = self.getScenesAsc();

                if (sceneList.length > 1) {
                    for (let i = 0; i < sceneList.length; i++) {
                        if (sceneList[i] === s && i !== sceneList.length) {
                            return sceneList[i + 1];
                        }
                    }
                }
            },
            getPattern(patternId) {
                return self.patterns.find(p => p.id === patternId)
            },
            getAllPatterns(){
                return self.patterns;
            },
            getAllSamples(){
                return self.samples;
            },
            get getNumTracks(){
                let total = 0;
                ['A','B','C','D'].forEach(g => {
                    total += store.getTracksByGroup(g).filter(t => t.type !== 'master').length;
                });
                return total;
            },
            get numSamples(){
                return self.getAllSamples().length;
            },
            getAllRegions(){
                let list = [];
                self.getAllSamples().forEach(s => { list.push(...s.regions) });
                return list;
            },
            get numRegions(){
                return self.getAllRegions().length;
            },
            getSample(sampleId) {
                return self.samples.find(s => s.id === sampleId);
            },
            getSampleByUrlLength(url, length) {
                return self.samples.find(s => (s.url === url && s.length === length));
            },
            getConnection(connId) {
                return self.connections.find(c => c.id === connId);
            },
            getConnectionsByObjId(id) {
                return self.connections.filter(c => (c.src === id || c.dest === id));
            },
            getConnectionsByTrack(trackId) {
                return self.connections.filter(c => c.track.id === trackId)
            },
            getPatternsByTrack(trackId) {
                return self.patterns.filter(p => p.track.id === trackId)
            },
            getPatternsByScene(sceneId) {
                return self.patterns.filter(p => p.scene.id === sceneId)
            },
            getPatternByTrackScene(trackId, sceneId) {
                return self.patterns.find(p => (p.track.id === trackId && p.scene.id === sceneId));
            },
            getPatternsBySceneGroup(sceneId, group) {
                return self.patterns.filter(p => (p.track.group === group && p.scene.id === sceneId));
            },
            getNotesByTrack(trackId) {
                let notes = [];
                self.getPatternsByTrack(trackId).forEach(function (pattern) {
                    notes = notes.concat(pattern.getSortedNotesAsc())
                })
                return notes;
            },
            getSceneLength(sceneId) {
                let scene = self.getScene(sceneId);
                return Tone.Time(scene.end) - Tone.Time(scene.start)
            },
            getSongLength() {
                let length = 0;
                self.scenes.forEach(function (scene) {
                    length = Tone.Time(length) + Tone.Time(self.getSceneLength(scene.id));
                });
                return length;
            },
            getLoopLength() {
                return Tone.Time(self.settings.loopEnd) - Tone.Time(self.settings.loopStart);
            },
            refreshConnections(){
                self.connections.forEach(function(c){
                    //console.log(c.id + ' track: ' + c.track.id + ' group: ' + c.track.group)
                })
                //return self.connections;
            }
        };
    })
    .actions(self => {
        //setUndoManager(self);

        function addScene(sceneId, start, end) {
            self.scenes.push(Scene.create({ id: sceneId, start: start, end: end, on: true }))
            self.tracks.forEach(function (track) {
                if(track.type !== "master"){
                    self.addPattern('pattern_' + randomId(), '16n', track.id, sceneId, [])
                }
            });
            //TODO: scene gets added to end of song currently, need to shift scene times if middle of track
        }
        function delScene(sceneId) {
            //always 1 scene
            if(self.scenes.length > 1){
                let scene = self.getScene(sceneId);
                self.getPatternsByScene(sceneId).forEach(pattern => self.delPattern(pattern.id));

                let nextScene = self.getNextScene(scene.id);
                let prevScene = self.getPrevScene(scene.id);

                //last scene
                if (!nextScene){
                    if(Tone.Time(self.settings.loopStart) >= Tone.Time(scene.start)){
                        self.settings.setLoopStart(prevScene.start);
                    }
                    if(Tone.Time(self.settings.loopEnd) > Tone.Time(scene.start)){
                        self.settings.setLoopEnd(prevScene.end);
                    }

                    self.ui.selectScene(prevScene.id);
                }
                else{
                    //shift scene times back
                    self.shiftSceneTimes(scene.end, self.getSceneLength(scene.id), "sub");

                    self.ui.selectScene(nextScene.id);
                }

                destroy(scene);
            }
        }
        function shiftSceneTimes(time, length, op) {
            let sceneList = self.getScenesAsc().filter(s => Tone.Time(s.end) >= Tone.Time(time));
            sceneList.forEach(function (scene) {
                if (op === "sub") {
                    if (scene !== sceneList[0])
                        scene.setStart(Tone.Time(Tone.Time(scene.start) - Tone.Time(length)).toBarsBeatsSixteenths());

                    scene.setEnd(Tone.Time(Tone.Time(scene.end) - Tone.Time(length)).toBarsBeatsSixteenths());
                }
                if (op === "add") {
                    if (scene !== sceneList[0])
                        scene.setStart(Tone.Time(Tone.Time(scene.start) + Tone.Time(length)).toBarsBeatsSixteenths());

                    scene.setEnd(Tone.Time(Tone.Time(scene.end) + Tone.Time(length)).toBarsBeatsSixteenths());
                }

                store.getPatternsByScene(scene.id).forEach(function (pattern) {
                    let part = ToneObjs.parts.find(p => p.id === pattern.id).obj;
                    part.dispose();

                    pattern.initPart();

                    pattern.getSortedNotesAsc().forEach(function (note) {
                        note.setPartNote();
                    })
                })
            })

            //update loopstart/end
            if(Tone.Time(self.settings.loopEnd) >= Tone.Time(time)){
                if(op === 'add')
                    store.settings.setLoopEnd(Tone.Time(Tone.Time(self.settings.loopEnd) + Tone.Time(length)).toBarsBeatsSixteenths());
                else if(op === 'sub')
                    store.settings.setLoopEnd(Tone.Time(Tone.Time(self.settings.loopEnd) - Tone.Time(length)).toBarsBeatsSixteenths());
            }
            if(Tone.Time(self.settings.loopStart) >= Tone.Time(time)){
                if(op === 'add')
                    store.settings.setLoopStart(Tone.Time(Tone.Time(self.settings.loopStart) + Tone.Time(length)).toBarsBeatsSixteenths());
                else if(op === 'sub')
                    store.settings.setLoopStart(Tone.Time(Tone.Time(self.settings.loopStart) - Tone.Time(length)).toBarsBeatsSixteenths());
            }
        }
        function swapScenes(sId1, sId2) {
            let s1 = self.getScene(sId1);
            let s2 = self.getScene(sId2);
            let start1 = s1.start;
            let length2 = self.getSceneLength(s2.id);

            s1.setStart(Tone.Time(Tone.Time(s2.end) - Tone.Time(self.getSceneLength(s1.id))).toBarsBeatsSixteenths());
            s1.setEnd(s2.end);
            s2.setStart(start1);
            s2.setEnd(Tone.Time(Tone.Time(start1) + Tone.Time(length2)).toBarsBeatsSixteenths());

            [s1, s2].forEach(function (scene) {
                self.getPatternsByScene(scene.id).forEach(function (pattern) {
                    let part = ToneObjs.parts.find(p => p.id === pattern.id).obj;
                    part.dispose();

                    pattern.initPart();

                    pattern.getSortedNotesAsc().forEach(function (note) {
                        note.setPartNote();
                    })
                });
            });
        }
        function duplicateScene(sceneId) {
            //add to end of song
            let start = Tone.Time(self.getSongLength()).toBarsBeatsSixteenths();
            let end = Tone.Time(Tone.Time(start) + Tone.Time(self.getSceneLength(sceneId))).toBarsBeatsSixteenths();

            let newId = 'scene_' + randomId();
            self.addScene(newId, start, end);

            self.getPatternsByScene(sceneId).forEach(function (pattern) {
                let newPattern = self.getPatternByTrackScene(pattern.track.id, newId);

                pattern.getSortedNotesAsc().forEach(function (note) {
                    newPattern.addNote(note.time, note.mute, note.note, note.duration);
                })
            })

            self.ui.selectScene(newId);
        }
        function addPattern(id, resolution, track, scene, notes) {
            self.patterns.push(Pattern.create({ id: id, resolution: resolution, track: track, scene: scene, notes: notes }));
        }
        function delPattern(patternId) {
            if(self.ui.selectedNote){
                if(self.ui.selectedNote.getPattern().id === patternId)
                    self.ui.selectNote(undefined);
            }

            destroy(self.getPattern(patternId));
        }
        function addMasterTracks() {
            ['master', 'A', 'B', 'C', 'D'].forEach(function (group) {
                const idTrack = 'track_' + group;

                if (group === 'master')
                    self.tracks.push(Track.create({ id: idTrack, type: 'master', mute: false, solo: false, sample: undefined, region: undefined, group: 'M', mixRow: MixRow.create({}) }));
                else
                    self.tracks.push(Track.create({ id: idTrack, type: 'master', mute: false, solo: false, sample: undefined, region: undefined, group: group, mixRow: MixRow.create({}) }));

                const idPanvol = 'panvol_' + group;
                store.components.add("panvol", { id: idPanvol, track: idTrack });

                const idPanvolOut = 'panvol_' + group + '_out';
                store.components.add("panvol", { id: idPanvolOut, track: idTrack });

                //add connections
                if (group === "master") {
                    //panvol_master -> panvol_master_out -> master
                    store.addConnection('connection_' + randomId(), idTrack, idPanvol, idPanvolOut, "component", "component");
                    store.addConnection('connection_' + randomId(), idTrack, idPanvolOut, "master", "component", "master");
                }
                else {
                    const idSolo = "mix_solo_" + group;
                    store.components.add("solo", { id: idSolo, track: idTrack });

                    //solo -> panvol -> panvol_out -> master panvol
                    store.addConnection('connection_' + randomId(), idTrack, idSolo, idPanvol, "component", "component");
                    store.addConnection('connection_' + randomId(), idTrack, idPanvol, idPanvolOut, "component", "component");
                    store.addConnection('connection_' + randomId(), idTrack, idPanvolOut, "panvol_master", "component", "component");
                }
            })
        }
        function addTrack(id, type, mute, solo, sample, region) {
            if(self.ui.selectedGroup !== 'M'){

                let groupIndex = store.getTracksByGroup(self.ui.selectedGroup).length;
                self.tracks.push(Track.create({ id: id, type: type, mute: mute, solo: solo, sample: sample, region: region, group: self.ui.selectedGroup, groupIndex: groupIndex, mixRow: MixRow.create({}) }));

                let panvolId = 'panvol_' + randomId();
                self.components.panvols.push(PanVol.create({ id: panvolId, track: id }));

                //panvol -> master group solo
                store.addConnection('connection_' + randomId(), id, panvolId, 'mix_solo_' + self.ui.selectedGroup, "component", "component");

                if (type === "audio") {
                    let playerId = 'player_' + randomId();
                    store.instruments.add('player', { id: playerId, track: id, sample: sample, region: region });
                    store.addConnection('connection_' + randomId(), id, playerId, panvolId, "instrument", "component");
                }

                self.scenes.forEach(function (scene) {
                    self.addPattern('pattern_' + randomId(), '16n', id, scene.id, []);
                })

                store.ui.selectTrack(id);
            }
        }
        function duplicateTrack(id){
            let track = self.getTrack(id);

            //add new track
            let newTrackId = 'track_' + randomId();
            self.addTrack(newTrackId, track.type, track.mute, track.solo, track.sample, track.region);

            //function to set new id's for all deep level props
            const setObjPropVal = (obj, prop, val, signal, child) => {
                Object.keys(obj).forEach(key => {
                    if(key === prop){
                        let tokens = obj[key].split('_');
                        if(val)
                            tokens[tokens.length-1] = val;
                        else
                            tokens[tokens.length-1] = randomId();

                        obj[key] = tokens.toString().replace(/,/g, '_');
                    }
                    else if(typeof obj[key] === 'object'){
                        setObjPropVal(obj[key], prop, val, signal, child);
                    }
                })
            }

            //save a copy of orig track connections to modify during obj loop
            let conns = self.getConnectionsByTrack(id)
                .filter(c => c.src.split('_')[0] !== 'mix' && c.dest.split('_')[0] !== 'mix')
                    .map(conn => ({...getSnapshot(conn)}))
            
            //copy orig track models
            self.getObjsByTrackObj(track).sort((a,b) => {return a-b}).forEach(obj => {
                let type = obj.id.split('_')[0];

                //addtrack already connected default track objs
                if(type !== 'mix'){
                    //copy and apply snapshots of obj models, update id's and track id's
                    let snapshot = cloneDeep(getSnapshot(obj));
                    snapshot.track = newTrackId;

                    if(type === 'panvol'){
                        let panvol = self.components.panvols.find(pv => pv.track.id === newTrackId);
                        snapshot.id = panvol.id;
                        applySnapshot(panvol, snapshot);
                    }
                    else if(type === 'player'){
                        let player = self.instruments.players.find(pv => pv.track.id === newTrackId);
                        snapshot.id = player.id;
                        applySnapshot(player, snapshot);

                        //remove default connection by addTrack()
                        self.delConnectionsByObj(player.id);
                    }
                    else{
                        if(type !== 'tinysynth'){
                            setObjPropVal(snapshot, 'id');
                            let baseType = self.getObjTypeByIdTrack(obj.id, track.id) + 's';
                            self[baseType].add(type, snapshot);
                        }
                        else if(type === "tinysynth" && obj.id.split('_')[1] === "panvol"){
                            //add panvol
                            setObjPropVal(snapshot, 'id');
                            self.components.add('panvol', snapshot);

                            //now add tinysynth using panvol id above
                            let tinysynth = self.instruments.getInstrumentByTypeId('tinysynth', 'tinysynth_' + obj.id.split('_')[2]);
                            let tsCopy = {...getSnapshot(tinysynth)};

                            tsCopy.track = newTrackId;
                            setObjPropVal(tsCopy, 'id', snapshot.id.split('_')[2]);
                            setObjPropVal(tsCopy, 'panvol', snapshot.id.split('_')[2]);

                            self.instruments.add('tinysynth', tsCopy);
                        }
                    }

                    //update new model id's in connections
                    conns.filter(c => c.src === obj.id || c.dest === obj.id).forEach(c => {
                        if(c.src === obj.id)
                            c.src = snapshot.id;
                        else if(c.dest === obj.id)
                            c.dest = snapshot.id;
                    })
                }
            });
            
            //copy connections to new track
            conns.forEach(c => {
                store.addConnection('connection_' + randomId(), newTrackId, c.src, c.dest, c.srcType, c.destType, c.signal, c.numOut, c.numIn);
            })
            
            //copy patterns
            self.getPatternsByTrack(track.id).forEach(p => {
                self.getPatternByTrackScene(newTrackId, p.scene.id).pastePattern(p);
            })
        }
        function delTrack(id) {
            let track = self.getTrack(id);

            //remove selections
            if(store.ui.selectedPattern){
                if(store.ui.selectedPattern.track.id === id)
                    store.ui.selectPattern(undefined);
            }
            if(store.ui.selectedTrack){
                if(store.ui.selectedTrack.id === track.id){
                    const groupTracks = store.getTracksByGroup(store.ui.selectedGroup);

                    if(groupTracks.length > 1){
                        if(track.groupIndex + 1 === groupTracks.length)
                            store.ui.selectTrack(groupTracks.find(t => t.groupIndex === track.groupIndex - 1).id);
                        else
                            store.ui.selectTrack(groupTracks.find(t => t.groupIndex === track.groupIndex + 1).id);
                    }
                    else{
                        store.ui.selectTrack(undefined)
                    }
                }
            }
            if(store.ui.selectedNote){
                if(store.ui.selectedNote.getPattern().track === track){
                    store.ui.selectNote(undefined);
                }
            }
            if(store.ui.selectedObj){
                if(store.getObjsByTrackObj(track).find(o => o.id === store.ui.selectedObj)){
                    store.ui.selectObj('');
                }
            }

            self.components.getAllByTrack(id).forEach(function (component) {
                let type = component.id.split('_');
                if (self.components.isHidden(component.id))
                    self.components.delete(type[1], component.id);
                else
                    self.components.delete(type[0], component.id);
            })
            self.effects.getAllByTrack(id).forEach(function (effect) {
                self.effects.delete(effect.id.split('_')[0], effect.id);
            })
            self.instruments.getAllByTrack(id).forEach(function (instrument) {
                self.instruments.delete(instrument.id.split('_')[0], instrument.id);
            })
            self.sources.getAllByTrack(id).forEach(function(source){
                self.sources.delete(source.id.split('_')[0], source.id);
            })

            self.patterns.filter(p => p.track.id === id).forEach(pattern => self.delPattern(pattern.id));

            if (track.type === "audio") {
                if(track.region)
                    self.getSample(track.sample.id).delRegion(track.region.id);
            }

            self.getTracksByGroup(track.group).filter(t => t.groupIndex > track.groupIndex).forEach(t => t.setGroupIndex(t.groupIndex - 1));

            destroy(self.getTrack(id));
        }
        function addConnection(id, track, src, dest, srcType, destType, signal, numOut, numIn) {
            self.connections.push(Connection.create({ id: id, track: track, src: src, dest: dest, srcType: srcType, destType: destType, signal: signal, numOut: numOut, numIn: numIn }))
        }
        function delConnectionsByObj(id) {
            self.getConnectionsByObjId(id).forEach(function (connection) {
                destroy(connection);
            })
        }
        function delConnection(id) {
            destroy(self.getConnection(id));
        }
        function addSample(id, url, length, regions, duration) {
            self.samples.push(Sample.create({ id: id, url: url, length: length, regions: regions, duration: duration }));
        }
        function delSample(id) {
            destroy(self.getSample(id));
        }
        //these could go elsewhere, but could be useful for future remote DB calls.
        //look into Fetch and idb updates
        function DBLoadStore(id) {
            var db;
            var openRequest = indexedDB.open('propadb', 1);

            openRequest.onsuccess = function (e) {
                console.log('DB Load - running onsuccess');
                db = e.target.result;

                var transaction = db.transaction(['songs'], 'readwrite');
                var objectStore = transaction.objectStore('songs');
                var request = objectStore.get(id);

                request.onerror = function (e) {
                    console.log('Error loading database', e.target.error.name);
                };
                request.onsuccess = function (e) {
                    console.log('opened database. loading song...')

                    //setting transport first, tone obj times properties based on this value
                    Tone.Transport.bpm.value = e.target.result.settings.bpm;     

                    //we maunally load all toneobjs before applying snapshot...
                    //after attach is unreliable...
                    setToneObjs(e.target.result);

                    //don't display load/save window
                    e.target.result.ui.toolbar.browser.action = undefined;

                    //set current window sizes
                    e.target.result.ui.windowWidth = store.ui.windowWidth;
                    e.target.result.ui.windowHeight = store.ui.windowHeight;

                    applySnapshot(store, e.target.result);
                    
                    //TODO: look into using afterCreate in model
                    //attach all patterns and notes
                    store.patterns.forEach(function(p){
                        p.getSortedNotesAsc().forEach(function(n){})
                    })
                    //attach all connections manually
                    store.refreshConnections();

                    //attach all players manually;
                    store.instruments.players.forEach(() => {});

                    //add samples to browser
                    e.target.result.samples.forEach(s => {
                        //fileTree.children[4].children.push({name: s.url, id: s.id , type: 'sample'});
                    })

                    //console.log(JSON.stringify(store));
                };
            };
            openRequest.onerror = function (e) {
                console.log('DB Load - onerror!');
                console.dir(e);
            };
        }
        async function DBLoadAudioFile(id) {
            let db = await idb.open('propadb', 1, upgradeDB => upgradeDB.createObjectStore('audio', { keyPath: 'id' }));
            let tx = db.transaction('audio', 'readwrite');
            let objStore = tx.objectStore('audio');

            let obj = await objStore.get(id);
            await tx.complete;

            db.close();

            return obj;
        }
        async function DBSaveAudioFile(obj) {
            let db = await idb.open('propadb', 1, upgradeDB => upgradeDB.createObjectStore('audio', { keyPath: 'id' }));
            let tx = db.transaction('audio', 'readwrite');
            let objStore = tx.objectStore('audio');

            await objStore.put(obj);
            await tx.complete;

            db.close();
        }
        async function DBGetAllSongs(){
            let db = await idb.open('propadb', 1, upgradeDB => upgradeDB.createObjectStore('songs', { keyPath: 'id' }));
            let tx = db.transaction('songs', 'readonly');
            let objStore = tx.objectStore('songs');

            let allSavedItems = await objStore.getAll();
            await tx.complete;

            db.close();

            let obj = [];
            allSavedItems.forEach(function(song){
                obj.push({id: song.id, title: song.settings.title, modified: song.settings.modified})
            });
            return obj;
        }
        function DBSaveStore(bSaveSong) {
            let db;
            let openRequest = indexedDB.open('propadb', 1);

            openRequest.onupgradeneeded = function (e) {
                let db = e.target.result;
                console.log('DB Save - running onupgradeneeded');
                if (!db.objectStoreNames.contains('songs')) {
                    //console.log('DB Save - creating songs object store');
                    db.createObjectStore('songs', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('audio')) {
                    //console.log('DB Save - creating audio object store')
                    db.createObjectStore('audio', { keyPath: 'id' });
                }
            };

            openRequest.onsuccess = function (e) {
                if(bSaveSong){
                    //console.log('DB Save - running onsuccess & saving store');
                    db = e.target.result;

                    let transaction = db.transaction(['songs'], 'readwrite');
                    let objectStore = transaction.objectStore('songs');
                    //put will replace and 'add' will check if exist
                    let request = objectStore.put(getSnapshot(store));

                    request.onerror = function (e) {
                        //console.log('DB Save Object - Error', e.target.error.name);
                        db.close();
                    };
                    request.onsuccess = function (e) {
                        //console.log('DB Save Object - Success');
                        db.close();
                    };
                }
            };

            openRequest.onerror = function (e) {
                console.log('DB Save Error!');
                console.dir(e);
            };
        }
        function DBDelete() {
            let DBDeleteRequest = indexedDB.deleteDatabase("propadb");

            DBDeleteRequest.onerror = function (event) {
                console.log("Error deleting database.");
            };

            DBDeleteRequest.onsuccess = function (event) {
                console.log("Database deleted successfully");

                console.log(event.result); // should be undefined
            };
        }
        function setSongId(id){
            self.id = id;
        }
        function afterCreate(){
            //console.log('root store aftercreate called')
            //DBDelete();

            //open DB without saving
            // console.log('save');
            //self.setSongId('emptysong')
            //self.setSongTitle('empty_' + self.id)
            //DBSaveStore(true);
            DBSaveStore(false);
        }
        return { afterCreate, setSongId, DBGetAllSongs, DBSaveStore, DBLoadStore, DBSaveAudioFile, DBLoadAudioFile, DBDelete, addPattern, delPattern, addMasterTracks, addTrack, duplicateTrack, delTrack, addScene, delScene, shiftSceneTimes, swapScenes, duplicateScene, addConnection, delConnectionsByObj, delConnection, addSample, delSample };
    });

/*
export let undoManager = {}
export const setUndoManager = targetStore => {
    undoManager = UndoManager.create({}, { targetStore })
}

export const undo = () => undoManager.canUndo && undoManager.undo()
export const redo = () => undoManager.canRedo && undoManager.redo()
*/