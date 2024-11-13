import React , {useEffect} from 'react';

export default function BufferShow({ buffer }) {

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    useEffect(()=>{
        (async()=>{
          await delay(2000)
        })()
    } , [buffer])



  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Buffer Frames</h3>
      {buffer.length > 0 ? (
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 px-4 py-2">Kind</th>
              <th className="border border-gray-300 px-4 py-2">Sequence Number (Seq)</th>
              <th className="border border-gray-300 px-4 py-2">Acknowledgment (Ack)</th>
              <th className="border border-gray-300 px-4 py-2">Message Data</th>
            </tr>
          </thead>
          <tbody>
            {buffer.map((frame, index) => (
              <tr key={index} className="odd:bg-white even:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 text-center">{frame.kind}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{frame.seq}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{frame.ack}</td>
                <td className="border border-gray-300 px-4 py-2 text-center">{frame.info.data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-600">No frames in buffer.</p>
      )}
    </div>
  );
}
