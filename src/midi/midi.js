import Tone from 'tone';
import { ToneObjs } from '../models/models.js';
import { store } from '../data/store.js';
import * as throttle from 'lodash/throttle';
import { hex_to_ascii, mapVal } from '../ui/utils.js';

let btDevice, btCharacteristic;
const serviceId = '03B80E5A-EDE8-4B33-A751-6CE34EC4C700'.toLowerCase();
const characteristicId = '7772E5DB-3868-4112-A1A9-F2669D106BF3'.toLowerCase();

/*   testing 
document.addEventListener('mousedown', async() => {
    if(!btDevice)
        await initBLE();
});
*/

export function initMidi(){
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess({ sysex: true }).then(onMIDISuccess, onMIDIFailure);
    } else {
        console.log('WebMIDI is not supported in this browser.');
    }
}

function onMIDISuccess(midiAccess) {
    console.log('WebMIDI enabled');
    for (let input of midiAccess.inputs.values())
        input.onmidimessage = getMIDIMessage;
}

function onMIDIFailure() {
    console.log('Could not access your MIDI devices.');
}


//throttle when changing player model (redraws trackrowview)
let throttlePlayerModelRateChange = throttle(changePlayerModelRate, 50);

function getMIDIMessage(message) {
    let command, val, velocity;

    //notes and controlchanges
    if(message.data.length === 3){
        command = message.data[0];
        val = message.data[1];
        velocity = message.data[2];
    }
    //sysex
    else if(message.data.length === 6){
        val = message.data[4].toString(16)
        if(val >= 41 && val <= 44){
            command = "GroupChange";
        }
        else{
            command = "TransportChange";
        }
    }

    switch (command) {
        //controlchanges
        //https://www.midi.org/specifications-old/item/table-3-control-change-messages-data-bytes-2
        case 176:
            if(val === 1){
                let mappedVal = parseFloat(mapVal(velocity, 0, 127, 0, 2).toFixed(2));
                throttlePlayerModelRateChange(mappedVal);
                changePlayerRate(mappedVal);
            }
            else if(val === 2){
                //Test parameter recording for player volume
                //remember to mute pattern player note velocity

                /*
                let mappedVal = parseFloat(mapVal(velocity, 0, 127, -50, 10).toFixed(2));

                store.getTracksByGroup(store.ui.selectedGroup).forEach((track, idx) => {
                    if(track.type === 'audio'){
                        let playerObj = ToneObjs.instruments.find(i => i.track === track.id && i.id.split('_')[0] === 'player').obj;

                        let playerModel = store.instruments.getPlayerByTrack(track.id);
                        let param = playerModel.automation.find(auto => auto.signal === 'volume');

                        //add volume automation model
                        if(!param){
                            playerModel.addAutomation(track.getPatternByTrackScene(track.id, store.ui.selectedScene.id).id, 'volume');
                        }

                        if(Tone.Transport.state === 'started' && store.ui.recordMode){
                            //add values
                            param.addParam(mappedVal, Tone.Transport.position);              
                            playerObj.volume.value = mappedVal;
                        }
                        else if(Tone.Transport.state === 'stopped'){
                            if(param){
                                console.log(param.getParams());
                            }
                        }
                    };
                });
                */
            }
            else if(val === 3){
                //console.log(val);
            }
            else if(val === 4){
                //console.log(val);
            }
            break;
        case 144:
            noteOn(val);
            break;
        case 128:
            noteOff(val);
            break;
        case "TransportChange":
            TransportChange(message);
            break;
        case "GroupChange":
            GroupChange(hex_to_ascii(val));
            break
        default:
            break;
    }
}

const GroupChange = (group) => {
    if(store.ui.selectedGroup !== group){
        store.ui.selectGroup(group);
    }
}

const TransportChange = (msg) => {
    let eleButton, action = msg.data[4];

    if(action === 2){
        eleButton = document.getElementById('btnTransportTogglePlay');
        if(eleButton){
            eleButton.click();
        }
    }
    else if(action === 40){
        eleButton = document.getElementById('btnTransportToggleRecord');
        if(eleButton){
            eleButton.click();
        }
    }
}

function changePlayerModelRate(val){
    store.getTracksByGroup(store.ui.selectedGroup).forEach((track, idx) => {
        if(track.type === "audio"){
            let player = store.instruments.getPlayerByTrack(track.id);
            if(player.playbackRate !== val){
                player.setModelPlaybackRate(val);
            }
        }
    });
}

function changePlayerRate(val){
    store.getTracksByGroup(store.ui.selectedGroup).forEach((track, idx) => {
        if(track.type === "audio"){
            let row = ToneObjs.instruments.find(i => i.track === track.id);
            if(row){
                if(row.obj){
                    row.obj.playbackRate = val;
                }
            }
        }
    });
}

const noteOn = (note) => {
    store.getTracksByGroup(store.ui.selectedGroup).forEach((track, idx) => {
        if(note-60 === idx){
            if(track.type === "audio"){
                // button view gridbutton mouse down
                if(store.ui.viewMode === 'button' && store.ui.selectedGroup === track.group){
                    let eleButton = document.getElementById('divGridButton_' + track.id);
                    if(eleButton){
                        if(document.createEvent){
                            eleButton.dispatchEvent(new PointerEvent("pointerdown", {
                                bubbles: true,
                            }));
                        }
                    }
                }
                // other views
                else{
                    let row = ToneObjs.instruments.find(i => i.track === track.id);
                    if(row){
                        if(row.obj){
                            if(row.obj.buffer.loaded){
                                row.obj.start();
                            }
                        }
                    }
                }
                
                store.ui.selectTrack(track.id);
            }
            // instrument tracks
            else if(track.type === 'instrument'){
                ToneObjs.trackInstNoteOn(track.id, ['C3']);
            }
        }
        //turn off all other audio tracks
        else{
            if(track.type === "audio"){
                let row = ToneObjs.instruments.find(i => i.track === track.id);
                if(row){
                    if(row.obj){
                        if(row.obj.buffer.loaded){
                            row.obj.stop();
                            
                            //stop gridbutton animations
                            if(store.ui.viewMode === 'button'){
                                let divGridButton = document.getElementById('divGridButton_' + track.id);

                                if(divGridButton){
                                    let divProgress = divGridButton.querySelector('.divGridButtonProgress');
                                    
                                    if(divProgress){
                                        divProgress.style.animation = 'none';
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    })
}

const noteOff = (note) => {
    store.getTracksByGroup(store.ui.selectedGroup).forEach((track, idx) => {
        if(note-60 === idx){
            if(track.type === 'instrument'){
                ToneObjs.trackInstNoteOff(track.id, ['C3']);
            }
        }
    });
}

/*******************************
 * BLE 
 *******************************/


export async function initBLE(){
    await requestDevice();
    await connectDeviceAndCacheCharacteristics();
}

async function requestDevice() {
    console.log('Requesting any Bluetooth Device...');
    btDevice = await navigator.bluetooth.requestDevice({
        filters: [{
                services: [serviceId]
            }]
        });
    btDevice.addEventListener('gattserverdisconnected', onDisconnected);
}


async function connectDeviceAndCacheCharacteristics() {
    if (btDevice.gatt.connected && btCharacteristic) {
      return;
    }
  
    try{
        console.log('Connecting to GATT Server...');
        const server = await btDevice.gatt.connect();
    
        console.log('Getting BLE MIDI Service...');
        const service = await server.getPrimaryService(serviceId);
    
        console.log('Getting BLE MIDI Characteristic...');
        btCharacteristic = await service.getCharacteristic(characteristicId);

        //this particular sequence turns notifications on for android chrome
        //this is not the standard, but it works.  maybe device code that's wrong
        //
        //notifications currently do not turn on for chrome on os x (only this computer?)
        //
        //note: make sure arduino scheduler for midi read is turned off along with 
        //handlers for noteon and noteoff
        btCharacteristic.addEventListener('characteristicvaluechanged', handleValueChange);
        
        try{
            await btCharacteristic.readValue();
        }
        catch(error){
            console.log(error);
        }

        console.log('Starting BLE MIDI Notifications...');
        await btCharacteristic.startNotifications();
        console.log('MIDI BLE Notifications started')
    }
    catch(error){
        console.log(error);
    }
}

async function onDisconnected() {
    console.log('> Bluetooth Device disconnected');
    try {
        await connectDeviceAndCacheCharacteristics()
    } catch(error) {
        console.log('Argh! ' + error);
    }
}

function handleValueChange(event) {
    //console.log(event);

    if(event.target.value){
        let action = event.target.value.getUint8(2);
        let note = event.target.value.getUint8(3);
        let velocity = event.target.value.getUint8(4);
        let msg = { data: [action, note, velocity]};

        getMIDIMessage(msg);
    }
}