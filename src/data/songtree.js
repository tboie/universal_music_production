import { Scale } from "tonal";

export default {
    name: 'Song',
    toggled: true,
    type: 'song',
    children: [
        {
            name: 'Scenes',
            toggled: false,
            type: 'folderScenes',
            children: []
        },
        {
            name: 'Tracks',
            toggled: false,
            type: 'folderTracks',
            children: ['A','B','C','D'].map(g => ({ name: g, type:'folderTracksGroup', toggled:false, children:[] }))
        },
        {
            name: 'Scales',
            toggled: false,
            type:'folderScales',
            children: [ 
                    { 
                            name: 'Keys',
                            toggled: false,
                            type: 'folderKeys',
                            children: ["C","C#","Db","D","D#","Eb","E","E#","Fb","F","F#","Gb","G","G#","Ab","A","A#","Bb","B","B#","Cb"].map(key => ({ name: key, type: 'key'}))
                    }
            ].concat(Scale.names().map(scale => ({ name: scale, type: 'scale'})))
    },
    ]
}