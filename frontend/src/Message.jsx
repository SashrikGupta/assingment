import React from 'react';

export default function Message(props) {
  return (
    <>
      {props.ked === props.username ? (
        <div className='flex w-[25vw] mt-2 ' >
         <div className='w-[1vw]' ></div>
         <div className='w-[18vw]  flex flex-col p-1 h-auto bg-primary rounded-lg border-2' style = {{paddingRight : "0" , backgroundColor : "black"}}>
         <span style={{ fontWeight: 'bold' ,  fontSize : "8px"  }}>@ {props.username}</span>
          
          <p style = {{fontSize : "16px" }}>{props.chat}</p>
         </div>
        </div>
      ) : (
         <div className='flex w-[25vw] mt-2 ' style = {{backgroundColor : "black"}} >
          <div className='w-[7vw]'></div>
          <div className='w-[18vw]  flex flex-col p-1 h-auto bg-secondary rounded-lg border-2' style =  {{paddingRight : "0" , backgroundColor : "black"}}>
          <span style={{ fontWeight: 'bold' ,  fontSize : "8px"  }}>@ {props.username}</span>
           
           <p style = {{fontSize : "16px"}}>{props.chat}</p>
          </div>
         </div>
      )}
    </>
  );
}