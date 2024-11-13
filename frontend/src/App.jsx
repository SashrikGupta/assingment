import React, { useState  , useEffect } from 'react';
import Chat from './Chat';
import BufferShow from './BufferShow';

function App() {
  const [username, setUsername] = useState('');
  const [submit, setSubmit] = useState(false);
  const [isFirst, setIsFirst] = useState(false); // New state for checkbox

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handleCheckboxChange = (event) => {
    setIsFirst(event.target.checked);
  };

  const handleSubmit = () => {
    setSubmit(true);
  };  



  const [buffer  , set_buffer] = useState([])


  return (
    <>
      {submit ? (
        <>
        <Chat username={username} id={"hi"} first={isFirst} buffer = {buffer} set_buffer = {set_buffer}/>
      

        </>
        
        
      ) : (
        <>
          <input
            placeholder="Enter your username"
            value={username}
            onChange={handleUsernameChange}
          />
          <label>
            <input
              type="checkbox"
              checked={isFirst}
              onChange={handleCheckboxChange}
            />
            Is this the first message?
          </label>
          <button onClick={handleSubmit}>Submit</button>
        </>
      )}


    </>
  );
}

export default App;
