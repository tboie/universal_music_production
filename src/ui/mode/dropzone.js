import React, { Component } from 'react';
import { observer } from "mobx-react";
import { store } from "../../data/store.js";
import interact from 'interactjs';


export const DropZone = observer(class DropZone extends Component {
    componentDidMount(){
      //document.getElementById('divDropZone').addEventListener('animationend', this.endAnimation);

      interact('#divDropZone').dropzone({
        accept: '.itemSelected',
        //overlap: 0.75,
        ondropactivate: e => {
          if(document.querySelector('.itemSelected').classList.contains('itemDragging')){
            e.target.style.display = 'block';
          }
        },
        ondragenter: e => {
          if(e.relatedTarget.classList.contains('itemDragging')){
            e.target.classList.add('drop-active')
          }
        },
        ondragleave: e => {
          e.target.classList.remove('drop-active')
        },
        ondrop: e => {
          let browserId = e.relatedTarget.id.split('_')[1]
          document.getElementById('btnBrowseLoad_' + browserId).click();
        },
        ondropdeactivate: e => {
          //e.target.style.animation = 'dropZoneFadeOut 0.25s linear';  BUGGY
          this.endAnimation(e);
        }
      });
    }

    componentWillUnmount(){
      interact('#divDropZone').unset();
    }

    endAnimation = (e) => {
      e.target.style.animation = 'none';
      e.target.style.display = 'none';
      e.target.classList.remove('drop-active');
    }
  
    render() {
      return (
        <div id="divDropZone" style={{width: store.ui.windowWidth + 'px'}}></div>
      )
    }
  })
  
