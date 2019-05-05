import React, { Component } from 'react';
import { observer } from "mobx-react";
import Tone from 'tone';
import { store } from "../../../../data/store.js";
import { ToneObjs, randomId } from "../../../../models/models.js";
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.regions.min.js';

export const ToolSampleEditor = observer(class ToolSampleEditor extends Component {
    sample;
    bSelect;
    zoomVal;
    selectedRegion;
    sampleId;
  
    componentDidMount(){
      this.drawAudio();
    }
  
    componentDidUpdate(prevProps){
      if(prevProps.objId !== this.props.objId || prevProps.file !== this.props.file){
        this.sample.destroy();
        this.drawAudio();
      }

      //reset zoom when toolbar changed (fixes bug where waveform doesn't fill container)
      if((prevProps.selectedToolbar !== this.props.selectedToolbar && this.props.selectedToolbar === 'editor') 
        || (prevProps.winWidth !== this.props.winWidth)){
        if(this.sample){
          if(this.sample.getDuration()){
            let zoom = store.ui.windowWidth / this.sample.getDuration();
            this.sample.zoom(zoom);
          }
        }
      }
  
      if(store.ui.viewMode === 'button' || store.ui.viewMode === 'sequencer'){
        if(prevProps.selectedTrack !== this.props.selectedTrack){
          if(this.props.selectedTrack){
            let region = this.props.selectedTrack.region;
            if(region){
              if(this.selectedRegion){
                if(this.selectedRegion.id !== region.id)
                  this.selectRegion(region.id);
              }
              else{
                this.selectRegion(region.id);
              }
            }
          }
        }
      }
    }
  
    drawAudio = () => {
      let sampleId;
      
      if(this.props.objId.split('_')[0] === 'sample')
        sampleId = this.props.objId;
      else if(this.props.objId === "player_" || this.props.objId.split('_')[0] === 'record')
        sampleId = this.props.file;
      else
        sampleId = store.instruments.getInstrumentByTypeId('player', this.props.objId).sample.id;
  
      this.sampleId = sampleId;
      
      if(sampleId){
        document.getElementById('btnDelRegion').disabled = true;
  
        this.sample = WaveSurfer.create({
          container: '#waveform',
          responsive: true,
          waveColor: '#ff3c00',
          progressColor: '#ff6000',
          //audioContext: Tone.context,
          partialRender: true,
          scrollParent: true,
          //forceDecode: true,
          //pixelRatio: 1,
          //minPxPerSec: 50,
          //fillParent: true,
          plugins: [
            /*
            TimelinePlugin.create({
                container: '#timeline'
            }),
            */
            RegionsPlugin.create({})
          ]
          
        });
  
       // let sampleLength = 0;
        let storeSample = null;
        let self = this;
        let s = this.sample;
  
        store.DBLoadAudioFile(sampleId).then(function(result){
          if (Array.isArray(result.data) || result.data instanceof Float32Array) {
            let buffer = new Tone.Buffer().fromArray(result.data);
  
            if(!store.getSample(sampleId))
              store.addSample(sampleId, sampleId, buffer.length, [], buffer.duration);
          
            self.sample.loadDecodedBuffer(buffer.get());
  
            buffer.dispose();
          }
          else{
            if(!store.getSample(sampleId))
              store.addSample(sampleId, result.data.name, result.data.length, [], result.duration);
  
            self.sample.loadBlob(result.data)
          }
        })
  
        this.ensureWaveIsReady(this.sample).then(function(){
          document.getElementById('divEditorSampleLoading').style.display = 'none';
        });
  
        this.sample.on('ready', function () {
          self.sample.isReady = true;
  
          storeSample = store.getSample(sampleId);
          storeSample.regions.forEach(function(region){
            s.addRegion({id: region.id, start: region.start, end: region.end});
          });
  
          if(store.ui.selectedTrack)
            if(store.ui.selectedTrack.region)
              self.selectRegion(store.ui.selectedTrack.region.id)
  
          if(!self.bSelect)
            self.toggleSelect();
          else
            self.sample.enableDragSelection({})
        });
  
        this.sample.on('region-created', function(region) {
          self.selectRegion(region.id);
          let trackId = null;
          let regionTrack = store.getTrackBySampleRegion(sampleId, region.id)
            
          if(!regionTrack)
            trackId = 'track_' + randomId();
          else
            trackId = regionTrack.id;
  
          if(!storeSample.getRegion(region.id)){
            region.id = 'region_' + randomId();
            storeSample.addRegion(region.id, sampleId);
          }
  
          region.on('update-end', function(e) {
            let regionLength = region.end - region.start;
  
            if(regionLength > 0){
              let r = storeSample.getRegion(region.id);
              if(store.getTrack(trackId)){
                //region changed, set buffer and save to DB
                if(r.start !== region.start || r.end !== region.end){
                  let regionBuffer = new Tone.Buffer(s.backend.buffer).slice(region.start, region.end);
  
                  let playerId = store.instruments.getPlayerByTrack(trackId).id;
                  ToneObjs.instruments.find(inst => inst.id === playerId).obj.buffer.set(regionBuffer);
                  r.setRegions(region.start, region.end);
  
                  store.DBSaveAudioFile({
                    id: region.id,
                    url: '',
                    duration: regionBuffer.duration,
                    data: regionBuffer.toArray()
                  }).then(() => {
                    regionBuffer.dispose();
                  });
                }
              }
              else{
                //New region, save to DB
                r.setRegions(region.start, region.end);
  
                let regionBuffer = new Tone.Buffer(s.backend.buffer).slice(region.start, region.end);
                store.DBSaveAudioFile({
                  id: region.id,
                  url: '',
                  duration: regionBuffer.duration,
                  data: regionBuffer.toArray()
                }).then(() => {
                  store.addTrack(trackId, 'audio', false, false, sampleId, region.id);
                  regionBuffer.dispose();
                });
              }
            }
  
            //s.seekAndCenter(region.start / s.getDuration());
          })
        });
  
        this.sample.on('region-click', function(region){
          self.selectedRegion = region;

          let eles = document.getElementsByClassName("wavesurfer-region-selected");
          for(let i=0; i < eles.length; i++)
            eles[i].className = "wavesurfer-region";
          
          region.element.className = "wavesurfer-region-selected";
          document.getElementById('btnDelRegion').disabled = false;
          document.getElementById('iconSampleDelete').style.opacity = "1";
          
          let track = store.getTrackBySampleRegion(self.sampleId, region.id);
          if(track){
            store.ui.selectTrack(track.id);
          }
        })
  
        this.sample.on('region-updated', function(region){
          if(self.selectedRegion !== region){
            self.selectedRegion = region;

            let eles = document.getElementsByClassName("wavesurfer-region-selected");
            for(let i=0; i < eles.length; i++)
              eles[i].className = "wavesurfer-region";
  
            region.element.className = "wavesurfer-region-selected";
            document.getElementById('btnDelRegion').disabled = false;
            document.getElementById('iconSampleDelete').style.opacity = "1";
          }

          let track = store.getTrackBySampleRegion(self.sampleId, region.id);
          if(track){
            store.ui.selectTrack(track.id);
          }
        })
  
        this.sample.on('loading', function(progress, obj){
        })
  
        this.sample.on('finish', function () {
          document.getElementById("iconSamplePlay").innerHTML = "play_arrow";
        });
  
        this.sample.on('zoom', function (zoom) {
          self.zoomVal = zoom;
        });
      }
    }
  
    //simulate click when selectedTrack changes (gridbutton is clicked)
    selectRegion = (id) => {
      let dataId;
      let sample = this.sample;
  
      if(sample){
        Object.keys(sample.regions.list).forEach(function(region){
          if(region === id){
            dataId = sample.regions.list[region].element.dataset.id;
          }
        });
        let all = document.getElementsByTagName("region");
        for (let i=0, max=all.length; i < max; i++) {
          if(dataId === all[i].getAttribute('data-id')){
            all[i].click();
          }
        }
      }
    }
  
    delRegion = (id) => {
      //track deleted(region) , update sample editor region
      if(typeof(id) === "string" && this.sample){
        this.sample.regions.list[id].remove();
      }
      //delete button click on editor
      else {
        if(this.selectedRegion && this.sampleId){
          store.delTrack(store.getTrackBySampleRegion(this.sampleId, this.selectedRegion.id).id);
          this.selectedRegion.remove();
          document.getElementById('btnDelRegion').disabled = true;
          document.getElementById('iconSampleDelete').style.opacity = "0.5";
        }
      }
    }
  
    refreshRegions = () => {
      //loop through wavesurfer regions and check if region exists in sample region array
      //if no region exists for sample (track deleted), remove wavesurfer region
      if(this.sample && this.sampleId){
        let p = this.sample.regions.list;
        for (let key in p) {
          if (p.hasOwnProperty(key)) {
            if(!store.getSample(this.sampleId).getRegion(key)){
              this.delRegion(key);
            }  
          }
        }
      }
    }
  
    componentWillUnmount(){
      if(this.sample)
        this.sample.destroy();
    }
  
    toggleSelect = () => {
      this.bSelect = !this.bSelect;
  
      let icon = document.getElementById('iconSampleSelect');
      this.bSelect ? icon.innerHTML = 'layers' : icon.innerHTML = 'layers_clear';
  
      let sample = this.sample;
      if(sample){
        let ele = document.getElementById('waveform').children[0];
        if(!this.bSelect){
          //enable scroll while selecting region TODO: check perf?
          ele.style.overflowX = 'auto';
          sample.disableDragSelection({});
          Object.keys(sample.regions.list).forEach(function(region){
            sample.regions.list[region].drag = false;
            sample.regions.list[region].resize = false;
          });
        } else {
          //disable scroll while selecting region
          ele.style.overflowX = 'hidden';
          sample.enableDragSelection({})
          Object.keys(sample.regions.list).forEach(function(region){
            sample.regions.list[region].drag = true;
            sample.regions.list[region].resize = true;
          });
        }
      }
    }
  
    togglePlay = (e) => {
     // e.stopPropagation();
     if(this.sample){
        this.sample.playPause();
  
        if(this.sample.isPlaying())
          document.getElementById("iconSamplePlay").innerHTML = "pause";
        else
          document.getElementById("iconSamplePlay").innerHTML = "play_arrow";
      }
    }
  
    //remember wavesurfer prop responsive enables debouncing on zoom for potential future modifications
  
    ensureWaveIsReady = (sample) => {
      return new Promise(function (resolve, reject) {
        let label = document.getElementById('divEditorSampleLoading');
        (function waitForReady(){
            if(label.style.display !== 'table')
              label.style.display = 'table';
  
            if(sample.isReady)
              return resolve();
  
            setTimeout(waitForReady, 15);
        })();
      });
    }
  
    zoomChange = (e) => {
      //console.log(e.target.value)
      let zoomLevel = Number(e.target.value);
      if(this.sample)
        this.sample.zoom(zoomLevel);
    };
    
    render() {
      //refresh regions on track changes
      //TODO: improve future deletion by mapping audio tracks only?
      if(this.props.tracks.length >= 0){
        this.refreshRegions();
      }
  
      return(
        <div style={{height:'100%', width:'100%', position:'absolute'}}>
          <div id="divEditorSampleLoading" style={{width:'100%', height:'100%', display:'none'}}>
            <div style={{display:'table-cell', verticalAlign:'middle'}}>
              <div className="la-ball-spin-clockwise-fade-rotating la-lg" style={{margin:'auto'}}>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          </div>
          <div id="samplezoom">
          { /*
            <button onClick={this.zoomIn} style={{position:'absolute', left:'5px'}}>+</button>
            <button onClick={this.zoomOut} style={{position:'absolute', left:'50px'}}>-</button>
          */ }
            <div style={{marginLeft:'25px', marginRight:'225px', position:'relative'}}>
              <input type="range" min="1" max="200" onInput={this.zoomChange} style={{width:'100%'}}></input>
            </div>
            <button onClick={this.delRegion} id="btnDelRegion" style={{position:'absolute',right:'5px', backgroundColor:'transparent', top:'4px', border:0}}>
              <i id="iconSampleDelete" className="material-icons i-28 colorRed" style={{opacity:0.5}}>delete</i>
            </button>
            <button onClick={this.toggleSelect} style={{position:'absolute',right:'80px', backgroundColor:'transparent', top:'4px', border:0}}>
              <i id="iconSampleSelect" className="material-icons i-28">layers_clear</i>
            </button>
            <button onClick={this.togglePlay} style={{position:'absolute',right:'140px', backgroundColor:'transparent', top:'4px', border:0}}>
              <i id="iconSamplePlay" className="material-icons i-28">play_arrow</i>
            </button>
          </div>
          <div id="waveform"></div>
          <div id="timeline"></div>
        </div>
      )
    }
  })