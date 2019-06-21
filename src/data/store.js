import { Scale } from "tonal";
import { RootStore, randomId } from "../models/models.js";

let firstSceneId = 'scene_' + randomId();

export const store = RootStore.create({
  "id": "song_" + randomId(),
  "settings": {
    "title": "untitled",
    "modified": undefined,
    "bpm" : 120,
    "swing:" : 0,
    "loopStart" : "0:0:0",
    "loopEnd" : "1:0:0",
    "scale" : Scale.names()[Math.floor(Math.random()*Scale.names().length)],
    "key" : ["C","C#","Db","D","D#","Eb","E","E#","Fb","F","F#","Gb","G","G#","Ab","A","A#","Bb","B","B#","Cb"][Math.floor(Math.random()*21)],
    "swingSubDivision" : "16n",
    "partRender": false,
  },
  "tracks": [],
  "patterns" : [],
  "scenes" : [
    {
      "id" : firstSceneId,
      "start" : "0:0:0",
      "end" : "1:0:0",
      "on" : true
    },
  ],
  "samples" : [],
  "ui" : {
    "viewMode" : "sequencer",
    "views": {
      "sequencer": {
      },
      "button" : {
      },
      "edit" : {
        "mode" : "bar"
      },
      "manager" : {
      }
    },
    "toolbar" : {
      "main" : {
      },
      "browser" : {
        "browser1" : {
          "selectedDir" : "/",
          "selectedFile" : undefined
        },
        "browser2" : {
          "selectedDir" : "/",
          "selectedFile" : undefined
        },
        "browser3" : {
          "selectedDir" : "/",
          "selectedFile" : undefined
        },
        "action": undefined
      },
      "edit" : {
      },
      "song" : {
      },
      "keys" : {
      }
    },
    "mixMode" : false,
    "editMode" : false,
    "recordMode" : false,
    "settings" : false,
    "viewLength" : "1:0:0",
    "windowHeight" : 0,
    "windowWidth" : 0,
    "selectedToolbar" : undefined,
    "selectedScene" : firstSceneId,
    "selectedTrack" : undefined,
    "selectedPattern" : undefined,
    "selectedObj" : undefined,
    "selectedGroup" : "A",
    "selectedNote" : undefined,
    "selectedKey" : undefined,
    "selectedChord" : undefined,
    "device" : undefined,
    "showSideBar" : undefined,
  },
  "sources" : {
    "amoscillators": [],
    "fmoscillators": [],
    "fatoscillators": [],
    "oscillators" : [],
    "omnioscillators": [],
    "pwmoscillators": [],
    "pulseoscillators": [],
    "noises": [],
    "usermedias": []
  },
  "instruments" : {
    "players" : [],
    "synths": [],
    "amsynths": [],
    "fmsynths": [],
    "monosynths": [],
    "metalsynths": [],
    "membranesynths": [],
    "plucksynths": [],
    "noisesynths": [],
    "polysynths": [],
    "duosynths": [],
    "tinysynths": []
  },
  "effects" : {
    "autofilters": [],
    "autopanners": [],
    "autowahs": [],
    "bitcrushers": [],
    "chebyshevs": [],
    "choruss": [],
    "convolvers": [],
    "distortions": [],
    "feedbackdelays": [],
    "freeverbs": [],
    "jcreverbs": [],
    "midsideeffects": [],
    "phasers": [],
    "pingpongdelays": [],
    "pitchshifts": [],
    "reverbs": [],
    "stereowideners": [],
    "tremolos": [],
    "vibratos": []
  },
  "components" : {
    "filters" : [],
    "followers": [],
    "meters": [],
    "panvols": [],
    "splits": [],
    "limiters": [],
    "solos": [],
    "eq3s": [],
    "compressors": [],
    "gates": [],
    "monos": [],
    "envelopes": [],
    "amplitudeenvelopes": [],
    "frequencyenvelopes": [],
    "lfos": [],
    "feedbackcombfilters": [],
    "lowpasscombfilters": [],
    "multibandcompressors": [],
    "midsidecompressors": [],
    "multibandsplits": [],
    "volumes": [],
    "panners": []
  },
  "connections" : []
});
