import React from 'react';

export const ToolHome = props => {
    return(
      <div id="divToolHome" className="divToolRowPanelContainer" style={{color:'white', height:'100%', width:'100%'}}>
        <iframe title="MainVideo" src="https://www.youtube.com/embed/HXwk6U0B-60" 
          frameBorder="0" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen 
            style={{height:'100%', width:'100%', display:'table', margin:'0 auto'}}></iframe>
      </div>
    )
  }