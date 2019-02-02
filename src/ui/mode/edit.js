import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from "../../data/store.js";
import interact from 'interactjs';
import { randomId } from '../../models/models.js';
import { applyDraggableGrid } from '../utils.js';
import { TrackRowView } from './trackrow/trackrow.js';
import { GridTimeline } from './timeline/timeline.js';


export const EditView = observer(class EditView extends Component {
    mousePosX;
    mousePosY;
    drawingLine;
    activeObj;
  
    componentDidMount(){
      applyDraggableGrid();
      this.props.store.ui.calibrateSizes();
  
      this.drawingLine = false;
  
      document.addEventListener('mouseup', this.mouseUp);
      document.addEventListener('touchend', this.mouseUp);
      document.addEventListener('mousedown', this.mouseDown);
      document.addEventListener('touchstart', this.touchStart);
      document.addEventListener('mousemove', this.mouseMove);
      document.addEventListener('touchmove', this.touchMove);
  
      this.refreshConnections();
      this.toggleDeleteButtons();
  
      if(!store.ui.editMode)
        store.ui.toggleEditMode();
    }
  
    componentDidUpdate(prevProps, prevState, snapshot){
      this.refreshConnections();
      this.toggleDeleteButtons();
  
      //store.ui.calibrateSizes();
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
      }
    }
  
    touchMove = (evt) => {
      evt.preventDefault(); //prevents offset on ios safari
  
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
      id = id.replace('canvas_',"");
      id = id.replace('label_',"");
  
      if(id && action === "down"){
        this.drawingLine = true;
        this.activeObj = id;
      }
      else if(id !== this.activeObj && action === "up" 
        && store.getObjsByTrackObj(this.props.track).find(o => o.id === id)){
  
          let srcType = store.getObjTypeByIdTrack(this.activeObj, this.props.track.id);
          let destType = store.getObjTypeByIdTrack(id, this.props.track.id);
  
          //dest must be component or effect
          if(destType === "effect" || destType === "component"){
            //is there already a connection?
            if(!store.getConnectionsByObjId(this.activeObj).find(c => c.src === this.activeObj && c.dest === id)){
              let connId = 'connection_' + randomId();
              store.addConnection(connId, this.props.track.id, this.activeObj, id, srcType, destType);
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
        
        hw = ele1.offsetWidth / 2;
        hh = ele1.offsetHeight / 2;
  
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
  
        x1 = (parseFloat(ele1.getAttribute('data-x')) || 0) + (ele1.offsetWidth / 2);
        x2 = this.mousePosX - eleBG.offsetLeft;
        y1 = (parseFloat(ele1.getAttribute('data-y')) || 0) + (ele1.offsetHeight / 2);
        // apply Y offset here ( -150 ) 
        y2 = this.mousePosY - eleBG.offsetTop - 150;
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
        else if(y1 < y2){
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
        else if(y1 < y2){
          eleBG.style.height = (y2 - y1) + 'px';
          eleBG.style.webkitTransform = eleBG.style.transform = 'translate(' + (x1 + hw) + 'px, ' + (y1 + hh) + 'px)';
          drawY1 = 0;
          drawY2 = parseInt(eleBG.style.height.replace('px',''), 10);
        }
        drawX1 = 0;
        drawX2 = parseInt(eleBG.style.width.replace('px',''), 10);
      }
  
      //show line when 1 px height or width
      if(x1 === x2 || y1 === y2){
        eleBG.style.backgroundColor = 'white';
      }
      else{
        if(eleBG.style.backgroundColor === 'white')
          eleBG.style.backgroundColor = 'transparent';
      }
  
  
      //center delete button over BG using transform
      // change to regex
      if(connection){
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
  
        let hWidth = (eleBG.offsetWidth / 2) ,
            hHeight = (eleBG.offsetHeight / 2);
  
        eleDelete.style.webkitTransform = eleDelete.style.transform = 'translate(' + (parseInt(strTrans[0], 10) + hWidth) + 'px, ' + (parseInt(strTrans[1], 10) + hHeight) + 'px)';
      }
  
      if(eleBG){
        ctx = eleBG.getContext("2d");
        //ctx.canvas.width = eleBG.style.width.replace('px','');
        //ctx.canvas.height = eleBG.style.height.replace('px', '');
        ctx.canvas.width = eleBG.style.width.replace('px','');
        ctx.canvas.height = eleBG.style.height.replace('px', '');
        ctx.clearRect(0, 0, eleBG.width, eleBG.height);
  
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(drawX1, drawY1);
        ctx.lineTo(drawX2, drawY2);
       // this.drawArrow(ctx, drawX1, drawY1, drawX2, drawY2);
        ctx.stroke();
      }
    }
  
    // this doesn't look good. not using for now, but keeping for later
    drawArrow = (context, fromx, fromy, tox, toy) => {
      let headlen = 10;   // length of head in pixels
      let angle = Math.atan2(toy-fromy,tox-fromx);
      context.strokeStyle = '#ffffff';
      context.moveTo(fromx, fromy);
      context.lineTo(tox, toy);
      context.lineTo(tox-headlen*Math.cos(angle-Math.PI/6),toy-headlen*Math.sin(angle-Math.PI/6));
      context.moveTo(tox, toy);
      context.lineTo(tox-headlen*Math.cos(angle+Math.PI/6),toy-headlen*Math.sin(angle+Math.PI/6));
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
    
        if(!this.props.store.ui.mixMode)
          this.props.store.ui.toggleMixMode();
  
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
          playbackRate={track.getPlaybackRate()} 
          selectedTrack={this.props.store.ui.selectedTrack} 
          selectedNote={this.props.store.ui.selectedNote} 
          selectedNoteValue={this.props.store.ui.getSelectedNoteValue()} 
          selectedPattern={this.props.store.ui.selectedPattern} 
          selectedPatternRes={this.props.store.ui.getSelectedPatternProp('resolution')} 
          selectedPatternNotes={this.props.store.ui.getSelectedPatternProp('notes')}
          selectedKey={this.props.store.ui.selectedKey}/>
      }
  
      let sizes = store.ui.getGridSizes();
      return (
        <div id="gridParent" style={{width: sizes.parent.width, left: sizes.parent.left}}>
          <div className="divBody" id="gridContainer" style={{width: sizes.container.width, left: sizes.container.left}}>
            <GridTimeline selectedScene={this.props.store.ui.selectedScene} ui={this.props.store.ui} windowWidth={this.props.store.ui.windowWidth}/>
            <div className="progressLine" id="playhead"></div>
            { trackRow }
          </div>
          <div id='divEditViewBG' style={{width: store.ui.windowWidth + 'px'}}>
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
    objId;
  
    componentDidMount(){
      this.props.edit ? this.enableDrag() : this.enableConnect();
      this.objId = this.props.obj.id;
  
      this.applyObjCoords();
    }
  
    applyObjCoords = () => {
      let ele = document.getElementById(this.props.obj.id);
      let relX = this.props.obj.ui.x, relY = this.props.obj.ui.y, absX = 0, absY = 0;
  
      //convert relative to abs
      //bg div is separated into 4 quadrants
      if(relY < 0){
        absY = (ele.offsetTop * (relY * -1) / 100) - ele.offsetTop;
      }
      else if(relY >= 0){
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
      if(interact.isSet('#' +  this.objId))
        interact('#' +  this.objId).unset();
    }
  
    componentDidUpdate(prevProps, prevState, snapshot){
      this.props.edit ? this.enableDrag() : this.enableConnect();
    }
  
    enableDrag = () => {
      let self = this;
      let relX, relY;
      if(interact.isSet('#' +  this.props.obj.id))
        interact('#' +  this.props.obj.id).unset();
  
      interact('#' + this.props.obj.id).draggable({
        onmove: function(event) {
          let target = event.target,
              x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
              y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
  
          target.style.webkitTransform = target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
  
          target.setAttribute('data-x', x);
          target.setAttribute('data-y', y);
  
          //save relative coordinates
          //BG div is separated into 4 quadrants
          relX = 0;
          relY = 0;
  
          if(y < 0){
            relY = ((target.offsetTop - Math.round(y * -1)) / target.offsetTop) * (100 * -1);
          }
          else if(y >= 0){
            relY = (Math.round(y) / (document.getElementById('divEditViewBG').offsetHeight - target.offsetTop - target.offsetHeight)) * 100;
          }
  
          if(x < 0){
            relX = (((Math.round(x) - (target.offsetWidth / 2)) / (store.ui.windowWidth / 2))) * 100;
          }
          else if(x >= 0){
            relX = (Math.round(x) / (store.ui.windowWidth / 2)) * 100;
          }
  
          store.getConnectionsByObjId(self.props.obj.id)
            .filter(c => (c.src !== "master" && c.dest !== "master"  
              && c.src.split('_')[0] !== "mix" && c.dest.split('_')[0] !== "mix"
              && c.dest !== 'panvol_master'))
                .forEach(function(connection){
                  self.props.drawConnection(connection);
          })
        },
        onend: function (event) {
          //update UI model
          self.props.obj.ui.setCoords(relX, relY)
        },
        restrict: {
          restriction: 'parent',
          elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
        },
      }).on('down', function (event) {
        store.ui.selectObj(self.props.obj.id);
        event.preventDefault();
      })
    }
  
    enableConnect = () => {
      let self = this;
      let id = this.props.obj.id;
  
      if(interact.isSet('#' + id))
        interact('#' + id).unset();
  
      interact('#' + id).on('down', function (event) {
        store.ui.selectObj(id);
        self.props.active(id, 'down');
        //event.preventDefault(); // this mucks up line drawing
      })/*
        MOVED TO LISTENERS ABOVE
        .on('up', function (event) {
        console.log(event)
        self.props.active(event.target.id, 'up');
        //event.preventDefault();
      })*/
    }
  
    render() {
      let cName = 'divEditViewObj';
      if(this.props.selectedObj === this.props.obj.id)
        cName = 'divEditViewObjSelected';
  
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
  