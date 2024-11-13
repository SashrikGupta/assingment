import React , {useState , useContext, useEffect , useRef} from 'react'
import {useParams ,  useNavigate , Navigate} from 'react-router-dom'
import { initSocket1, initSocket2 } from './socket';
import Message from './Message'
import Card from './Card'
import { MAX_SEQ , MAX_PKT , FrameKind , createFrame, createFrames , TIME } from './datalink'
import Finfo from './Finfo'
import Code from './Code';

const WINDOW_SIZE = (MAX_SEQ+1)/2

let too_far = WINDOW_SIZE -1
let next_frame_to_send = -1
let as_of_now = MAX_SEQ
let index = [0,1,2,3,4,5,6,7]
    // frame sending queue

function inc(num){
  num = num+1 
  return num%(MAX_SEQ+1)
}

const ACTIONS = {
   JOIN : 'join' , 
   JOINED : 'joined' , 
   DISCONNECTED : 'disconnected' , 
   CODE_CHANGE : 'code-change' , 
   SYNC_CHANGE : 'sync-code' , 
   LEAVE : 'leave' , 
 } ;

export default function Chat({username , id , first }) {

  const window = []
  const expected = []
  


  for(let i = 0 ; i<=too_far ; i++){
    expected.push(i)
  }


  const [demo , set_demo] = useState([])

  const [step , set_step] = useState(0)

  const [demo_run , set_demo_run] = useState(false)
   // intermediate storage 
   const [my_chat , set_my_chat] = useState() 
   // intermediate storage 
   const [chat_list , set_chat_list] = useState([])

   // stores all the chat 
   const [allchat , set_all_chat] = useState([]) ; 

   // current frame 
   const [curr_frame , set_curr_frame] = useState()

   const socketRef1 = useRef(null);
   const socketRef2 = useRef(null);
   const acked = []
   const [listenSocket , setlistenSocket] = useState(socketRef1)
   const [sendSocket , setsendSocket] = useState(socketRef2)
   //inter mediate level
   const [message_enter , set_message_enter] = useState(0) ;

   //stores the user info 
   const [client , setclient] = useState([{socketId : 1  , username : "sashrik gupta" } , {socketId : 2 , username : "jhon doe"}])

   const [in_buffer , set_in_buffer] = useState()

   // for showing the current state of the buffer  
   const [buffer , set_buffer] = useState([])

   // for showing the status of frames recived by the user 
   const [sended_frames  , set_sended_frames] = useState([])

   const [sent_to_other , set_sent_to_other] = useState(false)

   
  const bufferRef = useRef(buffer); // Create a ref for buffer

  useEffect(() => {
    const init = async () => {
      socketRef1.current = await initSocket1();
      socketRef2.current = await initSocket2();

      // Error handling
      function handleErrors(e) {
        console.log('socket_error', e);
        alert("Connection failed, try again later");
        rng('/');
      }

      socketRef1.current.on('connect_error', handleErrors);
      socketRef1.current.on('connect_failed', handleErrors);
      socketRef2.current.on('connect_error', handleErrors);
      socketRef2.current.on('connect_failed', handleErrors);

      // Emit JOIN event on both sockets
      socketRef1.current.emit(ACTIONS.JOIN, { roomId: id, username });
      socketRef2.current.emit(ACTIONS.JOIN, { roomId: id, username });

      // Listen for JOINED event on both sockets
      socketRef1.current.on(ACTIONS.JOINED, ({ clients, username, socketid }) => {
        if (username !== username) {
          console.log(`${username} joined on socket 1`);
        }
        setclient(clients);
      });

      socketRef2.current.on(ACTIONS.JOINED, ({ clients, username, socketid }) => {
        if (username !== username) {
          console.log(`${username} joined on socket 2`);
        }
        setclient(clients);
      });

      // Listen for DISCONNECTED event on both sockets
      socketRef1.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        setclient((prev) => prev.filter(client => client.socketId !== socketId));
      });

      socketRef2.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        setclient((prev) => prev.filter(client => client.socketId !== socketId));
      });



      if(first){
        setlistenSocket(socketRef1)
        setsendSocket(socketRef2)
      }
      else{
        setlistenSocket(socketRef2)
        setsendSocket(socketRef1)
      }


    };

    init();

    return () => {
      socketRef1.current?.disconnect();
      socketRef2.current?.disconnect();
    };
  } , [])
    

  const render_sended_frame = (frame)=>{
    set_sended_frames([frame])
  }




  function m_handler() {
    const old_chat = [...allchat]; // Clone array to avoid direct mutation
    old_chat.push({
        username: username, 
        chat: my_chat
    });
    set_step(2)
    set_all_chat(old_chat); 
    set_message_enter(1 - message_enter); 
    set_buffer(demo); 
    set_demo_run((prev) => !prev); 
    document.getElementById('kp').value = ''; 
    console.log("demo : ", demo);
    index = [0,1,2,3,4,5,6,7]
}

// useEffect to monitor changes in buffer
useEffect(() => {
  (async () => {
    console.log("---------------------------------------------");
    console.log("Updated buffer: ", buffer); 

    if (message_enter === 1) {
      console.log("idhar hu");
      bufferRef.current = buffer;
      
      if (first && buffer.length > 0) {
        let runner = 0;

        while (runner < 4) {
          let frame_to_send = buffer[runner];

          // Introduce error based on probability
          if (frame_to_send.error_prob > 0) {
            const randomChance = Math.floor(Math.random() * 100) + 1;
            frame_to_send.error = randomChance <= frame_to_send.error_prob;
          }

          // Wait for 2 seconds before sending the next frame
          await delay(2000)
         await to_physical_layer(frame_to_send);

          runner++;
          next_frame_to_send++;
        }
      }

      set_message_enter(1 - message_enter);
    }
  })(); // IIFE to handle the async nature

}, [message_enter]);



const to_physical_layer = async (frame) => {
  
  console.log("Sending the following frame: ", frame);
  if (sendSocket.current) {
    sendSocket.current.emit('chat', {
      roomId: id,
      chat_frame: JSON.stringify(frame),
      username: username,
    });
  }
};

// ------------------- Sending Function --------------------------------------------------------




//-------------------Receiving (from_physical_layer)----------------------------------------

useEffect(() => {
  if (listenSocket.current) {
    let sended = 0;
    let count = 0;

    listenSocket.current.on('chat', async ({ chat_frame, username }) => {
      // Parse the chat frames
      
      const frame = JSON.parse(chat_frame);
      console.log(acked)
     


        count++;

        await delay (4000)
        render_sended_frame(frame);
        console.log("frame received: ", frame);
        console.log("current buffer length: ", bufferRef.current.length); // Access the latest buffer
        console.log("buffer: ", bufferRef.current);
        console.log("index: ", index);

        
        let ack_to_send = -10;
        let ack_received = frame.ack; // Initialize ack_received


        if(frame.kind === FrameKind.NAK){
            set_step(4)
          let received_seq = frame.nak;
          let frame_to_send = null ;


            ack_to_send = received_seq;

          if (index.includes(received_seq)) {
            frame_to_send = bufferRef.current.find(f => f.seq === received_seq); // Use the ref
                frame_to_send.error = false;
          }

          frame_to_send.ack = TIME.start;
          acked.push(ack_to_send)
          await to_physical_layer(frame_to_send);
          sended++;


        }




















        if (frame.kind === FrameKind.DATA) {
          
          set_step(3)



          if(!frame.error){
            let received_seq = frame.seq;
            let frame_to_send = null ;

            // Check acknowledgment 
            if (ack_received === TIME.start) {
              next_frame_to_send = inc(next_frame_to_send);
            } else if (ack_received !== -10) {
              set_buffer((prevBuffer) => {
                const temp = prevBuffer.filter(f => f.seq !== ack_received); // Remove acknowledged frame
                return temp;
              });
              as_of_now--;
              index = index.filter(f => f !== ack_received);
              next_frame_to_send = inc(next_frame_to_send);
            }

              ack_to_send = received_seq;
              to_network_layer(frame, username);

            if (index.includes(next_frame_to_send)) {
              frame_to_send = bufferRef.current.find(f => f.seq === next_frame_to_send); // Use the ref
            }
            if (!frame_to_send) {
              frame_to_send = createFrame(FrameKind.ACK, 0, ack_to_send, ' ');
            }

            frame_to_send.ack = ack_to_send;
            acked.push(ack_to_send)
            await to_physical_layer(frame_to_send);
            sended++;
          }

          else{
            let frame_to_send;
            set_step(5)
            frame_to_send = createFrame(FrameKind.NAK, -1 , -1, -1);
            frame_to_send.nak  = frame.seq;
            await to_physical_layer(frame_to_send);
            sended++;
          }

        }

        if (frame.kind === FrameKind.ACK) {
          // Process ACK

          console.log("ack mila hai ")
          let next_seq_to_send = frame.ack;
          if (ack_received !== -10) {
            set_buffer((prevBuffer) => {
              return prevBuffer.filter(f => f.seq !== ack_received);
            });
            as_of_now--;
            index = index.filter(f => f !== ack_received);
            next_frame_to_send = inc(next_frame_to_send);
          }
          if (index.includes(next_frame_to_send)) {
            console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
            console.log(next_frame_to_send)
            console.log(index)
            console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")
            const next_frame = bufferRef.current.find(f => f.seq === next_frame_to_send); // Use the ref
            if (next_frame) {
              acked.push(frame.seq)
              await to_physical_layer(next_frame);
              sended++;
            }
          }
      }
    });
  }
}, [listenSocket.current]);









//--------------------------------simulations------------------------------------------


 
const sim_handler = () => {
  const seqNumber = 0;
  const ackNumber = -1;
  const packet = from_network_layer();
  const frames = createFrames(packet, seqNumber, ackNumber);
  set_step(1)
  set_demo((prev) => {
    const temp = [];
    frames.forEach((frame) => {
      temp.push(frame);
    });
    return temp;
  });
  set_demo_run((prev) => !prev);
};


let ran = false 
useEffect(() => {
  console.log("___________________________________________");
}, [chat_list, allchat]);

const frame_list = [];

function to_network_layer(frame, username) {
  frame_list.push(frame);

  // Check if frame_list length is MAX_SEQ+1
  if (frame_list.length === MAX_SEQ + 1) {
    // Sort frame_list by frame.seq
    frame_list.sort((a, b) => a.seq - b.seq);
    // Concatenate each frame's data into a single string
    const data = frame_list.map(frame => frame.info.data).join('');
    to_application_layer(data, username);
  }
}

const from_network_layer = () => {
  return my_chat;
}

const to_application_layer = (chat, username) => {
  set_chat_list({ username, chat: chat });
  const updatedChat = [...allchat, { username, chat: chat }];
  set_all_chat(updatedChat);
}

useEffect(() => {
  console.log("---------------------------------------------");
}, [buffer, sendSocket.current,listenSocket.current ,  message_enter]);

useEffect(() => {
  console.log("---------------------------------------------");
}, [demo, demo_run]);

// Sending and receiving

const error_generator = (index) => {
  console.log("clicked");
  console.log(demo);
  set_demo((prevBuffer) => {
    const updatedBuffer = [...prevBuffer];
    updatedBuffer[index].error = true;
    return updatedBuffer;
  });
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ui 

return (
  <>
    <div class="flex ">
      <div class="flex ">
        <Card w="350px" h="90vh" mx="3" my="2">
          <div className="w-[25vw] h-[90vh] flex flex-col items-center justify-start ">
            <div className="flex flex-col  flex-wrap justify-center items-center h-[10vh]">
              Chat Application Simulation
            </div>
            <div
              className="h-[69vh] w-[310px] bg-white/20 rounded-lg"
              style={{ overflowY: "scroll", scrollbarWidth: "none" }}
            >
              {allchat &&
                allchat.map((el, index) => (
                  <Message
                    key={index}
                    ked={username}
                    username={el.username}
                    chat={el.chat}
                  />
                ))}
            </div>

            <div className="flex justify-between mt-4 w-[310px]">
              <input
                id="kp"
                className="rounded-lg h-[5vh] bg-white/20 text-[2vh] text-center w-[310px]"
                onChange={(e) => {
                  set_my_chat(e.target.value);
                }}
              />
            </div>
            <div className="flex justify-between mt-4 w-[310px] ">
              <button
                className="btn btn-primary flex justify-center items-center w-[310px]"
                onClick={sim_handler}
              >
                simulate 
              </button>
            </div>
            <div className="flex justify-between mt-4 w-[310px] mb-3">
              <button
                className="btn btn-primary flex justify-center items-center w-[310px]"
                onClick={m_handler}
              >
                send
              </button>
            </div>
          </div>
        </Card>

        {curr_frame && <Finfo frame={curr_frame}></Finfo>}
      </div>

      <div>
      <div class="flex-col h-[30vh] justify-between ">
        <Card w="350px" h="18vh" mx="3" my="2">
          <div className="p-4">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Sended Buffer Frames</h3>
            {sended_frames.length > 0 ? (
              sended_frames[0].error || sended_frames[0].nak !=-1 ? <>
               <p className="text-gray-500 dark:text-red-400 text-center">
                {
                  sended_frames[0].error ? <> recived error !!</> : <> negative acknowledgment  </>
                }
               </p>
              </>:<>
              <div className='rounded-lg'>
                <table className="min-w-full border-separate border-spacing-2 border border-gray-300 dark:border-gray-700 rounded-lg">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg">Kind</th>
                      <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg">Seq</th>
                      <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg">Ack</th>
                      <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sended_frames.map((frame, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg">{frame.kind}</td>
                        <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg">{frame.seq}</td>
                        <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg">{frame.ack}</td>
                        <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg">
                          {frame.info.data.length > 3 ? `${frame.info.data.slice(0, 3)}...` : frame.info.data}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>  
              </> 
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center">currently no frames</p>
            )}
          </div>
        </Card>

        <div class="mx-4 w-[350px] ">
          {/* Progress bar section to simulate the sending process */}
          {!sent_to_other ? (
            <div className="mb-2 px-1 font-bold text-[3vh]">
              preparing data to send... 
            </div>
          ) : (
            <div className="mb-2 px-1">
              sending...
            </div>
          )}
          <div className="w-full bg-gray-300 rounded-full h-4 dark:bg-gray-700">
            <div
              className={`h-4 rounded-full ${
                sent_to_other ? 'bg-green-500 w-full' : 'bg-blue-500 w-[0%] animate-pulse'
              }`}
              style={{
                transition: 'width 5s ease-in-out',
                marginTop: '1rem',  // Setting a valid margin unit
              }}
            >
            </div>
          </div>
        </div>
      </div>


      
      {demo_run ? <>
      
      
        <Card w="350px" h="60vh" mx="3" my="2">
        <div className="p-4">
          <h3 className="text-lg font-bold mb-4 dark:text-white">Buffer Frames</h3>
          {demo.length > 0 ? (
            <table className="min-w-full border-separate border-spacing-2 border border-gray-300 dark:border-gray-700 rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg">Seq</th>
                  <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg">Message</th>
                  <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg"> simulation</th>
                </tr>
              </thead>
              <tbody>
                {demo.map((frame, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg">{frame.seq}</td>
                    <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg">
                      {frame.info.data.length > 3 ? `${frame.info.data.slice(0, 3)}...` : frame.info.data}
                    </td>
                    <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg">
                    <button className='w- [100px] h-[30px] flex items-center  shadow-2 border-1' style = {{backgroundColor : `${!frame.error ? 'aqua' : 'red'}`}}
                      onClick={()=>{error_generator(index)}}
                    >
                      {
                        !frame.error ? <>
                             <div>
                              no error 
                             </div>
                        </> : <>
                         <div>
                          ERROR
                         </div>
                        </>  
                      }

                    </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No frames in buffer</p>
          )}
        </div>
      </Card>

     
      
      
      
      
      
      
      
      
      
      
      
      
      </>  : <>
        
        
        
        <Card w="350px" h="60vh" mx="3" my="2">
        <div className="p-4">
          <h3 className="text-lg font-bold mb-4 dark:text-white">Buffer Frames</h3>
          {buffer.length > 0 ? (
            <table className="min-w-full border-separate border-spacing-2 border border-gray-300 dark:border-gray-700 rounded-lg">
              <thead>
                <tr>
                  <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg">Seq</th>
                  <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg">Message</th>
                  <th className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg"> simulation</th>
                </tr>
              </thead>
              <tbody>
                {buffer.map((frame, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg">{frame.seq}</td>
                    <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg">
                      {frame.info.data.length > 3 ? `${frame.info.data.slice(0, 3)}...` : frame.info.data}
                    </td>
                    <td className="px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg">
                    <button className='w-[100px] h-[30px] flex items-center  shadow-2 border-1' style = {{backgroundColor : `${!frame.erorr ? 'aqua' : 'red'}`}}
                      onClick={()=>{error_generator(index)}}
                    >
                      {
                        !frame.error ? <>
                             <div>
                              no error 
                             </div>
                        </> : <>
                         <div>
                          ERROR
                         </div>
                        </>  
                      }

                    </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No frames in buffer</p>
          )}
        </div>
      </Card>

        
        </>}




        



     

    </div>
    <Code step = { step }></Code>
    </div>
  </>
);

}