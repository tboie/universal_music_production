import React, { Component } from 'react';
import { observer } from 'mobx-react';
import Tone from 'tone';
import { store } from '../../../data/store.js';
import { randomId } from '../../../models/models.js';
import { audioBufferToWav } from '../../utils.js';
import interact from 'interactjs';

import newfileTree from '../../../data/newfiletree.json';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { shouldComponentUpdate } from 'react-window';


let bBrowseMenuLoading = false;
let browsePlayer = new Tone.Player().toMaster();

const browsePlayerStart = (item, eleAnim, eleLoadIcon) => {
  eleLoadIcon.querySelector('.divListItemLoadingIcon').style.display = 'none';
  eleAnim.style.animation = 'progressWidth ' + browsePlayer.buffer.duration + 's linear';
  browsePlayer.start();
  item.tStart = new Date().getTime();       
}

const browsePlayerStop = (item, eleAnim) => {
  browsePlayer.stop();
  eleAnim.style.animation = 'none';
  item.tStart = undefined;
}

const procBrowseItem = (item, browserId) => {
  let type = item.type;
  let name = item.name.toLowerCase();
  let randId = name + '_' + randomId();
  let trackId = 'track_' + randomId();

  if(type === 'instrument' || type === 'source'){
    if(store.ui.viewMode === 'edit'){
      trackId = store.ui.selectedTrack.id;
      store[type + 's'].add(name, {id: randId, track: trackId});
    }
    else{
      store.addTrack(trackId, 'instrument', false, false);
      store[type + 's'].add(name, {id: randId, track: trackId});

      let panvolId = store.components.getAllByTrack(trackId).find(c => c.id.split('_')[0] === 'panvol').id;

      if(name !== 'tinysynth')
        store.addConnection('connection_' + randomId(), trackId, randId, panvolId, type, 'component');
      else
        store.addConnection('connection_' + randomId(), trackId, 'tinysynth_panvol_' + randId.split('_')[1], panvolId, 'component', 'component');
    }

    if(name === 'tinysynth')
      store.ui.selectObj('tinysynth_panvol_' + randId.split('_')[1]);
    else
      store.ui.selectObj(randId);

    store.ui.selectToolbar('synth');
  }
  else if(type === 'effect' || type === 'component'){
    if(store.ui.selectedTrack){
      store[type + 's'].add(name, {id: randId, track: store.ui.selectedTrack.id})
      store.ui.selectObj(randId);
      store.ui.selectToolbar('editor')
    }
  }
  else if(type === 'sample'){
    if(item.name === '...Import'){
      document.getElementById('inputFile_' + browserId).click();
    }
    else if(item.name === '...Folder'){
      //document.getElementById('btnInputFolder_' + this.id).click();
    }
    else if(item.name === '...Record'){
      store.ui.selectObj('record_' + randomId());
      store.ui.selectToolbar('editor');
    }
    else if(item.dir.substr(0,8) === '/Samples'){
      if(item.name.split('_')[0] === 'region'){
        let region = store.getAllRegions().find(r => r.id === item.name);
        if(region){
          store.addTrack('track_' + randomId(), 'audio', false, false, region.getSample().id, item.name);
          store.ui.selectObj(region.getSample().id);
          store.ui.selectToolbar('editor');
        }
      }
      else{
        store.ui.selectObj(item.name);
        store.ui.selectToolbar('editor');
      }
    }
    else if(item.dir.substr(0,8) === '/Library'){
      let url = item.dir + '/' + item.name;
      let sampleId = 'sample_' + url;
      
      store.DBLoadAudioFile(sampleId).then(result => {
        if(!result){
          let buffer = new Tone.Buffer(url, () => {
            audioBufferToWav(buffer.get()).then(blob => {
              store.DBSaveAudioFile({
                id: sampleId,
                url: url,
                duration: buffer.duration,
                data: blob
              }).then(() => {
                if(!store.getSample(sampleId))
                  store.addSample(sampleId, url, buffer.length, [], buffer.duration);
                
                if(buffer.duration < 2.5) // || result.id.split('_')[0] === 'region'){
                  store.addTrack('track_' + randomId(), 'audio', false, false, sampleId);
                
                store.ui.selectObj(sampleId);
                store.ui.selectToolbar('editor');

                buffer.dispose();
              });
            });
          });
        }
        else{
          if(!store.getSample(sampleId))
            store.addSample(sampleId, url, result.data.length, [], result.duration);
          
          if(result.duration < 2.5 || result.id.split('_')[0] === 'region')
            store.addTrack('track_' + randomId(), 'audio', false, false, sampleId);
          
          store.ui.selectObj(sampleId);
          store.ui.selectToolbar('editor');
        }
      });
    }
  }
}

const changeBrowseMenu = (dir, browserId) => {
  if(!bBrowseMenuLoading && dir !== store.ui[browserId].selectedDir){
    if(dir === '/'){
      document.getElementById('btnBrowseBack_' + browserId).style.opacity = 0.5;
      document.getElementById('btnBrowseHome_' + browserId).style.opacity = 0.5;
    }
    else{
      document.getElementById('btnBrowseBack_' + browserId).style.opacity = 1;
      document.getElementById('btnBrowseHome_' + browserId).style.opacity = 1;
    }

    disableBrowseBtnClick(true, browserId);
    bBrowseMenuLoading = true;
    
    let eleList = document.getElementById('divListBrowseContainer_' + browserId);
    eleList.classList.add('menuFade');

    setTimeout(() => {
      eleList.classList.remove('menuFade');

      let eleSelected = eleList.querySelector('.itemSelected');
      if(eleSelected)
        eleSelected.classList.remove('itemSelected')

      store.ui[browserId].selectDir(dir);

      bBrowseMenuLoading = false;
    }, 220);
  }
}

const disableBrowseBtnClick = (disabled, browserId) => {
  let btn = document.getElementById('btnBrowseLoad_' + browserId);
  if(disabled){
    btn.disabled = true;
    btn.style.opacity = 0.25;
  }
  else{
    btn.disabled = false;
    btn.style.opacity = 1;
  }
}

const toggleBrowseBtnLoad = (item, browserId) => {
  if(!item.folder){
    if(item.type === 'component' || item.type === 'effect'){
      if(store.ui.viewMode === 'edit')
        disableBrowseBtnClick(false, browserId);
      else
        disableBrowseBtnClick(true, browserId);
    }
    else if(item.type === 'sample' || item.type === 'instrument' || item.type === 'source'){
      if(store.ui.viewMode === 'edit'){
        if(store.ui.selectedTrack.type !== 'master')
          disableBrowseBtnClick(false, browserId);
        else
          disableBrowseBtnClick(false, browserId);
      }
      else if(store.ui.selectedGroup !== 'M'){
        disableBrowseBtnClick(false, browserId);
      }
    }
  }
  else{
    disableBrowseBtnClick(true, browserId);
  }
}

class Row extends Component {
  shouldComponentUpdate = shouldComponentUpdate.bind(this);
  rowId; //row ele id
  item;
  browserId; 

  componentDidMount(){
    let origPos = { x: undefined, y: undefined };
    let dragDist = 0;
    let bThreshold = false;
    let scrollY = 0;
    let savedTop = [];
   
    if(this.browserId === 'browser3'){
      interact('#' + this.rowId)
        .draggable({
          autoScroll: false,
          ignoreFrom: 'input',
          onmove: e => {
            if(!this.item.folder && this.item.selected && !document.getElementById('btnBrowseLoad_' + this.browserId).disabled){
              let target = e.target,
                  x = (parseFloat(target.getAttribute('data-x')) || 0) + e.dx,
                  y = (parseFloat(target.getAttribute('data-y')) || 0) + e.dy;

              //no drag to right prevent horizontal scrollbar
              /*
              if(x > origPos.x)
                x = origPos.x; 
              */

              //drag distance threshold
              dragDist = Math.sqrt(Math.pow(x - origPos.x, 2) + Math.pow(y - origPos.y, 2) | 0).toFixed(3);
              if(dragDist > 50 || bThreshold){
                if(!bThreshold){
                  bThreshold = true;
                  
                  //react-window only renders visible rows (scrolling, overflow)
                  //need some style funk for accurate dragging
                  scrollY = document.querySelector('#divListBrowseContainer_' + this.browserId + ' div.List').scrollTop;
                  document.querySelector('#divListBrowseContainer_' + this.browserId + ' div.List').style.overflow = '';
                  if(scrollY > 0){
                    document.querySelectorAll('#divListBrowseContainer_' + this.browserId +  ' .ListItem').forEach(item => {
                      savedTop.push(item.style.top);
                      item.style.top = (item.style.top.replace('px','') - scrollY) + 'px';
                    })
                  }
                }
                
                if(!target.classList.contains('itemDragging')){
                  target.classList.add('itemDragging');
                  interact('#divDropZone').fire({ type: 'dropactivate', target: document.getElementById('divDropZone')}); 
                }
                target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
              }
              target.setAttribute('data-x', x);
              target.setAttribute('data-y', y);
            }
          },
          onstart: e => {
            origPos.x = parseFloat(e.target.getAttribute('data-x')) || 0;
            origPos.y = parseFloat(e.target.getAttribute('data-y')) || 0;
          },
          onend: e => {
            if(bThreshold){
              if(scrollY > 0){
                document.querySelectorAll('#divListBrowseContainer_' + this.browserId + ' .ListItem').forEach((item, idx) => {
                  item.style.top = savedTop[idx]
                })
                savedTop = [];
                scrollY = 0;
              }
              document.querySelector('#divListBrowseContainer_' + this.browserId +  ' div.List').style.overflow = 'auto';
            }

            bThreshold = false;
            e.target.classList.remove('itemDragging');
            e.target.setAttribute('data-x', origPos.x);
            e.target.setAttribute('data-y', origPos.y);
            e.target.style.webkitTransform = e.target.style.transform = 'translate(' + origPos.x + 'px, ' + origPos.y + 'px)';
          }
        }).on('up', e => {
          this.rowClick(e);
        })
    }
    else{
      interact('#' + this.rowId).on('up', e => {
        this.rowClick(e);
      })
    }
    
    //setup row events listeners and current animations (if scrolled off screen)
    if(this.item.type === 'sample'){
      let eleAnimDiv = document.querySelector('#' + this.rowId + ' div.divRowAudioPlaying');
      if(eleAnimDiv)
        eleAnimDiv.addEventListener('animationend', this.rowAnimationEnded); 

      if(this.item.tStart){
        let tNow = new Date().getTime();
        let tDelta = (this.item.tStart - tNow) / 1000;
  
        let prevEleAnim = document.querySelector('.itemSelected .divRowAudioPlaying');
        if(prevEleAnim){
          prevEleAnim.style.animation = 'progressWidth ' + browsePlayer.buffer.duration + 's linear';
          prevEleAnim.style.animationDelay = tDelta + 's';
        }
      }
    }
  }

  componentWillUnmount(){
    interact('#' + this.rowId).unset();

    let eleAnimDiv = document.querySelector('#' + this.rowId + ' div.divRowAudioPlaying');
    if(eleAnimDiv)
      eleAnimDiv.removeEventListener('animationend', this.rowAnimationEnded); 
  }

  rowAnimationEnded = (e) => {
    browsePlayerStop(this.item, e.target);
  }

  selectRow = (e) => {
    //check existing selection
    let ele = document.getElementById('divListBrowseContainer_' + this.browserId).querySelector('.itemSelected');
    if(ele){
      //remove existing row item with selected styling
      if(ele.id !== e.target.id){        
        let loadIcon = ele.querySelector('.divListItemLoadingIcon')
        if(loadIcon)
          loadIcon.style.display = 'none';
        
        ele.classList.remove('itemSelected');
      }
      //stop animation if present
      let prevEleAnim = ele.querySelector('.divRowAudioPlaying');
      if(prevEleAnim){
        prevEleAnim.style.animation = 'none';
      }
    }
    //add selected style to current row item
    if(!e.target.classList.contains('itemSelected')){
      e.target.classList.add('itemSelected');
    }
  }

  rowClick = (e) => {
    let item = this.item;

    if(!bBrowseMenuLoading){
      this.selectRow(e);

      //reset selected items in list
      if(!item.selected){
        this.props.data.list.filter(row => row.selected === true).forEach(r => { 
          r.selected = false;
          r.tStart = undefined;
        });
      }

      //actions and toggles depending on type
      if(item.folder){
        let newDir = (item.dir + '/' + item.name).replace('//','/');
        changeBrowseMenu(newDir, this.browserId);
        toggleBrowseBtnLoad(item, this.browserId);
      }
      else if(item.type === 'instrument' || item.type === 'source' || item.type === 'effect' || item.type === 'component'){
        item.selected = true;
        store.ui[this.browserId].selectFile(item.name);
        toggleBrowseBtnLoad(item, this.browserId);
      }
      else if(item.type === 'sample'){
        if(item.name === '...Import' || item.name === '...Folder' || item.name === '...Record'){
          item.selected = true;
          store.ui[this.browserId].selectFile(item.name);
          toggleBrowseBtnLoad(item, this.browserId);
        }
        else{
          let eleAnim = e.target.querySelector('.divRowAudioPlaying');
          let url = item.dir + '/' + item.name;

          //if same row already selected
          if(item.selected){
            if(browsePlayer.state === 'started'){
              browsePlayerStop(item, eleAnim)
            }
            else if(browsePlayer.loaded && browsePlayer.state === 'stopped'){
              browsePlayerStart(item, eleAnim, e.target);
            }
            else{
              browsePlayer.load(url, () => {
                if(url === store.ui[this.browserId].selectedFile)
                  browsePlayerStart(item, eleAnim, e.target);
              });
            }
          }
          //diff row selected
          else{
            item.selected = true;
            store.ui[this.browserId].selectFile(item.name);

            browsePlayerStop(item, e.target);
            browsePlayer.buffer.dispose();

            //samples folder. audio already saved to DB
            if(url.substr(0,8) === '/Samples'){
              store.DBLoadAudioFile(item.name).then(result => {
                if(result){
                  if(result.data){
                    if(result.data instanceof Blob){
                      let blobUrl = window.URL.createObjectURL(result.data);
                      browsePlayer.load(blobUrl, function(){
                        if(url === store.ui[this.browserId].selectedFile)
                          browsePlayerStart(item, eleAnim, e.target);
                        
                        window.URL.revokeObjectURL(blobUrl);
                      });
                    }
                    else if (Array.isArray(result.data) || result.data instanceof Float32Array) {
                      if(url === store.ui[this.browserId].selectedFile)  
                        browsePlayerStart(item, eleAnim, e.target);
                    }
                  }
                }
              })
            }
            //Library folder - load audio
            else{
              e.target.querySelector('.divListItemLoadingIcon').style.display = 'block';

              store.DBLoadAudioFile(url).then(result => {
                if(result){
                  if(result.data){
                    if(result.data instanceof Blob){
                      let blobUrl = window.URL.createObjectURL(result.data);
                      browsePlayer.load(blobUrl, () => {
                        if(url === store.ui[this.browserId].selectedFile)
                          browsePlayerStart(item, eleAnim, e.target);

                        window.URL.revokeObjectURL(blobUrl);
                      });
                    }
                    else if (Array.isArray(result.data) || result.data instanceof Float32Array) {   
                      browsePlayer.buffer.fromArray(result.data);
                      if(url === store.ui[this.browserId].selectedFile)
                        browsePlayerStart(item, eleAnim, e.target);
                    }
                  }
                }
                else{
                  browsePlayer.load(url, () => {
                    //save as blob because toArray is empty during load above on FF
                    audioBufferToWav(browsePlayer.buffer.get()).then(blob => {
                      store.DBSaveAudioFile({
                        id: url,
                        url: url,
                        duration: browsePlayer.buffer.duration,
                        data: blob
                      }).then(() => {
                        if(url === store.ui[this.browserId].selectedFile)
                          browsePlayerStart(item, eleAnim, e.target);
                      });
                    });
                  });
                }
              })
            }
          }

          toggleBrowseBtnLoad(item, this.browserId);
        }
      }
    }
  }

  render() {
    const { data, index, style } = this.props;
    this.item = data.list[index];
    this.browserId = data.browserId;

    let text, loadIcon, item = this.item;

    let classSelected = '', showLoadIcon = 'none';
    if(item.dir + '/' + item.name === store.ui[this.browserId].selectedFile){
      classSelected = ' itemSelected';

      if(item.type === 'sample' && !browsePlayer.loaded){
        showLoadIcon = 'block';
      }
    }

    if(item.folder || item.type !== 'sample'){
      let iconType = 'audiotrack';

      if(item.folder)
        iconType = 'folder_open';
      else if(item.type === 'effect')
        iconType = 'settings_input_component';
      else if(item.type === 'component')
        iconType = 'equalizer';
      else if(item.type === 'source')
        iconType = 'waves';

      text =  <div style={{pointerEvents: 'none'}}>
                <i className='material-icons menuIcon'>{iconType}</i>
                <label className='lblMain'>{item.name}</label>
              </div>
    }
    else{
      let tokens = item.name.split(' - ');
      text =  <div style={{pointerEvents: 'none'}}>
                <div className='divRowAudioPlaying'></div>
                <label className='lblArtist'>{tokens[0]}</label>
                <label className='lblSong'>{tokens[1]}</label>
              </div>

      loadIcon = <div className='divListItemLoadingIcon' style={{display:showLoadIcon}}>
                    <div className="la-ball-spin-clockwise-fade-rotating la-sm">
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
    }

    if(!this.rowId)
      this.rowId = 'ListBrowse_' + this.browserId + '_row_' + randomId();

    return (
      <div id={this.rowId} className={'ListItem' + classSelected} style={style}>
        { text }
        { loadIcon }
      </div>
    )
  }
}

export const ListBrowser = observer(class ListBrowser extends Component {
  list = [];
  currDir;

  componentDidMount(){}
  componentDidUpdate(prevProps){
    if(prevProps.selectedDir !== this.props.selectedDir){
      browsePlayer.stop();
    }
    /* 
    if(prevProps.selectedFile !== this.props.selectedFile && this.props.selectedFile){
      let item = this.list.find(i => i.selected === true && i.name === this.props.selectedFile);
    }
    */
  }

  btnMainClick = (e) => {
    this.list = [];
    changeBrowseMenu('/', this.props.id)
  }

  btnBackClick = (e) => {
    let tokens = store.ui[this.props.id].selectedDir.split('/').filter(t => t !== '');
    let strDir = '';

    if(tokens.length > 0){
      tokens.forEach((token, idx) => {
        if(idx < tokens.length - 1)
          strDir += '/' + token;
      }) 
    }

    if(!strDir)
      strDir = '/';

    changeBrowseMenu(strDir, this.props.id);
  }

  btnLoadClick = (e) => {
    let item = this.list.find(i => i.selected === true);
    if(item){
      if(!bBrowseMenuLoading){
        if(!item.folder){
          let eleList = document.getElementById('divListBrowseContainer_' + this.props.id);
          if(item.type === 'sample'){
            browsePlayer.stop();
            let eleRow = eleList.querySelector('.itemSelected div.divRowAudioPlaying');
            if(eleRow)
              eleRow.style.animation = 'none';
          }
          procBrowseItem(item, this.props.id);
        }
      }
    }
  }

  filterSection = (dir) => {
    this.list = [];
    let type = 'sample';

    if(dir === '/Instruments' || dir === '/Components' || dir === '/Effects' || dir === '/Sources')
      type = dir.replace('/', '').slice(0, -1).toLowerCase();
  
    newfileTree[dir].folders.forEach(folder  => {
      this.list.push({name: folder, type: type, folder: true, dir: dir, selected: false, tStart: undefined})
    })

    newfileTree[dir].files.forEach(file => {
      this.list.push({name: file, type: type, folder: false, dir: dir, selected: false, tStart: undefined})
    })

    if(dir === '/Samples'){
      type = 'sample';
      store.getAllSamples().forEach(s => {
        this.list.push({name: s.id, type: type, folder: false, dir: dir, selected: false, tStart: undefined})

        s.regions.forEach(r => {
          this.list.push({name: r.id, type: type, folder: false, dir: dir, selected: false, tStart: undefined})
        })
      })
    }
  }

  importFile = (e) => {
    let file = e.target.files[0];
  
    if(file){
      if(file.type.split('/')[0] === "audio"){
       // let fileName = file.name;
        let sampleId = 'sample_' + randomId();
        //let sampleUrl = '/';
        //let sampleSize = file.size;
        
        store.DBSaveAudioFile({
          id: sampleId,
          url: '',
          duration: undefined,
          data: file
        }).then(() => {
          store.addSample(sampleId, '', undefined, [], undefined);
        });
      }
    }
  }
  
  render() {
    if(this.currDir !== this.props.selectedDir || this.props.selectedDir === '/Samples'){
      this.currDir = this.props.selectedDir;
      this.filterSection(this.props.selectedDir);
    }

    let list = this.list;
    let browserId = this.props.id;

    return (
      <div className='divBrowseMainContainer'>
        <div id={'divBrowseHdr_' + browserId} className='divListBrowseHdrContainer'>
          <button id={'btnBrowseBack_' + browserId} className='btnBrowseHdrIcon btnBrowseBack' onClick={this.btnBackClick}>
            <i className='material-icons'>arrow_back</i>
          </button>
          <button id={'btnBrowseLoad_' + browserId} className='btnBrowseHdrIcon btnBrowseLoad' onClick={this.btnLoadClick}>
            <i className='material-icons'>open_in_browser</i>
          </button>
          <button id={'btnBrowseHome_' + browserId} className='btnBrowseHdrIcon btnBrowseHome' onClick={this.btnMainClick}>
            <i className='material-icons'>home</i>
          </button>

          <input id={"inputFile_" + browserId} type="file" accept="audio/*" onChange={this.importFile} multiple style={{display:'none'}}/>
          <input id={"inputFolder_" + browserId} type="file" accept="audio/*" onChange={this.importFolder} multiple mozdirectory="" webkitdirectory="" directory="" style={{display:'none'}}/>
          {/* 
            <button id='btnBrowseSearch' className='btnBrowseHdrIcon' onClick={this.btnBackClick}>
              <i className='material-icons'>search</i>
            </button>
          
            <input id='inputSearch' onInput={this.onInput} style={{float:'right'}}></input>
            <button style={{float:'right'}} onClick={this.loadClick}>LOAD</button> 
          */}
        </div>
        <div id={'divListBrowseContainer_' + browserId} className='divBrowseListContainer'>
          <AutoSizer>
            {({ height, width }) => (
              <List
                className='List'
                height={height}
                itemCount={this.list.length}
                itemData={{list, browserId}}
                itemSize={35}
                width={width} 
              >
              {Row}
              </List>
            )}
          </AutoSizer>
        </div>
      </div>
    );
  }
})