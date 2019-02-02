import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from "../../data/store.js";

export const DropZone = observer(class DropZone extends Component {
    componentDidMount(){}
    componentWillMount(){}
  
    drop = (e) => {
      e.preventDefault();
  
      e.target.classList.remove('drop-active');
      if(e.target.id === 'divDropZone'){
        let data = e.dataTransfer.getData("text");
  
        if(data){
          let btnLoad = document.getElementById(data);
          if(btnLoad)
            btnLoad.click();
        }
      }
  
      document.getElementById('divDropZone').style.display = 'none';
    }
    
    dragOver = (e) => {
      e.preventDefault();
    }
  
    dragEnter = (e) => {
      e.preventDefault();
      if(e.target.id === 'divDropZone'){
        e.target.classList.add('drop-active');
      }
    }
  
    dragLeave = (e) => {
      e.preventDefault();
      if(e.target.id === 'divDropZone'){
        e.target.classList.remove('drop-active');
      }
    }
  
    render() {
      return (
        <div id="divDropZone" onDrop={this.drop} onDragEnter={this.dragEnter} onDragLeave={this.dragLeave} onDragOver={this.dragOver} 
          style={{width: store.ui.windowWidth + 'px'}}></div>
      )
    }
  })
  
