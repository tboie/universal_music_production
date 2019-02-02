import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from "../../../data/store.js";
import { randomId } from "../../../models/models.js";

export const LoadSaveModal = observer(class LoadSaveModal extends Component {
    selectedSongTitle;
    selectedSongId;
  
    componentDidMount(){
      let self = this;
      let modal = document.getElementById('myModal');
      let span = document.getElementsByClassName("close")[0];
      let list = document.getElementById("ulSongs");
      let input = document.getElementById("inputSong");
  
      window.onclick = function(event) {
        if (event.target === modal) {
          self.toggleWindow();
          //modal.style.display = "none";
        }
      }
  
      span.onclick = function() {
        self.toggleWindow();
        //modal.style.display = "none";
      }
  
      list.onclick = function(e) {
        if(e.target && e.target.nodeName === "LI") {
          if(e.target.style.backgroundColor !== "gray"){
            e.target.style.backgroundColor = "gray";
            self.selectedSongTitle = e.target.innerHTML;
            self.selectedSongId = e.target.id;
            input.value = self.selectedSongTitle;
  
            let listItems = list.getElementsByTagName("li");
            for (let i=0; i < listItems.length; i++) {
              if(listItems[i].id !== e.target.id){
                listItems[i].style.backgroundColor = "white";
              }
            }
          }
          else{
            e.target.style.backgroundColor = "white";
            self.selectedSongTitle = "";
          }
        }
      }
    }
  
    componentDidUpdate(prevProps, prevState, snapshot){
      document.getElementById("inputSong").value = store.settings.title;
      let self = this;
  
      store.DBGetAllSongs().then(function(list){
        list = list.sort(function(a, b){return b.modified - a.modified})
        document.getElementById("ulSongs").innerHTML = "";
      
        if(list){
          if(list.length > 0){
            self.songs = list;
            list.forEach(function(song){
              let node = document.createElement("LI");
              node.id = song.id;
  
              let textnode = document.createTextNode(song.title);
              node.appendChild(textnode);
  
              /*
              let spanDate = document.createElement("SPAN");
              let date = new Date(song.modified);
              spanDate.textContent = (date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear();
              spanDate.style.float = 'right';
              node.appendChild(spanDate);
              */
             
              document.getElementById('ulSongs').appendChild(node)
            })
          }
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
        document.getElementsByClassName("close")[0].click();
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
  
    componentWillUnmount(){
    }
  
    render(){
      return (
        <div id="myModal" className="modal">
          <div id="modalContent" className="modal-content">
            <span className="close">&times;</span>
            <input id="inputSong" type="text" placeholder="song name" onInput={this.inputText} style={{width:'98%', height:'40px'}}></input>
            <br/>
            <div id="modalSongList" style={{position:'absolute', width: '100%', overflowY:'auto'}}>
              <ul id="ulSongs">
              </ul>
            </div>
            <button id="modalBtnLoad" onClick={this.btnClickLoad} style={{bottom:0, width:'50%', height:'40px', position:'absolute', left:0}}>LOAD</button>
            <button id="modalBtnSave" onClick={this.btnClickSave} style={{bottom:0, width:'50%', height:'40px', position:'absolute', right:0}}>SAVE</button>
          </div>
        </div>
      )
    }
  })