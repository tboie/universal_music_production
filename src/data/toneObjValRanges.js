
export const toneObjValRanges = {
    main : {
        volume : {
            min: -100,
            max: 10,
            mode: 'range',
            step: 0.01,
            numType: 'float',
            signal: true,
            density: 1
        },
        portamento : {
            min: 0,
            max: 0.3,
            mode: 'range',
            step: 0.01,
            numType: 'float',
            signal: false,
            density: 1
        },
        harmonicity: {
            min: 0,
            max: 4,
            mode: 'range',
            step: 0.1,
            numType: 'float',
            signal: true,
            density: 1
        },
        detune: {
            min: -100,
            max: 100,
            mode: 'range',
            step: 0.1,
            numType: 'float',
            signal: true,
            density: 1
        },
        modulationIndex: {
            min: 0,
            max: 40,
            mode: 'range',
            step: 0.1,
            numType: 'float',
            signal: true,
            density: 1
        },
    },
    instruments: {
        metalsynth: {
            resonance: {
                min: 0,
                max: 8000,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: false,
                density: 1
            },
            octaves: {
                min: 0,
                max: 4,
                mode: 'steps',
                step: 0.25,
                numType: 'float',
                signal: false,
                density: 1
            },
        },
        plucksynth: {
            resonance: {
                min: 0,
                max: 1,
                mode: 'range',
                step: 0.01,
                numType: 'float',
                signal: true,
                density: 1
            },
        },
        membranesynth: {
            pitchDecay: {
                min: 0,
                max: 0.2,
                mode: 'range',
                step: 0.01,
                numType: 'float',
                signal: false,
                density: 1
            },
            octaves: {
                min: 0.5,
                max: 6,
                mode: 'steps',
                step: 0.5,
                numType: 'float',
                signal: false,
                density: 1
            },
        },     
        monosynth: {   
            filter: {

            },
            env1: {

            },
            env2: {

            }
        },
        tinysynth: {
            instrument: {
                min: 0,
                max: 127,
                mode: 'steps',
                step: 1,
                numType: 'integer',
                signal: false,
                density: 1
            }
        }
    },
    components: {
        amplitudeenvelope: {
            attack: {
                min: 0.01,
                max: 2,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: false,
                density: 1
            },
            decay: {
                min: 0.01,
                max: 2,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: false,
                density: 1
            },
            sustain: {
                min: 0.01,
                max: 1,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: false,
                density: 1
            },
            release: {
                min: 0.01,
                max: 4,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: false,
                density: 1
            }
        },
        filter:{
            Q: {
                min: 0,
                max: 10,
                mode: 'steps',
                step: 1,
                numType: 'integer',
                signal: true,
                density: 1
            },
            frequency: {
                min: 0,
                max: 10000,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: true,
                density: 1
            },
            gain: {
                min: -20,
                max: 3,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: true,
                density: 1
            },
        },
        frequencyEnvelope: {
            octaves: {
                min: 0,
                max: 10,
                mode: 'steps',
                step: 1,
                numType: 'float',
                signal: false,
                density: 1
            },
            baseFrequency: {
                min: 20,
                max: 1000,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: false,
                density: 1
            },
            baseFrequency: {
                min: 1,
                max: 10,
                mode: 'steps',
                step: 1,
                numType: 'integer',
                signal: false,
                density: 1
            }
        },
        gate: {
            threshold: {
                min: -50,
                max: 20,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: false,
                density: 1
            },
            attack: {
                min: 0.01,
                max: 1,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: false,
                density: 1
            },
            release: {
                min: 0.01,
                max: 1,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: false,
                density: 1
            }
        },
        limiter: {
            threshold: {
                min: -100,
                max: 0,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: true,
                density: 1
            }
        },
        lfo: {
            min: {
                min: -10000,
                max: 10000,
                mode: 'range',
                step: 1,
                numType: 'integer',
                signal: false,
                density: 1
            },
            max: {
                min: -10000,
                max: 10000,
                mode: 'range',
                step: 1,
                numType: 'integer',
                signal: false,
                density: 1
            },
            phase: {
                min: 0,
                max: 360,
                mode: 'range',
                step: 1,
                numType: 'integer',
                signal: false,
                density: 1
            },
            amplitude: {
                min: 0,
                max: 1,
                mode: 'range',
                step: 0.01,
                numType: 'float',
                signal: true,
                density: 1
            }
        },
        compressor: {
            ratio: {
                min: 1,
                max: 30,
                mode: 'steps',
                step: 1,
                numType: 'integer',
                signal: true,
                density: 30
            },
            threshold: {
                min: -50,
                max: 0,
                mode: 'range',
                step: 0.01,
                numType: 'float',
                signal: true,
                density: 1
            },
            attack: {
                min: 0,
                max: 0.2,
                mode: 'range',
                step: 0.001,
                numType: 'float',
                signal: true,
                density: 1
            },
            release: {
                min: 0.001,
                max: 5,
                mode: 'range',
                step: 0.001,
                numType: 'float',
                signal: true,
                density: 1
            },
            knee: {
                min: -50,
                max: 50,
                mode: 'range',
                step: 0.01,
                numType: 'float',
                signal: true,
                density: 1
            },            
        }    ,
        multibandcompressor: {
            lowFrequency: {
                min: 20,
                max: 20000,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: true,
                density: 1
            },
            highFrequency: {
                min: 20,
                max: 20000,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: true,
                density: 1
            },          
        },
        eq3: {
            low: {
                min: -30,
                max: 30,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: true,
                density: 1
            },
            mid: {
                min: -30,
                max: 30,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: true,
                density: 1
            },
            high: {
                min: -30,
                max: 30,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: true,
                density: 1
            },
            //low, high and q are multiband split
            
        },
        multibandsplit: {
            lowFrequency: {
                min: 20,
                max: 20000,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: true,
                density: 1
            },
            highFrequency: {
                min: 20,
                max: 20000,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: true,
                density: 1
            },
            Q: {
                min: 0,
                max: 10,
                mode: 'steps',
                step: 1,
                numType: 'integer',
                signal: true,
                density: 1
            }
        },
        panner: {
            pan: {
                min: -1,
                max: 1,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: true,
                density: 1
            }
        },
        lowpasscombfilter: {
            delayTime: {
                min: 0.001,
                max: 1,
                mode: 'range',
                step: 0.001,
                numType: 'float',
                signal: true,
                density: 1
            },
            resonance: {
                min: 0,
                max: 1,
                mode: 'range',
                step: 0.001,
                numType: 'float',
                signal: true,
                density: 1
            },
            dampening: {
                min: 20,
                max: 20000,
                mode: 'range',
                step: null,
                numType: 'float',
                signal: true,
                density: 1
            }
        },
        feedbackcombfilter: {
            delayTime: {
                min: 0.001,
                max: 1,
                mode: 'range',
                step: 0.001,
                numType: 'float',
                signal: true,
                density: 1
            },
            resonance: {
                min: 0,
                max: 1,
                mode: 'range',
                step: 0.001,
                numType: 'float',
                signal: true,
                density: 1
            }
        }
    },
    effects: {

    },
    sources: {

    }
}
