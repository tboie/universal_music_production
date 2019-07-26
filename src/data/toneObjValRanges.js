
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
        }
    },
    env : {
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
    }
}
