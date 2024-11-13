export const MAX_PKT = 256; // Define maximum packet size as per your requirement
export const MAX_SEQ = 7

export const TIME = {
   ignore : 107 , 
   start : 108 , 
   end  : 109 
}
// Frame structure definition

export const FrameKind = {
    DATA: 'DATA',
    ACK: 'ACK',
    PAD : 'PAD' ,
    NAK: 'NAK'
};

export const createFrame = (kind, seq, ack, message) => {
   const nak = -1
  return {
    kind,
    seq,
    ack,
    nak : nak ,
    info: { data: message } , 
    error : false , 
    error_prob : 0 
 }
}

export function createFrames(packet, seqNumber, ackNumber){
   const numberOfFrames = MAX_SEQ+1;
   const frames = [];
   const partLength = Math.ceil(packet.length / numberOfFrames); 

   for (let i = 0; i < numberOfFrames; i++) {
     const start = i * partLength;
     const end = start + partLength;
     const dataPart = packet.substring(start, end);
     const frame = createFrame('DATA', seqNumber + i, TIME.start , dataPart);
     frames.push(frame);
   }

   return frames;
}
