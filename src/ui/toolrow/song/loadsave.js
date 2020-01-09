import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from "../../../data/store.js";
import { randomId } from "../../../models/models.js";

export const LoadSaveModal = observer(class LoadSaveModal extends Component {
    selectedSongTitle = '';
    selectedSongId = '';
    bConfirm = false;
  
    componentDidMount(){
      this.toggleIconOpacity(false);
      document.getElementById('modalClose').onclick = () => { 
        this.bConfirm = false; 
        this.resetSelectedSong();
        this.toggleWindow() 
      };
    }

    rowClick = (e) => {
      this.selectedSongId = e.target.parentNode.id;

      let rows = e.target.parentNode.parentNode.children;
      for(let i=0; i < rows.length; i++){
        if(rows[i].id === this.selectedSongId){
          rows[i].style.backgroundColor = 'rgb(19, 62, 131)';
          this.selectedSongTitle = rows[i].children[0].textContent;
          this.toggleIconOpacity(true);
          this.enableBtnLoad();
        }
        else{
          rows[i].style.backgroundColor = 'transparent';
        }
      }
    }

    formatDate = (date) => {
      let monthNames = [ "Jan", "Feb", "Mar","Apr", "May", "Jun", "Jul","Aug", "Sep", "Oct","Nov", "Dec"];
    
      let monthIndex = date.getMonth();
      let day = date.getDate();
      let year = date.getFullYear().toString().substr(2,2);
    
      return day + ' ' + monthNames[monthIndex] + ' ' + year;
    }

    toggleIconOpacity = (on) => {
      const icon = document.getElementById('iconDeleteSong');
      if(icon){
        on ? icon.style.opacity = 1 : icon.style.opacity = 0.4;
      }
    }
  
    componentDidUpdate(prevProps){
      this.toggleIconOpacity(false);

      if(this.props.action && !this.bConfirm){        
        document.getElementById("inputSong").value = store.settings.title;
    
        store.DBGetAllSongs().then(list => {
          let table = document.getElementById('tableSongs');

          while(table.hasChildNodes()){
            table.removeChild(table.firstChild);
          }

          if(list.length > 0){
            list.sort((a,b) => {return b.modified - a.modified}).forEach(song => {
              let row = table.insertRow(0);
              row.id = song.id;
              row.onclick = this.rowClick;

              let cell1 = row.insertCell(0);
              cell1.style.width = '80%';
              cell1.innerHTML = song.title;

              let cell2 = row.insertCell(1);
              cell2.innerHTML = this.formatDate(new Date(song.modified));
            })
          }
        });
    
        this.toggleWindow();
      }
    }

    toggleWindow = () => {
      let modal = document.getElementById('myModal');
      
      if(!modal.style.display || modal.style.display === "none"){
        modal.style.display = "block";
        //footer zindex is wonky with modal zindex 
        document.getElementById('divToolRowNav').style.zIndex = 1
        document.getElementById('divFooter').style.zIndex = 1;
      }
      else{
        modal.style.display = "none";
        document.getElementById('divToolRowNav').style.zIndex = 2;
        document.getElementById('divFooter').style.zIndex = 3;
      }
    }

    enableBtnLoad = () => {
      const btnLoad = document.getElementById('modalBtnLoad');
      if(btnLoad){
        btnLoad.disabled = false;
        btnLoad.onclick = () => this.btnClickLoad();
      }
    }
  
    btnClickLoad = (e) => {
      if(this.selectedSongId){
        store.ui.toolbar.browser.setAction(undefined);
        sessionStorage.setItem("load_songId", this.selectedSongId);
        window.location.reload();
      }
    }
    
    btnClickSave = (e) => {
      store.setSongId("song_" + randomId())
      store.settings.setSongTitle(document.getElementById('inputSong').value)
      store.settings.setModified(Date.now());
      store.DBSaveStore(true);
      this.forceUpdate();
    }

    btnClickDelete = (e) => {
      if(this.selectedSongId){
        this.bConfirm = true;
        this.forceUpdate();
      }
    }

    btnConfirmDelete = (yes) => {
      if(yes){
        store.DBDeleteSongById(this.selectedSongId);
      }

      this.bConfirm = false;
      this.resetSelectedSong();
      this.forceUpdate();
      this.toggleWindow();
    }

    resetSelectedSong = () => {
      this.selectedSongId = '';
      this.selectedSongTitle = '';
    }

    inputText = (e) => {
      if(e.target.value){
        document.getElementById('modalBtnSave').disabled = false;
      }
      else{
        document.getElementById('modalBtnSave').disabled = true;
      }
    }
  
    componentWillUnmount(){}
  
    render(){
      return (
        <div id="myModal" className="modal">
          <div id="modalContent" className="modal-content">
            <div style={{width:'100%'}}>
              { 
                this.bConfirm ? null 
                  : 
                  <i id='iconDeleteSong' className="material-icons i-28 colorRed" style={{left:'4px', top: '4px', position:'relative', opacity:0.4}} onClick={this.btnClickDelete}>delete</i>
              }
              <span id='modalClose' className='modalClose'>&times;</span>
              { 
                this.bConfirm ? null 
                  : 
                  <input id="inputSong" type="text" placeholder="song name" onInput={this.inputText}></input> 
              }
            </div>
            <br/>
            { this.bConfirm ? <ConfirmDialog confirm={() => this.btnConfirmDelete(true)} cancel={() => this.btnConfirmDelete(false)} title={this.selectedSongTitle}/>
              :
              <div>
                <div id="modalSongList">
                  <table id='tableSongs'></table>
                </div>
                <LoadSaveButton action={this.props.action} btnClickLoad={this.btnClickLoad} btnClickSave={this.btnClickSave}/>
              </div>
            }
            </div> 
        </div>
      )
    }
  })

  const ConfirmDialog = props => {
    return (
      <div style={{top:'10%', position:'relative'}}>
        <div style={{textAlign:'center', height:'40px'}}>
          <label>Delete song {props.title}?</label>
        </div>
        <button onClick={props.confirm} style={{float:'left', width:'50%', height:'40px'}}>Yes</button>
        <button onClick={props.cancel} style={{float:'right', width:'50%', height:'40px'}}>No</button>
      </div>
    )
  }

  const LoadSaveButton = props => {
    return (
      <div>
        { props.action && props.action.substr(0,4) === "Load" ? 
            <button disabled id="modalBtnLoad" style={{bottom:0, width:'100%', height:'40px', position:'absolute'}}>LOAD</button>
            :
              props.action && props.action.split('_')[0] !== 'undefined' ?
              <button id="modalBtnSave" onClick={props.btnClickSave} style={{bottom:0, width:'100%', height:'40px', position:'absolute'}}>SAVE</button>
              :
              <button style={{bottom:0, width:'100%', height:'40px', position:'absolute'}}>Waiting</button>
        }
      </div>
    )
  }