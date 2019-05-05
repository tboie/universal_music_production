export function initMidi(){
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    } else {
        console.log('WebMIDI is not supported in this browser.');
    }
}

function onMIDISuccess(midiAccess) {
    console.log('WebMIDI enabled')
    for (let input of midiAccess.inputs.values())
    input.onmidimessage = getMIDIMessage;
}

function onMIDIFailure() {
    console.log('Could not access your MIDI devices.');
}

function getMIDIMessage(message) {
    var command = message.data[0];
    var note = message.data[1];
    var velocity = (message.data.length > 2) ? message.data[2] : 0; // a velocity value might not be included with a noteOff command

    switch (command) {
        case 144: // noteOn
            if (velocity > 0) {
                //noteOn(note);
            } else {
                //noteOff(note);
            }
            break;
        case 128: // noteOff
            //noteOff(note);
            break;
        // we could easily expand this switch statement to cover other types of commands such as controllers or sysex
    }
}

/*
const noteOn = (note) => {
    if(this.props.store.ui.selectedTrack){
    ToneObjs.instruments.filter(o => o.track === this.props.store.ui.selectedTrack.id).forEach(function(row){
        if(row.obj){
        let type = row.id.split('_')[0];

        if(type === 'metalsynth'){
            row.obj.frequency.setValueAtTime(Tone.Midi(note).toFrequency(), undefined, Math.random()*0.5 + 0.5);
            row.obj.triggerAttack(undefined, 1);
        }
        else if(type === 'noisesynth'){
            row.obj.triggerAttack();
        }
        else if(type === 'plucksynth' || type === 'membranesynth'){
            row.obj.triggerAttack(Tone.Midi(note).toFrequency());
        }
        else if(type !== 'player'){
            //row.obj.triggerAttack(notes.map(n => Note.freq(n)));
            row.obj.triggerAttack(Tone.Midi(note).toFrequency());
        }
        }
    });
    }
}

const noteOff = (note) => { 
    ToneObjs.instruments.filter(o => o.track === this.props.store.ui.selectedTrack.id).forEach(function(row){
    if(row.obj){
        let type = row.id.split('_')[0];

        if(type === "metalsynth" || type === "membranesynth" || type === "noisesynth"){
        row.obj.triggerRelease();
        }
        else if(type !== "player" && type !== "plucksynth"){
        row.obj.releaseAll();
        }
    }
    });
}
*/