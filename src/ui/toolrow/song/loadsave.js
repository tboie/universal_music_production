import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from "../../../data/store.js";
import { randomId } from "../../../models/models.js";

export const LoadSaveModal = observer(class LoadSaveModal extends Component {
    selectedSongTitle;
    selectedSongId;
  
    componentDidMount(){
      document.getElementById('modalClose').onclick = () => this.toggleWindow();
    }

    rowClick = (e) => {
      this.selectedSongId = e.target.parentNode.id;

      let rows = e.target.parentNode.parentNode.children;
      for(let i=0; i < rows.length; i++){
        if(rows[i].id === this.selectedSongId){
          rows[i].style.backgroundColor = 'rgb(19, 62, 131)';
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
  
    componentDidUpdate(prevProps){
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
  
    btnClickLoad = (e) => {
      if(this.selectedSongId){
        document.getElementById('modalClose').click();
        sessionStorage.setItem("load_songId", this.selectedSongId);
        window.location.reload();
        //store.DBLoadStore(this.selectedSongId);
      }
    }
    
    btnClickSave = (e) => {
      store.setSongId("song_" + randomId())
      store.settings.setSongTitle(document.getElementById('inputSong').value)
      store.settings.setModified(Date.now());
      store.DBSaveStore(true);
      this.forceUpdate();
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
              <span id='modalClose' className='modalClose'>&times;</span>
              <input id="inputSong" type="text" placeholder="song name" onInput={this.inputText}></input>
            </div>
            <br/>
            <div id="modalSongList">
              <table id='tableSongs'></table>
            </div>
            <button id="modalBtnLoad" onClick={this.btnClickLoad} style={{bottom:0, width:'50%', height:'40px', position:'absolute', left:0}}>LOAD</button>
            <button id="modalBtnSave" onClick={this.btnClickSave} style={{bottom:0, width:'50%', height:'40px', position:'absolute', right:0}}>SAVE</button>
          </div>
        </div>
      )
    }
  })