import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from "../../data/store.js";
import interact from 'interactjs';
import Tone from 'tone';
import { randomId } from '../../models/models.js';
import { applyDraggableGrid } from '../utils.js';
import { TrackRowView } from './trackrow/trackrow.js';
import { MixRowView } from './trackrow/mixrow.js';
import { MixRowViewEdit } from './trackrow/mixrowedit.js';
import { GridTimeline } from './timeline/timeline.js';


export const EditView = observer(class EditView extends Component {
  componentDidMount(){}
  componentDidUpdate(prevProps){}
  componentWillUnmount(){}
  
  render(){
    let content;
    if(this.props.editViewMode === 'graph'){
      content = <EditViewGraph 
                    store={this.props.store}
                    track={this.props.track}
                    edit={this.props.edit}
                    windowHeight={this.props.windowHeight} 
                    windowWidth={this.props.windowWidth}
                  />
    }
    else {
      content = <EditViewBars
                    store={this.props.store}
                    track={this.props.track}
                    selectedNote={this.props.store.ui.selectedNote}
                    viewLength={this.props.store.ui.viewLength}
                    sceneLength={store.getSceneLength(this.props.store.ui.selectedScene.id)}
                  />               
    }

    return (
        <div>
          { content }
        </div>
    )
  }
});

const EditViewBars = observer(class EditViewBars extends Component {
  strSVG;

  componentDidMount(){
    applyDraggableGrid();
    store.ui.calibrateSizes(true, true);
  }
  componentDidUpdate(prevProps){
    if(prevProps.sceneLength !== this.props.sceneLength){
      store.ui.calibrateSizes(true)
    }
  }
  componentWillUnmount(){
    interact(document.querySelector('body')).unset();
    interact('#gridContainer').unset();
  }

  setSVG = (svg) => {
    this.strSVG = svg;
    this.forceUpdate();
  }

  render(){
    let mixRow;
    if(this.props.selectedNote){
      if(this.props.selectedNote.getPattern().track.id === this.props.track.id){
        mixRow = <MixRowViewEdit trackId={this.props.track.id} store={this.props.store} track={this.props.track} note={this.props.selectedNote} viewLength={this.props.viewLength}/>
      }
    }
    else{
      mixRow = <MixRowView store={this.props.store} track={this.props.track} viewLength={this.props.viewLength}/>
    }

    let numMeasures = 0;
    let tracks = [];
    if(store.ui.selectedScene){
      let sceneLength = Tone.Time(store.getSceneLength(this.props.store.ui.selectedScene.id)).toBarsBeatsSixteenths();
      numMeasures = sceneLength.split(':')[0];
    }
    
    let track = this.props.track;
    for(let i=1; i<=numMeasures; i++){
      tracks.push(<TrackRowView key={track.id + '_' + i} 
          keyValue={track.id} store={this.props.store} 
          sample={track.sample} 
          region={track.returnRegion()} 
          patterns={this.props.store.getPatternsByTrack(track.id)} 
          scenes={this.props.store.getScenesAsc()} 
          mixMode={this.props.store.ui.mixMode}
          viewLength={this.props.store.ui.viewLength} 
          songLength={this.props.store.getSongLength()} 
          bpm={this.props.store.settings.bpm} 
          /* notes={this.props.store.getNotesByTrack(track.id)} */
          selectedScene={this.props.store.ui.selectedScene} 
          track={track} 
          selectedGroup={this.props.store.ui.selectedGroup} 
          playbackRate={track.getPlaybackRate} 
          selectedTrack={this.props.store.ui.selectedTrack} 
          selectedNote={this.props.store.ui.selectedNote} 
          selectedNoteValue={this.props.store.ui.getSelectedNoteValue()}
          selectedPattern={this.props.store.ui.selectedPattern} 
          selectedPatternRes={this.props.store.ui.getSelectedPatternProp('resolution')} 
          selectedPatternNotes={this.props.store.ui.getSelectedPatternProp('notes')}
          selectedKey={this.props.store.ui.selectedKey}
          windowWidth={this.props.store.ui.windowWidth}
          bar={i}
          selectedNoteDuration={this.props.store.ui.getSelectedNoteDuration()}
          selectedNoteOffset={this.props.store.ui.getSelectedNoteOffset()}
          strSVG={this.strSVG}
          setSVG={this.setSVG}
        />)
    }

    let sizes = store.ui.getGridSizes();
    return(
      <div style={{top:'40px', position:'relative'}}>
        { mixRow }
        <div id="gridParent" style={{width: sizes.parent.width, left: sizes.parent.left}}>
          <div className="divBody" id="gridContainer" style={{width: sizes.container.width, left: sizes.container.left}}>
            <GridTimeline selectedScene={this.props.store.ui.selectedScene} ui={this.props.store.ui} windowWidth={this.props.store.ui.windowWidth}/>
            { tracks.map(t => t) }
          </div>
        </div>
      </div>
    )
  }
})

const EditViewGraph = observer(class EditViewGraph extends Component {
    mousePosX;
    mousePosY;
    drawingLine;
    activeObj;
    hoverObj;
    //hardcoded css styles for width/height/top/bottom/
    objSize = {width: this.props.windowWidth * 0.07, height: (this.props.windowHeight - 150 - 80) * 0.1 };
  
    componentDidMount(){
      applyDraggableGrid();
      //this.props.store.ui.calibrateSizes();
      this.drawingLine = false;
      
      //TODO: replace with interact event for divEditViewBG only
      document.addEventListener('mouseup', this.mouseUp);
      document.addEventListener('touchend', this.mouseUp);
      document.addEventListener('mousedown', this.mouseDown);
      document.addEventListener('touchstart', this.touchStart);
      document.addEventListener('mousemove', this.mouseMove);
      document.addEventListener('touchmove', this.touchMove);
  
      if(!store.ui.editMode)
        store.ui.toggleEditMode();

      this.objSize.width = this.props.windowWidth * 0.07;
      //diveditbg has top and bottom set
      this.objSize.height = (this.props.windowHeight - 150 - 80) * 0.1;

      this.refreshConnections();
      this.toggleDeleteButtons();
    }
  
    componentDidUpdate(prevProps){
      if(prevProps.windowHeight !== this.props.windowHeight || prevProps.windowWidth !== this.props.windowWidth){
        this.objSize.width = this.props.windowWidth * 0.07;
        this.objSize.height = (this.props.windowHeight - 150 - 80) * 0.1;

        //call element drag event to refresh positions
        document.querySelectorAll('#divEditViewBG > div').forEach(ele => {
          interact('#' + ele.id).fire({ type: 'dragmove', target: ele });
        });
      }

      this.refreshConnections();
      this.toggleDeleteButtons();
    }
  
    toggleDeleteButtons = () => {
      if(!this.props.edit){
        let btns = document.getElementsByClassName("btnEditViewDelete");
        for(let i=0; i<btns.length; i++)
          btns[i].style.display = 'block';
      }
      else{
        let btns = document.getElementsByClassName("btnEditViewDelete");
        for(let i=0; i<btns.length; i++)
          btns[i].style.display = 'none';
      }
    }
  
    mouseUp = (evt) => {
      if(!this.props.edit && this.drawingLine && this.mousePosX && this.mousePosY){
        let ele = document.elementFromPoint(this.mousePosX, this.mousePosY);
        if(ele){
          if(ele.id){
            this.activateObj(ele.id, 'up');
          }
        }
      }
  
      this.drawingLine = false;
      if(document.getElementById('canvasLineBG'))
        document.getElementById('canvasLineBG').remove();


      store.getObjsByTrackObj(this.props.track).forEach(o => {
        let ele = document.getElementById(o.id);
        if(ele){
          if(ele.classList.contains('divEditViewObjEnabled'))
            ele.classList.remove('divEditViewObjEnabled');
          if(ele.classList.contains('divEditViewObjHover'))
            ele.classList.remove('divEditViewObjHover');
        }
      })
    }
  
    mouseDown = (evt) => {
      this.mousePosX = evt.pageX;
      this.mousePosY = evt.pageY;
    }
  
    touchStart = (evt) => {
      this.mousePosX = evt.touches[0].pageX;
      this.mousePosY = evt.touches[0].pageY;
    }
  
    mouseMove = (evt) => {
      if(this.drawingLine){
        this.mousePosX = evt.pageX;
        this.mousePosY = evt.pageY;
        this.drawConnection();

        if(this.hoverObj){
          let ele = document.elementFromPoint(this.mousePosX, this.mousePosY);
          if(ele)
            this.activateObj(ele.id, 'over')
        }
      }
    }
  
    touchMove = (evt) => {
      evt.preventDefault(); //prevents position offset on ios safari
  
      if(this.drawingLine){
        this.mousePosX = evt.touches[0].pageX;
        this.mousePosY = evt.touches[0].pageY;
        this.drawConnection();
      }
    }
  
    componentWillUnmount(){
      interact(document.querySelector('body')).unset();
      interact('#gridContainer').unset();

      document.removeEventListener('mouseup', this.mouseUp);
      document.removeEventListener('touchend', this.mouseUp);
      document.removeEventListener('mousemove', this.mouseMove);
      document.removeEventListener('touchmove', this.touchMove);
      document.removeEventListener('mousedown', this.mouseDown);
      document.removeEventListener('touchstart', this.touchStart);
    }
  
    activateObj = (id, action) => {
      let self = this;

      //remove tags from nested elements if part of id
      id = id.replace('canvas_','');
      id = id.replace('label_','');
  
      if(id && action === "down"){
        this.drawingLine = true;
        this.activeObj = id;

        store.getObjsByTrackObj(this.props.track).filter(o => o.id.split('_')[0] !== 'mix' && o.id !== id).forEach(o => {
          let type = store.getObjTypeByIdTrack(o.id, self.props.track.id);
          if((type === "effect" || type === "component") && o.id.split('_')[0] !== "tinysynth"){

            if(!store.getConnectionsByObjId(this.activeObj).find(c => c.src === this.activeObj && c.dest === o.id))
              document.getElementById(o.id).classList.add('divEditViewObjEnabled');
          }
        })
      }
      else if(id !== this.activeObj && action === "up" 
        && store.getObjsByTrackObj(this.props.track).find(o => o.id === id)){
  
          let srcType = store.getObjTypeByIdTrack(this.activeObj, this.props.track.id);
          let destType = store.getObjTypeByIdTrack(id, this.props.track.id);
  
          //dest must be component or effect
          if((destType === "effect" || destType === "component") && id.split('_')[0] !== "tinysynth"){
            //is there already a connection?
            if(!store.getConnectionsByObjId(this.activeObj).find(c => c.src === this.activeObj && c.dest === id)){
              let connId = 'connection_' + randomId();
              store.addConnection(connId, this.props.track.id, this.activeObj, id, srcType, destType);
            }
          }
      }
      //hover on connect mode
      else if(action === "over" && id !== this.hoverObj && id !== this.activeObj && this.drawingLine){
        let ele = document.getElementById(id);
        if(ele){
          //hover id is tone obj && not connected
          let destType = store.getObjTypeByIdTrack(id, this.props.track.id);
          if((destType === "effect" || destType === "component") && id.split('_')[0] !== "tinysynth"
            && !store.getConnectionsByObjId(this.activeObj).find(c => c.src === this.activeObj && c.dest === id)){

              //remove hover style from prev ele
              let elePrev = document.getElementById(this.hoverObj);
              if(elePrev){
                if(elePrev.classList.contains('divEditViewObjHover'))
                  elePrev.classList.remove('divEditViewObjHover');
              }

              if(!ele.classList.contains('divEditViewObjHover'))
                document.getElementById(id).classList.add('divEditViewObjHover');

              this.hoverObj = id;
          }
          //hover id is not tone obj
          else{
            //remove hover class from prev ele
            let elePrev = document.getElementById(this.hoverObj);
            if(elePrev){
              if(elePrev.classList.contains('divEditViewObjHover'))
                elePrev.classList.remove('divEditViewObjHover');
            }

            this.hoverObj = undefined;
          }
        
        }
      }
    }
  
    drawConnection = (connection) => {
      //TODO: set these once for better perf?
      let ele1, ele2, eleBG, ctx, hw, hh, x1, x2, y1, y2, drawX1, drawX2, drawY1, drawY2, eleDelete;
  
      if(connection){
        ele1 = document.getElementById(connection.src);
        ele2 = document.getElementById(connection.dest);
        eleBG = document.getElementById(connection.id);
        eleDelete = document.getElementById('delete_' + connection.id)
  
        if(!eleDelete){
          eleDelete = document.createElement('button');
          eleDelete.setAttribute("id", "delete_" + connection.id);
          eleDelete.setAttribute("class", "btnEditViewDelete");
          eleDelete.innerHTML = 'X';
          eleDelete.onclick = this.btnDeleteConnection;
          document.getElementById('divEditViewBG').appendChild(eleDelete);
        }
        
        hw = this.objSize.width / 2;
        hh = this.objSize.height / 2;
  
        x1 = (parseFloat(ele1.getAttribute('data-x')) || 0);
        x2 = (parseFloat(ele2.getAttribute('data-x')) || 0);
        y1 = (parseFloat(ele1.getAttribute('data-y')) || 0);
        y2 = (parseFloat(ele2.getAttribute('data-y')) || 0);
      }
      else{
        ele1 = document.getElementById(this.activeObj);
        eleBG = document.getElementById('canvasLineBG');
  
        if(!eleBG){
          eleBG = document.createElement('canvas');
          eleBG.setAttribute("id", "canvasLineBG");
          eleBG.setAttribute("style", "position:absolute; top:30%; left:45%; z-index:2;");
          document.getElementById('divEditViewBG').appendChild(eleBG);
        }
        
        hw = 0;
        hh = 0;
  
        x1 = (parseFloat(ele1.getAttribute('data-x')) || 0) + (this.objSize.width / 2);
        y1 = (parseFloat(ele1.getAttribute('data-y')) || 0) + (this.objSize.height / 2);

        //x2 = this.mousePosX - eleBG.offsetLeft;
        //y2 = this.mousePosY - eleBG.offsetTop - 150;
        //ugly, fast, sloppy... but better than a redraw
        x2 = this.mousePosX - (store.ui.windowWidth * 0.45);
        y2 = this.mousePosY - ((store.ui.windowHeight - 150 - 80) * 0.3) - 150;
      }
      
      x1 = Math.round(x1);
      x2 = Math.round(x2);
      y1 = Math.round(y1);
      y2 = Math.round(y2);
      
      if(x1 > x2){
        eleBG.style.width = (x1 - x2) + 'px';
        if(y1 > y2){
          eleBG.style.height = (y1 - y2) + 'px';
          eleBG.style.webkitTransform = eleBG.style.transform = 'translate(' + (x2 + hw) + 'px, ' + (y2 + hh) + 'px)';
          drawY1 = parseInt(eleBG.style.height.replace('px',''), 10);
          drawY2 = 0;
        }
        else if(y1 <= y2){
          eleBG.style.height = (y2 - y1) + 'px';
          eleBG.style.webkitTransform = eleBG.style.transform = 'translate(' + (x2 + hw) + 'px, ' + (y1 + hh) + 'px)';
          drawY1 = 0;
          drawY2 = parseInt(eleBG.style.height.replace('px',''), 10);
        }
        drawX1 = parseInt(eleBG.style.width.replace('px',''), 10);
        drawX2 = 0;
      }
      else if(x1 < x2){
        eleBG.style.width = (x2 - x1) + 'px';
        if(y1 > y2){
          eleBG.style.height = (y1 - y2) + 'px';
          eleBG.style.webkitTransform = eleBG.style.transform = 'translate(' + (x1 + hw) + 'px, ' + (y2 + hh) + 'px)';
          drawY1 = parseInt(eleBG.style.height.replace('px',''), 10);
          drawY2 = 0;
        }
        else if(y1 <= y2){
          eleBG.style.height = (y2 - y1) + 'px';
          eleBG.style.webkitTransform = eleBG.style.transform = 'translate(' + (x1 + hw) + 'px, ' + (y1 + hh) + 'px)';
          drawY1 = 0;
          drawY2 = parseInt(eleBG.style.height.replace('px',''), 10);
        }
        drawX1 = 0;
        drawX2 = parseInt(eleBG.style.width.replace('px',''), 10);
      }
  
      if(x1 === x2 || y1 === y2){
       eleBG.style.backgroundColor = 'white';

        if(y1 === y2)
          eleBG.style.height = '1px';
        if(x1 === x2)
          eleBG.style.width = '1px';
      }
      else{
        if(eleBG.style.backgroundColor === 'white')
          eleBG.style.backgroundColor = 'transparent';
      }
  
      //center delete button over BG using transform
      // change to regex
      if(connection && !this.props.edit){
        let strTrans = eleBG.style.transform.replace("translate(","");
        strTrans = strTrans.replace(")","");
        strTrans = strTrans.trim();
        strTrans = strTrans.replace("px","");
        strTrans = strTrans.replace("px","");
        strTrans = strTrans.split(",");
  
        if(strTrans[0])
          strTrans[0] = strTrans[0].replace('px','');
        if(strTrans[1])
          strTrans[1] = strTrans[1].replace('px','');
        
        let hWidth = (eleBG.style.width.replace('px','') / 2) - 13;
        let hHeight = (eleBG.style.height.replace('px','') / 2) - 13;

        eleDelete.style.webkitTransform = eleDelete.style.transform = 'translate(' + (parseInt(strTrans[0], 10) + hWidth) + 'px, ' + (parseInt(strTrans[1], 10) + hHeight) + 'px)';
      }
  
      if(eleBG && !isNaN(drawX1) && !isNaN(drawY1) && !isNaN(drawX2) && !isNaN(drawY2)){
        ctx = eleBG.getContext("2d");
        ctx.canvas.width = eleBG.style.width.replace('px','');
        ctx.canvas.height = eleBG.style.height.replace('px', '');
        ctx.clearRect(0, 0, eleBG.width, eleBG.height);

        let grad = ctx.createLinearGradient(drawX1, drawY1, drawX2, drawY2);
        grad.addColorStop(0, "white");
        grad.addColorStop(1, "#202020");
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(drawX1, drawY1);
        ctx.lineTo(drawX2, drawY2);
        ctx.stroke();
      }
    }

    btnDeleteConnection = (e) => {
      //remove connection and button
      let connId = e.target.id.replace("delete_","");
      if(store.getConnection(connId)){
        store.delConnection(connId);
      }
    }
  
    refreshConnections = () => {
      let self = this;
      store.getConnectionsByTrack(this.props.track.id)
        .filter(c => (c.src !== "master" && c.dest !== "master" 
          && c.src.split('_')[0] !== "mix" && c.dest.split('_')[0] !== "mix"
          && c.dest !== 'panvol_master'))
            .forEach(function(connection){
              self.drawConnection(connection);
      })
    }
    
    render() {
      let trackRow = null;
  
      if(this.props.track){
        let track = this.props.track;
        
        trackRow = <TrackRowView key={track.id} 
          keyValue={track.id} store={this.props.store} 
          sample={track.sample} 
          region={track.returnRegion()} 
          patterns={this.props.store.getPatternsByTrack(track.id)} 
          scenes={this.props.store.getScenesAsc()} 
          mixMode={this.props.store.ui.mixMode}
          viewLength={this.props.store.ui.viewLength} 
          songLength={this.props.store.getSongLength()} 
          bpm={this.props.store.settings.bpm} 
          /* notes={this.props.store.getNotesByTrack(track.id)} */
          selectedScene={this.props.store.ui.selectedScene} 
          track={track} 
          selectedGroup={this.props.store.ui.selectedGroup} 
          playbackRate={track.getPlaybackRate} 
          selectedTrack={this.props.store.ui.selectedTrack} 
          selectedNote={this.props.store.ui.selectedNote} 
          selectedNoteValue={this.props.store.ui.getSelectedNoteValue()} 
          selectedPattern={this.props.store.ui.selectedPattern} 
          selectedPatternRes={this.props.store.ui.getSelectedPatternProp('resolution')} 
          selectedPatternNotes={this.props.store.ui.getSelectedPatternProp('notes')}
          selectedKey={this.props.store.ui.selectedKey}
          windowWidth={this.props.store.ui.windowWidth}
          selectedNoteDuration={this.props.store.ui.getSelectedNoteDuration()}
          selectedNoteOffset={this.props.store.ui.getSelectedNoteOffset()}
        />
      }

      let timeline, playhead;
      if(this.props.track.type !== 'master'){
        timeline = <GridTimeline selectedScene={this.props.store.ui.selectedScene} ui={this.props.store.ui} windowWidth={this.props.store.ui.windowWidth}/>
        playhead = <div className="progressLine" id="playhead"></div>;
      }

      let cssCursor = '';
      if(!this.props.edit)
        cssCursor = 'cursorCrosshair'

      let sizes = store.ui.getGridSizes();
      return (
        <div id="gridParent" style={{width: sizes.parent.width, left: sizes.parent.left}}>
          <div className="divBody" id="gridContainer" style={{width: sizes.container.width, left: sizes.container.left}}>
            { timeline }
            { playhead }
            { trackRow }
          </div>
          <div id='divEditViewBG' className={cssCursor} style={{width: store.ui.windowWidth + 'px'}}>
            { /* save for later? <canvas id="canvasEditViewBG" style={{backgroundColor: 'white', width:'100%', height:'100%', position:'fixed'}}></canvas> */ }
            { store.instruments.getAllByTrack(this.props.track.id).filter(o => o.id.split('_')[0] !== "mix" && o.id.split('_')[0] !== "tinysynth").map((obj, index) => 
              <EditViewObj key={obj.id} index={index} obj={obj} edit={this.props.edit} active={this.activateObj} drawConnection={this.drawConnection} selectedObj={this.props.store.ui.selectedObj}/>) }
            { store.components.getAllByTrack(this.props.track.id).filter(o => o.id.split('_')[0] !== "mix").map((obj, index) => 
              <EditViewObj key={obj.id} index={index} obj={obj} edit={this.props.edit} active={this.activateObj} drawConnection={this.drawConnection} selectedObj={this.props.store.ui.selectedObj}/>) }
            { store.effects.getAllByTrack(this.props.track.id).filter(o => o.id.split('_')[0] !== "mix").map((obj, index) => 
              <EditViewObj key={obj.id} index={index} obj={obj} edit={this.props.edit} active={this.activateObj} drawConnection={this.drawConnection} selectedObj={this.props.store.ui.selectedObj}/>) }
            { store.sources.getAllByTrack(this.props.track.id).filter(o => o.id.split('_')[0] !== "mix").map((obj, index) => 
              <EditViewObj key={obj.id} index={index} obj={obj} edit={this.props.edit} active={this.activateObj} drawConnection={this.drawConnection} selectedObj={this.props.store.ui.selectedObj}/>) }
            { store.getConnectionsByTrack(this.props.track.id)
                .filter(c => (c.src !== "master" && c.dest !== "master" 
                && c.src.split('_')[0] !== "mix" && c.dest.split('_')[0] !== "mix"
                && c.dest !== 'panvol_master')) 
                  .map((obj, index) => <EditViewConnection key={obj.id} index={index} connection={obj}/>) }
          </div>
        </div>
      )
    }
  })
  

  const EditViewConnection = observer(class EditViewConnection extends Component {
    connId;
  
    componentDidMount(){
      this.connId = this.props.connection.id;
    }
  
    componentWillUnmount(){
      document.getElementById("delete_" + this.connId).remove();
    }
  
    render() {
      return(
        <canvas id={this.props.connection.id} style={{position:'absolute',top:'30%',left:'45%', zIndex:2}}></canvas>
      )
    }
  })
  
  const EditViewObj = observer(class EditViewObj extends Component {
    x;
    y;
  
    componentDidMount(){
      this.setInteract();
      this.applyObjCoords();
    }
  
    applyObjCoords = () => {
      let ele = document.getElementById(this.props.obj.id);
      let relX = this.props.obj.ui.x, relY = this.props.obj.ui.y, absX = 0, absY = 0;
  
      //convert relative to abs
      //bg div is separated into 4 quadrants
      if(relY <= 0){
        absY = (ele.offsetTop * (relY * -1) / 100) - ele.offsetTop;
      }
      else if(relY > 0){
        absY = (relY * (document.getElementById('divEditViewBG').offsetHeight - ele.offsetTop - ele.offsetHeight)) / 100;
      }
  
      if(relX < 0){
        absX = ((relX  * (store.ui.windowWidth / 2)) / 100) + (ele.offsetWidth / 2);
      }
      else if(relX >= 0){
        absX = (relX  * (store.ui.windowWidth / 2)) / 100;
      }
  
      ele.style.webkitTransform = ele.style.transform  = 'translate(' + absX + 'px, ' + absY  + 'px)';
      ele.setAttribute('data-x', absX);
      ele.setAttribute('data-y', absY);
    }
  
    componentWillUnmount(){
      if(interact.isSet('#' +  this.props.obj.id))
        interact('#' +  this.props.obj.id).unset();
    }
  
    componentDidUpdate(prevProps, prevState, snapshot){
      if(prevProps.edit !== this.props.edit)
        interact('#' + this.props.obj.id).styleCursor(this.props.edit);
    }
    
    setInteract = () => {
      let self = this;

      interact('#' + this.props.obj.id).draggable({
        onmove: self.dragObj,
        onend: self.dragEnd,
        restrict: {
          restriction: 'parent',
          elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
        },
      }).on('down', function(event) {
        if(self.props.edit){
          store.ui.selectObj(self.props.obj.id);
          event.preventDefault();
        }
        else{
          store.ui.selectObj(self.props.obj.id);

          //ignore panvols except for master group panvols
          if(self.props.obj.id.split('_')[0] === 'panvol'){
            ['master','A','B','C','D'].some(group => {
              if(self.props.obj.id === 'panvol_' + group){
                self.props.active(self.props.obj.id, 'down');
                return true;
              }
              return false;
            })
          }
          else
            self.props.active(self.props.obj.id, 'down');
        }
      }).on('move', function (event){
          if(!self.props.edit)
            self.props.active(event.target.id, 'over');
      });

      interact('#' + this.props.obj.id).styleCursor(this.props.edit);
    }
    
    dragObj = (event) => {
      let self = this;
      let target = event.target;

      this.x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
      this.y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
      
      //fire event called on window resize in parent
      if(isNaN(this.x) || isNaN(this.y)){
        this.applyObjCoords();
        return;
      }
      
      if(this.props.edit){
        target.style.webkitTransform = target.style.transform = 'translate(' + this.x + 'px, ' + this.y + 'px)';
        
        target.setAttribute('data-x', this.x);
        target.setAttribute('data-y', this.y);

        store.getConnectionsByObjId(self.props.obj.id)
          .filter(c => (c.src !== "master" && c.dest !== "master"  
            && c.src.split('_')[0] !== "mix" && c.dest.split('_')[0] !== "mix"
            && c.dest !== 'panvol_master'))
              .forEach(function(connection){
                self.props.drawConnection(connection);
        })
      }
    }

    dragEnd = (event) => {
      if(this.props.edit){
        let target = event.target;

        //save relative coordinates
        //BG div is separated into 4 quadrants
        let relX = 0, relY = 0;

        if(this.y < 0){
          relY = ((target.offsetTop - Math.round(this.y * -1)) / target.offsetTop) * (100 * -1);
        }
        else if(this.y >= 0){
          relY = (Math.round(this.y) / (document.getElementById('divEditViewBG').offsetHeight - target.offsetTop - target.offsetHeight)) * 100;
        }

        if(this.x < 0){
          relX = (((Math.round(this.x) - (target.offsetWidth / 2)) / (store.ui.windowWidth / 2))) * 100;
        }
        else if(this.x >= 0){
          relX = (Math.round(this.x) / (store.ui.windowWidth / 2)) * 100;
        }

        //update UI model
        this.props.obj.ui.setCoords(relX, relY)
      }
    }
  
    render() {
      let cName = 'divEditViewObj';
      if(this.props.selectedObj === this.props.obj.id)
        cName = 'divEditViewObjSelected';

      if(!this.props.edit)
        cName = cName + ' ' + ' cursorCrosshair';
  
      //text label. master track panvols display group our 'out'
      let text = this.props.obj.id.split('_')[0];
      if(store.ui.selectedTrack)
        if(store.ui.selectedTrack.type === "master")
          if(text === "panvol"){
            text = this.props.obj.id.split('_')[1];
            if(this.props.obj.id.split('_')[2])
              text = "out"
          }
  
      return(
        <div id={this.props.obj.id} className={cName}>
          <canvas id={'canvas_' + this.props.obj.id} className="canvasEditViewObj"></canvas>
          <label id={'label_'+ this.props.obj.id} className="labelEditViewObj">{text}</label>
        </div>
      )
    }
  })
  